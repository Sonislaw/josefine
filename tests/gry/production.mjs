import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { chromium } from '@playwright/test'
import { developedKingdom, encode as encodeKingdom } from './kingdom-progression-fixture.mjs'
import { requestsKingdom } from './kingdom-requests-fixture.mjs'
import { beforeRaid } from './kingdom-war-fixture.mjs'

// Local clean-URL static server for testing built HTML, not a production server.
const root = resolve('dist')
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
}
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = resolve(
    root,
    `.${path === '/' ? '/index.html' : extname(path) ? path : `${path}.html`}`,
  )
  if (!file.startsWith(root + sep)) {
    res.writeHead(403).end()
    return
  }
  try {
    res.setHeader(
      'Content-Type',
      `${mime[extname(file)] ?? 'application/octet-stream'}; charset=utf-8`,
    )
    res.end(await readFile(file))
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(await readFile(resolve(root, '404.html')))
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  await mkdir('test-results/production', { recursive: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/*', (route) =>
    route.request().url().startsWith(base) ? route.continue() : route.abort(),
  )
  await context.addInitScript(() =>
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1'),
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text())
  })
  await page.goto(base)
  assert.equal(await page.locator('.game-card').count(), 6)
  assert.equal(
    await page.locator('.game-card').filter({ hasText: 'Nocny ekspres' }).getAttribute('href'),
    '/nocny-ekspres',
  )
  assert.equal(
    await page.locator('.game-card').filter({ hasText: 'Klocki' }).getAttribute('href'),
    '/klocki',
  )
  assert.equal(
    await page.locator('.game-card').filter({ hasText: 'Warcaby' }).getAttribute('href'),
    '/warcaby-arena-mocy',
  )
  assert.equal(
    await page
      .locator('.game-card')
      .filter({ hasText: 'Jeszcze jeden kryształ' })
      .getAttribute('href'),
    '/jeszcze-jeden-krysztal',
  )
  await page.screenshot({ path: 'test-results/production/home-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/production/home-mobile.png', fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.goto(`${base}/warcaby-arena-mocy`)
  await page.waitForFunction(() => !document.querySelector('.square').disabled)
  await page.getByRole('button', { name: /^c3,/ }).click()
  await page.getByRole('button', { name: /^b4,/ }).click()
  await page.waitForFunction(() =>
    document.querySelector('.board-actions').textContent.includes('RUCH 03'),
  )
  await page.goto(`${base}/jeszcze-jeden-krysztal`)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://gry.zgrana.pl/jeszcze-jeden-krysztal',
  )
  assert.equal(
    await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://gry.zgrana.pl/og/crystal-rush.png',
  )
  await page.getByRole('button', { name: 'Zaczynamy →' }).click()
  await page.keyboard.press('p')
  assert.ok(await page.getByRole('button', { name: 'Wracam do gry →' }).isVisible())
  await page.screenshot({ path: 'test-results/production/crystal-mobile.png', fullPage: true })
  await page.goto(`${base}/klocki`)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://gry.zgrana.pl/klocki',
  )
  assert.equal(
    await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://gry.zgrana.pl/og/blocks.png',
  )
  await page.locator('.blocks-start').click()
  await page.locator('[data-slot="0"]').click()
  await page.locator('[data-cell="0"]').click()
  assert.ok((await page.locator('.cell-filled').count()) > 0)
  const blocksScore = await page.locator('[data-testid="blocks-score"]').innerText()
  await page.reload()
  await page.waitForFunction(
    (score) => document.querySelector('[data-testid="blocks-score"]')?.textContent === score,
    blocksScore,
  )
  await page.screenshot({ path: 'test-results/production/blocks-mobile.png', fullPage: true })
  await page.goto(`${base}/male-krolestwo`)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://gry.zgrana.pl/male-krolestwo',
  )
  assert.equal(
    await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://gry.zgrana.pl/og/little-kingdom.png',
  )
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
  await page.reload()
  await page.waitForFunction(
    () => document.querySelector('[data-testid="kingdom-turn"]')?.textContent === '2',
  )
  // Verify legacy hydration against built HTML, not only the development server.
  const legacyKingdom = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('zgrana:gry:male-krolestwo:v6'))
    data.version = 1
    delete data.state.discoveries
    delete data.state.rank
    delete data.state.promotions
    delete data.state.requests
    const raw = JSON.stringify(data)
    localStorage.setItem('zgrana:gry:male-krolestwo:v1', raw)
    localStorage.removeItem('zgrana:gry:male-krolestwo:v6')
    return raw
  })
  await page.reload()
  await page.waitForFunction(
    () => document.querySelector('[data-testid="kingdom-turn"]')?.textContent === '2',
  )
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('zgrana:gry:male-krolestwo:v6')).version,
    ),
    6,
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v1')),
    legacyKingdom,
  )
  // Hydrate a migrated developed settlement against the actual prerendered production HTML.
  const previousKingdom = encodeKingdom(developedKingdom(), 2)
  await page.evaluate((raw) => {
    localStorage.setItem('zgrana:gry:male-krolestwo:v2', raw)
    localStorage.removeItem('zgrana:gry:male-krolestwo:v6')
  }, previousKingdom)
  await page.reload()
  await page.waitForFunction(
    () => document.querySelector('[data-testid="kingdom-turn"]')?.textContent === '61',
  )
  assert.ok((await page.getByTestId('kingdom-rank').textContent()).includes('Osada'))
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  assert.ok((await page.locator('.promotion-preview').textContent()).includes('Wioska'))
  await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
  assert.ok((await page.getByTestId('kingdom-rank').textContent()).includes('Wioska'))
  await page.reload()
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="kingdom-rank"]')?.textContent.includes('Wioska'),
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v2')),
    previousKingdom,
  )
  // Existing v3 ranks survive hydration; choosing a goal itself never pays or advances time.
  const previousRequests = encodeKingdom(requestsKingdom(), 3)
  await page.evaluate((raw) => {
    localStorage.setItem('zgrana:gry:male-krolestwo:v3', raw)
    localStorage.removeItem('zgrana:gry:male-krolestwo:v6')
  }, previousRequests)
  await page.reload()
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="kingdom-rank"]')?.textContent.includes('Małe królestwo'),
  )
  await page.locator('.residents-panel > summary').click()
  await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
  assert.equal(await page.getByTestId('kingdom-turn').textContent(), '61')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  assert.ok((await page.locator('.request-preview').textContent()).includes('Pole przy strumieniu'))
  await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
  assert.ok((await page.locator('.request-announcement').textContent()).includes('Zosia'))
  await page.reload()
  await page.waitForFunction(
    () => document.querySelector('[data-testid="kingdom-turn"]')?.textContent === '62',
  )
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('zgrana:gry:male-krolestwo:v6')).state.requests.completed
          .length,
    ),
    1,
  )
  assert.equal(await page.locator('.request-announcement').count(), 0)
  assert.equal(
    await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v3')),
    previousRequests,
  )
  await page.screenshot({ path: 'test-results/production/kingdom-mobile.png', fullPage: true })
  const raidState = beforeRaid({ spearman: 4, archer: 0 }, true)
  await page.evaluate(
    (raw) => localStorage.setItem('zgrana:gry:male-krolestwo:v6', raw),
    encodeKingdom(raidState),
  )
  await page.reload()
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  assert.ok(
    (await page.getByRole('region', { name: 'Prognoza bitwy' }).textContent()).includes(
      'zwycięstwo',
    ),
  )
  await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
  assert.ok(
    (await page.getByRole('region', { name: 'Raport bitwy' }).textContent()).includes('zwycięstwo'),
  )
  const warSaved = await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v6'))
  await page.reload()
  await page.waitForFunction(
    (turn) => document.querySelector('[data-testid="kingdom-turn"]')?.textContent === String(turn),
    raidState.turn + 2,
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v6')),
    warSaved,
  )
  assert.equal(await page.getByRole('region', { name: 'Raport bitwy' }).count(), 0)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  await page.goto(`${base}/ostatnia-latarnia`)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://gry.zgrana.pl/ostatnia-latarnia',
  )
  assert.equal(
    await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://gry.zgrana.pl/og/last-lighthouse.png',
  )
  await page.locator('.lh-start').click()
  await page.getByRole('button', { name: 'Ⅱ Pauza' }).click()
  assert.ok(await page.getByRole('button', { name: 'Wracam do światła' }).isVisible())
  await page.screenshot({ path: 'test-results/production/lighthouse-mobile.png', fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.equal(await page.evaluate(() => window.lighthouseHarness), undefined)
  assert.equal((await page.request.get(`${base}/tests/gry/lighthouse-harness.html`)).status(), 404)
  await page.goto(`${base}/nocny-ekspres`)
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://gry.zgrana.pl/nocny-ekspres',
  )
  assert.equal(
    await page.locator('meta[property="og:image"]').getAttribute('content'),
    'https://gry.zgrana.pl/og/night-express.png',
  )
  await page.getByRole('button', { name: '▶ Wznów ruch', exact: true }).click()
  await page.getByRole('button', { name: 'Ⅱ Pauza', exact: true }).click()
  assert.equal(await page.locator('.ne-map').getAttribute('data-mode'), 'paused')
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('zgrana:gry:nocny-ekspres:v1')),
  )
  assert.equal(saved.version, 1)
  await page.reload()
  await page.waitForFunction(() => document.querySelector('.ne-map')?.dataset.mode === 'paused')
  assert.equal(await page.evaluate(() => window.expressHarness), undefined)
  assert.equal((await page.request.get(`${base}/tests/gry/express-harness.html`)).status(), 404)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: 'test-results/production/express-mobile.png', fullPage: true })
  assert.deepEqual(errors, [])
  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await noJs.newPage()
  await staticPage.goto(`${base}/warcaby-arena-mocy`)
  assert.equal(await staticPage.locator('.square').count(), 64)
  assert.ok((await staticPage.title()).includes('Warcaby — Arena Mocy'))
  await staticPage.goto(`${base}/jeszcze-jeden-krysztal`)
  assert.ok((await staticPage.title()).includes('Jeszcze jeden kryształ'))
  assert.ok(await staticPage.getByRole('button', { name: 'Zaczynamy →' }).isVisible())
  await staticPage.goto(`${base}/klocki`)
  assert.ok((await staticPage.title()).includes('Klocki'))
  assert.equal(await staticPage.locator('.board-cell').count(), 64)
  await staticPage.goto(`${base}/male-krolestwo`)
  assert.ok((await staticPage.title()).includes('Małe królestwo'))
  assert.equal(await staticPage.locator('.kingdom-faq details').count(), 15)
  assert.ok(await staticPage.locator('.residents-panel > summary').isVisible())
  assert.ok(await staticPage.locator('.progression-panel summary').isVisible())
  assert.ok((await staticPage.locator('.kingdom-faq').textContent()).includes('Jak awansować'))
  assert.ok(
    (await staticPage.locator('.kingdom-faq').textContent()).includes('Jak działają najazdy'),
  )
  assert.equal(await staticPage.locator('.defence-panel > summary').count(), 2)
  assert.ok(await staticPage.locator('.discovery-journal').isVisible())
  assert.equal(await staticPage.locator('[data-tile]').count(), 49)
  assert.ok(await staticPage.getByRole('button', { name: 'Zatwierdź turę' }).isDisabled())
  await staticPage.goto(`${base}/ostatnia-latarnia`)
  assert.ok((await staticPage.title()).includes('Ostatnia latarnia'))
  assert.equal(await staticPage.locator('.lh-faq details').count(), 5)
  assert.ok(await staticPage.locator('.lh-start').isDisabled())
  await staticPage.goto(`${base}/nocny-ekspres`)
  assert.ok((await staticPage.title()).includes('Nocny ekspres'))
  assert.equal(await staticPage.locator('.ne-faq details').count(), 5)
  assert.ok(
    await staticPage.getByRole('button', { name: '▶ Wznów ruch', exact: true }).isDisabled(),
  )
  assert.equal((await staticPage.goto(`${base}/nie-ma-takiej-gry`)).status(), 404)
  console.log(
    'Production browser OK: six games, catalog desktop/mobile, clean routes, per-game SEO, no hydration errors, AI, Crystal Rush and Lighthouse start/pause, Blocks, Kingdom and Express play/restore, prerender without JavaScript, test harness excluded, 404.',
  )
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}

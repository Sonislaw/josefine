import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { chromium } from '@playwright/test'

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
  assert.deepEqual(errors, [])
  const noJs = await browser.newContext({ javaScriptEnabled: false })
  const staticPage = await noJs.newPage()
  await staticPage.goto(`${base}/warcaby-arena-mocy`)
  assert.equal(await staticPage.locator('.square').count(), 64)
  assert.ok((await staticPage.title()).includes('Warcaby — Arena Mocy'))
  await staticPage.goto(`${base}/jeszcze-jeden-krysztal`)
  assert.ok((await staticPage.title()).includes('Jeszcze jeden kryształ'))
  assert.ok(await staticPage.getByRole('button', { name: 'Zaczynamy →' }).isVisible())
  assert.equal((await staticPage.goto(`${base}/nie-ma-takiej-gry`)).status(), 404)
  console.log(
    'Production browser OK: both games, catalog desktop/mobile, clean routes, per-game SEO, no hydration errors, AI, Crystal Rush start/pause, prerender without JavaScript, 404.',
  )
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}

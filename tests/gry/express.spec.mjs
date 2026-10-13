import { test, expect } from '@playwright/test'
const url = '/gry/nocny-ekspres',
  harness = '/tests/gry/express-harness.html',
  key = 'zgrana:gry:nocny-ekspres:v1'
async function prepare(page, fixture) {
  await page.addInitScript((f) => {
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    window.expressFixture = f
  }, fixture)
}
const run = (page) => page.getByRole('button', { name: '▶ Wznów ruch', exact: true }).click()
const pause = (page) => page.getByRole('button', { name: 'Ⅱ Pauza', exact: true }).click()
const mode = (page, value) => expect(page.locator('.ne-map')).toHaveAttribute('data-mode', value)
test('catalog, dedicated route, own SEO, FAQ and no production test API', async ({ page }) => {
  await prepare(page)
  await page.goto('/gry')
  await expect(page.locator('.game-card')).toHaveCount(6)
  await page.locator('.game-card').filter({ hasText: 'Nocny ekspres' }).click()
  await expect(page).toHaveURL(/\/gry\/nocny-ekspres$/)
  await expect(page).toHaveTitle(/Nocny ekspres/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/night-express.png$/,
  )
  await expect(page.locator('.ne-faq details')).toHaveCount(5)
  expect(await page.evaluate(() => window.expressHarness)).toBeUndefined()
})
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [800, 1024],
  [1440, 1000],
])
  test(`responsive rail map and controls ${width}×${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await prepare(page)
    await page.goto(url)
    await expect(page.getByRole('button', { name: '▶ Wznów ruch', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: info.outputPath('initial.png'), fullPage: true })
    await run(page)
    await mode(page, 'playing')
    if (width <= 600) {
      const controls = await page.locator('.ne-controls').boundingBox()
      expect(controls.y + controls.height).toBeLessThanOrEqual(height)
    }
    await pause(page)
    await mode(page, 'paused')
    await page.screenshot({ path: info.outputPath('map.png'), fullPage: true })
    await page.locator('.ne-stage').screenshot({ path: info.outputPath('arena.png') })
  })
test('keyboard-accessible construction preview/commit and exact paused restore', async ({
  page,
}) => {
  await prepare(page)
  await page.goto(harness)
  await page.getByRole('button', { name: '＋ Buduj sieć' }).click()
  await page.locator('.ne-connect select').nth(0).selectOption('1')
  await page.locator('.ne-connect select').nth(1).selectOption('2')
  await page.getByRole('button', { name: 'Podgląd toru' }).click()
  await expect(page.locator('.ne-draft')).toContainText('10 jednostek')
  expect(await page.evaluate(() => Object.keys(window.expressHarness.game().edges).length)).toBe(3)
  await page.getByRole('button', { name: 'Zatwierdź zmianę' }).click()
  expect(await page.evaluate(() => window.expressHarness.game().rails)).toBe(38)
  await page.reload()
  await mode(page, 'paused')
  await expect(page.locator('.ne-dispatch')).toContainText('38')
  const s = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
  expect(Object.keys(s.game.edges)).toHaveLength(4)
  expect(s.game.rails).toBe(38)
})
test('real touch construction requires confirmation; cancelled gestures and pinch never edit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
  await page.goto(harness)
  await page.getByRole('button', { name: '＋ Buduj sieć' }).click()
  const positions = async () => {
    await page.locator('canvas').scrollIntoViewIfNeeded()
    const box = await page.locator('canvas').boundingBox(),
      z = Math.min(box.width / 560, 1)
    return (x, y) => ({ x: box.x + box.width / 2 + x * z, y: box.y + box.height / 2 + y * z })
  }
  let point = await positions(),
    a = point(-190, 120),
    b = point(190, 120)
  const client = await page.context().newCDPSession(page)
  const send = (type, touchPoints) => client.send('Input.dispatchTouchEvent', { type, touchPoints })
  await send('touchStart', [{ id: 1, ...a }])
  await send('touchMove', [{ id: 1, ...b }])
  await send('touchEnd', [])
  await expect(page.locator('.ne-draft')).toContainText('10 jednostek')
  expect(await page.evaluate(() => Object.keys(window.expressHarness.game().edges).length)).toBe(3)
  await page.getByRole('button', { name: 'Anuluj', exact: true }).click()
  point = await positions()
  a = point(-190, 120)
  b = point(190, 120)
  await send('touchStart', [{ id: 1, ...a }])
  await send('touchMove', [{ id: 1, ...b }])
  await send('touchCancel', [])
  await expect(page.locator('.ne-draft')).toHaveCount(0)
  point = await positions()
  const center = point(0, 40),
    oldZoom = await page.locator('.ne-map-note').innerText()
  await send('touchStart', [
    { id: 1, x: center.x - 30, y: center.y },
    { id: 2, x: center.x + 30, y: center.y },
  ])
  await send('touchMove', [
    { id: 1, x: center.x - 55, y: center.y },
    { id: 2, x: center.x + 55, y: center.y },
  ])
  await send('touchEnd', [])
  await expect(page.locator('.ne-map-note')).not.toHaveText(oldZoom)
  expect(await page.evaluate(() => Object.keys(window.expressHarness.game().edges).length)).toBe(3)
  await client.detach()
})
test('turnout, station signal, keyboard pan and blur preserve simulation and require explicit resume', async ({
  page,
}) => {
  await prepare(page)
  await page.goto(harness)
  await page.locator('.ne-node-picker select').selectOption('4')
  await page.getByRole('button', { name: 'Przełącz zwrotnicę' }).click()
  expect(await page.evaluate(() => window.expressHarness.game().nodes[4].pair)).toEqual([2, 3])
  await page.locator('.ne-node-picker select').selectOption('1')
  await page.getByRole('button', { name: 'Ⅱ Wstrzymaj odjazdy' }).click()
  expect(await page.evaluate(() => window.expressHarness.game().nodes[1].hold)).toBe(true)
  await run(page)
  await page.waitForFunction(() => window.expressHarness.game().elapsed > 0.1)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await mode(page, 'paused')
  const before = await page.evaluate(() => JSON.stringify(window.expressHarness.game().trains))
  await page.setViewportSize({ width: 844, height: 390 })
  await page.locator('canvas').focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('+')
  expect(await page.evaluate(() => JSON.stringify(window.expressHarness.game().trains))).toBe(
    before,
  )
  await mode(page, 'paused')
})
test('upgrade overlay has legal choices, freezes time and saves the chosen improvement', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await prepare(page, 'upgrade')
  await page.goto(harness)
  await run(page)
  await mode(page, 'upgrade')
  await expect(page.locator('.ne-upgrades button')).toHaveCount(3)
  const before = await page.evaluate(() => window.expressHarness.game().elapsed)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.expressHarness.game().elapsed)).toBe(before)
  await page.screenshot({ path: info.outputPath('upgrade.png'), fullPage: true })
  await page.getByRole('button', { name: /Dłuższe składy/ }).click()
  await mode(page, 'paused')
  expect(await page.evaluate(() => window.expressHarness.game().capacity)).toBe(8)
})
test('three real collision resolutions, replacements, terminal summary and confirmed restart', async ({
  page,
}) => {
  await prepare(page)
  await page.goto(harness)
  for (let i = 1; i <= 3; i++) {
    await page.evaluate(() => {
      const g = window.expressHarness.game(),
        e = Object.values(g.edges)[0],
        a = g.nodes[e.a],
        b = g.nodes[e.b],
        length = Math.hypot(a.x - b.x, a.y - b.y)
      g.trains.forEach((t, index) =>
        Object.assign(t, {
          node: null,
          edge: e.id,
          from: index ? e.b : e.a,
          to: index ? e.a : e.b,
          progress: index ? length - 110 : 100,
          dwell: 0,
          onboard: [],
        }),
      )
    })
    await run(page)
    await mode(page, i === 3 ? 'gameover' : 'paused')
    expect(await page.evaluate(() => window.expressHarness.game().lives)).toBe(3 - i)
  }
  await expect(page.locator('.ne-result')).toContainText('Zmiana zakończona')
  await page.getByRole('button', { name: 'Jeszcze jedna noc →' }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną sieć' }).click()
  await mode(page, 'gameover')
  await page.getByRole('button', { name: 'Jeszcze jedna noc →' }).click()
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click()
  await mode(page, 'paused')
  expect(await page.evaluate(() => window.expressHarness.game().lives)).toBe(3)
})
test('corrupt save is not overwritten until confirmation; denied storage stays playable', async ({
  page,
}) => {
  await prepare(page)
  await page.addInitScript((k) => localStorage.setItem(k, '{broken'), key)
  await page.goto(harness)
  await expect(page.locator('.ne-notice')).toContainText('Nie nadpisaliśmy')
  await page.getByRole('button', { name: 'Włącz dźwięk' }).click()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{broken')
  await page.getByRole('button', { name: 'Rozpocznij nową grę', exact: true }).click()
  await page.getByRole('button', { name: 'Nowa gra', exact: true }).click()
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).version, key)).toBe(1)
})
test('unavailable storage, help and sound do not block play or route cleanup', async ({ page }) => {
  await prepare(page)
  await page.addInitScript((k) => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (name) {
      if (name === k) throw Error('denied')
      return get.call(this, name)
    }
    Storage.prototype.setItem = function (name, value) {
      if (name === k) throw Error('denied')
      return set.call(this, name, value)
    }
  }, key)
  await page.goto(url)
  await expect(page.locator('.ne-notice')).toContainText('Pamięć')
  await run(page)
  await page.getByRole('button', { name: 'Jak grać? ↗' }).click()
  await mode(page, 'paused')
  await page.getByRole('dialog').getByRole('button', { name: 'Rozumiem', exact: true }).click()
  await mode(page, 'paused')
  await page.getByRole('button', { name: 'Włącz dźwięk' }).click()
  await page.getByRole('link', { name: /Wszystkie gry/ }).click()
  await expect(page.locator('.game-card')).toHaveCount(6)
})
test('100 districts, 16 trains, minimap and viewport remain usable', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, 'large')
  await page.goto(harness)
  await expect(page.locator('.ne-dispatch')).toContainText('100')
  await page.getByRole('button', { name: 'Pokaż najnowszą dzielnicę' }).click()
  await page.getByRole('button', { name: 'Oddal mapę' }).click()
  await page.screenshot({ path: info.outputPath('large-map.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  expect(await page.locator('.ne-node-picker option').count()).toBeLessThan(70)
  await page.getByRole('button', { name: 'Wróć do zajezdni' }).click()
  await run(page)
  await pause(page)
  await mode(page, 'paused')
})
test('twenty restarts keep one RAF; unmount cancels RAF and pointer handlers', async ({ page }) => {
  await prepare(page)
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window)
    window.framesPending = new Set()
    window.requestAnimationFrame = (cb) => {
      const id = request((t) => {
        window.framesPending.delete(id)
        cb(t)
      })
      window.framesPending.add(id)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      window.framesPending.delete(id)
      cancel(id)
    }
  })
  await page.goto(harness)
  for (let i = 0; i < 20; i++) {
    await page.getByRole('button', { name: 'Rozpocznij nową noc' }).click()
    await page.getByRole('button', { name: 'Nowa gra', exact: true }).click()
  }
  expect(await page.evaluate(() => window.framesPending.size)).toBe(1)
  await page.evaluate(() => window.expressApp.unmount())
  expect(await page.evaluate(() => window.framesPending.size)).toBe(0)
})

import { test, expect } from '@playwright/test'
const url = '/gry/ostatnia-latarnia',
  harness = '/tests/gry/lighthouse-harness.html',
  key = 'zgrana:gry:ostatnia-latarnia:v1'
async function prepare(page, fixture) {
  await page.addInitScript((f) => {
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    window.lighthouseFixture = f
  }, fixture)
}
const start = (page) => page.locator('.lh-start').click()
const mode = (page, value) => expect(page.locator('.lh-arena')).toHaveAttribute('data-mode', value)
test('catalog, own route, SEO and no exposed production test state', async ({ page }) => {
  await prepare(page)
  await page.goto('/gry')
  await expect(page.locator('.game-card')).toHaveCount(5)
  await page.locator('.game-card').filter({ hasText: 'Ostatnia latarnia' }).click()
  await expect(page).toHaveURL(/\/gry\/ostatnia-latarnia$/)
  await expect(page).toHaveTitle(/Ostatnia latarnia/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/last-lighthouse.png$/,
  )
  expect(await page.evaluate(() => window.lighthouseHarness)).toBeUndefined()
  await expect(page.locator('.lh-faq details')).toHaveCount(5)
})
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [800, 1024],
  [1440, 1000],
])
  test(`menu, arena and controls fit ${width}×${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await prepare(page)
    await page.goto(url)
    await expect(page.locator('[data-hero="storm"]')).toBeDisabled()
    await expect(page.locator('[data-hero="iron"]')).toBeDisabled()
    const b = await page.locator('.lh-start').boundingBox(),
      f = await page.locator('.lh-arena').boundingBox()
    expect(b.y + b.height).toBeLessThanOrEqual(f.y + f.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: info.outputPath('menu.png'), fullPage: true })
    await start(page)
    await mode(page, 'playing')
    if (width <= 600) {
      const controls = await page.locator('.lh-controls').boundingBox()
      expect(controls.y + controls.height).toBeLessThanOrEqual(height)
    }
    await page.getByRole('button', { name: 'Ⅱ Pauza' }).click()
    await mode(page, 'paused')
    await page.screenshot({ path: info.outputPath('paused.png'), fullPage: true })
  })
for (const [width, height] of [
  [360, 640],
  [390, 844],
])
  test(`real upgrade overlay is fully reachable ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await prepare(page, 'upgrade')
    await page.goto(harness)
    await start(page)
    await mode(page, 'upgrade')
    await expect(page.locator('[data-choice]')).toHaveCount(3)
    const time = await page.evaluate(() => window.lighthouseHarness.game().elapsed)
    await page.waitForTimeout(150)
    expect(await page.evaluate(() => window.lighthouseHarness.game().elapsed)).toBe(time)
    const last = await page.locator('[data-choice="2"]').boundingBox(),
      arena = await page.locator('.lh-arena').boundingBox()
    expect(last.y + last.height).toBeLessThanOrEqual(arena.y + arena.height)
    expect(
      await page.locator('.lh-overlay').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('upgrade.png'), fullPage: true })
    await page.locator('[data-choice="0"]').click()
    await mode(page, 'playing')
  })
test('keyboard, equipment, blur and resize preserve state without auto resume', async ({
  page,
}) => {
  await prepare(page)
  await page.goto(harness)
  await start(page)
  const before = await page.evaluate(() => ({ ...window.lighthouseHarness.game().player }))
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(180)
  await page.keyboard.up('ArrowRight')
  expect(await page.evaluate(() => window.lighthouseHarness.game().player.x)).toBeGreaterThan(
    before.x,
  )
  await page.getByRole('button', { name: '✧ Moce' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await mode(page, 'paused')
  await page.keyboard.press('Escape')
  await mode(page, 'paused')
  const p = await page.evaluate(() => ({ ...window.lighthouseHarness.game().player }))
  await page.setViewportSize({ width: 360, height: 640 })
  expect(await page.evaluate(() => ({ ...window.lighthouseHarness.game().player }))).toEqual(p)
  await page.getByRole('button', { name: 'Wracam do światła' }).click()
  await mode(page, 'playing')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await mode(page, 'paused')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await mode(page, 'paused')
})
test('real touch joystick owns first pointer, release/cancel stops movement', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
  await page.goto(harness)
  await start(page)
  const b = await page.locator('canvas').boundingBox(),
    cdp = await context.newCDPSession(page),
    touch = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 })
  const origin = touch(1, b.x + 90, b.y + 210),
    destination = touch(1, b.x + 150, b.y + 210)
  const x = await page.evaluate(() => window.lighthouseHarness.game().player.x)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] })
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.lighthouseHarness.game().player.x)).toBeGreaterThan(x)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [destination, touch(2, b.x + 200, b.y + 170)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const stopped = await page.evaluate(() => ({ ...window.lighthouseHarness.game().player }))
  await page.waitForTimeout(120)
  expect(await page.evaluate(() => window.lighthouseHarness.game().player.x)).toBe(stopped.x)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  const cancelled = await page.evaluate(() => window.lighthouseHarness.game().player.x)
  await page.waitForTimeout(120)
  expect(await page.evaluate(() => window.lighthouseHarness.game().player.x)).toBe(cancelled)
})
test('storm unlock saves immediately, persists after reload and starts correct hero', async ({
  page,
}) => {
  await prepare(page, 'unlock')
  await page.goto(harness)
  await start(page)
  await expect
    .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').unlocked, key))
    .toContain('storm')
  await page.reload()
  await expect(page.locator('[data-hero="storm"]')).toBeEnabled()
  await page.locator('[data-hero="storm"]').click()
  await start(page)
  await expect(page.getByTestId('lighthouse-hp')).toHaveText('80 / 80')
})
test('victory and death screens, records, new hero, replay and locked progression', async ({
  page,
}) => {
  await prepare(page, 'victory')
  await page.goto(harness)
  await start(page)
  await mode(page, 'victory')
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
  expect(saved.unlocked).toContain('iron')
  expect(saved.victories).toBe(1)
  await page.getByRole('button', { name: 'Wybierz bohatera', exact: true }).click()
  await mode(page, 'menu')
  await expect(page.locator('[data-hero="iron"]')).toBeEnabled()
  await page.evaluate(() => {
    window.lighthouseFixture = 'loss'
  })
  await start(page)
  await mode(page, 'gameover')
  await expect(page.getByRole('button', { name: 'Jeszcze raz' })).toBeVisible()
  expect((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)).victories).toBe(1)
})
test('unavailable storage, optional audio, help and real route cleanup', async ({ page }) => {
  await prepare(page)
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (k) {
      if (k === 'zgrana:gry:ostatnia-latarnia:v1') throw Error('denied')
      return get.call(this, k)
    }
    Storage.prototype.setItem = function (k, v) {
      if (k === 'zgrana:gry:ostatnia-latarnia:v1') throw Error('denied')
      return set.call(this, k, v)
    }
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url)
  await expect(page.locator('.lh-storage')).toContainText('niedostępna')
  await page.getByRole('button', { name: '♪ Dźwięk wył.' }).click()
  await expect(page.getByRole('button', { name: '♪ Dźwięk wł.' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await start(page)
  await page.getByRole('button', { name: 'Jak grać?' }).click()
  await page.keyboard.press('Escape')
  await mode(page, 'paused')
  await page.getByRole('link', { name: /Wszystkie gry/ }).click()
  await expect(page.locator('.game-card')).toHaveCount(5)
  expect(errors).toEqual([])
})
test('twenty resets retain a single RAF and unmount removes it', async ({ page }) => {
  await prepare(page)
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window)
    window.pendingFrames = new Set()
    window.requestAnimationFrame = (fn) => {
      const id = request((t) => {
        window.pendingFrames.delete(id)
        fn(t)
      })
      window.pendingFrames.add(id)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      window.pendingFrames.delete(id)
      cancel(id)
    }
  })
  await page.goto(harness)
  for (let i = 0; i < 20; i++) {
    await start(page)
    await page.getByRole('button', { name: 'Ⅱ Pauza' }).click()
    await page.getByRole('button', { name: 'Zakończ wyprawę' }).click()
    await page.getByRole('button', { name: 'Tak, wybierz bohatera' }).click()
    await mode(page, 'menu')
  }
  expect(await page.evaluate(() => window.pendingFrames.size)).toBe(1)
  await page.evaluate(() => window.lighthouseApp.unmount())
  expect(await page.evaluate(() => window.pendingFrames.size)).toBe(0)
})
test('mobile combat illustration, boss telegraph and reduced-motion rendering', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(harness)
  await start(page)
  await page.evaluate(() => {
    const api = window.lighthouseHarness,
      g = api.game()
    g.elapsed = 601
    g.bossSpawned = true
    g.eliteFlags = [true, true]
    g.player.invulnerable = 999
    g.weapons = { fire: 4, lightning: 4, blades: 4 }
    g.evolved = ['fire', 'lightning', 'blades']
    g.passives = { power: 2, haste: 2, speed: 2 }
    for (let i = 0; i < 22; i++) {
      const a = i * 2.4,
        e = api.spawner.createEnemy(g, ['shade', 'runner', 'heavy'][i % 3], {
          x: g.player.x + Math.cos(a) * 185,
          y: g.player.y + Math.sin(a) * 215,
        })
      e.hp = e.maxHp = 10000
      g.enemies.push(e)
    }
    const boss = api.spawner.createEnemy(g, 'boss', { x: g.player.x, y: g.player.y - 200 })
    boss.attack = 'charge-warning'
    boss.timer = 2
    boss.dx = 0
    boss.dy = 1
    g.enemies.push(boss)
  })
  await expect(page.getByRole('progressbar', { name: 'Zdrowie bossa' })).toBeVisible()
  await page.locator('.lh-arena').screenshot({ path: info.outputPath('combat-mobile.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

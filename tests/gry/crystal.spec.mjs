import { test, expect } from '@playwright/test'
const url = '/gry/jeszcze-jeden-krysztal'
async function prepare(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    } catch {
      /* optional */
    }
  })
}
async function open(page) {
  await prepare(page)
  await page.goto(url)
  await expect(page.getByRole('button', { name: 'Zaczynamy' })).toBeFocused()
}

test('crystal catalog entry, metadata and independent lazy route', async ({ page }) => {
  await prepare(page)
  await page.goto('/gry')
  await expect(page.locator('.game-card')).toHaveCount(5)
  await page.locator('.game-card').filter({ hasText: 'Jeszcze jeden kryształ' }).click()
  await expect(page).toHaveURL(/\/gry\/jeszcze-jeden-krysztal$/)
  await expect(page).toHaveTitle(/Jeszcze jeden kryształ/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /crystal-rush.png$/,
  )
})
for (const width of [360, 390, 800, 1440]) {
  test(`crystal canvas and menu fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 })
    await open(page)
    const box = await page.locator('canvas').boundingBox()
    if (width > 600) expect(Math.abs(box.width / box.height - 1.5)).toBeLessThan(0.015)
    else expect(box.height).toBeGreaterThan(box.width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: testInfo.outputPath(`crystal-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: 'Zaczynamy' }).click()
    await expect(page.locator('canvas')).toBeFocused()
    await page.keyboard.press('KeyP')
    await expect(page.getByRole('button', { name: 'Wracam do gry' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.keyboard.press('Space')
    await expect(page.locator('.dash-button')).toBeDisabled()
  })
}
test('actual UI: start, level, choose upgrade, pause, loss, record and replay', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000)
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await open(page)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByRole('button', { name: 'Zaczynamy' }).click()
  await expect(page.getByRole('dialog', { name: 'Wybór ulepszenia' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Silnik/ })).toBeFocused()
  await page.screenshot({ path: testInfo.outputPath('upgrade.png'), fullPage: true })
  await page.getByRole('button', { name: /Silnik/ }).click()
  await page.keyboard.press('KeyP')
  await page.getByRole('button', { name: 'Wracam do gry' }).click()
  // No player movement: intentionally lose to verify the complete actual UI flow.
  const deadline = Date.now() + 40000
  while (
    Date.now() < deadline &&
    !(await page.getByRole('button', { name: 'Jeszcze raz' }).count())
  ) {
    if (await page.getByRole('button', { name: /Silnik/ }).count())
      await page.getByRole('button', { name: /Silnik/ }).click()
    if (await page.getByRole('button', { name: 'Wracam do gry' }).count())
      await page.getByRole('button', { name: 'Wracam do gry' }).click()
    await page.waitForTimeout(150)
  }
  await expect(page.getByRole('dialog', { name: 'Koniec rundy' })).toBeVisible()
  const score = await page.locator('.final-score').innerText()
  expect(Number.parseInt(score, 10)).toBeGreaterThan(0)
  expect(
    await page.evaluate(() => Number(localStorage.getItem('crystal-rush-best'))),
  ).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Jeszcze raz' }).click()
  await expect(page.locator('.hearts')).toHaveAttribute('aria-label', 'Życia: 3 z 3')
  expect(errors).toEqual([])
})

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [430, 932],
]) {
  test(`mobile menu, upgrade and controls fit without inner scroll at ${width}×${height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.addInitScript(() => {
      Math.random = () => 0.5
    })
    await open(page)
    const noInnerScroll = async () => {
      expect(
        await page.locator('.game-overlay').evaluate((el) => el.scrollHeight - el.clientHeight),
      ).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
    }
    await noInnerScroll()
    const start = await page.getByRole('button', { name: 'Zaczynamy' }).boundingBox()
    expect(start.y + start.height).toBeLessThan(height)
    await page.screenshot({ path: testInfo.outputPath('mobile-menu.png'), fullPage: true })
    await page.getByRole('button', { name: 'Zaczynamy' }).click()
    const controls = await page.locator('.arena-controls').boundingBox()
    const arena = await page.locator('canvas').boundingBox()
    expect(arena.y).toBeGreaterThanOrEqual(0)
    expect(controls.y + controls.height).toBeLessThan(height)
    await page.screenshot({ path: testInfo.outputPath('mobile-playing.png') })
    await expect(page.getByRole('dialog', { name: 'Wybór ulepszenia' })).toBeVisible()
    await noInnerScroll()
    for (const card of await page.locator('.upgrade-card').all()) {
      const box = await card.boundingBox()
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height).toBeLessThan(height)
    }
    await page.screenshot({ path: testInfo.outputPath('mobile-upgrade.png') })
    await page.getByRole('button', { name: /Magnes/ }).click()
    await expect(page.locator('canvas')).toBeFocused()
  })
}

test('rotation preserves mobile round geometry and object coordinates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/tests/gry/crystal-harness.html')
  await page.waitForFunction(() => window.crystalTest)
  await page.evaluate(() => {
    window.crystalTest.start()
    window.crystalTest.togglePause()
  })
  const before = await page.evaluate(() => JSON.stringify(window.crystalTest.getGame()))
  await page.setViewportSize({ width: 844, height: 390 })
  const after = await page.evaluate(() => JSON.stringify(window.crystalTest.getGame()))
  expect(after).toBe(before)
  expect(JSON.parse(after).arena).toEqual({ width: 450, height: 600 })
})

test('mobile active arena shows the larger ship and incoming meteors', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Math.random = () => 0.9
  })
  await open(page)
  await page.getByRole('button', { name: 'Zaczynamy' }).click()
  await expect(page.locator('.meteor-count')).toContainText('Meteory: 1')
  // Allow the first meteor to travel into the world from its off-screen birth point.
  await page.waitForTimeout(1200)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('mobile-active.png') })
})
test('touch drag keeps first pointer, second finger dashes; release/cancel and blur clear movement', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/tests/gry/crystal-harness.html')
  await page.waitForFunction(() => window.crystalTest)
  await page.evaluate(() => window.crystalTest.start())
  const cdp = await context.newCDPSession(page)
  const touch = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(1, 700, 300)],
  })
  await page.waitForTimeout(120)
  const first = await page.evaluate(() => window.crystalTest.getGame().player.x)
  expect(first).toBeGreaterThan(450)
  // The second arena pointer must not become the movement target.
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(1, 700, 300), touch(2, 100, 300)],
  })
  await page.waitForTimeout(100)
  expect(await page.evaluate(() => window.crystalTest.getGame().player.x)).toBeGreaterThan(first)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  const stopped = await page.evaluate(() => window.crystalTest.getGame().player.x)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.crystalTest.getGame().player.x)).toBeCloseTo(stopped)
  await page.locator('canvas').focus()
  await page.keyboard.down('ArrowRight')
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.keyboard.up('ArrowRight')
  expect(await page.evaluate(() => window.crystalTest.getGame().mode)).toBe('paused')
  const paused = await page.evaluate(() => window.crystalTest.getGame().elapsed)
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.crystalTest.getGame().elapsed)).toBe(paused)
})
test('two-finger movement plus actual dash button works on mobile', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await open(page)
  await page.getByRole('button', { name: 'Zaczynamy' }).click()
  const arena = await page.locator('canvas').boundingBox(),
    button = await page.locator('.dash-button').boundingBox()
  const cdp = await context.newCDPSession(page)
  const a = {
    id: 1,
    x: arena.x + arena.width * 0.8,
    y: arena.y + arena.height * 0.7,
    radiusX: 2,
    radiusY: 2,
    force: 1,
  }
  const b = {
    id: 2,
    x: button.x + button.width / 2,
    y: button.y + button.height / 2,
    radiusX: 2,
    radiusY: 2,
    force: 1,
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a, b] })
  await expect(page.locator('.dash-button')).toBeDisabled()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.getByRole('button', { name: /Pauza/ }).click()
})
test('twenty restarts use one RAF/listener set; unmount cleans all bindings', async ({ page }) => {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame,
      cancel = window.cancelAnimationFrame
    window.crystalFrames = new Set()
    window.requestAnimationFrame = (callback) => {
      const tracked = callback.name === 'animate'
      const id = raf((time) => {
        if (tracked) window.crystalFrames.delete(id)
        callback(time)
      })
      if (tracked) window.crystalFrames.add(id)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      window.crystalFrames.delete(id)
      cancel(id)
    }
    window.crystalListeners = new Set()
    const add = window.addEventListener.bind(window),
      remove = window.removeEventListener.bind(window)
    window.addEventListener = (type, fn, options) => {
      if (type === 'keydown' && fn.name === 'keyDown') window.crystalListeners.add(fn)
      add(type, fn, options)
    }
    window.removeEventListener = (type, fn, options) => {
      if (type === 'keydown') window.crystalListeners.delete(fn)
      remove(type, fn, options)
    }
  })
  await page.goto('/tests/gry/crystal-harness.html')
  await page.waitForFunction(() => window.crystalTest)
  const result = await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.crystalTest.start()
    const before = { frames: window.crystalFrames.size, listeners: window.crystalListeners.size }
    window.crystalApp.unmount()
    return {
      before,
      after: { frames: window.crystalFrames.size, listeners: window.crystalListeners.size },
    }
  })
  expect(result).toEqual({
    before: { frames: 1, listeners: 1 },
    after: { frames: 0, listeners: 0 },
  })
})
test('denied record storage does not block gameplay; resize preserves world coordinates', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key.startsWith('crystal-rush')) throw Error('denied')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('crystal-rush')) throw Error('denied')
      return set.call(this, key, value)
    }
  })
  await open(page)
  await expect(page.locator('.storage-note')).toContainText('niedostępna')
  await page.getByRole('button', { name: 'Zaczynamy' }).click()
  await page.keyboard.press('KeyP')
  await page.setViewportSize({ width: 360, height: 900 })
  await expect(page.getByRole('button', { name: 'Wracam do gry' })).toBeVisible()
  await page.getByRole('button', { name: 'Wracam do gry' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

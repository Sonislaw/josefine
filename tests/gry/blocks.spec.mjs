import { test, expect } from '@playwright/test'
const url = '/gry/klocki',
  key = 'zgrana:gry:klocki:v1'
const empty = () => ({
  board: Array(64).fill(0),
  tray: ['dot', 'dot', 'dot'],
  score: 0,
  streak: 0,
  lines: 0,
  moves: 0,
  status: 'playing',
})
async function prepare(page, round = null) {
  await page.addInitScript(
    ({ key, round }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      Math.random = () => 0
      if (round)
        localStorage.setItem(
          key,
          JSON.stringify({ version: 1, round, best: round.score, sound: false }),
        )
    },
    { key, round },
  )
}
async function start(page) {
  await page.goto(url)
  await page.getByRole('button', { name: 'Zaczynamy' }).click()
}
const slot = (page, n) => page.locator(`[data-slot="${n}"]`)
const cell = (page, n) => page.locator(`[data-cell="${n}"]`)

test('catalog, own route and SEO', async ({ page }) => {
  await prepare(page)
  await page.goto('/gry')
  await page.locator('.game-card').filter({ hasText: 'Klocki' }).click()
  await expect(page).toHaveURL(/\/gry\/klocki$/)
  await expect(page).toHaveTitle(/Klocki/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/blocks.png$/,
  )
  await expect(page.locator('.board-cell')).toHaveCount(64)
})
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [430, 932],
  [800, 1024],
  [1440, 1000],
]) {
  test(`layout and tap placement ${width}×${height}`, async ({ page }, testInfo) => {
    await prepare(page)
    await page.setViewportSize({ width, height })
    await page.goto(url)
    const button = await page.locator('.blocks-start').boundingBox()
    const frame = await page.locator('.blocks-frame').boundingBox()
    expect(button.y + button.height).toBeLessThanOrEqual(frame.y + frame.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: testInfo.outputPath('menu.png'), fullPage: true })
    await page.locator('.blocks-start').click()
    await slot(page, 0).click()
    await cell(page, 9).click()
    await expect(cell(page, 9)).toHaveClass(/cell-filled/)
    await expect(page.getByTestId('blocks-score')).toHaveText('1')
    if (width <= 600) {
      const tray = await page.locator('.blocks-tray').boundingBox()
      expect(tray.y + tray.height).toBeLessThan(height)
    }
    await page.screenshot({ path: testInfo.outputPath('playing.png'), fullPage: true })
  })
}
test('keyboard selection, preview, placement and invalid move', async ({ page }) => {
  await prepare(page)
  await start(page)
  await slot(page, 0).focus()
  await page.keyboard.press('Enter')
  await expect(cell(page, 0)).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(cell(page, 9)).toHaveClass(/cell-filled/)
  await slot(page, 1).focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
  await expect(page.locator('.blocks-feedback')).toContainText('nie mieści')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Space')
  await expect(page.getByTestId('blocks-score')).toHaveText('2')
})
test('mouse drag commits once; outside drop and blur leave the board untouched', async ({
  page,
}) => {
  await prepare(page)
  await start(page)
  const b = await page.locator('.blocks-board').boundingBox(),
    s = await slot(page, 0).boundingBox()
  const unit = (b.width + 4) / 8
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + 2.5 * unit, b.y + 2 * unit + unit + 18, { steps: 8 })
  await expect(page.locator('.blocks-ghost')).toBeVisible()
  await expect(cell(page, 18)).toHaveClass(/cell-preview/)
  await page.mouse.up()
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
  await expect(cell(page, 18)).toHaveClass(/cell-filled/)
  const second = await slot(page, 1).boundingBox()
  await page.mouse.move(second.x + 20, second.y + 20)
  await page.mouse.down()
  await page.mouse.move(1, 1, { steps: 3 })
  await page.mouse.up()
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
  await page.mouse.move(second.x + 20, second.y + 20)
  await page.mouse.down()
  await page.mouse.move(b.x + 20, b.y + 100)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.mouse.up()
  await expect(page.locator('.blocks-ghost')).toHaveCount(0)
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
})
test('touch drag preview stays above finger; cancel and second pointer do not place extra blocks', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
  await start(page)
  const b = await page.locator('.blocks-board').boundingBox(),
    s = await slot(page, 0).boundingBox(),
    unit = (b.width + 4) / 8
  const cdp = await context.newCDPSession(page)
  const touch = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 })
  const destination = touch(1, b.x + 2.5 * unit, b.y + 2 * unit + unit + 68)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(1, s.x + s.width / 2, s.y + s.height / 2)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] })
  const ghost = await page.locator('.blocks-ghost').boundingBox()
  expect(ghost.y + ghost.height).toBeLessThan(destination.y - 50)
  await expect(cell(page, 18)).toHaveClass(/cell-preview/)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [destination, touch(2, s.x + 10, s.y + 10)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
  const next = await slot(page, 1).boundingBox()
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touch(1, next.x + 20, next.y + 20)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(page.locator('.blocks-ghost')).toHaveCount(0)
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
})
test('restore exact round on reload; restart confirmation preserves or replaces it', async ({
  page,
}) => {
  await prepare(page)
  await start(page)
  await slot(page, 0).click()
  await cell(page, 10).click()
  const before = await page.evaluate((key) => localStorage.getItem(key), key)
  await page.reload()
  await expect(cell(page, 10)).toHaveClass(/cell-filled/)
  await expect(page.getByTestId('blocks-score')).toHaveText('1')
  await expect(page.locator('.blocks-save')).toContainText('Wczytaliśmy')
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(before)
  await page.getByRole('button', { name: 'Nowa runda', exact: false }).click()
  await page.getByRole('button', { name: 'Zostaję przy tej' }).click()
  await expect(cell(page, 10)).toHaveClass(/cell-filled/)
  await page.getByRole('button', { name: 'Nowa runda', exact: false }).click()
  await page.getByRole('button', { name: 'Tak, nowa runda' }).click()
  await expect(page.locator('.cell-filled')).toHaveCount(0)
  await expect(page.getByTestId('blocks-score')).toHaveText('0')
  expect(JSON.parse(await page.evaluate((key) => localStorage.getItem(key), key)).best).toBe(1)
})
test('simultaneous clear, next deal, gameover, replay and reduced motion', async ({ page }) => {
  const round = empty()
  for (let i = 1; i < 8; i++) {
    round.board[i] = 1
    round.board[i * 8] = 2
  }
  await prepare(page, round)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url)
  await slot(page, 0).click()
  await cell(page, 0).click()
  await expect(page.getByTestId('blocks-score')).toHaveText('41')
  await expect(page.locator('.cell-filled')).toHaveCount(0)
  await slot(page, 1).click()
  await cell(page, 0).click()
  await slot(page, 2).click()
  await cell(page, 1).click()
  await expect(page.locator('.shape-slot.used')).toHaveCount(0)
  // Load a valid almost-lost board through the real persistence boundary, never global app hooks.
  await page.evaluate((key) => {
    const round = {
      board: Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) + (i % 8)) % 2),
      tray: ['square', 'h2', 'dot'],
      score: 0,
      moves: 0,
      lines: 0,
      streak: 0,
    }
    localStorage.setItem(key, JSON.stringify({ version: 1, round, best: 41, sound: false }))
  }, key)
  // Avoid the initial fixture overwriting the new saved game by testing it in another same-origin tab.
  const other = await page.context().newPage()
  await other.goto(url)
  await slot(other, 2).click()
  await cell(other, 0).click()
  await expect(other.locator('.blocks-again')).toBeFocused()
  await expect(other.locator('.board-cell').first()).toBeDisabled()
  await other.locator('.blocks-again').click()
  await expect(other.getByTestId('blocks-score')).toHaveText('0')
})
test('denied storage, invalid data and help are nonfatal; route unmount during feedback', async ({
  page,
}) => {
  await prepare(page)
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'zgrana:gry:klocki:v1') throw Error('denied')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'zgrana:gry:klocki:v1') throw Error('denied')
      return set.call(this, key, value)
    }
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await start(page)
  await expect(page.locator('.blocks-save')).toContainText('Nie możemy zapisać')
  await slot(page, 0).click()
  await cell(page, 0).click()
  await page.getByRole('button', { name: 'Jak grać?' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: /Wszystkie gry/ }).click()
  expect(errors).toEqual([])
})

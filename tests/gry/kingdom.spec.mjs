import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const { newKingdom } = await jiti.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const url = '/gry/male-krolestwo',
  key = 'zgrana:gry:male-krolestwo:v1'
async function prepare(page, state = newKingdom(42)) {
  await page.addInitScript(
    ({ state, key }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('kingdom-fixture')) {
        localStorage.setItem(
          key,
          typeof state === 'string'
            ? state
            : JSON.stringify({ version: 1, state, tutorialDismissed: true }),
        )
        sessionStorage.setItem('kingdom-fixture', '1')
      }
    },
    { state, key },
  )
}
const turn = (page) => page.getByTestId('kingdom-turn')
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
const tile = (page, xy) => page.locator(`[data-tile="${xy}"]`)
const stored = (page) => page.evaluate((key) => localStorage.getItem(key), key)

test('catalog, own lazy route, title, illustration and FAQ', async ({ page }) => {
  await prepare(page)
  await page.goto('/gry')
  await expect(page.locator('.game-card')).toHaveCount(5)
  await page.locator('.game-card').filter({ hasText: 'Małe królestwo' }).click()
  await expect(page).toHaveURL(/\/gry\/male-krolestwo$/)
  await expect(page).toHaveTitle(/Małe królestwo/)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/little-kingdom.png$/,
  )
  await expect(page.locator('.kingdom-faq details')).toHaveCount(5)
  await expect(tile(page, '3,3')).toHaveAttribute('aria-label', /Ratusz/)
})
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [800, 1024],
  [1440, 1000],
]) {
  test(`layout, exact preview, build and restore ${width}×${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    await prepare(page)
    await page.goto(url)
    await expect(turn(page)).toHaveText('1')
    await page.locator('[data-building-card="farm"]').click()
    await tile(page, '0,1').click()
    await expect(page.locator('.turn-preview')).toContainText('Budowa: Farma')
    await expect(commit(page)).toBeEnabled()
    await expect(turn(page)).toHaveText('1')
    const forecast = await page.locator('.turn-preview dd strong').allTextContents()
    await commit(page).click()
    await expect(turn(page)).toHaveText('2')
    for (const [i, r] of ['wood', 'stone', 'food', 'gold'].entries())
      await expect(page.locator(`[data-resource="${r}"]`)).toHaveText(forecast[i])
    const before = await stored(page)
    await page.reload()
    await expect(turn(page)).toHaveText('2')
    expect(await stored(page)).toBe(before)
    await expect(tile(page, '0,1')).toHaveAttribute('aria-label', /Farma/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: info.outputPath('kingdom.png'), fullPage: true })
  })
}
test('upgrade, demolition and exploration', async ({ page }) => {
  const s = newKingdom(4)
  s.resources = { wood: 100, stone: 100, food: 100, gold: 100 }
  await prepare(page, s)
  await page.goto(url)
  await page.locator('[data-building-card="farm"]').click()
  await tile(page, '0,1').click()
  await commit(page).click()
  await page.getByRole('button', { name: 'Ulepsz do 2' }).click()
  await commit(page).click()
  await expect(tile(page, '0,1')).toHaveAttribute('aria-label', /poziom 2/)
  await page.getByRole('button', { name: 'Wyburz', exact: true }).click()
  await expect(tile(page, '0,1')).toHaveAttribute('aria-label', /Farma/)
  await commit(page).click()
  await expect(tile(page, '0,1')).toHaveAttribute('aria-label', /Łąka/)
  await page.locator('.exploration summary').click()
  await page.getByRole('button', { name: 'Sektor -1, 0 ↗' }).click()
  await commit(page).click()
  await expect(page.locator('.map-toolbar')).toContainText('2 odkrytych')
  await expect(tile(page, '-4,3')).toBeAttached()
  expect(JSON.parse(await stored(page)).state.sectors).toContainEqual({ x: -1, y: 0 })
})
test('insufficient funds and natural terrain do not spend turns; gathering restores resources', async ({
  page,
}) => {
  const s = newKingdom(42)
  s.resources.wood = 0
  await prepare(page, s)
  await page.goto(url)
  await page.locator('[data-building-card="farm"]').click()
  await tile(page, '0,1').click()
  await expect(page.locator('.preview-error')).toContainText('Brakuje zasobów')
  await expect(commit(page)).toBeDisabled()
  await expect(turn(page)).toHaveText('1')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await commit(page).click()
  await expect(page.locator('[data-resource="wood"]')).toHaveText('3')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await commit(page).click()
  await page.locator('[data-building-card="farm"]').click()
  await tile(page, '0,1').click()
  await expect(commit(page)).toBeEnabled()
  await tile(page, '2,3').click()
  await expect(commit(page)).toBeDisabled()
  await expect(page.locator('.selected-panel')).toContainText('Zachowujemy naturalny teren')
  await expect(turn(page)).toHaveText('3')
})
test('keyboard controls, help focus, restart cancellation and confirmation', async ({ page }) => {
  await prepare(page)
  await page.goto(url)
  await page.locator('[data-building-card="farm"]').click()
  await page.locator('.kingdom-map').focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.turn-preview')).toContainText('Budowa: Farma')
  await commit(page).click()
  await expect(turn(page)).toHaveText('2')
  await page.getByRole('button', { name: 'Jak grać?' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Jak grać?' })).toBeFocused()
  await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
  await expect(turn(page)).toHaveText('2')
  await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  await expect(turn(page)).toHaveText('1')
  expect(Object.keys(JSON.parse(await stored(page)).state.buildings)).toHaveLength(1)
})
test('mouse pan, zoom and blur never commit or select during dragging', async ({ page }) => {
  await prepare(page)
  await page.goto(url)
  await page.locator('.kingdom-map').scrollIntoViewIfNeeded()
  const box = await page.locator('.kingdom-map').boundingBox()
  const before = await stored(page)
  await page.mouse.move(box.x + 100, box.y + 150)
  await page.mouse.down()
  await page.mouse.move(box.x + 230, box.y + 170, { steps: 8 })
  await page.mouse.up()
  await expect(page.locator('.selected-panel h2')).toContainText('Wybierz pole')
  await page.getByRole('button', { name: 'Przybliż mapę' }).click()
  await page.getByRole('button', { name: 'Oddal mapę' }).click()
  await page.mouse.move(box.x + 100, box.y + 150)
  await page.mouse.down()
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.mouse.up()
  expect(await stored(page)).toBe(before)
  await expect(turn(page)).toHaveText('1')
})
test('mobile real touch pan, pinch and cancel do not build', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page)
  await page.goto(url)
  await page.locator('[data-building-card="farm"]').click()
  await page.locator('.kingdom-map').scrollIntoViewIfNeeded()
  const b = await page.locator('.kingdom-map').boundingBox(),
    cdp = await context.newCDPSession(page)
  const p = (id, x, y) => ({ id, x, y, radiusX: 2, radiusY: 2, force: 1 })
  const beforeWidth = (await tile(page, '3,3').boundingBox()).width
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(1, b.x + 100, b.y + 130), p(2, b.x + 180, b.y + 190)],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(1, b.x + 60, b.y + 100), p(2, b.x + 230, b.y + 230)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect((await tile(page, '3,3').boundingBox()).width).toBeGreaterThan(beforeWidth)
  await expect(turn(page)).toHaveText('1')
  await expect(commit(page)).toBeDisabled()
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [p(1, b.x + 100, b.y + 130)],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [p(1, b.x + 140, b.y + 150)],
  })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(turn(page)).toHaveText('1')
  await expect(commit(page)).toBeDisabled()
})
test('corrupt save untouched until explicit restart; denied storage remains playable', async ({
  page,
}) => {
  await prepare(page, '{broken')
  await page.goto(url)
  await expect(page.getByRole('alert')).toContainText('Nie możemy odczytać')
  expect(await stored(page)).toBe('{broken')
  await expect(page.locator('[data-building-card="farm"]')).toBeDisabled()
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
  expect(await stored(page)).toBe('{broken')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (k) {
      if (k === 'zgrana:gry:male-krolestwo:v1') throw Error('denied')
      return get.call(this, k)
    }
    Storage.prototype.setItem = function (k, v) {
      if (k === 'zgrana:gry:male-krolestwo:v1') throw Error('denied')
      return set.call(this, k, v)
    }
  })
  await page.reload()
  await expect(page.locator('.kingdom-notice')).toContainText('niedostępny')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await commit(page).click()
  await expect(turn(page)).toHaveText('2')
})
test('100 sectors render only visible tiles; camera, resize and navigation remain usable', async ({
  page,
}, info) => {
  const s = newKingdom(31)
  s.sectors = Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) }))
  await prepare(page, s)
  await page.goto(url)
  await expect(page.locator('.map-toolbar')).toContainText('100 odkrytych')
  expect(await page.locator('[data-tile]').count()).toBeLessThan(500)
  await page.getByRole('button', { name: 'Oddal mapę' }).click()
  await page.getByRole('button', { name: 'Oddal mapę' }).click()
  expect(await page.locator('[data-tile]').count()).toBeLessThan(500)
  await page.setViewportSize({ width: 360, height: 640 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.screenshot({ path: info.outputPath('100-sectors.png'), fullPage: true })
  await page.getByRole('link', { name: /Wszystkie gry/ }).click()
  await expect(page.locator('.game-card')).toHaveCount(5)
  expect(errors).toEqual([])
})

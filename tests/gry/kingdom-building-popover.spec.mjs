import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v7',
  url = '/gry/male-krolestwo'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)
const bubble = (page) => page.getByRole('region', { name: 'Ulepszanie budynku', exact: true })
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
function fixture() {
  const s = newKingdom(42)
  s.turn = 12
  s.rank = 1
  s.promotions = [{ rank: 1, turn: 12 }]
  s.resources = { wood: 200, stone: 150, food: 80, gold: 60 }
  s.buildings['0,1'] = { x: 0, y: 1, kind: 'farm', level: 1 }
  return s
}
async function prepare(page, state) {
  await page.route('**/*googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(
    ({ key, raw }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('popover-fixture')) {
        localStorage.setItem(key, raw)
        sessionStorage.setItem('popover-fixture', '1')
      }
    },
    { key, raw: encode(state) },
  )
}
async function selectFarm(page) {
  await page.locator('.kingdom-map').evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await page.locator('[data-tile="0,1"]').click()
  await expect(bubble(page)).toBeVisible()
}
async function checkAnchor(page) {
  await expect
    .poll(async () => {
      const p = await bubble(page).boundingBox(),
        t = await page.locator('[data-tile="0,1"]').boundingBox(),
        m = await page.locator('.kingdom-map').boundingBox()
      return p.y >= m.y && p.y + p.height <= t.y - 6 && p.x >= m.x && p.x + p.width <= m.x + m.width
    })
    .toBe(true)
  await expect
    .poll(async () => {
      const r = await bubble(page).boundingBox(),
        header = await page.locator('.resource-dock').boundingBox()
      return r.y >= header.y + header.height && r.y + r.height <= page.viewportSize().height
    })
    .toBe(true)
}
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(`anchored upgrade plans one turn, remains above its tile, and closes without actions ${width}`, async ({
    page,
  }, info) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    const state = fixture()
    await page.setViewportSize({ width, height })
    await prepare(page, state)
    await page.goto(url)
    await selectFarm(page)
    await checkAnchor(page)
    await expect(bubble(page)).toContainText('Poziom 1 / 3')
    await expect(bubble(page)).toContainText('36 drewna')
    await expect(
      page.locator('.selected-panel').getByRole('button', { name: /Ulepsz/ }),
    ).toHaveCount(0)
    expect(await stored(page)).toEqual(state)
    await bubble(page).getByRole('button', { name: 'Ulepsz do 2' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(bubble(page)).toContainText('Farma')
    await page.keyboard.press('Enter')
    await expect(bubble(page)).toContainText('Zaplanowano ulepszenie')
    expect(await stored(page)).toEqual(state)
    const expected = resolveTurn(state, { type: 'upgrade', x: 0, y: 1 })
    await commit(page).click()
    expect(await stored(page)).toEqual(expected.state)
    await page.locator('.kingdom-map').evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await expect(bubble(page)).toContainText('Poziom 2 / 3')
    await checkAnchor(page)
    await page.locator('.map-stage').screenshot({ path: info.outputPath('building-upgrade.png') })
    await bubble(page).getByRole('button', { name: 'Zamknij dymek budynku' }).click()
    await expect(bubble(page)).toHaveCount(0)
    await expect(page.locator('.kingdom-map')).toBeFocused()
    await selectFarm(page)
    await bubble(page).getByRole('button', { name: 'Ulepsz do 3' }).focus()
    await page.keyboard.press('Escape')
    await expect(bubble(page)).toHaveCount(0)
    await selectFarm(page)
    const r = await page.locator('.kingdom-map').boundingBox()
    await page.mouse.move(r.x + 25, r.y + r.height - 20)
    await page.mouse.down()
    await page.mouse.move(r.x + 65, r.y + r.height - 20, { steps: 4 })
    await page.mouse.up()
    await expect(bubble(page)).toHaveCount(0)
    expect(await stored(page)).toEqual(expected.state)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
test('rank requirements, damaged and maximum-level buildings use the bubble without bypassing engine rules', async ({
  page,
}) => {
  const state = fixture()
  state.rank = 0
  state.promotions = []
  await prepare(page, state)
  await page.goto(url)
  await selectFarm(page)
  await expect(bubble(page)).toContainText('wymagają Wioski')
  await bubble(page).getByRole('button', { name: 'Ulepsz do 2' }).click()
  await expect(commit(page)).toBeDisabled()
  expect(await stored(page)).toEqual(state)
  for (const building of [
    { x: 0, y: 1, kind: 'farm', level: 3 },
    { x: 0, y: 1, kind: 'farm', level: 2, damaged: true },
  ]) {
    const s = fixture()
    s.buildings['0,1'] = building
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw: encode(s) })
    await page.reload()
    await selectFarm(page)
    await expect(bubble(page).getByRole('button', { name: /Ulepsz do/ })).toHaveCount(0)
    await expect(bubble(page)).toContainText(
      building.damaged ? 'Najpierw napraw' : 'Najwyższy poziom',
    )
    if (building.damaged)
      await expect(page.getByRole('button', { name: 'Napraw budynek' })).toBeVisible()
    expect(await stored(page)).toEqual(s)
  }
})
test('real touch opens a bubble without spending a turn; zoom and orientation keep controls usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 })
  const state = fixture()
  await prepare(page, state)
  await page.goto(url)
  const map = page.locator('.kingdom-map')
  await map.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const tile = await page.locator('[data-tile="0,1"]').boundingBox()
  const touch = await page.context().newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 }],
  })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(bubble(page)).toBeVisible()
  await checkAnchor(page)
  expect(await stored(page)).toEqual(state)
  await page.setViewportSize({ width: 740, height: 360 })
  await checkAnchor(page)
  await page.getByRole('button', { name: 'Przybliż mapę' }).click()
  await expect(bubble(page)).toHaveCount(0)
  await selectFarm(page)
  await checkAnchor(page)
  await bubble(page).getByRole('button', { name: 'Ulepsz do 2' }).click()
  expect(await stored(page)).toEqual(state)
  await page.getByRole('link', { name: 'Wszystkie gry' }).click()
  await expect(page).toHaveURL(/\/gry$/)
  await expect(bubble(page)).toHaveCount(0)
  await touch.detach()
})

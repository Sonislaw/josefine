import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const {
  newKingdom,
  key: xy,
  terrain,
} = await j.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const { discoveryForSector, DISCOVERIES } = await j.import(
  '../../src/apps/gry/games/little-kingdom/discoveries.ts',
)
const url = '/gry/male-krolestwo',
  key = 'zgrana:gry:male-krolestwo:v7',
  legacy = 'zgrana:gry:male-krolestwo:v1'
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
const runtimeErrors = new WeakMap()
test.beforeEach(({ page }) => {
  const errors = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(error.message))
})
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]))
const rich = (seed) => ({
  ...newKingdom(seed),
  resources: { wood: 5000, stone: 5000, food: 5000, gold: 5000 },
})
function fixture(kind) {
  for (let seed = 1; seed < 10000; seed++) {
    const d = discoveryForSector(seed, { x: 1, y: 0 }, 1)
    if (d.kind === kind) return { state: rich(seed), d }
  }
  throw Error('missing fixture')
}
async function prepare(page, state, version = 7, raw) {
  await page.addInitScript(
    ({ state, version, raw, key, legacy }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('discovery-fixture')) {
        localStorage.setItem(
          version === 1 ? legacy : key,
          raw ?? JSON.stringify({ version, state, tutorialDismissed: true }),
        )
        sessionStorage.setItem('discovery-fixture', '1')
      }
    },
    { state, version, raw, key, legacy },
  )
}
const stored = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
for (const [kind, width] of [
  ['ruins', 360],
  ['wagon', 390],
  ['spring', 1440],
  ['tradingPost', 360],
])
  test(`explore and use ${kind}: preview, SVG, journal and reload at ${width}px`, async ({
    page,
  }, info) => {
    const { state, d } = fixture(kind),
      def = DISCOVERIES[kind]
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    await prepare(page, state)
    await page.goto(url)
    await page.locator('.exploration summary').click()
    await page.getByRole('button', { name: 'Sektor 1, 0 ↗' }).click()
    await expect(page.locator('.discovery-announcement')).toHaveCount(0)
    await expect(page.getByTestId('kingdom-turn')).toHaveText('1')
    await commit(page).click()
    await expect(page.locator('.discovery-announcement')).toContainText(def.name)
    await page.locator('.discovery-announcement button').click()
    await expect(page.locator('.selected-panel h2')).toContainText(def.name)
    await expect(page.locator(`[data-tile="${d.x},${d.y}"]`)).toHaveAttribute(
      'aria-label',
      new RegExp(def.name),
    )
    await page.locator('.kingdom-map').screenshot({ path: info.outputPath('discovery-map.png') })
    await page.getByRole('button', { name: def.action, exact: true }).click()
    const forecast = await page.locator('.turn-preview dd strong').allTextContents()
    if (!def.permanent)
      await expect(page.locator('.discovery-reward')).toContainText('Jednorazowa nagroda')
    await expect(page.getByTestId('kingdom-turn')).toHaveText('2')
    await commit(page).click()
    for (const [i, r] of ['wood', 'stone', 'food', 'gold'].entries())
      await expect(page.locator(`[data-resource="${r}"]`)).toHaveText(forecast[i])
    await expect(page.getByRole('button', { name: def.action, exact: true })).toHaveCount(0)
    await page.locator('.discovery-journal summary').click()
    await expect(page.locator('.discovery-journal')).toContainText('Wykorzystane: 1')
    await expect(page.locator('[data-discovery-entry]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Wszystkie', exact: true }).click()
    await expect(page.locator('[data-discovery-entry]')).toHaveCount(1)
    await page.locator('[data-discovery-entry] button').click()
    await page.locator('.kingdom-map').screenshot({ path: info.outputPath('used-map.png') })
    const before = await stored(page)
    await page.reload()
    await expect(page.getByTestId('kingdom-turn')).toHaveText('3')
    expect(await stored(page)).toEqual(before)
    await page.locator('.discovery-journal summary').click()
    await page.getByRole('button', { name: 'Wszystkie', exact: true }).click()
    await page.locator('[data-discovery-entry] button').click()
    await page.locator('[data-building-card="farm"]').click()
    if (def.permanent) await expect(commit(page)).toBeDisabled()
    else {
      await expect(commit(page)).toBeEnabled()
      await commit(page).click()
      await expect(page.locator(`[data-tile="${d.x},${d.y}"]`)).toHaveAttribute(
        'aria-label',
        /Farma/,
      )
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: info.outputPath('discovery-page.png'), fullPage: true })
  })

test('restoration bonus appears in forecast and selected adjacent building; keyboard inspection never commits', async ({
  page,
}) => {
  const { state, d } = fixture('spring')
  state.turn = 1
  state.sectors.push({ x: 1, y: 0 })
  state.discoveries[xy(d.x, d.y)] = d
  const neighbor = [
    { x: d.x - 1, y: d.y },
    { x: d.x + 1, y: d.y },
    { x: d.x, y: d.y - 1 },
    { x: d.x, y: d.y + 1 },
  ].find(
    (p) =>
      p.x >= 0 && p.x < 14 && p.y >= 0 && p.y < 7 && terrain(state.seed, p.x, p.y) === 'meadow',
  )
  expect(neighbor).toBeTruthy()
  state.buildings[xy(neighbor.x, neighbor.y)] = { ...neighbor, kind: 'farm', level: 1 }
  await prepare(page, state)
  await page.goto(url)
  await page.locator('.discovery-journal summary').click()
  await page.locator('[data-discovery-entry] button').click()
  await page.getByRole('button', { name: 'Odnów źródło' }).click()
  await expect(page.locator('.turn-preview .discovery-bonus')).toContainText('+1 żywności')
  await commit(page).click()
  await page.locator('.kingdom-map').focus()
  const direction =
    neighbor.x < d.x
      ? 'ArrowLeft'
      : neighbor.x > d.x
        ? 'ArrowRight'
        : neighbor.y < d.y
          ? 'ArrowUp'
          : 'ArrowDown'
  await page.keyboard.press(direction)
  await page.keyboard.press('Enter')
  await expect(page.locator('.selected-panel .discovery-bonus')).toContainText('Zarośnięte źródło')
  await expect(page.getByTestId('kingdom-turn')).toHaveText('3')
})

test('old osada migrates once, preserving raw v1 and every existing building', async ({ page }) => {
  const state = rich(4)
  state.turn = 30
  state.sectors.push({ x: 1, y: 0 })
  delete state.discoveries
  const d = discoveryForSector(state.seed, { x: 1, y: 0 }, 1)
  state.buildings[xy(d.x, d.y)] = { x: d.x, y: d.y, kind: 'farm', level: 2 }
  const raw = JSON.stringify({ version: 1, state, tutorialDismissed: true })
  await prepare(page, state, 1, raw)
  await page.goto(url)
  await expect(page.getByTestId('kingdom-turn')).toHaveText('31')
  const result = await stored(page)
  expect(result.version).toBe(7)
  expect(result.state).toEqual({ ...state, discoveries: {} })
  expect(await page.evaluate((k) => localStorage.getItem(k), legacy)).toBe(raw)
  await page.reload()
  await expect(page.getByTestId('kingdom-turn')).toHaveText('31')
  expect(await stored(page)).toEqual(result)
})

test('corrupt current save never falls back to valid v1 and stays untouched until explicit restart', async ({
  page,
}) => {
  await prepare(page, rich(2), 1)
  await page.addInitScript((k) => {
    if (!sessionStorage.getItem('bad-v2')) {
      localStorage.setItem(k, '{broken')
      sessionStorage.setItem('bad-v2', '1')
    }
  }, key)
  await page.goto(url)
  await expect(page.getByRole('alert')).toContainText('Nie możemy odczytać')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{broken')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  expect((await stored(page)).state.turn).toBe(0)
  expect((await stored(page)).state.discoveries).toEqual({})
})

test('failed migration write keeps old state playable; quota failure and restart are clearly warned', async ({
  page,
}) => {
  const state = rich(5)
  state.turn = 9
  await prepare(page, state, 1)
  await page.addInitScript((k) => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === k) throw Error('quota')
      return set.call(this, name, value)
    }
  }, key)
  await page.goto(url)
  await expect(page.getByTestId('kingdom-turn')).toHaveText('10')
  await expect(page.locator('.kingdom-notice')).toContainText('niedostępny')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await commit(page).click()
  await expect(page.getByTestId('kingdom-turn')).toHaveText('11')
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull()
  await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  await expect(page.getByTestId('kingdom-turn')).toHaveText('1')
  await expect(page.locator('.kingdom-notice')).toContainText('niedostępny')
})

test('100-sector discovery journal paginates newest first and locates a distant place on mobile', async ({
  page,
}, info) => {
  const state = rich(31)
  state.turn = 100
  state.sectors = Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) }))
  state.sectors.slice(1).forEach((p, i) => {
    const d = discoveryForSector(state.seed, p, i + 1)
    state.discoveries[xy(d.x, d.y)] = d
  })
  await page.setViewportSize({ width: 360, height: 640 })
  await prepare(page, state)
  await page.goto(url)
  await page.locator('.discovery-journal summary').click()
  await expect(page.locator('[data-discovery-entry]')).toHaveCount(10)
  await expect(page.locator('[data-discovery-entry]').first()).toContainText('tura 99')
  await page.getByRole('button', { name: /Pokaż więcej/ }).click()
  await expect(page.locator('[data-discovery-entry]')).toHaveCount(20)
  await page.getByRole('button', { name: 'Wszystkie', exact: true }).click()
  await expect(page.locator('[data-discovery-entry]')).toHaveCount(10)
  const first = await page
    .locator('[data-discovery-entry]')
    .first()
    .getAttribute('data-discovery-entry')
  await page.locator('[data-discovery-entry] button').first().click()
  await expect(page.locator(`[data-tile="${first}"]`)).toBeAttached()
  expect(await page.locator('[data-tile]').count()).toBeLessThan(500)
  await expect(page.getByTestId('kingdom-turn')).toHaveText('101')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  await page.locator('.kingdom-map').screenshot({ path: info.outputPath('distant-discovery.png') })
})

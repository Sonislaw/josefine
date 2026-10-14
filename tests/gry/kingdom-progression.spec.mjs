import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { developedKingdom, encode } from './kingdom-progression-fixture.mjs'
const jiti = createJiti(import.meta.url)
const { resolveTurn } = await jiti.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const url = '/gry/male-krolestwo',
  key = 'zgrana:gry:male-krolestwo:v6',
  previous = 'zgrana:gry:male-krolestwo:v2'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
const runtimeErrors = new WeakMap()
test.beforeEach(({ page }) => {
  const errors = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (e) => errors.push(e.message))
})
test.afterEach(({ page }) => expect(runtimeErrors.get(page)).toEqual([]))
async function prepare(page, entries) {
  await page.addInitScript((entries) => {
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    if (!sessionStorage.getItem('rank-fixture')) {
      for (const [k, v] of entries) localStorage.setItem(k, v)
      sessionStorage.setItem('rank-fixture', '1')
    }
  }, entries)
}
async function gather(page) {
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
}
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(`rank previews, four SVG halls, journal, reload and no overflow ${width}`, async ({
    page,
  }, info) => {
    let state = developedKingdom()
    await prepare(page, [[key, encode(state)]])
    await page.setViewportSize({ width, height })
    await page.goto(url)
    await expect(page.getByTestId('kingdom-rank')).toContainText('Osada')
    const summary = page.locator('.progression-panel summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.progression-panel')).toHaveAttribute('open', '')
    await expect(page.locator('[data-rank-requirement]')).toHaveCount(4)
    await expect(page.locator('.progression-panel')).toContainText('Mieszkańcy: 20 / 6')
    await expect(page.locator('[data-tile="3,3"] [data-hall-rank]')).toHaveAttribute(
      'data-hall-rank',
      '0',
    )
    for (const [index, name] of ['Wioska', 'Miasteczko', 'Małe królestwo'].entries()) {
      await gather(page)
      await expect(page.locator('.promotion-preview')).toContainText(`Awans: ${name}`)
      expect((await stored(page)).state).toEqual(state) // preview is read-only
      const expected = resolveTurn(state, { type: 'gather' })
      await commit(page).click()
      await expect(page.getByTestId('kingdom-rank')).toContainText(name)
      expect((await stored(page)).state).toEqual(expected.state)
      state = expected.state
      await expect(page.locator('.promotion-announcement')).toContainText(`Awans: ${name}`)
      await page.getByRole('button', { name: 'Ratusz', exact: false }).click()
      await expect(page.locator('[data-tile="3,3"] [data-hall-rank]')).toHaveAttribute(
        'data-hall-rank',
        String(index + 1),
      )
      await page
        .locator('.kingdom-map')
        .screenshot({ path: info.outputPath(`hall-${index + 1}.png`) })
      await page.getByRole('button', { name: 'Zamknij komunikat o awansie' }).click()
      await expect(page.locator('.promotion-announcement')).toHaveCount(0)
      await expect(page.locator('.rank-history li')).toHaveCount(index + 1)
    }
    await expect(page.locator('.progression-panel')).toContainText('Ścieżka rozwoju ukończona')
    await expect(page.locator('[data-rank-requirement]')).toHaveCount(0)
    await page.locator('.progression-panel').screenshot({ path: info.outputPath('rank-panel.png') })
    await page.reload()
    await expect(page.getByTestId('kingdom-rank')).toContainText('Małe królestwo')
    await expect(page.locator('.promotion-announcement')).toHaveCount(0)
    await gather(page)
    await expect(page.locator('.promotion-preview')).toHaveCount(0)
    await commit(page).click()
    expect((await stored(page)).state.promotions).toEqual(state.promotions)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
    await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
    await expect(page.getByTestId('kingdom-rank')).toContainText('Małe królestwo')
    await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
    await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
    await expect(page.getByTestId('kingdom-rank')).toContainText('Osada')
    expect((await stored(page)).state.promotions).toEqual([])
  })

test('v2 migration preserves discoveries and bytes; old settlement earns its first rank only after commit', async ({
  page,
}) => {
  const s = developedKingdom(),
    raw = encode(s, 2)
  await prepare(page, [[previous, raw]])
  await page.goto(url)
  await expect(page.getByTestId('kingdom-turn')).toHaveText('61')
  expect((await stored(page)).state).toEqual(s)
  await expect(page.locator('.promotion-announcement')).toHaveCount(0)
  expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
  await gather(page)
  await commit(page).click()
  await expect(page.getByTestId('kingdom-rank')).toContainText('Wioska')
  await page.reload()
  await expect(page.getByTestId('kingdom-rank')).toContainText('Wioska')
  expect((await stored(page)).state.promotions).toEqual([{ rank: 1, turn: 61 }])
  expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
})

for (const brokenVersion of [2, 6])
  test(`corrupt v${brokenVersion} stays protected despite an older valid save`, async ({
    page,
  }) => {
    const brokenKey = brokenVersion === 4 ? key : previous
    await prepare(page, [
      ['zgrana:gry:male-krolestwo:v1', encode(developedKingdom(), 1)],
      ...(brokenVersion === 4 ? [[previous, encode(developedKingdom(), 2)]] : []),
      [brokenKey, '{broken'],
    ])
    await page.goto(url)
    await expect(page.getByRole('alert')).toContainText('Nie możemy odczytać')
    await expect(commit(page)).toBeDisabled()
    expect(await page.evaluate((k) => localStorage.getItem(k), brokenKey)).toBe('{broken')
    await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
    await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
    expect(await page.evaluate((k) => localStorage.getItem(k), brokenKey)).toBe('{broken')
    await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
    await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
    expect((await stored(page)).version).toBe(6)
    expect((await stored(page)).state.rank).toBe(0)
  })

test('quota failure keeps migration and promotions playable in memory with a warning', async ({
  page,
}) => {
  const raw = encode(developedKingdom(), 2)
  await prepare(page, [[previous, raw]])
  await page.addInitScript((key) => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw Error('quota')
      return set.call(this, k, v)
    }
  }, key)
  await page.goto(url)
  await expect(page.locator('.kingdom-notice')).toContainText('niedostępny')
  await gather(page)
  await commit(page).click()
  await expect(page.getByTestId('kingdom-rank')).toContainText('Wioska')
  expect(await stored(page)).toBeNull()
  expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
})

test('insufficient present-day requirements never revoke a saved rank', async ({ page }) => {
  const s = developedKingdom(2)
  s.population = 3
  await prepare(page, [[key, encode(s)]])
  await page.goto(url)
  await expect(page.getByTestId('kingdom-rank')).toContainText('Miasteczko')
  await page.locator('.progression-panel summary').click()
  await expect(page.locator('[data-rank-requirement="population"]')).toContainText('3 / 20')
  await expect(page.locator('[data-rank-requirement="population"]')).toContainText('Do spełnienia')
  await expect(page.locator('[data-rank-requirement="population"]')).toContainText(
    'Zapewnij miejsce',
  )
  await gather(page)
  await commit(page).click()
  expect((await stored(page)).state.rank).toBe(2)
  expect((await stored(page)).state.promotions).toEqual(s.promotions)
})

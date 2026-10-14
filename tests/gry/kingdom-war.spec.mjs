import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { warKingdom, beforeRaid, emptyPlot } from './kingdom-war-fixture.mjs'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { resolveTurn, newKingdom } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v5',
  oldKey = 'zgrana:gry:male-krolestwo:v4',
  url = '/gry/male-krolestwo'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
async function prepare(page, state, version = 5) {
  await page.addInitScript(
    ({ raw, k }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('war-fixture')) {
        localStorage.setItem(k, raw)
        sessionStorage.setItem('war-fixture', '1')
      }
    },
    { raw: encode(state, version), k: version === 4 ? oldKey : key },
  )
}
async function openPanel(page, name) {
  await page.locator('.defence-panel > summary').filter({ hasText: name }).click()
}
const errors = new WeakMap()
test.beforeEach(({ page }) => {
  const e = []
  errors.set(page, e)
  page.on('pageerror', (err) => e.push(err.message))
})
test.afterEach(({ page }) => expect(errors.get(page)).toEqual([]))
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(`raid forecast, tactics, loss, repair and save ${width}px`, async ({ page }, info) => {
    const s = beforeRaid()
    await page.setViewportSize({ width, height })
    await prepare(page, s)
    await page.goto(url)
    await expect(page.getByText('⚑ Najazd za 1 tur!')).toBeVisible()
    await openPanel(page, 'Obrona osady')
    await page.getByRole('button', { name: 'Rekrutuj: Włócznik', exact: true }).click()
    await page.getByRole('radio', { name: /Szturm/ }).check()
    await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('porażka')
    const preview = resolveTurn(s, { type: 'recruit', unit: 'spearman', tactic: 'charge' })
    expect((await stored(page)).state).toEqual(s)
    await page.locator('.turn-preview').screenshot({ path: info.outputPath('battle-preview.png') })
    await commit(page).click()
    expect((await stored(page)).state).toEqual(preview.state)
    await expect(page.getByRole('region', { name: 'Raport bitwy' })).toContainText('porażka')
    await page.getByRole('button', { name: 'Zamknij raport bitwy' }).click()
    await page.reload()
    expect((await stored(page)).state).toEqual(preview.state)
    const p = preview.battle.damaged
    await page.locator(`[data-tile="${p.x},${p.y}"]`).click()
    await page.getByRole('button', { name: 'Napraw budynek', exact: true }).click()
    await expect(page.locator('.turn-preview')).toContainText('Naprawa budynku')
    await commit(page).click()
    expect((await stored(page)).state.buildings[`${p.x},${p.y}`].damaged).toBe(false)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.locator('.map-column').screenshot({ path: info.outputPath('defence-panels.png') })
  })
test('keyboard military construction, recruitment and truce stop due attack', async ({ page }) => {
  const s = beforeRaid({ spearman: 2, archer: 0 })
  await prepare(page, s)
  await page.goto(url)
  await page.getByRole('button', { name: 'Obrona', exact: true }).click()
  await page.locator('[data-building-card="watchtower"]').focus()
  await page.keyboard.press('Enter')
  const p = emptyPlot(s)
  await page.locator(`[data-tile="${p.x},${p.y}"]`).click()
  await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('zwycięstwo')
  await openPanel(page, 'Sąsiednie osady')
  await page.getByRole('button', { name: /Opłać rozejm/ }).click()
  await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toHaveCount(0)
  await commit(page).click()
  const next = (await stored(page)).state
  expect(next.affairs.raid).toBeNull()
  expect(next.affairs.protectedUntil).toBe(next.turn + 12)
  await page.reload()
  expect((await stored(page)).state).toEqual(next)
})
test('neighbours gifts, expedition selection and permanent peace', async ({ page }) => {
  let s = warKingdom()
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  s.affairs.army = { spearman: 6, archer: 0 }
  await prepare(page, s)
  await page.goto(url)
  await openPanel(page, 'Sąsiednie osady')
  await page.getByRole('button', { name: 'Odbierz dar powitalny' }).click()
  await commit(page).click()
  await expect(page.getByRole('button', { name: 'Odbierz dar powitalny' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Wyślij dar' }).click()
  await commit(page).click()
  await page.locator('.expedition > summary').click()
  await page.getByLabel('Włócznicy', { exact: true }).fill('4')
  await page.getByRole('button', { name: 'Przygotuj wyprawę' }).click()
  await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('zwycięstwo')
  await commit(page).click()
  await expect(page.locator('.neighbour').last()).toContainText('Podporządkowana — pokój')
  expect((await stored(page)).state.affairs.settlements[2].relation).toBe('subdued')
  await page.reload()
  await openPanel(page, 'Sąsiednie osady')
  await expect(page.getByRole('button', { name: /Opłać rozejm/ })).toHaveCount(0)
})
test('v4 migration keeps old bytes, v5 corrupt protects data and restart resets army', async ({
  page,
}) => {
  const s = newKingdom(42)
  await prepare(page, s, 4)
  await page.goto(url)
  await expect(page.getByTestId('kingdom-turn')).toHaveText('1')
  expect((await stored(page)).state).toEqual(s)
  const raw = await page.evaluate((k) => localStorage.getItem(k), oldKey)
  expect(raw).toBe(encode(s, 4))
  await page.evaluate((k) => localStorage.setItem(k, '{"version":5,"state":{}}'), key)
  await page.reload()
  await expect(page.getByText('Nie możemy odczytać zapisanej osady.')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{"version":5,"state":{}}')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę', exact: true }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  expect((await stored(page)).state.affairs.army).toEqual({ spearman: 0, archer: 0 })
  expect((await stored(page)).state.affairs.settlements).toEqual([])
})
test('storage quota failure allows in-memory combat without corrupting old army', async ({
  page,
}) => {
  const s = beforeRaid({ spearman: 4, archer: 0 }, true)
  await prepare(page, s)
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === 'zgrana:gry:male-krolestwo:v5' && sessionStorage.getItem('war-fixture'))
        throw Error('quota')
      return write.call(this, k, v)
    }
  })
  await page.goto(url)
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await commit(page).click()
  await expect(page.getByRole('region', { name: 'Raport bitwy' })).toContainText('zwycięstwo')
  await expect(page.getByText('Zapis lokalny jest niedostępny.', { exact: false })).toBeVisible()
  expect((await stored(page)).state).toEqual(s)
})

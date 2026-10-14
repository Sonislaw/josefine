import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { warKingdom, beforeRaid, emptyPlot } from './kingdom-war-fixture.mjs'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { resolveTurn, newKingdom } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v6',
  oldKey = 'zgrana:gry:male-krolestwo:v5',
  url = '/gry/male-krolestwo'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
async function prepare(page, state, version = 6) {
  await page.addInitScript(
    ({ raw, k }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('war-fixture')) {
        localStorage.setItem(k, raw)
        sessionStorage.setItem('war-fixture', '1')
      }
    },
    { raw: encode(state, version), k: version === 5 ? oldKey : key },
  )
}
async function openPanel(page, name) {
  await page.locator('.defence-panel > summary').filter({ hasText: name }).click()
}
async function setTroops(page, army) {
  await page.getByLabel('Włócznik', { exact: true }).fill(String(army.spearman))
  await page.getByLabel('Łucznik', { exact: true }).fill(String(army.archer))
  await page.getByLabel('Tarczownik', { exact: true }).fill(String(army.shieldbearer))
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
  test(
    'campaign raid forecast, loss, repair and restore ' + width + 'px',
    async ({ page }, info) => {
      const s = beforeRaid()
      await page.setViewportSize({ width, height })
      await prepare(page, s)
      await page.goto(url)
      await expect(page.getByText('⚑ Najazd za 1 tur!')).toBeVisible()
      await openPanel(page, 'Obrona osady')
      await expect(
        page.getByRole('button', { name: 'Rekrutuj: Tarczownik', exact: true }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Rekrutuj: Włócznik', exact: true }).click()
      await page.getByRole('radio', { name: /Szturm/ }).check()
      await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('porażka')
      const forecast = resolveTurn(s, { type: 'recruit', unit: 'spearman', tactic: 'charge' })
      expect((await stored(page)).state).toEqual(s)
      await page
        .locator('.turn-preview')
        .screenshot({ path: info.outputPath('campaign-preview.png') })
      await commit(page).click()
      expect((await stored(page)).state).toEqual(forecast.state)
      await expect(page.getByRole('region', { name: 'Raport bitwy' })).toContainText('Straty wroga')
      await page.getByRole('button', { name: 'Zamknij raport bitwy' }).click()
      await page.reload()
      expect((await stored(page)).state).toEqual(forecast.state)
      const p = forecast.battle.damaged
      await page.locator('[data-tile="' + p.x + ',' + p.y + '"]').click()
      await page.getByRole('button', { name: 'Napraw budynek', exact: true }).click()
      await commit(page).click()
      expect((await stored(page)).state.buildings[p.x + ',' + p.y].damaged).toBe(false)
      await openPanel(page, 'Sąsiednie osady')
      await page
        .locator('.neighbour')
        .last()
        .screenshot({ path: info.outputPath('enemy-campaign.png') })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
    },
  )
test('successful interception shows exact enemy losses and keeps troop pools after reload', async ({
  page,
}) => {
  const s = beforeRaid({ spearman: 6, archer: 0, shieldbearer: 0 }, false, 3)
  await prepare(page, s)
  await page.goto(url)
  await openPanel(page, 'Sąsiednie osady')
  await page.locator('.expedition > summary').click()
  await setTroops(page, s.affairs.army)
  await page.getByRole('button', { name: 'Przechwyć najazd', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('Przechwycenie')
  const forecast = resolveTurn(s, {
    type: 'intercept',
    army: { ...s.affairs.army },
    tactic: 'guard',
  })
  await commit(page).click()
  expect((await stored(page)).state).toEqual(forecast.state)
  await expect(page.getByRole('region', { name: 'Raport bitwy' })).toContainText(
    'Najazd zakończony',
  )
  await page.reload()
  expect((await stored(page)).state.affairs.raid).toBeNull()
})
test('failed interception preserves attack date, disables retry, and does not damage civilians', async ({
  page,
}) => {
  const s = beforeRaid({ spearman: 1, archer: 0, shieldbearer: 0 }, true, 3)
  await prepare(page, s)
  await page.goto(url)
  await openPanel(page, 'Sąsiednie osady')
  await page.locator('.expedition > summary').click()
  await setTroops(page, s.affairs.army)
  await page.getByRole('button', { name: 'Przechwyć najazd', exact: true }).click()
  await commit(page).click()
  const next = (await stored(page)).state
  expect(next.affairs.raid.dueTurn).toBe(s.affairs.raid.dueTurn)
  expect(next.affairs.raid.intercepted).toBe(true)
  expect(next.population).toBeGreaterThanOrEqual(s.population)
  await expect(page.getByRole('button', { name: 'Przechwyć najazd', exact: true })).toBeDisabled()
  await expect(page.getByRole('region', { name: 'Raport bitwy' })).toContainText('Termin bez zmian')
})
test('rank-gated barracks upgrade, third unit SVG and recruitment by keyboard', async ({
  page,
}) => {
  let s = warKingdom()
  s.rank = 2
  s.promotions.push({ rank: 2, turn: 13 })
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  const b = Object.values(s.buildings).find((b) => b.kind === 'barracks')
  await prepare(page, s)
  await page.goto(url)
  await page.locator('[data-tile="' + b.x + ',' + b.y + '"]').click()
  await page.getByRole('button', { name: 'Ulepsz do 2' }).focus()
  await page.keyboard.press('Enter')
  await commit(page).click()
  expect((await stored(page)).state.buildings[b.x + ',' + b.y].level).toBe(2)
  await openPanel(page, 'Obrona osady')
  await expect(page.locator('.unit-grid article')).toHaveCount(3)
  await expect(page.locator('.defence-panel').first()).toContainText('0 / 9')
  await page.getByRole('button', { name: 'Rekrutuj: Tarczownik', exact: true }).focus()
  await page.keyboard.press('Enter')
  await commit(page).click()
  expect((await stored(page)).state.affairs.army.shieldbearer).toBe(1)
})
test('gifts, two battles, cooldown and forcePeace pay once, with persistent temporary peace', async ({
  page,
}) => {
  let s = warKingdom()
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  s.rank = 3
  s.promotions = [
    { rank: 1, turn: 12 },
    { rank: 2, turn: 13 },
    { rank: 3, turn: 14 },
  ]
  Object.values(s.buildings).find((b) => b.kind === 'barracks').level = 3
  s.affairs.army = { spearman: 12, archer: 0, shieldbearer: 0 }
  await prepare(page, s)
  await page.goto(url)
  await openPanel(page, 'Sąsiednie osady')
  await page.getByRole('button', { name: 'Odbierz dar powitalny' }).click()
  await commit(page).click()
  await page.getByRole('button', { name: 'Wyślij dar', exact: true }).click()
  await commit(page).click()
  await page.locator('.expedition > summary').click()
  await setTroops(page, (await stored(page)).state.affairs.army)
  await page.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }).click()
  await commit(page).click()
  await expect(
    page.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }),
  ).toBeDisabled()
  for (let i = 0; i < 5; i++) {
    if (i < 2) {
      await openPanel(page, 'Obrona osady')
      await page.getByRole('button', { name: 'Rekrutuj: Włócznik', exact: true }).click()
      await openPanel(page, 'Obrona osady')
    } else await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    await commit(page).click()
  }
  await setTroops(page, (await stored(page)).state.affairs.army)
  await page.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }).click()
  await commit(page).click()
  await expect(page.locator('.neighbour').last()).toContainText('Przewaga 2 / 2')
  await setTroops(page, (await stored(page)).state.affairs.army)
  await page.getByRole('button', { name: 'Wymuś pokój', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText(
    'Pokój na 36 tur',
  )
  await commit(page).click()
  const saved = (await stored(page)).state
  expect(saved.affairs.enemy.peaceUntil).toBe(saved.turn + 36)
  expect(saved.affairs.enemy.lootCampaign).toBe(1)
  await page.reload()
  await openPanel(page, 'Sąsiednie osady')
  await expect(page.getByTestId('campaign-peace')).toContainText('36 tur')
  await expect(page.getByRole('button', { name: 'Wymuś pokój', exact: true })).toHaveCount(0)
})
test('negotiation expires with new campaign and full four-turn warning', async ({ page }) => {
  let s = beforeRaid()
  s.affairs.enemy.advantage = 2
  s = resolveTurn(s, { type: 'negotiate' }).state
  for (let i = 0; i < 35; i++) s = resolveTurn(s, { type: 'gather' }).state
  await prepare(page, s)
  await page.goto(url)
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await expect(page.locator('.turn-preview')).toContainText('Pokój się kończy')
  await expect(page.locator('.turn-preview')).toContainText('za 4 tur')
  await commit(page).click()
  expect((await stored(page)).state.affairs.enemy.campaign).toBe(2)
  expect((await stored(page)).state.affairs.raid.dueTurn).toBe(s.turn + 5)
  await page.reload()
  await expect(page.getByText('⚑ Najazd za 4 tur!')).toBeVisible()
})
test('v5 active raid migration preserves old bytes, and corrupt v6 blocks fallback until restart', async ({
  page,
}) => {
  const s = beforeRaid({ spearman: 2, archer: 2, shieldbearer: 0 })
  await prepare(page, s, 5)
  await page.goto(url)
  await expect(page.getByTestId('kingdom-turn')).toHaveText(String(s.turn + 1))
  const migrated = (await stored(page)).state
  expect(migrated.affairs.raid.tactic).toBe('none')
  expect(migrated.affairs.raid.dueTurn).toBe(s.affairs.raid.dueTurn)
  expect(await page.evaluate((k) => localStorage.getItem(k), oldKey)).toBe(encode(s, 5))
  await page.evaluate((k) => localStorage.setItem(k, '{"version":6,"state":{}}'), key)
  await page.reload()
  await expect(page.getByText('Nie możemy odczytać zapisanej osady.')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{"version":6,"state":{}}')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę', exact: true }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  expect((await stored(page)).state.affairs.army).toEqual({
    spearman: 0,
    archer: 0,
    shieldbearer: 0,
  })
  expect((await stored(page)).state.affairs.enemy).toBeNull()
})
test('quota failure allows in-memory combat and preserves stored campaign', async ({ page }) => {
  const s = beforeRaid({ spearman: 4, archer: 0, shieldbearer: 0 }, true)
  await prepare(page, s)
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === 'zgrana:gry:male-krolestwo:v6' && sessionStorage.getItem('war-fixture'))
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

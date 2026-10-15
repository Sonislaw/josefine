import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, terrain, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v9'
function fixture() {
  const s = newKingdom(42)
  s.turn = 12
  s.resources = { wood: 100, stone: 100, food: 80, gold: 60 }
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) if (terrain(s.seed, x, y) === 'forest') s.deposits[`${x},${y}`] = 0
  s.buildings['2,2'] = { kind: 'forester', x: 2, y: 2, level: 1, plantingProgress: 3 }
  s.buildings['1,2'] = { kind: 'sawmill', x: 1, y: 2, level: 1 }
  for (const [k, age] of [
    ['0,0', 0],
    ['1,1', 5],
    ['4,0', 6],
  ]) {
    s.forests[k] = { age }
    s.deposits[k] = 60
  }
  return s
}
for (const width of [360, 1440])
  test(`forester range, three forest icons, maturation preview, harvesting and reload ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    const s = fixture(),
      raw = encode(s)
    await page.route('**/*googletagmanager.com/**', (r) => r.abort())
    await page.addInitScript(
      ({ raw, key }) => {
        localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
        if (!sessionStorage.getItem('forestry-fixture')) {
          localStorage.setItem(key, raw)
          sessionStorage.setItem('forestry-fixture', '1')
        }
      },
      { raw, key },
    )
    await page.goto('/gry/male-krolestwo')
    for (const [p, stage] of [
      ['0,0', 1],
      ['1,1', 2],
      ['4,0', 3],
    ])
      await expect(page.locator(`[data-tile="${p}"] [data-forest-stage="${stage}"]`)).toHaveCount(1)
    await page.locator('[data-tile="1,1"]').click()
    await expect(page.locator('.forest-details')).toContainText('Dojrzały las za 1 tur')
    await page.locator('[data-tile="2,2"]').click()
    await expect(page.locator('.forestry-details')).toContainText('Następne sadzenie za 1 tur')
    await expect(page.locator('.map-hint')).toContainText('Zasięg sadzenia: 3 pola')
    await expect(page.locator('[data-extraction-range]').first()).toBeVisible()
    await page.getByRole('button', { name: 'Zamknij dymek budynku' }).click()
    await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    await expect(page.locator('.forestry-preview')).toHaveCount(2)
    await expect(page.locator('.turn-preview')).toContainText('W tej turze dojrzeje las: (1, 1)')
    expect(
      await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state.forests['1,1'].age, key),
    ).toBe(5)
    await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
    const expected = resolveTurn(s, { type: 'gather' }).state
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)).toEqual(
      expected,
    )
    await expect(page.locator('[data-tile="1,1"] [data-forest-stage="3"]')).toHaveCount(1)
    expect(expected.deposits['1,1']).toBe(58)
    await page.reload()
    await expect(page.locator('[data-tile="1,1"]')).toHaveAttribute('aria-label', /etap lasu 3/)
    await expect(page.locator('[data-tile="2,2"] [data-forester-art]')).toHaveCount(1)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
    // Keyboard selects the hut and shows its range without performing a turn.
    const map = page.getByRole('group', { name: /^Mapa królestwa/ })
    await map.focus()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.selected-panel h2')).toContainText('Domek leśnika')
    await expect(page.getByTestId('kingdom-turn')).toHaveText('14')
  })
test('v8 depletion migrates unchanged into v9; broken new save stays protected', async ({
  page,
}) => {
  const s = newKingdom(42)
  s.deposits['2,3'] = 0
  const raw = encode(s, 8)
  await page.addInitScript((raw) => {
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    localStorage.setItem('zgrana:gry:male-krolestwo:v8', raw)
  }, raw)
  await page.goto('/gry/male-krolestwo')
  await expect(page.getByTestId('kingdom-turn')).toHaveText('1')
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)).toEqual(s)
  expect(await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v8'))).toBe(raw)
  await page.evaluate((k) => localStorage.setItem(k, 'broken'), key)
  await page.reload()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('broken')
})

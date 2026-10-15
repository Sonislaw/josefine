import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, terrain, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v8'
for (const width of [360, 1440])
  test(`finite extraction, range, exhaustion graphics and reload ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const s = newKingdom(42)
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++)
        if (['forest', 'rock'].includes(terrain(s.seed, x, y))) s.deposits[`${x},${y}`] = 0
    s.deposits['1,4'] = 2
    s.buildings['1,2'] = { x: 1, y: 2, kind: 'sawmill', level: 1 }
    await page.route('**/*googletagmanager.com/**', (r) => r.abort())
    await page.addInitScript(
      ({ raw, key }) => {
        localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
        if (!sessionStorage.getItem('deposit-fixture')) {
          localStorage.setItem(key, raw)
          sessionStorage.setItem('deposit-fixture', '1')
        }
      },
      { raw: encode(s), key },
    )
    await page.goto('/gry/male-krolestwo')
    await page.locator('[data-tile="1,4"]').click()
    await expect(page.locator('.deposit-details')).toContainText('2 / 60')
    await page.locator('[data-tile="1,2"]').click()
    await expect(page.locator('[data-extraction-range]').first()).toBeVisible()
    await page.getByRole('button', { name: 'Zamknij dymek budynku' }).click()
    await expect(page.locator('.deposit-details')).toContainText('Wydobycie w następnej turze: 2')
    await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    await expect(page.locator('.turn-preview')).toContainText('W tej turze wyczerpią się złoża')
    expect(
      await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state.deposits['1,4'], key),
    ).toBe(2)
    await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)).toEqual(
      resolveTurn(s, { type: 'gather' }).state,
    )
    await expect(page.locator('[data-tile="1,2"] [data-extractor-idle]')).toHaveCount(1)
    await expect(page.locator('[data-tile="1,4"] [data-depleted]')).toHaveCount(1)
    await page.reload()
    await expect(page.locator('[data-tile="1,2"]')).toHaveAttribute('aria-label', /przestój/)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
  })
test('v7 migration is non-destructive and corrupt v8 is protected', async ({ page }) => {
  const raw = encode(newKingdom(42), 7)
  await page.addInitScript((raw) => {
    localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    localStorage.setItem('zgrana:gry:male-krolestwo:v7', raw)
  }, raw)
  await page.goto('/gry/male-krolestwo')
  await expect(page.getByTestId('kingdom-turn')).toHaveText('1')
  expect(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state.deposits, key),
  ).toEqual({})
  expect(await page.evaluate(() => localStorage.getItem('zgrana:gry:male-krolestwo:v7'))).toBe(raw)
  await page.evaluate((k) => localStorage.setItem(k, 'broken'), key)
  await page.reload()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('broken')
})

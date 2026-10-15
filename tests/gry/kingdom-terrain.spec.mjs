import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { baseTerrain } = await j.import('../../src/apps/gry/games/little-kingdom/terrain.ts')
const key = 'zgrana:gry:male-krolestwo:v11',
  previous = 'zgrana:gry:male-krolestwo:v10'
async function prepare(page, state, version = 11) {
  await page.route('**/*googletagmanager.com/**', (r) => r.abort())
  const raw = encode(state, version)
  await page.addInitScript(
    ({ raw, key }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('terrain-fixture')) {
        localStorage.setItem(key, raw)
        sessionStorage.setItem('terrain-fixture', '1')
      }
    },
    { raw, key: version === 11 ? key : previous },
  )
  return raw
}
const tile = (page, xy) => page.locator(`[data-tile="${xy}"]`)
const stored = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)

for (const [width, height] of [
  [360, 640],
  [1440, 1000],
])
  test(`clustered map, mining, reload and large-map rendering ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height })
    const s = newKingdom(42)
    s.resources = { wood: 100, stone: 100, food: 80, gold: 80 }
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await prepare(page, s)
    await page.goto('/gry/male-krolestwo')
    await expect(tile(page, '1,3')).toHaveAttribute('aria-label', /Las/)
    await expect(tile(page, '3,5')).toHaveAttribute('aria-label', /Woda/)
    await page.locator('[data-building-card="sawmill"]').click()
    await tile(page, '1,2').click()
    await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
    const expected = resolveTurn(s, { type: 'build', kind: 'sawmill', x: 1, y: 2 }).state
    expect((await stored(page)).state).toEqual(expected)
    await page.reload()
    await expect(tile(page, '1,2')).toHaveAttribute('aria-label', /Tartak/)
    expect((await stored(page)).state).toEqual(expected)
    const large = newKingdom(42)
    large.sectors = Array.from({ length: 100 }, (_, i) => ({
      x: (i % 10) - 5,
      y: Math.floor(i / 10) - 5,
    }))
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key,
      raw: encode(large),
    })
    await page.reload()
    await expect(page.locator('.map-toolbar')).toContainText('100 odkrytych')
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Oddal mapę' }).click()
    expect(await page.locator('[data-tile]').count()).toBeGreaterThan(49)
    expect(await page.locator('[data-tile]').count()).toBeLessThan(1200)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.locator('.map-stage').screenshot({ path: info.outputPath('clustered-map.png') })
    expect(errors).toEqual([])
  })

test('v10 preserves known terrain and bytes while future exploration uses the clustered generator', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const s = newKingdom(42, 1)
  s.resources = { wood: 100, stone: 100, food: 80, gold: 80 }
  const raw = await prepare(page, s, 10)
  await page.goto('/gry/male-krolestwo')
  await expect(tile(page, '2,3')).toHaveAttribute('aria-label', /Las/)
  const loaded = (await stored(page)).state
  expect(loaded.landscape).toEqual({ version: 2, legacySectors: ['0,0'] })
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) expect(baseTerrain(loaded, x, y)).toBe(baseTerrain(s, x, y))
  await page.locator('.exploration summary').click()
  await page.getByRole('button', { name: 'Sektor 1, 0 ↗' }).click()
  await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
  const next = (await stored(page)).state
  expect(next).toEqual(resolveTurn(loaded, { type: 'explore', x: 1, y: 0 }).state)
  for (let y = 0; y < 7; y++)
    for (let x = 7; x < 14; x++)
      expect(baseTerrain(next, x, y)).toBe(baseTerrain(newKingdom(42), x, y))
  expect(await page.evaluate((key) => localStorage.getItem(key), previous)).toBe(raw)
  await page.reload()
  await expect(page.locator('.map-toolbar')).toContainText('2 odkrytych')
  expect((await stored(page)).state).toEqual(next)
})

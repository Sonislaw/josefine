import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { inventoryLimit } = await j.import('../../src/apps/gry/games/little-kingdom/balance.ts')
const url = '/gry/male-krolestwo',
  key = 'zgrana:gry:male-krolestwo:v8'
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(
    'harder opening, gated upgrades and visible inventory overflow ' + width,
    async ({ page }, info) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setViewportSize({ width, height })
      await page.addInitScript(
        ({ key, raw }) => {
          localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
          if (!sessionStorage.getItem('balance-fixture')) {
            localStorage.setItem(key, raw)
            sessionStorage.setItem('balance-fixture', '1')
          }
        },
        { key, raw: encode(newKingdom(42)) },
      )
      await page.goto(url)
      await expect(page.locator('.stock-limit')).toHaveCount(4)
      await page.locator('[data-building-card="farm"]').click()
      await page.locator('[data-tile="0,1"]').click()
      await expect(page.locator('.turn-preview')).toContainText('12 drewna')
      await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
      await page.getByRole('button', { name: 'Ulepsz do 2' }).click()
      await expect(page.locator('.preview-error')).toContainText('Wioski')
      await expect(page.getByRole('button', { name: 'Zatwierdź turę' })).toBeDisabled()
      const capped = newKingdom(42)
      capped.resources = inventoryLimit(0)
      capped.buildings['0,0'] = { x: 0, y: 0, kind: 'farm', level: 3 }
      await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
        key,
        raw: encode(capped),
      })
      await page.reload()
      await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
      await expect(page.locator('.turn-preview')).toContainText('Nadwyżka poza limitem')
      const expected = resolveTurn(capped, { type: 'gather' })
      await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
      expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)).toEqual(
        expected.state,
      )
      await page
        .locator('.kingdom-resources')
        .screenshot({ path: info.outputPath('inventory-limits.png') })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      expect(errors).toEqual([])
    },
  )

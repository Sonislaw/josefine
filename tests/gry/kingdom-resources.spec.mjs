import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v7'

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [800, 1024],
  [1440, 1000],
])
  test(`compact resources stay above the map, controls and FAQ ${width}`, async ({
    page,
  }, info) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width, height })
    await page.route('**/*googletagmanager.com/**', (route) => route.abort())
    const state = newKingdom(42)
    // Old above-limit stocks must remain readable too, without widening the page.
    state.resources.wood = 1234567
    await page.addInitScript(
      ({ key, raw }) => {
        localStorage.setItem(key, raw)
        localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      },
      { key, raw: JSON.stringify({ ...JSON.parse(encode(state)), tutorialDismissed: false }) },
    )
    await page.goto('/gry/male-krolestwo')
    const dock = page.getByRole('region', { name: 'Zapasy osady' })
    await expect(dock.locator('[data-resource]')).toHaveCount(4)
    await expect(dock.locator('.stock-limit')).toHaveCount(4)
    await expect(dock.locator('[data-resource="wood"]')).toHaveText(
      state.resources.wood.toLocaleString('pl-PL'),
    )
    const original = await dock.boundingBox()
    expect(original.height).toBeLessThan(100)
    expect(original.y + original.height).toBeLessThan(height)
    expect((await dock.locator('[data-resource="wood"]').boundingBox()).height).toBeLessThan(25)
    for (const target of ['.kingdom-map', '.turn-preview', '.kingdom-faq']) {
      await page.locator(target).evaluate((el) => el.scrollIntoView({ block: 'start' }))
      await expect.poll(async () => (await dock.boundingBox()).y).toBeCloseTo(0, 0)
      expect(
        await dock.evaluate((el) => {
          const r = el.getBoundingClientRect()
          return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))
        }),
      ).toBe(true)
    }
    await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    await expect(dock.locator('.delta')).toHaveCount(4)
    await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
    const expected = resolveTurn(state, { type: 'gather' })
    for (const r of ['wood', 'stone', 'food', 'gold'])
      await expect(dock.locator(`[data-resource="${r}"]`)).toHaveText(
        expected.state.resources[r].toLocaleString('pl-PL'),
      )
    await page.locator('.kingdom-faq').evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await expect.poll(async () => (await dock.boundingBox()).y).toBeCloseTo(0, 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath('sticky-resources.png') })
    await page.getByRole('button', { name: 'Jak grać?' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Zamknij', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(errors).toEqual([])
  })

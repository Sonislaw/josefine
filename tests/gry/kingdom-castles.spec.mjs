import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { castlesKingdom } from './kingdom-castles-fixture.mjs'
import { beforeRaid } from './kingdom-war-fixture.mjs'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { resolveTurn } = await j.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const key = 'zgrana:gry:male-krolestwo:v7',
  previous = 'zgrana:gry:male-krolestwo:v6'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
async function prepare(page, state, version = 7) {
  await page.route('**/*googletagmanager.com/**', (r) => r.abort())
  await page.addInitScript(
    ({ key, raw }) => {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
      if (!sessionStorage.getItem('castle-fixture')) {
        localStorage.setItem(key, raw)
        sessionStorage.setItem('castle-fixture', '1')
      }
    },
    { key: version === 6 ? previous : key, raw: encode(state, version) },
  )
}
for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(`targeted plunder, repairs, final destruction and persistent ruins ${width}`, async ({
    page,
  }, info) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width, height })
    let state = castlesKingdom(2)
    state.affairs.enemies[3].garrison = { spearman: 0, archer: 0, shieldbearer: 0 }
    state.affairs.enemies[3].health = 60
    await prepare(page, state)
    await page.goto('/gry/male-krolestwo')
    await page.locator('.defence-panel > summary').filter({ hasText: 'Sąsiednie osady' }).click()
    const castle = page.locator('[data-castle-id="3"]')
    await expect(castle.getByTestId('castle-health')).toHaveText('60%')
    await castle.locator('.expedition > summary').click()
    await castle.getByLabel('Włócznik', { exact: true }).fill('12')
    await castle.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }).focus()
    await page.keyboard.press('Enter')
    const first = resolveTurn(state, {
      type: 'expedition',
      enemyId: 3,
      army: { ...state.affairs.army },
      tactic: 'guard',
    })
    await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText(
      'Północna Twierdza',
    )
    await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText('25%')
    await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText(
      'Łupy po wyżywieniu',
    )
    expect((await stored(page)).state).toEqual(state)
    await commit(page).click()
    state = first.state
    expect((await stored(page)).state).toEqual(state)
    await expect(castle.getByTestId('castle-health')).toHaveText('25%')
    await expect(page.locator('[data-castle-id="2"]').getByTestId('castle-health')).toHaveText(
      '100%',
    )
    await expect(
      castle.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }),
    ).toBeDisabled()
    await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    await expect(page.locator('.turn-preview')).toContainText('Odbudowa zamków po turze')
    state = resolveTurn(state, { type: 'gather' }).state
    await commit(page).click()
    await expect(castle.getByTestId('castle-health')).toHaveText('28%')
    await castle.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }).click()
    const final = resolveTurn(state, {
      type: 'expedition',
      enemyId: 3,
      army: { ...state.affairs.army },
      tactic: 'guard',
    })
    await expect(page.getByRole('region', { name: 'Prognoza bitwy' })).toContainText(
      'Zamek zniszczony',
    )
    await commit(page).click()
    expect((await stored(page)).state).toEqual(final.state)
    await expect(castle.getByTestId('castle-health')).toHaveText('0%')
    await expect(
      castle.getByRole('button', { name: 'Wyprawa na garnizon', exact: true }),
    ).toHaveCount(0)
    const contact = state.affairs.settlements.find((c) => c.id === 3)
    await page
      .locator('.neighbour')
      .filter({ hasText: 'Północna Twierdza' })
      .getByRole('button', { name: 'Pokaż na mapie' })
      .click()
    await expect(page.locator(`[data-tile="${contact.x},${contact.y}"]`)).toHaveAttribute(
      'aria-label',
      /Zgliszcza.*0%/,
    )
    await expect(
      page.locator(`[data-tile="${contact.x},${contact.y}"] [data-castle-ruins]`),
    ).toHaveCount(1)
    await page.screenshot({ path: info.outputPath('castle-ruins.png') })
    await page.reload()
    await page.locator('.defence-panel > summary').filter({ hasText: 'Sąsiednie osady' }).click()
    await expect(castle.getByTestId('castle-health')).toHaveText('0%')
    await expect(castle).toContainText('Nie ma odbudowy')
    expect((await stored(page)).state).toEqual(final.state)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
test('v6 ongoing raid migrates without changing old bytes and corrupt v7 never falls back', async ({
  page,
}) => {
  const state = beforeRaid(),
    raw = encode(state, 6)
  await prepare(page, state, 6)
  await page.goto('/gry/male-krolestwo')
  await expect(page.getByTestId('kingdom-turn')).toHaveText(String(state.turn + 1))
  const migrated = (await stored(page)).state
  expect(migrated.affairs.raid).toEqual(state.affairs.raid)
  expect(migrated.affairs.enemies[2].health).toBe(100)
  expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
  await page.evaluate((k) => localStorage.setItem(k, '{broken'), key)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Nie możemy odczytać')
  await expect(commit(page)).toBeDisabled()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{broken')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{broken')
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  expect((await stored(page)).version).toBe(7)
  expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
})
test('100 discovered castles paginate contacts and render only the visible map on mobile', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 640 })
  const state = castlesKingdom(100)
  await prepare(page, state)
  await page.goto('/gry/male-krolestwo')
  await expect(page.getByTestId('kingdom-turn')).toHaveText(String(state.turn + 1))
  await page.locator('.defence-panel > summary').filter({ hasText: 'Sąsiednie osady' }).click()
  await expect(page.locator('.neighbour')).toHaveCount(5)
  await page.getByRole('button', { name: 'Pokaż więcej osad' }).click()
  await expect(page.locator('.neighbour')).toHaveCount(10)
  expect(await page.locator('[data-tile]').count()).toBeLessThan(400)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(Object.keys((await stored(page)).state.affairs.enemies)).toHaveLength(100)
  await page
    .locator('.defence-panel')
    .last()
    .screenshot({ path: info.outputPath('castle-list.png') })
})

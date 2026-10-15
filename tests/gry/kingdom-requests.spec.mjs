import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { requestsKingdom } from './kingdom-requests-fixture.mjs'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { manageRequest, REQUESTS, REQUEST_IDS } = await j.import(
  '../../src/apps/gry/games/little-kingdom/requests.ts',
)
const url = '/gry/male-krolestwo',
  key = 'zgrana:gry:male-krolestwo:v11',
  oldKey = 'zgrana:gry:male-krolestwo:v3'
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
const commit = (page) => page.getByRole('button', { name: 'Zatwierdź turę' })
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
    if (!sessionStorage.getItem('requests-fixture')) {
      for (const [k, v] of entries) localStorage.setItem(k, v)
      sessionStorage.setItem('requests-fixture', '1')
    }
  }, entries)
}
const open = async (page) => {
  await page.locator('.residents-panel > summary').focus()
  await page.keyboard.press('Enter')
}

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [1440, 1000],
])
  test(`residents choose, locate, preview, reward once, rotate and defer at ${width}px`, async ({
    page,
  }, info) => {
    const s = requestsKingdom()
    await page.setViewportSize({ width, height })
    await prepare(page, [[key, encode(s)]])
    await page.goto(url)
    await open(page)
    await expect(page.locator('[data-request-card]')).toHaveCount(3)
    await expect(page.locator('[data-request-card] .resident-portrait')).toHaveCount(3)
    await page
      .locator('.residents-panel')
      .screenshot({ path: info.outputPath('request-offers.png') })
    await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
    const chosen = manageRequest(s, { type: 'accept', id: 'water-farm' })
    expect((await stored(page)).state).toEqual(chosen)
    await expect(page.locator('[data-active-request]')).toContainText('✓ Cel gotowy')
    await expect(page.getByTestId('kingdom-turn')).toHaveText('61')
    await expect(page.locator('.request-announcement')).toHaveCount(0)
    await page
      .locator('.resident-actions')
      .getByRole('button', { name: /Pokaż na mapie/ })
      .click()
    await expect(page.locator('.selected-panel h2')).toContainText('Farma')
    expect((await stored(page)).state).toEqual(chosen)
    await page.reload()
    await open(page)
    await expect(page.locator('[data-active-request]')).toHaveAttribute(
      'data-active-request',
      'water-farm',
    )
    expect((await stored(page)).state).toEqual(chosen)
    const forecast = resolveTurn(chosen, { type: 'gather' })
    await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
    expect((await stored(page)).state).toEqual(forecast.state)
    await expect(page.locator('.request-announcement')).toContainText('Zosia')
    await expect(page.locator('[data-request-card="water-farm"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Zamknij podziękowanie mieszkańca' }).click()
    await expect(page.locator('.request-announcement')).toHaveCount(0)
    await page.locator('.resident-history > summary').click()
    await expect(page.locator('.resident-history li')).toHaveCount(1)
    await expect(page.locator('.resident-history li')).toContainText('po turze 61')
    await page.getByRole('button', { name: 'Inne prośby ↻' }).click()
    const rotated = manageRequest(forecast.state, { type: 'rotate' })
    expect((await stored(page)).state).toEqual(rotated)
    await page.getByRole('button', { name: 'Przyjmij prośbę: Dom na lata' }).click()
    await page.getByRole('button', { name: 'Odłóż prośbę' }).click()
    expect((await stored(page)).state.requests.completed).toEqual(forecast.state.requests.completed)
    expect((await stored(page)).state.resources).toEqual(forecast.state.resources)
    await page.reload()
    await open(page)
    await expect(page.locator('[data-request-card="master-house"]')).toHaveCount(1)
    expect((await stored(page)).state.requests.active).toBeNull()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Nowa osada', exact: true }).click()
    await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
    expect((await stored(page)).state.requests).toEqual({ active: null, completed: [], cursor: 0 })
  })

test('fresh settlement builds its goal, deferral is free and locked goals wait for rank', async ({
  page,
}) => {
  const s = newKingdom(42, 1)
  await prepare(page, [[key, encode(s)]])
  await page.goto(url)
  await open(page)
  await expect(page.getByRole('button', { name: 'Inne prośby ↻' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
  await expect(page.locator('[data-active-request]')).toContainText('0 / 1')
  await page.getByRole('button', { name: 'Odłóż prośbę' }).click()
  expect((await stored(page)).state.resources).toEqual(s.resources)
  expect((await stored(page)).state.turn).toBe(0)
  await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
  await page.getByRole('button', { name: /Farma/ }).first().click()
  await page.locator('[data-tile="4,2"]').click()
  await expect(page.locator('.request-preview')).toContainText('Prośba wykonana')
  await expect(page.locator('.request-announcement')).toHaveCount(0)
  await commit(page).click()
  await expect(page.locator('.request-announcement')).toContainText('Pole przy strumieniu')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await expect(page.locator('.request-preview')).toHaveCount(0)
  expect((await stored(page)).state.requests.completed).toHaveLength(1)
})

test('v3 retains rank and old bytes; migration does not complete requests or advance turns', async ({
  page,
}) => {
  const s = requestsKingdom(),
    raw = encode(s, 3)
  await prepare(page, [[oldKey, raw]])
  await page.goto(url)
  await expect(page.getByTestId('kingdom-rank')).toContainText('Małe królestwo')
  await expect(page.getByTestId('kingdom-turn')).toHaveText('61')
  expect((await stored(page)).state).toEqual({
    ...s,
    landscape: { version: 2, legacySectors: s.sectors.map((p) => `${p.x},${p.y}`) },
  })
  expect(await page.evaluate((k) => localStorage.getItem(k), oldKey)).toBe(raw)
  await open(page)
  await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
  await page.reload()
  await open(page)
  await expect(page.locator('[data-active-request]')).toContainText('Cel gotowy')
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  expect((await stored(page)).state.requests.completed).toHaveLength(1)
  expect(await page.evaluate((k) => localStorage.getItem(k), oldKey)).toBe(raw)
})

test('quota during migration remains playable with active goal and completion in memory', async ({
  page,
}) => {
  const raw = encode(requestsKingdom(), 3)
  await prepare(page, [[oldKey, raw]])
  await page.addInitScript((key) => {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) {
      if (k === key) throw Error('quota')
      return set.call(this, k, v)
    }
  }, key)
  await page.goto(url)
  await expect(page.locator('.kingdom-notice')).toContainText('niedostępny')
  await open(page)
  await page.getByRole('button', { name: 'Przyjmij prośbę: Pole przy strumieniu' }).click()
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await expect(page.locator('.request-announcement')).toContainText('Pole przy strumieniu')
  expect(await stored(page)).toBeNull()
  expect(await page.evaluate((k) => localStorage.getItem(k), oldKey)).toBe(raw)
})

test('corrupt current request data stays protected despite valid v3 until confirmed restart', async ({
  page,
}) => {
  const s = requestsKingdom()
  s.requests.active = { id: 'unknown', acceptedTurn: 0 }
  const broken = encode(s)
  await prepare(page, [
    [key, broken],
    [oldKey, encode(requestsKingdom(), 3)],
  ])
  await page.goto(url)
  await expect(page.getByRole('alert')).toContainText('Nie możemy odczytać')
  await open(page)
  await expect(page.locator('[data-request-card] button').first()).toBeDisabled()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(broken)
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Zachowaj obecną' }).click()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(broken)
  await page.getByRole('button', { name: 'Rozpocznij nową osadę' }).click()
  await page.getByRole('button', { name: 'Tak, nowa osada' }).click()
  expect((await stored(page)).version).toBe(11)
})

test('finished collection displays history and continuing play without more rewards on mobile', async ({
  page,
}, info) => {
  const s = requestsKingdom()
  s.requests.completed = REQUEST_IDS.map((id, i) => ({ id, acceptedTurn: i + 33, turn: i + 34 }))
  await page.setViewportSize({ width: 360, height: 640 })
  await prepare(page, [[key, encode(s)]])
  await page.goto(url)
  await open(page)
  await expect(page.locator('.resident-empty')).toContainText('Wszystkie 12 próśb wykonane')
  await expect(page.locator('[data-request-card]')).toHaveCount(0)
  await page.locator('.resident-history > summary').click()
  await expect(page.locator('.resident-history li')).toHaveCount(12)
  await page.getByRole('button', { name: /Zbierz zapasy/ }).click()
  await expect(page.locator('.request-preview')).toHaveCount(0)
  expect((await stored(page)).state.requests.completed).toEqual(s.requests.completed)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page
    .locator('.residents-panel')
    .screenshot({ path: info.outputPath('requests-history.png') })
})

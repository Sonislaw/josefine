import { test, expect } from '@playwright/test'
import { pathToFileURL } from 'node:url'

const gameUrl = '/gry/warcaby-arena-mocy'
async function dismissCookies(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
    } catch {
      /* optional */
    }
  })
}
async function openGame(page) {
  await dismissCookies(page)
  await page.goto(gameUrl)
  await expect(page.locator('.square')).toHaveCount(64)
  await expect(page.locator('.square').first()).toBeEnabled()
}
async function normalMove(page, from = 'c3', to = 'b4') {
  await page.getByRole('button', { name: new RegExp(`^${from},`) }).click()
  await page.getByRole('button', { name: new RegExp(`^${to},`) }).click()
}

test('catalog links to game; metadata and navigation', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await dismissCookies(page)
  await page.goto('/gry')
  await expect(page).toHaveTitle(/Gry online/)
  await page.locator('.game-card').filter({ hasText: 'Warcaby' }).click()
  await expect(page).toHaveURL(new RegExp(`${gameUrl}$`))
  await expect(page).toHaveTitle(/Warcaby — Arena Mocy/)
  await expect(page.locator('.piece')).toHaveCount(24)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/gry.png$/,
  )
  await page.getByRole('link', { name: 'Wszystkie gry' }).click()
  await expect(page).toHaveURL(/\/gry$/)
  expect(errors).toEqual([])
})

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`board fits viewport at ${width}px without clipping`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await openGame(page)
    const geometry = await page.locator('.board-grid').boundingBox()
    expect(Math.abs(geometry.width - geometry.height)).toBeLessThan(2)
    expect(geometry.x).toBeGreaterThanOrEqual(0)
    expect(geometry.x + geometry.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
    await page.screenshot({ path: testInfo.outputPath(`arena-${width}.png`), fullPage: true })
  })
}

test('AI performs a turn in worker; opponent switch preserves position and cancels old turn', async ({
  page,
}) => {
  await openGame(page)
  await page.getByRole('button', { name: 'Klasyczne', exact: true }).click()
  await normalMove(page)
  await expect(page.locator('.board-actions')).toContainText('RUCH 03', { timeout: 15000 })
  await page.getByRole('button', { name: 'Nowa rozgrywka' }).click()
  await page.getByRole('button', { name: 'Rozpocznij', exact: true }).click()
  await normalMove(page)
  await page.getByLabel('Z KIM GRASZ?').selectOption('local')
  await expect(page.locator('.board-actions')).toContainText('RUCH 02')
  await page.waitForTimeout(700)
  await expect(page.locator('.board-actions')).toContainText('RUCH 02')
  await expect(page.getByRole('button', { name: /^b4, jasny/ })).toBeVisible()
  await page.getByLabel('Z KIM GRASZ?').selectOption('computer')
  await expect(page.locator('.board-actions')).toContainText('RUCH 03')
})

test('restart cancels old AI; cancellation and help dialogs retain board and focus', async ({
  page,
}) => {
  await openGame(page)
  await normalMove(page)
  await page.getByRole('button', { name: 'Nowa rozgrywka' }).click()
  await page.getByRole('button', { name: 'Rozpocznij', exact: true }).click()
  await page.waitForTimeout(850)
  await expect(page.locator('.board-actions')).toContainText('RUCH 01')
  await expect(page.locator('.piece')).toHaveCount(24)
  await page.getByLabel('Z KIM GRASZ?').selectOption('local')
  await normalMove(page)
  const board = await page.locator('.board-grid').innerHTML()
  await page.getByRole('button', { name: 'Klasyczne', exact: true }).click()
  await page.getByRole('button', { name: 'Wróć do gry' }).click()
  expect(await page.locator('.board-grid').innerHTML()).toBe(board)
  await expect(
    page.getByRole('button', { name: 'Arena Mocy', exact: false }).first(),
  ).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Jak grać' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Jak grać' })).toBeFocused()
})

test('storage denial is harmless; valid XP survives reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('arena-xp', '437')
  })
  await openGame(page)
  await expect(page.locator('.xp-card')).toContainText('437 PD')
  await page.reload()
  await expect(page.locator('.xp-card')).toContainText('TWÓJ POZIOM 5')
  await page.addInitScript(() => {
    // Vite's devtools depend on their own storage. Deny the game's key here;
    // the standalone test below denies ALL storage without development tools.
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'arena-xp') throw new Error('blocked')
      return get.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'arena-xp') throw new Error('blocked')
      return set.call(this, key, value)
    }
  })
  await page.reload()
  await expect(page.locator('.xp-card')).toContainText('Łącznie 0 PD')
  await normalMove(page)
  await expect(page.locator('.board-actions')).toContainText('RUCH 03')
})

test('controller: preview is reversible, awards once, locks after result and resets mission', async ({
  page,
}) => {
  await page.goto('/tests/gry/harness.html')
  await page.waitForFunction(() => window.arenaTest)
  const result = await page.evaluate(() => {
    const a = window.arenaTest,
      e = window.engineTest,
      s = window.sessionTest
    const board = Array(64).fill(null)
    board[40] = { side: 0, king: false, used: false, power: 'slide' } // a3
    board[1] = { side: 1, king: false, used: false, power: 'sprint' }
    a.changeOpponent('local')
    a.session.value = s.createSession('arena', 0, {
      board,
      side: 0,
      mode: 'arena',
      forcedPiece: null,
      quietMoves: 0,
    })
    a.clickSquare(40)
    const before = JSON.stringify(a.session.value)
    a.togglePower()
    const preview = a.powerMode.value && a.targets.value.length > 0
    a.togglePower()
    const untouched = before === JSON.stringify(a.session.value)
    a.togglePower()
    a.clickSquare(42)
    const powerSpent =
      a.state.value.board[42].used && a.state.value.side === 1 && a.session.value.mission === 1
    const finalBoard = Array(64).fill(null)
    finalBoard[17] = { side: 0, king: false, used: false, power: null } // b6
    finalBoard[10] = { side: 1, king: false, used: false, power: null } // c7
    a.session.value = s.createSession('classic', 0, {
      board: finalBoard,
      side: 0,
      mode: 'classic',
      forcedPiece: null,
      quietMoves: 0,
    })
    a.clickSquare(17)
    a.clickSquare(3)
    const won = a.showOutcome.value && a.session.value.xp === 130
    a.showOutcome.value = false
    const ended = JSON.stringify(a.session.value)
    a.clickSquare(3)
    a.clickSquare(12)
    const locked = a.locked.value && JSON.stringify(a.session.value) === ended
    a.reset('arena')
    return {
      preview,
      untouched,
      powerSpent,
      won,
      locked,
      xp: a.session.value.xp,
      mission: a.session.value.mission,
      count: e.getLegalMoves(a.state.value).length,
    }
  })
  expect(result).toMatchObject({
    preview: true,
    untouched: true,
    powerSpent: true,
    won: true,
    locked: true,
    xp: 130,
    mission: 0,
  })
  expect(result.count).toBeGreaterThan(0)
})

test('controller switch during forced capture preserves same piece and resumes AI chain', async ({
  page,
}) => {
  await page.goto('/tests/gry/harness.html')
  await page.waitForFunction(() => window.arenaTest)
  await page.evaluate(() => {
    const a = window.arenaTest
    a.changeOpponent('local')
    const board = Array(64).fill(null)
    board[10] = { side: 1, king: false, power: null, used: false } // c7
    board[19] = { side: 0, king: false, power: null, used: false } // d6
    board[37] = { side: 0, king: false, power: null, used: false } // f4
    board[56] = { side: 0, king: false, power: null, used: false }
    a.session.value = window.sessionTest.createSession('classic', 0, {
      board,
      side: 1,
      mode: 'classic',
      forcedPiece: null,
      quietMoves: 0,
    })
    a.clickSquare(10)
    a.clickSquare(28)
    if (a.state.value.forcedPiece !== 28) throw new Error('Expected chain')
    a.changeOpponent('computer')
  })
  await page.waitForFunction(() => window.arenaTest.state.value.side === 0)
  expect(
    await page.evaluate(() => ({
      forced: window.arenaTest.state.value.forcedPiece,
      piece: window.arenaTest.state.value.board[46]?.side,
      turn: window.arenaTest.session.value.turn,
    })),
  ).toEqual({ forced: null, piece: 1, turn: 2 })
})

test('download is a single HTML that runs game and AI from file:// with network blocked', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(90000)
  await openGame(page)
  const pending = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Pobierz grę' }).click()
  const download = await pending
  const file = testInfo.outputPath('warcaby-arena-mocy.html')
  await download.saveAs(file)
  const offline = await browser.newContext()
  await offline.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('blocked')
    }
    Storage.prototype.setItem = () => {
      throw new Error('blocked')
    }
  })
  await offline.setOffline(true)
  const tab = await offline.newPage()
  const errors = [],
    requests = []
  tab.on('pageerror', (e) => errors.push(e.message))
  tab.on('request', (req) => {
    if (/^https?:/.test(req.url())) requests.push(req.url())
  })
  await tab.goto(pathToFileURL(file).href)
  await expect(tab.locator('.piece')).toHaveCount(24)
  await expect(tab.locator('.board-actions')).toContainText('RUCH 01')
  await normalMove(tab)
  await expect(tab.locator('.board-actions')).toContainText('RUCH 03', { timeout: 15000 })
  await tab.screenshot({ path: testInfo.outputPath('offline.png'), fullPage: true })
  expect(errors).toEqual([])
  expect(requests).toEqual([])
  await offline.close()
})

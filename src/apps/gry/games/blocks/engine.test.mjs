import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const { SHAPES, newRound, placement, fullLines, fits, hasMove, place, shapeById, drawTray } =
  await jiti.import('./engine.ts')
const { SAVE_KEY, decodeSave, decodeRound, load, save } = await jiti.import('./storage.ts')
const dot = shapeById('dot')
const fresh = () => ({ ...newRound(() => 0), tray: ['dot', 'dot', 'dot'] })

test('8×8 board, three shapes and catalog integrity', () => {
  const round = fresh()
  assert.equal(round.board.length, 64)
  assert.ok(round.board.every((n) => n === 0))
  assert.equal(round.tray.length, 3)
  assert.equal(round.score, 0)
  assert.equal(new Set(SHAPES.map((s) => s.id)).size, SHAPES.length)
  for (const shape of SHAPES) {
    assert.equal(new Set(shape.cells.map(String)).size, shape.cells.length)
    assert.ok(fits(round.board, shape))
  }
  assert.equal(drawTray(() => 0.999).length, 3)
})
test('legal placement is immutable and consumes exactly the chosen slot', () => {
  const round = fresh(),
    before = structuredClone(round)
  const result = place(round, 1, 2, 3)
  assert.equal(result.state.board[19], 1)
  assert.deepEqual(result.state.tray, ['dot', null, 'dot'])
  assert.equal(result.state.score, 1)
  assert.equal(result.state.moves, 1)
  assert.deepEqual(round, before)
  assert.equal(place(result.state, 1, 3, 3), null)
})
test('reject overlap, wraparound, outside coordinates and invalid slot', () => {
  const round = fresh()
  round.tray[0] = 'h3'
  for (const [row, col] of [
    [0, 6],
    [0, -1],
    [-1, 0],
    [8, 0],
    [1.5, 0],
    [0, NaN],
  ])
    assert.equal(place(round, 0, row, col), null)
  round.board[1] = 2
  assert.equal(place(round, 0, 0, 0), null)
  assert.equal(place(round, -1, 0, 0), null)
  assert.equal(place(round, 3, 0, 0), null)
  assert.equal(place(round, 0.5, 0, 0), null)
})
test('crossing row and column clear together once: two lines, 15 cells and 41 points', () => {
  const round = fresh()
  for (let i = 1; i < 8; i++) {
    round.board[i] = 1
    round.board[i * 8] = 2
  }
  const result = place(round, 0, 0, 0)
  assert.equal(result.lines, 2)
  assert.equal(result.cleared.length, 15)
  assert.equal(result.points, 41)
  assert.ok(result.state.board.every((n) => n === 0))
})
test('consecutive clearing multiplies bonus; ordinary placement resets streak, without gravity', () => {
  let round = fresh()
  for (let i = 0; i < 7; i++) round.board[i] = 1
  let result = place(round, 0, 0, 7)
  assert.equal(result.points, 11)
  round = result.state
  for (let i = 0; i < 7; i++) round.board[8 + i] = 1
  result = place(round, 1, 1, 7)
  assert.equal(result.points, 21)
  assert.equal(result.state.streak, 2)
  result = place(result.state, 2, 0, 0, () => 0)
  assert.equal(result.state.streak, 0)
  assert.equal(result.state.board[0], 1)
  assert.equal(result.state.board[56], 0)
})
test('refill only after all three pieces and preserve board/score', () => {
  let round = fresh(),
    calls = 0
  const rng = () => {
    calls++
    return 0.4
  }
  for (let slot = 0; slot < 3; slot++) round = place(round, slot, 0, slot, rng).state
  assert.equal(calls, 3)
  assert.ok(round.tray.every(Boolean))
  assert.equal(round.score, 3)
  assert.equal(round.board.filter(Boolean).length, 3)
})
test('gameover checks ALL remaining shapes and also a newly dealt pack', () => {
  const round = fresh()
  round.board = Array.from({ length: 64 }, (_, i) => (Math.floor(i / 8) + (i % 8)) % 2)
  round.tray = ['square', 'h2', 'dot']
  assert.equal(hasMove(round), true)
  const result = place(round, 2, 0, 0)
  assert.equal(result.state.status, 'gameover')
  assert.equal(place(result.state, 0, 0, 2), null)
  round.tray = [null, null, 'dot']
  const refilled = place(round, 2, 0, 0, () => 0.999)
  assert.equal(refilled.refilled, true)
  assert.equal(refilled.state.status, 'gameover')
})
test('line clear can restore room for remaining large shapes before loss check', () => {
  const round = fresh()
  for (let i = 0; i < 7; i++) round.board[i] = 1
  round.tray = ['dot', 'h4', null]
  const result = place(round, 0, 0, 7)
  assert.equal(result.state.status, 'playing')
  assert.ok(placement(result.state.board, shapeById('h4'), 0, 0))
})
test('saved round validation: malformed, version, cells, shapes, counters and derived loss', () => {
  const round = place(fresh(), 0, 0, 0).state
  const raw = JSON.stringify({ version: 1, round, best: 9, sound: true })
  assert.deepEqual(decodeSave(raw), { version: 1, round, best: 9, sound: true })
  for (const raw of [null, '{', '[]', '{"version":2}', 'null'])
    assert.equal(decodeSave(raw).round, null)
  for (const value of [
    { ...round, board: [1] },
    { ...round, tray: ['unknown', null, null] },
    { ...round, tray: [null, null, null] },
    { ...round, score: -1 },
    { ...round, streak: 100 },
    { ...round, lines: Infinity },
    { ...round, board: Array(64).fill(7) },
  ])
    assert.equal(decodeRound(value), null)
  assert.equal(decodeRound({ ...round, status: 'gameover' }).status, 'playing')
  assert.equal(decodeRound({ ...round, board: Array(64).fill(1) }), null)
})
test('blocked storage never throws; save never lowers the record', () => {
  const denied = {
    getItem() {
      throw Error('denied')
    },
    setItem() {
      throw Error('denied')
    },
  }
  assert.equal(load(denied).available, false)
  assert.equal(
    save(denied, { version: 1, round: fresh(), best: 42, sound: false }).available,
    false,
  )
  const memory = new Map([
    [SAVE_KEY, JSON.stringify({ version: 1, best: 400, round: null, sound: false })],
  ])
  const store = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  }
  assert.equal(save(store, { version: 1, round: fresh(), best: 30, sound: true }).best, 400)
  assert.equal(load(store).best, 400)
  assert.equal(load(store).sound, true)
})
test('seeded complete rounds maintain invariants and survive serialization after every move', () => {
  let seed = 37
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  for (let game = 0; game < 10; game++) {
    let round = newRound(rng)
    for (let turn = 0; turn < 500 && round.status === 'playing'; turn++) {
      const moves = []
      for (let slot = 0; slot < 3; slot++) {
        const shape = shapeById(round.tray[slot])
        if (!shape) continue
        for (let row = 0; row < 8; row++)
          for (let col = 0; col < 8; col++)
            if (placement(round.board, shape, row, col)) moves.push([slot, row, col])
      }
      assert.ok(moves.length > 0)
      const [slot, row, col] = moves[Math.floor(rng() * moves.length)]
      const next = place(round, slot, row, col, rng).state
      assert.ok(next.score > round.score)
      assert.equal(fullLines(next.board).cells.length, 0)
      assert.deepEqual(
        decodeSave(JSON.stringify({ version: 1, round: next, best: next.score })).round,
        next,
      )
      round = next
    }
    assert.equal(round.status, 'gameover')
  }
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const {
  createInitialState,
  getLegalMoves,
  getPieceMoves,
  applyMove,
  getCompleteTurns,
  chooseComputerTurn,
  positionKey,
  getOutcome,
  evaluatePosition,
} = await jiti.import('./engine.ts')
const { createSession, playMove, safeXp } = await jiti.import('./session.ts')
const idx = (coord) => (8 - Number(coord[1])) * 8 + 'abcdefgh'.indexOf(coord[0])
const piece = (side = 0, power = null, king = false, used = false) => ({ side, power, king, used })
const position = (entries, mode = 'arena', side = 0) => ({
  board: Array.from({ length: 64 }, (_, i) => entries.find(([c]) => idx(c) === i)?.[1] ?? null),
  mode,
  side,
  forcedPiece: null,
  quietMoves: 0,
})
const find = (s, from, to, skill) =>
  getLegalMoves(s).find((m) => m.from === idx(from) && m.to === idx(to) && m.skill === skill)
const count = (s) => s.board.filter(Boolean).length

test('12 pieces per side, dark squares, symmetric 3×4 powers; classic has 7 opening moves', () => {
  for (let n = 0; n < 30; n++) {
    const s = createInitialState('arena')
    for (const side of [0, 1]) {
      const pieces = s.board.filter((p) => p?.side === side)
      assert.equal(pieces.length, 12)
      for (const power of ['sprint', 'retreat', 'slide', 'vault'])
        assert.equal(pieces.filter((p) => p.power === power).length, 3)
    }
    s.board.forEach((p, i) => {
      if (p) {
        assert.equal((Math.floor(i / 8) + (i % 8)) % 2, 1)
        assert.equal(p.power, s.board[63 - i].power)
      }
    })
    assert.equal(s.side, 0)
  }
  const classic = createInitialState('classic')
  assert.equal(getLegalMoves(classic).length, 7)
  assert.ok(classic.board.filter(Boolean).every((p) => p.power === null))
})
test('men cannot move/capture backwards; kings are short-range', () => {
  const s = position(
    [
      ['c3', piece()],
      ['d2', piece(1)],
    ],
    'classic',
  )
  assert.ok(!find(s, 'c3', 'e1'))
  assert.ok(getPieceMoves(s, idx('c3')).every((m) => Math.floor(m.to / 8) < 5))
  s.board[idx('c3')].king = true
  assert.ok(find(s, 'c3', 'e1'))
  s.board[idx('d2')] = null
  assert.equal(getLegalMoves(s).length, 4)
  assert.ok(!find(s, 'c3', 'f6'))
})
test('global capture excludes ordinary moves and powers, accepts either capture path', () => {
  const s = position([
    ['c3', piece(0, 'slide')],
    ['b4', piece(1)],
    ['d4', piece(1)],
    ['h2', piece(0, 'retreat')],
  ])
  assert.equal(getLegalMoves(s).length, 2)
  assert.ok(
    getLegalMoves(s).every((m) => m.captureIndex !== undefined && !m.skill && m.from === idx('c3')),
  )
})
test('capture chain locks piece and side, removes victims immediately; full turn includes all jumps', () => {
  const s = position([
    ['c3', piece()],
    ['d4', piece(1)],
    ['f6', piece(1)],
    ['a1', piece()],
  ])
  const next = applyMove(s, find(s, 'c3', 'e5'))
  assert.equal(next.side, 0)
  assert.equal(next.forcedPiece, idx('e5'))
  assert.equal(next.board[idx('d4')], null)
  assert.ok(getLegalMoves(next).every((m) => m.from === idx('e5')))
  const turns = getCompleteTurns(s)
  assert.equal(turns.length, 1)
  assert.equal(turns[0].sequence.length, 2)
  assert.equal(turns[0].state.side, 1)
  assert.equal(turns[0].state.forcedPiece, null)
  assert.equal(count(s), 4)
})
test('promotion after capture ends turn, keeps spent power, does not take backwards capture', () => {
  const s = position([
    ['b6', piece(0, 'sprint', false, true)],
    ['c7', piece(1)],
    ['e7', piece(1)],
  ])
  const next = applyMove(s, find(s, 'b6', 'd8'))
  assert.equal(next.side, 1)
  assert.equal(next.forcedPiece, null)
  assert.deepEqual(next.board[idx('d8')], piece(0, 'sprint', true, true))
  assert.ok(next.board[idx('e7')])
})
test('sprint requires empty middle/target; dark powers point toward its own forward edge', () => {
  const s = position([['c3', piece(0, 'sprint')]])
  assert.ok(find(s, 'c3', 'e5', 'sprint'))
  s.board[idx('d4')] = piece()
  assert.ok(!find(s, 'c3', 'e5', 'sprint'))
  s.board[idx('d4')] = null
  s.board[idx('e5')] = piece()
  assert.ok(!find(s, 'c3', 'e5', 'sprint'))
  const dark = position([['f6', piece(1, 'sprint')]], 'arena', 1)
  assert.ok(find(dark, 'f6', 'd4', 'sprint'))
  assert.ok(!find(dark, 'f6', 'h8', 'sprint'))
})
test('retreat, slide and vault geometry; vault never captures or jumps empty squares', () => {
  for (const [power, target] of [
    ['retreat', 'b2'],
    ['slide', 'a3'],
  ]) {
    const s = position([['c3', piece(0, power)]])
    assert.ok(find(s, 'c3', target, power))
    assert.equal(applyMove(s, find(s, 'c3', target, power)).board[idx(target)].used, true)
  }
  const vault = position([
    ['c3', piece(0, 'vault')],
    ['d4', piece()],
  ])
  assert.ok(find(vault, 'c3', 'e5', 'vault'))
  assert.equal(count(applyMove(vault, find(vault, 'c3', 'e5', 'vault'))), 2)
  vault.board[idx('d4')] = null
  assert.ok(!find(vault, 'c3', 'e5', 'vault'))
  vault.board[idx('d4')] = piece(1)
  assert.ok(!find(vault, 'c3', 'e5', 'vault'))
  assert.ok(find(vault, 'c3', 'e5'))
})
test('king retreat overlap is explicit: ordinary move leaves power unused', () => {
  const s = position([['c3', piece(0, 'retreat', true)]])
  const ordinary = find(s, 'c3', 'd2'),
    power = find(s, 'c3', 'd2', 'retreat')
  assert.ok(ordinary)
  assert.ok(power)
  assert.equal(applyMove(s, ordinary).board[idx('d2')].used, false)
  const used = applyMove(s, power)
  assert.equal(used.board[idx('d2')].used, true)
  used.side = 0
  assert.ok(!getLegalMoves(used).some((m) => m.skill))
})
test('power promotes but ends turn even if its new position has a capture', () => {
  const s = position([
    ['b6', piece(0, 'sprint')],
    ['e7', piece(1)],
  ])
  const next = applyMove(s, find(s, 'b6', 'd8', 'sprint'))
  assert.equal(next.board[idx('d8')].king, true)
  assert.equal(next.side, 1)
  assert.equal(next.forcedPiece, null)
  assert.equal(next.quietMoves, 0)
  const p = position([
    ['c3', piece(0, 'sprint')],
    ['f6', piece(1)],
  ])
  const after = applyMove(p, find(p, 'c3', 'e5', 'sprint'))
  assert.equal(after.side, 1)
  assert.equal(after.forcedPiece, null)
})
test('a power is a legal escape from an otherwise blocked position; classic ignores powers', () => {
  const s = position([
    ['a7', piece(0, 'retreat')],
    ['b8', piece(1)],
  ])
  assert.equal(getLegalMoves(s).length, 1)
  assert.equal(getOutcome(s, 1), null)
  s.mode = 'classic'
  assert.equal(getOutcome(s, 1).winner, 1)
})
test('position key includes power/used/side in arena, ignores powers in classic; draws and win priority', () => {
  const s = position([
    ['c3', piece(0, 'slide')],
    ['f6', piece(1)],
  ])
  const key = positionKey(s)
  s.board[idx('c3')].used = true
  assert.notEqual(positionKey(s), key)
  s.mode = 'classic'
  const classicKey = positionKey(s)
  s.board[idx('c3')].used = false
  s.board[idx('c3')].power = 'retreat'
  assert.equal(positionKey(s), classicKey)
  s.side = 1
  assert.notEqual(positionKey(s), classicKey)
  assert.equal(getOutcome(s, 3).winner, null)
  s.quietMoves = 80
  assert.equal(getOutcome(s, 1).winner, null)
  s.board = Array(64).fill(null)
  assert.equal(getOutcome(s, 3).winner, 0)
})
test('quiet counter increments once per non-capture turn and resets for capture/promotion', () => {
  const s = position([
    ['c3', piece(0, 'slide')],
    ['h8', piece(1)],
  ])
  s.quietMoves = 79
  assert.equal(applyMove(s, find(s, 'c3', 'a3', 'slide')).quietMoves, 80)
  const capture = position([
    ['c3', piece()],
    ['d4', piece(1)],
    ['f6', piece(1)],
  ])
  capture.quietMoves = 79
  assert.equal(getCompleteTurns(capture)[0].state.quietMoves, 0)
})
test('AI searches full turns, honors powers, and never mutates input', () => {
  for (const mode of ['classic', 'arena']) {
    const s = createInitialState(mode)
    const before = JSON.stringify(s)
    for (const depth of [1, 2, 3]) {
      const choice = chooseComputerTurn(s, depth, () => 0)
      assert.ok(getCompleteTurns(s).some((t) => JSON.stringify(t) === JSON.stringify(choice)))
      assert.equal(JSON.stringify(s), before)
    }
  }
  const s = position([
    ['a7', piece(0, 'retreat')],
    ['b8', piece(1)],
  ])
  assert.equal(chooseComputerTurn(s, 1).sequence[0].skill, 'retreat')
  const chain = position([
    ['c3', piece()],
    ['d4', piece(1)],
    ['f6', piece(1)],
  ])
  assert.equal(chooseComputerTurn(chain, 2).sequence.length, 2)
  assert.equal(evaluatePosition(position([['c3', piece(0, 'slide')]]), 0), 114)
})
test('XP: capture + promotion + light victory stack, closed result cannot award twice', () => {
  const s = position(
    [
      ['b6', piece()],
      ['c7', piece(1)],
    ],
    'classic',
  )
  const result = playMove(createSession('classic', 0, s), find(s, 'b6', 'd8'))
  assert.equal(result.xp, 130)
  assert.equal(result.outcome.winner, 0)
  assert.throws(() => playMove(result, { from: idx('d8'), to: idx('c7') }))
})
test('mission awards once; multi-jump history shares turn number, repetition counts complete turns only', () => {
  const s = position(
    [
      ['a1', piece()],
      ['b2', piece(1)],
      ['d4', piece(1)],
      ['f6', piece(1)],
      ['h8', piece(1)],
    ],
    'classic',
  )
  let session = createSession('classic', 0, s)
  const moves = getCompleteTurns(s)[0].sequence
  assert.equal(moves.length, 3)
  session = playMove(session, moves[0])
  assert.equal(session.turn, 1)
  assert.equal(Object.keys(session.repetitions).length, 1)
  session = playMove(session, moves[1])
  session = playMove(session, moves[2])
  assert.equal(session.mission, 3)
  assert.equal(session.missionAwarded, true)
  assert.equal(session.xp, 60)
  assert.equal(session.turn, 2)
  assert.ok(session.history.every((h) => h.turn === 1))
  const fresh = createSession('arena', session.xp)
  assert.equal(fresh.xp, 60)
  assert.equal(fresh.mission, 0)
})
test('invalid storage XP is ignored', () => {
  for (const value of [
    null,
    undefined,
    NaN,
    Infinity,
    -1,
    1.5,
    '',
    'bad',
    'Infinity',
    '-30',
    '3.5',
    {},
    '9007199254740992',
  ])
    assert.equal(safeXp(value), 0)
  assert.equal(safeXp('124'), 124)
})

test('session detects the third actual occurrence including the starting position', () => {
  const state = position(
    [
      ['a1', piece(0, null, true)],
      ['h8', piece(1, null, true)],
    ],
    'classic',
  )
  let session = createSession('classic', 0, state)
  const cycle = [
    ['a1', 'b2'],
    ['h8', 'g7'],
    ['b2', 'a1'],
    ['g7', 'h8'],
  ]
  for (let round = 0; round < 2; round++) {
    for (const [from, to] of cycle) session = playMove(session, find(session.state, from, to))
    if (round === 0) assert.equal(session.outcome, null)
  }
  assert.equal(session.outcome.winner, null)
  assert.match(session.outcome.reason, /trzeci/)
  assert.equal(session.state.quietMoves, 8)
})

test('arena mission awards only once when a fourth different piece uses its power', () => {
  const entries = [
    ['a1', piece(0, 'slide')],
    ['a3', piece(0, 'slide')],
    ['a5', piece(0, 'slide')],
    ['a7', piece(0, 'slide')],
    ['h8', piece(1, null, true)],
  ]
  let session = createSession('arena', 0, position(entries))
  for (const [n, rank] of ['1', '3', '5', '7'].entries()) {
    session = playMove(session, find(session.state, `a${rank}`, `c${rank}`, 'slide'))
    assert.equal(session.mission, Math.min(n + 1, 3))
    assert.equal(session.xp, n >= 2 ? 30 : 0)
    if (n < 3)
      session = playMove(
        session,
        find(session.state, n % 2 === 0 ? 'h8' : 'g7', n % 2 === 0 ? 'g7' : 'h8'),
      )
  }
  assert.equal(session.xp, 30)
})

test('powers never wrap board edges or land on occupied fields', () => {
  for (const side of [0, 1])
    for (const power of ['sprint', 'retreat', 'slide', 'vault']) {
      for (const origin of ['a1', 'a7', 'h2', 'h8']) {
        const s = position([[origin, piece(side, power, true)]], 'arena', side)
        for (const move of getLegalMoves(s)) {
          assert.ok(move.to >= 0 && move.to < 64)
          assert.ok(Math.abs((move.to % 8) - (move.from % 8)) <= 2)
          assert.equal((Math.floor(move.to / 8) + (move.to % 8)) % 2, 1)
        }
      }
    }
  const s = position([
    ['c3', piece(0, 'slide')],
    ['a3', piece()],
    ['e3', piece(1)],
  ])
  assert.ok(!getLegalMoves(s).some((m) => m.skill === 'slide'))
})

test('a shorter capture branch is legal, but each chosen branch must finish', () => {
  const s = position([
    ['c3', piece()],
    ['b4', piece(1)],
    ['d4', piece(1)],
    ['f6', piece(1)],
  ])
  const turns = getCompleteTurns(s)
  assert.deepEqual(turns.map((t) => t.sequence.length).sort(), [1, 2])
  assert.ok(turns.every((t) => t.state.side === 1 && t.state.forcedPiece === null))
})
test(
  'complete simulated games preserve invariants and every AI action is legal',
  { timeout: 120000 },
  () => {
    let seed = 71
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 2 ** 32
    }
    for (const mode of ['classic', 'arena'])
      for (let game = 0; game < 4; game++) {
        let session = createSession(mode, 0, createInitialState(mode, random))
        for (let turn = 0; turn < 350 && !session.outcome; turn++) {
          const choice = chooseComputerTurn(session.state, 1, random)
          assert.ok(choice)
          for (const move of choice.sequence) {
            const before = count(session.state),
              previousSide = session.state.side
            session = playMove(session, move)
            assert.ok(count(session.state) <= before)
            session.state.board.forEach((p, i) => {
              if (p) assert.equal((Math.floor(i / 8) + (i % 8)) % 2, 1)
            })
            if (session.state.forcedPiece !== null) assert.equal(session.state.side, previousSide)
            else assert.notEqual(session.state.side, previousSide)
          }
          assert.deepEqual(session.state, choice.state)
        }
        assert.ok(session.outcome, `${mode} game ${game} should finish`)
      }
  },
)

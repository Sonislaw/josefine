/** Pure rules: no Vue, timers, storage or browser APIs. A move is one jump;
 * a complete turn may contain several jumps and is the unit searched by AI. */
export type Side = 0 | 1
export type Mode = 'arena' | 'classic'
export type Power = 'sprint' | 'retreat' | 'slide' | 'vault'
export interface Piece {
  side: Side
  king: boolean
  power: Power | null
  used: boolean
}
export interface GameState {
  board: (Piece | null)[]
  side: Side
  forcedPiece: number | null
  mode: Mode
  quietMoves: number
}
export interface Move {
  from: number
  to: number
  captureIndex?: number
  skill?: Power
}
export interface CompleteTurn {
  state: GameState
  sequence: Move[]
}
export interface Outcome {
  winner: Side | null
  reason: string
}
export const powers: Power[] = ['sprint', 'retreat', 'slide', 'vault']
export const coordinate = (i: number) => `${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}`
const row = (i: number) => Math.floor(i / 8)
const index = (r: number, c: number) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1)
const opposite = (side: Side): Side => (side === 0 ? 1 : 0)

export function createInitialState(mode: Mode, random = Math.random): GameState {
  const board: GameState['board'] = Array(64).fill(null)
  const bag = powers.flatMap((p) => [p, p, p])
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j]!, bag[i]!]
  }
  let n = 0
  for (let i = 0; i < 24; i++) {
    if ((row(i) + (i % 8)) % 2 !== 1) continue
    const power = mode === 'arena' ? bag[n++]! : null
    board[i] = { side: 1, king: false, power, used: false }
    board[63 - i] = { side: 0, king: false, power, used: false }
  }
  return { board, side: 0, forcedPiece: null, mode, quietMoves: 0 }
}

/** Geometric ordinary moves. getLegalMoves adds global capture priority. */
export function getPieceMoves(state: GameState, from: number, captureOnly = false): Move[] {
  const p = state.board[from]
  if (!p || p.side !== state.side) return []
  const moves: Move[] = []
  for (const dr of p.king ? [-1, 1] : [p.side === 0 ? -1 : 1]) {
    for (const dc of [-1, 1]) {
      const adjacent = index(row(from) + dr, (from % 8) + dc)
      const target = index(row(from) + dr * 2, (from % 8) + dc * 2)
      if (adjacent < 0) continue
      if (!captureOnly && !state.board[adjacent]) moves.push({ from, to: adjacent })
      if (state.board[adjacent]?.side === opposite(p.side) && target >= 0 && !state.board[target]) {
        moves.push({ from, to: target, captureIndex: adjacent })
      }
    }
  }
  return moves
}

function powerMoves(state: GameState, from: number): Move[] {
  const p = state.board[from]
  if (!p || p.used || !p.power || state.mode !== 'arena') return []
  const f = p.side === 0 ? -1 : 1
  const offsets =
    p.power === 'sprint'
      ? [
          [2 * f, -2],
          [2 * f, 2],
        ]
      : p.power === 'retreat'
        ? [
            [-f, -1],
            [-f, 1],
          ]
        : p.power === 'slide'
          ? [
              [0, -2],
              [0, 2],
            ]
          : [
              [-2, -2],
              [-2, 2],
              [2, -2],
              [2, 2],
            ]
  return offsets.flatMap(([dr, dc]) => {
    const to = index(row(from) + dr!, (from % 8) + dc!)
    if (to < 0 || state.board[to]) return []
    const middle = index(row(from) + dr! / 2, (from % 8) + dc! / 2)
    if (p.power === 'sprint' && state.board[middle]) return []
    if (p.power === 'vault' && state.board[middle]?.side !== p.side) return []
    return [{ from, to, skill: p.power! }]
  })
}

export function getLegalMoves(state: GameState): Move[] {
  if (state.forcedPiece !== null) return getPieceMoves(state, state.forcedPiece, true)
  const own = state.board.flatMap((p, i) => (p?.side === state.side ? [i] : []))
  const captures = own.flatMap((i) => getPieceMoves(state, i, true))
  if (captures.length) return captures
  return own.flatMap((i) => [...getPieceMoves(state, i), ...powerMoves(state, i)])
}
export const sameMove = (a: Move, b: Move) =>
  a.from === b.from && a.to === b.to && a.skill === b.skill && a.captureIndex === b.captureIndex

export function applyMove(state: GameState, move: Move): GameState {
  if (!getLegalMoves(state).some((m) => sameMove(m, move))) throw new Error('Niedozwolony ruch')
  const board = state.board.map((p) => (p ? { ...p } : null))
  const piece = board[move.from]!
  board[move.from] = null
  board[move.to] = piece
  if (move.captureIndex !== undefined) board[move.captureIndex] = null
  if (move.skill) piece.used = true
  const promoted = !piece.king && row(move.to) === (piece.side === 0 ? 0 : 7)
  if (promoted) piece.king = true
  const next: GameState = { ...state, board, forcedPiece: null }
  // Promotion terminates an American-checkers turn, even during a capture chain.
  if (move.captureIndex !== undefined && !promoted && getPieceMoves(next, move.to, true).length) {
    next.forcedPiece = move.to
    next.quietMoves = 0
    return next
  }
  next.side = opposite(state.side)
  next.quietMoves = move.captureIndex !== undefined || promoted ? 0 : state.quietMoves + 1
  return next
}

export function getCompleteTurns(state: GameState): CompleteTurn[] {
  return getLegalMoves(state).flatMap((move) => {
    const next = applyMove(state, move)
    return next.forcedPiece === null
      ? [{ state: next, sequence: [move] }]
      : getCompleteTurns(next).map((turn) => ({
          state: turn.state,
          sequence: [move, ...turn.sequence],
        }))
  })
}

export function positionKey(state: GameState): string {
  return (
    `${state.side}:${state.mode}:` +
    state.board
      .map((p) =>
        !p ? '.' : `${p.side}${+p.king}${state.mode === 'arena' ? `${p.power}${+p.used}` : ''}`,
      )
      .join('|')
  )
}

export function getOutcome(state: GameState, occurrences: number): Outcome | null {
  if (state.forcedPiece !== null) return null
  if (!getLegalMoves(state).length)
    return { winner: opposite(state.side), reason: 'Przeciwnik nie ma dozwolonego ruchu.' }
  if (occurrences >= 3) return { winner: null, reason: 'Ta sama pozycja wystąpiła po raz trzeci.' }
  if (state.quietMoves >= 80)
    return { winner: null, reason: '80 kolejnych ruchów bez bicia i promocji.' }
  return null
}

export function evaluatePosition(state: GameState, perspective: Side = 1): number {
  return state.board.reduce((score, p, i) => {
    if (!p) return score
    const value =
      (p.king ? 180 : 100) +
      (p.side === 1 ? row(i) : 7 - row(i)) * 3 +
      (state.mode === 'arena' && p.power && !p.used ? 8 : 0)
    return score + (p.side === perspective ? value : -value)
  }, 0)
}

export function chooseComputerTurn(
  state: GameState,
  depth: number,
  random = Math.random,
): CompleteTurn | null {
  const perspective = state.side
  function search(current: GameState, remaining: number, alpha: number, beta: number): number {
    const turns = getCompleteTurns(current)
    if (!turns.length) return current.side === perspective ? -10000 - remaining : 10000 + remaining
    if (remaining === 0) return evaluatePosition(current, perspective)
    const maximizing = current.side === perspective
    let best = maximizing ? -Infinity : Infinity
    for (const turn of turns) {
      const value = search(turn.state, remaining - 1, alpha, beta)
      best = maximizing ? Math.max(best, value) : Math.min(best, value)
      if (maximizing) alpha = Math.max(alpha, best)
      else beta = Math.min(beta, best)
      if (alpha >= beta) break
    }
    return best
  }
  let best: CompleteTurn | null = null
  let score = -Infinity
  for (const turn of getCompleteTurns(state)) {
    const value =
      search(turn.state, Math.max(0, Math.min(3, depth) - 1), -Infinity, Infinity) + random() * 2
    if (value > score) {
      score = value
      best = turn
    }
  }
  return best
}

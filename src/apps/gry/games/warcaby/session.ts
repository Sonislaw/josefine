import { applyMove, createInitialState, getOutcome, positionKey } from './engine'
import type { GameState, Mode, Move, Outcome } from './engine'

export interface HistoryEntry {
  move: Move
  turn: number
  side: 0 | 1
  promoted: boolean
}
export interface Session {
  state: GameState
  xp: number
  mission: number
  missionAwarded: boolean
  turn: number
  history: HistoryEntry[]
  repetitions: Record<string, number>
  outcome: Outcome | null
}
export function safeXp(value: unknown): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0
}
export function createSession(mode: Mode, xp = 0, state = createInitialState(mode)): Session {
  return {
    state,
    xp: safeXp(xp),
    mission: 0,
    missionAwarded: false,
    turn: 1,
    history: [],
    repetitions: { [positionKey(state)]: 1 },
    outcome: null,
  }
}
/** Awards and repetition bookkeeping are committed with the move, never by UI watchers. */
export function playMove(session: Session, move: Move): Session {
  if (session.outcome) throw new Error('Partia zakończona')
  const state = applyMove(session.state, move)
  const side = session.state.side
  const promoted = !session.state.board[move.from]!.king && state.board[move.to]!.king
  const captured = move.captureIndex !== undefined
  const mission = Math.min(
    3,
    session.mission + (side === 0 && (state.mode === 'arena' ? !!move.skill : captured) ? 1 : 0),
  )
  const missionAwarded = session.missionAwarded || mission === 3
  const repetitions = { ...session.repetitions }
  if (state.forcedPiece === null) {
    const key = positionKey(state)
    repetitions[key] = (repetitions[key] ?? 0) + 1
  }
  const outcome = getOutcome(state, repetitions[positionKey(state)] ?? 0)
  const bonus =
    (side === 0 ? (captured ? 10 : 0) + (promoted ? 20 : 0) : 0) +
    (!session.missionAwarded && missionAwarded ? 30 : 0) +
    (outcome?.winner === 0 ? 100 : 0)
  return {
    state,
    xp: Math.min(Number.MAX_SAFE_INTEGER, session.xp + bonus),
    mission,
    missionAwarded,
    turn: session.turn + (state.forcedPiece === null ? 1 : 0),
    history: [{ move, turn: session.turn, side, promoted }, ...session.history].slice(0, 5),
    repetitions,
    outcome,
  }
}

import { fullLines, hasMove, shapeById, type Round } from './engine'

export const SAVE_KEY = 'zgrana:gry:klocki:v1'
export interface SavedGame {
  version: 1
  round: Round | null
  best: number
  sound: boolean
}
interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
const integer = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
export function decodeRound(value: unknown): Round | null {
  if (!object(value)) return null
  const { board, tray, score, streak, lines, moves } = value
  if (!Array.isArray(board) || board.length !== 64 || !board.every((n) => integer(n) && n <= 6))
    return null
  if (
    !Array.isArray(tray) ||
    tray.length !== 3 ||
    !tray.some(Boolean) ||
    !tray.every((id) => id === null || (typeof id === 'string' && !!shapeById(id)))
  )
    return null
  if (
    ![score, streak, lines, moves].every(integer) ||
    (streak as number) > (moves as number) ||
    (lines as number) > (moves as number) * 16 ||
    fullLines(board).cells.length
  )
    return null
  const round = {
    board: [...board],
    tray: [...tray],
    score,
    streak,
    lines,
    moves,
    status: 'playing',
  } as Round
  round.status = hasMove(round) ? 'playing' : 'gameover'
  return round
}
export function decodeSave(raw: string | null): SavedGame {
  const empty: SavedGame = { version: 1, round: null, best: 0, sound: false }
  try {
    const value: unknown = raw ? JSON.parse(raw) : null
    if (!object(value) || value.version !== 1) return empty
    const round = decodeRound(value.round)
    return {
      version: 1,
      round,
      best: Math.max(integer(value.best) ? value.best : 0, round?.score ?? 0),
      sound: value.sound === true,
    }
  } catch {
    return empty
  }
}
export function load(storage: StoragePort) {
  try {
    return { ...decodeSave(storage.getItem(SAVE_KEY)), available: true }
  } catch {
    return { ...decodeSave(null), available: false }
  }
}
/** Save committed state immediately, never an in-progress drag or animation. */
export function save(storage: StoragePort, value: SavedGame) {
  let best = value.best
  try {
    best = Math.max(best, decodeSave(storage.getItem(SAVE_KEY)).best, value.round?.score ?? 0)
    storage.setItem(SAVE_KEY, JSON.stringify({ ...value, best }))
    return { best, available: true }
  } catch {
    return { best, available: false }
  }
}

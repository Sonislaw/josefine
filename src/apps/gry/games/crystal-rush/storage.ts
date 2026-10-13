export interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export const BEST_KEY = 'crystal-rush-best'
export const SOUND_KEY = 'crystal-rush-sound'
export function parseBest(raw: string | null): number {
  const number = raw?.trim() ? Number(raw) : 0
  return Number.isFinite(number) && number >= 0 ? number : 0
}
export function loadPreferences(storage: StoragePort) {
  try {
    return {
      best: parseBest(storage.getItem(BEST_KEY)),
      sound: storage.getItem(SOUND_KEY) === '1',
      available: true,
    }
  } catch {
    return { best: 0, sound: false, available: false }
  }
}
export function saveBest(
  storage: StoragePort,
  score: number,
): { best: number; available: boolean } {
  let best = score
  try {
    best = Math.max(score, parseBest(storage.getItem(BEST_KEY)))
    storage.setItem(BEST_KEY, String(best))
    return { best, available: true }
  } catch {
    return { best, available: false }
  }
}

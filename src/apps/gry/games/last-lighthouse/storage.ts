import type { HeroId } from './model'
export const SAVE_KEY = 'zgrana:gry:ostatnia-latarnia:v1'
export interface Preferences {
  version: 1
  unlocked: HeroId[]
  bestTime: number
  bestKills: number
  victories: number
  sound: boolean
}
interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export const defaults = (): Preferences => ({
  version: 1,
  unlocked: ['flame'],
  bestTime: 0,
  bestKills: 0,
  victories: 0,
  sound: false,
})
export function decode(raw: string | null): Preferences {
  try {
    const p = JSON.parse(raw ?? 'null')
    if (!p || p.version !== 1) return defaults()
    const valid = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0
    return {
      version: 1,
      unlocked: [
        'flame',
        ...(['storm', 'iron'] as HeroId[]).filter(
          (id) => Array.isArray(p.unlocked) && p.unlocked.includes(id),
        ),
      ],
      bestTime: valid(p.bestTime) ? p.bestTime : 0,
      bestKills: valid(p.bestKills) ? Math.floor(p.bestKills) : 0,
      victories: valid(p.victories) ? Math.floor(p.victories) : 0,
      sound: p.sound === true,
    }
  } catch {
    return defaults()
  }
}
export function load(port: StoragePort) {
  try {
    return { preferences: decode(port.getItem(SAVE_KEY)), available: true }
  } catch {
    return { preferences: defaults(), available: false }
  }
}
export function save(port: StoragePort, p: Preferences) {
  try {
    const old = decode(port.getItem(SAVE_KEY))
    const merged: Preferences = {
      ...p,
      unlocked: [...new Set([...old.unlocked, ...p.unlocked])],
      bestTime: Math.max(old.bestTime, p.bestTime),
      bestKills: Math.max(old.bestKills, p.bestKills),
      victories: Math.max(old.victories, p.victories),
    }
    port.setItem(SAVE_KEY, JSON.stringify(merged))
    return { preferences: merged, available: true }
  } catch {
    return { preferences: p, available: false }
  }
}

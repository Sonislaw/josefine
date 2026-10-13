import {
  BUILDINGS,
  KEYS,
  capacity,
  discovered,
  key,
  neighbors,
  terrain,
  type Kingdom,
} from './engine'
export const SAVE_KEY = 'zgrana:gry:male-krolestwo:v1'
interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LoadResult = {
  status: 'empty' | 'saved' | 'corrupt' | 'unavailable'
  state: Kingdom | null
  tutorialDismissed: boolean
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const coordinate = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Math.abs(v as number) <= Math.floor(Number.MAX_SAFE_INTEGER / 7) - 1
export function decode(raw: string): { state: Kingdom; tutorialDismissed: boolean } | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!object(data) || data.version !== 1 || !object(data.state)) return null
    const s = data.state
    if (
      !natural(s.seed) ||
      s.seed > 0xffffffff ||
      !natural(s.rng) ||
      s.rng > 0xffffffff ||
      !natural(s.turn) ||
      !natural(s.population) ||
      !natural(s.hunger)
    )
      return null
    if (
      !object(s.resources) ||
      !KEYS.every((k) => natural((s.resources as Record<string, unknown>)[k]))
    )
      return null
    if (
      !Array.isArray(s.sectors) ||
      !s.sectors.length ||
      !s.sectors.every((p) => object(p) && coordinate(p.x) && coordinate(p.y))
    )
      return null
    const sectors = s.sectors as Kingdom['sectors'],
      known = new Set(sectors.map((p) => key(p.x, p.y)))
    if (known.size !== sectors.length || !known.has('0,0')) return null
    // Reject disconnected islands without quadratic scans on large saved maps.
    const visited = new Set(['0,0']),
      queue = [{ x: 0, y: 0 }]
    for (let i = 0; i < queue.length; i++)
      for (const p of neighbors(queue[i]!)) {
        const k = key(p.x, p.y)
        if (known.has(k) && !visited.has(k)) {
          visited.add(k)
          queue.push(p)
        }
      }
    if (visited.size !== known.size) return null
    if (
      !Array.isArray(s.offer) ||
      s.offer.length !== 3 ||
      s.offer[0] !== 'farm' ||
      new Set(s.offer).size !== 3 ||
      !s.offer.every((k) => typeof k === 'string' && Object.hasOwn(BUILDINGS, k))
    )
      return null
    if (!object(s.buildings)) return null
    let halls = 0
    for (const [k, b] of Object.entries(s.buildings)) {
      if (
        !object(b) ||
        !coordinate(b.x) ||
        !coordinate(b.y) ||
        k !== key(b.x, b.y) ||
        !natural(b.level) ||
        b.level < 1 ||
        b.level > 3
      )
        return null
      if (typeof b.kind !== 'string' || (b.kind !== 'hall' && !Object.hasOwn(BUILDINGS, b.kind)))
        return null
      if (b.kind === 'hall') {
        if (k !== '3,3' || b.level !== 1) return null
        halls++
      }
      if (
        !discovered(s as unknown as Kingdom, { x: b.x, y: b.y }) ||
        terrain(s.seed, b.x, b.y) !== 'meadow'
      )
        return null
    }
    if (
      halls !== 1 ||
      s.population > capacity(s as unknown as Kingdom) ||
      s.hunger > s.turn ||
      s.status !== (s.population === 0 ? 'gameover' : 'playing')
    )
      return null
    return { state: s as unknown as Kingdom, tutorialDismissed: data.tutorialDismissed === true }
  } catch {
    return null
  }
}
export function load(storage: StoragePort): LoadResult {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (raw === null) return { status: 'empty', state: null, tutorialDismissed: false }
    const result = decode(raw)
    return result
      ? { status: 'saved', ...result }
      : { status: 'corrupt', state: null, tutorialDismissed: false }
  } catch {
    return { status: 'unavailable', state: null, tutorialDismissed: false }
  }
}
export function save(storage: StoragePort, state: Kingdom, tutorialDismissed: boolean): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, state, tutorialDismissed }))
    return true
  } catch {
    return false
  }
}

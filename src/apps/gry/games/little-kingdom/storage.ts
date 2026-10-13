import {
  BUILDINGS,
  KEYS,
  capacity,
  discovered,
  key,
  neighbors,
  sectorOf,
  terrain,
  type Kingdom,
} from './engine'
import { DISCOVERIES, blocksBuilding, discoveryForSector, type Discovery } from './discoveries'
export const SAVE_KEY = 'zgrana:gry:male-krolestwo:v3'
export const PREVIOUS_KEY = 'zgrana:gry:male-krolestwo:v2'
export const LEGACY_KEY = 'zgrana:gry:male-krolestwo:v1'
interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type LoadResult = {
  status: 'empty' | 'saved' | 'corrupt' | 'unavailable'
  state: Kingdom | null
  tutorialDismissed: boolean
  migrationSaveFailed?: boolean
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const coordinate = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Math.abs(v as number) <= Math.floor(Number.MAX_SAFE_INTEGER / 7) - 1
export function decode(
  raw: string,
  version: 1 | 2 | 3 = 3,
): { state: Kingdom; tutorialDismissed: boolean } | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!object(data) || data.version !== version || !object(data.state)) return null
    const s = data.state
    // Migration adds progression only. It neither awards gifts nor advances simulation.
    if (version < 3) {
      s.rank = 0
      s.promotions = []
    }
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
      !natural(s.rank) ||
      s.rank > 3 ||
      !Array.isArray(s.promotions) ||
      s.promotions.length !== s.rank
    )
      return null
    let previousTurn = 0
    for (const [i, p] of s.promotions.entries()) {
      if (
        !object(p) ||
        p.rank !== i + 1 ||
        !natural(p.turn) ||
        p.turn <= previousTurn ||
        p.turn > s.turn
      )
        return null
      previousTurn = p.turn
    }
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
    // Old sectors deliberately stay as they were. Never backfill onto existing buildings.
    if (version === 1) s.discoveries = {}
    if (!object(s.discoveries)) return null
    const discoverySectors = new Set<string>()
    for (const [k, d] of Object.entries(s.discoveries)) {
      if (
        !object(d) ||
        !coordinate(d.x) ||
        !coordinate(d.y) ||
        k !== key(d.x, d.y) ||
        typeof d.kind !== 'string' ||
        !Object.hasOwn(DISCOVERIES, d.kind) ||
        !natural(d.discoveredTurn) ||
        d.discoveredTurn < 1 ||
        d.discoveredTurn > s.turn ||
        !['available', 'used'].includes(d.status as string)
      )
        return null
      const sector = sectorOf({ x: d.x, y: d.y }),
        sectorKey = key(sector.x, sector.y)
      if (!known.has(sectorKey) || discoverySectors.has(sectorKey)) return null
      discoverySectors.add(sectorKey)
      const expected = discoveryForSector(s.seed, sector, d.discoveredTurn)
      if (!expected || expected.kind !== d.kind || expected.x !== d.x || expected.y !== d.y)
        return null
      if (
        d.status === 'available'
          ? d.usedTurn !== null
          : !natural(d.usedTurn) || d.usedTurn <= d.discoveredTurn || d.usedTurn > s.turn
      )
        return null
      if (s.buildings[k] && blocksBuilding(d as unknown as Discovery)) return null
    }
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
    // Presence wins over validity: never silently resurrect an older settlement.
    for (const [key, version] of [
      [SAVE_KEY, 3],
      [PREVIOUS_KEY, 2],
      [LEGACY_KEY, 1],
    ] as const) {
      const raw = storage.getItem(key)
      if (raw === null) continue
      const result = decode(raw, version)
      if (!result) return { status: 'corrupt', state: null, tutorialDismissed: false }
      if (version < 3) {
        const written = save(storage, result.state, result.tutorialDismissed)
        return { status: 'saved', ...result, migrationSaveFailed: !written }
      }
      return { status: 'saved', ...result }
    }
    return { status: 'empty', state: null, tutorialDismissed: false }
  } catch {
    return { status: 'unavailable', state: null, tutorialDismissed: false }
  }
}
export function save(storage: StoragePort, state: Kingdom, tutorialDismissed: boolean): boolean {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 3, state, tutorialDismissed }))
    return true
  } catch {
    return false
  }
}

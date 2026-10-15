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
import { REQUESTS, REQUEST_IDS, emptyRequests } from './requests'
import { emptyAffairs, settlementPosition } from './neighbours'
import { militaryBuilding, WAR } from './military'
import { castleAppears } from './castles'
import { depositCapacity } from './deposits'
import { migrateCastles, validateCampaign } from './campaign-storage'
import {
  migrateWarfare,
  validateLegacyCampaign,
  type LegacyKingdom,
} from './legacy-campaign-storage'
export const SAVE_KEY = 'zgrana:gry:male-krolestwo:v8'
export const CASTLES_KEY = 'zgrana:gry:male-krolestwo:v7'
export const CAMPAIGN_KEY = 'zgrana:gry:male-krolestwo:v6'
export const WARFARE_KEY = 'zgrana:gry:male-krolestwo:v5'
export const REQUESTS_KEY = 'zgrana:gry:male-krolestwo:v4'
export const PROGRESSION_KEY = 'zgrana:gry:male-krolestwo:v3'
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
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 8,
): { state: Kingdom; tutorialDismissed: boolean } | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (!object(data) || data.version !== version || !object(data.state)) return null
    const s = data.state
    if (version < 5) {
      const f = emptyAffairs()
      s.affairs = { army: f.army, settlements: [], raid: null, protectedUntil: 0, enemy: null }
    }
    if (version < 4) s.requests = emptyRequests()
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
      !object(s.requests) ||
      !natural(s.requests.cursor) ||
      s.requests.cursor >= REQUEST_IDS.length ||
      !Array.isArray(s.requests.completed) ||
      s.requests.completed.length > REQUEST_IDS.length
    )
      return null
    const isRequestId = (id: unknown): id is keyof typeof REQUESTS =>
      typeof id === 'string' && Object.hasOwn(REQUESTS, id)
    const completedIds = new Set<string>()
    let previousRequestTurn = 0
    for (const c of s.requests.completed) {
      if (
        !object(c) ||
        !isRequestId(c.id) ||
        completedIds.has(c.id) ||
        !natural(c.acceptedTurn) ||
        !natural(c.turn) ||
        c.turn <= c.acceptedTurn ||
        c.turn <= previousRequestTurn ||
        c.turn > s.turn ||
        REQUESTS[c.id].minRank > s.rank
      )
        return null
      completedIds.add(c.id)
      previousRequestTurn = c.turn
    }
    const active = s.requests.active
    if (
      active !== null &&
      (!object(active) ||
        !isRequestId(active.id) ||
        completedIds.has(active.id) ||
        !natural(active.acceptedTurn) ||
        active.acceptedTurn > s.turn ||
        REQUESTS[active.id].minRank > s.rank)
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
    // Existing saves start with full deposits. Migration consumes no turn or resources.
    if (version < 8) s.deposits = {}
    if (!object(s.deposits)) return null
    for (const [k, amount] of Object.entries(s.deposits)) {
      const parts = k.split(',')
      const p = { x: Number(parts[0]), y: Number(parts[1]) }
      if (
        parts.length !== 2 ||
        !coordinate(p.x) ||
        !coordinate(p.y) ||
        k !== key(p.x, p.y) ||
        !natural(amount) ||
        !known.has(key(sectorOf(p).x, sectorOf(p).y))
      )
        return null
      const capacity = depositCapacity({ seed: s.seed }, p)
      if (!capacity || amount > capacity) return null
    }
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
      !s.offer.every(
        (k) => typeof k === 'string' && Object.hasOwn(BUILDINGS, k) && !militaryBuilding(k),
      )
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
      if (b.damaged !== undefined && typeof b.damaged !== 'boolean') return null
      if (b.damaged && (b.kind === 'hall' || b.kind === 'house' || militaryBuilding(b.kind)))
        return null
      if (
        militaryBuilding(b.kind) &&
        (version < 5 || (version === 5 && b.level !== 1) || s.rank < b.level)
      )
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
    const f = s.affairs
    if (
      !object(f) ||
      !object(f.army) ||
      !natural(f.army.spearman) ||
      !natural(f.army.archer) ||
      (version < 6 && f.army.spearman + f.army.archer > WAR.capacity) ||
      !Array.isArray(f.settlements) ||
      (version < 7 && f.settlements.length > 3) ||
      !natural(f.protectedUntil)
    )
      return null
    const buildings = Object.values(s.buildings) as unknown as Kingdom['buildings'][string][]
    for (const kind of ['barracks', 'watchtower'])
      if (buildings.filter((b) => b.kind === kind).length > 1) return null
    if (f.army.spearman + f.army.archer > 0 && !buildings.some((b) => b.kind === 'barracks'))
      return null
    const occupiedSectors = new Set<string>()
    let contactTurn = 0
    for (const [i, c] of f.settlements.entries()) {
      if (
        !object(c) ||
        c.id !== i ||
        !coordinate(c.x) ||
        !coordinate(c.y) ||
        !natural(c.discoveredTurn) ||
        c.discoveredTurn <= contactTurn ||
        c.discoveredTurn > s.turn ||
        typeof c.giftTaken !== 'boolean' ||
        s.rank < 1
      )
        return null
      if (
        i === 0
          ? c.relation !== 'friendly'
          : i === 1
            ? c.relation !== (c.giftTaken ? 'friendly' : 'neutral')
            : !(
                version < 6
                  ? ['hostile', 'subdued']
                  : version < 7
                    ? ['hostile', 'peaceful']
                    : ['hostile', 'peaceful', 'ruins']
              ).includes(c.relation as string) || c.giftTaken
      )
        return null
      const sector = sectorOf({ x: c.x, y: c.y }),
        sk = key(sector.x, sector.y)
      const d = discoveryForSector(s.seed, sector, c.discoveredTurn)
      if (version >= 7 && i >= 3 && !castleAppears(s.seed, sector)) return null
      if (!d || !known.has(sk) || occupiedSectors.has(sk) || s.buildings[key(c.x, c.y)]) return null
      const storedDiscovery = (s.discoveries as Record<string, Discovery>)[key(d.x, d.y)]
      if (!storedDiscovery || storedDiscovery.discoveredTurn !== c.discoveredTurn) return null
      const p = settlementPosition(s.seed, sector, d)
      if (p.x !== c.x || p.y !== c.y) return null
      occupiedSectors.add(sk)
      contactTurn = c.discoveredTurn
    }
    const hostile = f.settlements[2] as Record<string, unknown> | undefined
    if (version < 6 && !hostile) {
      if (f.raid !== null || f.protectedUntil !== 0) return null
    } else if (version < 6 && hostile) {
      if (
        f.protectedUntil < (hostile.discoveredTurn as number) + WAR.protection ||
        f.protectedUntil > s.turn + WAR.protection
      )
        return null
      if (f.raid !== null) {
        if (
          !object(f.raid) ||
          hostile.relation !== 'hostile' ||
          !natural(f.raid.announcedTurn) ||
          !natural(f.raid.dueTurn) ||
          f.raid.announcedTurn < f.protectedUntil ||
          f.raid.announcedTurn > s.turn ||
          f.raid.dueTurn !== f.raid.announcedTurn + WAR.warning ||
          f.raid.dueTurn <= s.turn
        )
          return null
      }
    }
    let state: Kingdom
    if (version < 7) {
      let legacy = s as unknown as LegacyKingdom
      if (version < 6) legacy = migrateWarfare(legacy)
      if (!validateLegacyCampaign(legacy)) return null
      state = migrateCastles(legacy)
    } else state = s as unknown as Kingdom
    if (!validateCampaign(state)) return null
    return { state, tutorialDismissed: data.tutorialDismissed === true }
  } catch {
    return null
  }
}
export function load(storage: StoragePort): LoadResult {
  try {
    // Presence wins over validity: never silently resurrect an older settlement.
    for (const [key, version] of [
      [SAVE_KEY, 8],
      [CASTLES_KEY, 7],
      [CAMPAIGN_KEY, 6],
      [WARFARE_KEY, 5],
      [REQUESTS_KEY, 4],
      [PROGRESSION_KEY, 3],
      [PREVIOUS_KEY, 2],
      [LEGACY_KEY, 1],
    ] as const) {
      const raw = storage.getItem(key)
      if (raw === null) continue
      const result = decode(raw, version)
      if (!result) return { status: 'corrupt', state: null, tutorialDismissed: false }
      if (version < 8) {
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
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 8, state, tutorialDismissed }))
    return true
  } catch {
    return false
  }
}

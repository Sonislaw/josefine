/** Pure, deterministic rules. Preview and commit both call resolveTurn; no browser state here. */
import { SIZE, terrain, type Terrain } from './terrain'
import {
  MILITARY,
  UNITS,
  TACTICS,
  WAR,
  militaryBuilding,
  armySize,
  upkeep,
  removeUnits,
  type Unit,
  type Army,
  type Tactic,
} from './military'
import {
  SETTLEMENTS,
  emptyAffairs,
  settlementAt,
  settlementPosition,
  type ForeignAffairs,
} from './neighbours'
import { battle, type BattleReport } from './battle'
import { RANKS, earnedPromotion, type Promotion, type SettlementRank } from './progression'
import {
  REQUESTS,
  emptyRequests,
  completedRequest,
  type CompletedRequest,
  type ResidentRequests,
} from './requests'
import {
  DISCOVERIES,
  blocksBuilding,
  discoveryForSector,
  discoveryBonus,
  type Discovery,
} from './discoveries'
export { SIZE, terrain, type Terrain } from './terrain'
export type Resource = 'wood' | 'stone' | 'food' | 'gold'
export type Resources = Record<Resource, number>
export type BuildingKind =
  | 'house'
  | 'farm'
  | 'sawmill'
  | 'quarry'
  | 'mill'
  | 'market'
  | 'orchard'
  | 'barracks'
  | 'watchtower'
export type Point = { x: number; y: number }
export type Building = Point & { kind: BuildingKind | 'hall'; level: number; damaged?: boolean }
export interface Kingdom {
  affairs: ForeignAffairs
  requests: ResidentRequests
  rank: SettlementRank
  promotions: Promotion[]
  seed: number
  rng: number
  sectors: Point[]
  buildings: Record<string, Building>
  discoveries: Record<string, Discovery>
  resources: Resources
  population: number
  hunger: number
  turn: number
  offer: BuildingKind[]
  status: 'playing' | 'gameover'
}
export type Action = (
  | ({ type: 'build'; kind: BuildingKind } & Point)
  | ({ type: 'upgrade' | 'demolish' | 'explore' | 'landmark' | 'repair' } & Point)
  | { type: 'gather' }
  | { type: 'recruit' | 'dismiss'; unit: Unit }
  | { type: 'diplomacy'; id: number }
  | { type: 'truce' }
  | { type: 'expedition'; army: Army }
) & { tactic?: Tactic }
export const KEYS: Resource[] = ['wood', 'stone', 'food', 'gold']
export const RESOURCE_NAMES: Record<Resource, string> = {
  wood: 'Drewno',
  stone: 'Kamień',
  food: 'Żywność',
  gold: 'Monety',
}
export const TERRAIN_NAMES: Record<Terrain, string> = {
  meadow: 'Łąka',
  forest: 'Las',
  rock: 'Skały',
  water: 'Woda',
}
export const SEASONS = ['Wiosna', 'Lato', 'Jesień', 'Zima']
export const zero = (): Resources => ({ wood: 0, stone: 0, food: 0, gold: 0 })
const cost = (wood = 0, stone = 0, gold = 0): Resources => ({ wood, stone, food: 0, gold })
export const BUILDINGS: Record<
  BuildingKind,
  { name: string; cost: Resources; description: string }
> = {
  ...MILITARY,
  house: {
    name: 'Dom',
    cost: cost(8, 2),
    description:
      '+3 miejsca na poziom. Mieszkańcy przybywają na koniec pory roku, jeśli masz zapasy.',
  },
  farm: {
    name: 'Farma',
    cost: cost(5),
    description:
      '4 żywności +1 przy wodzie. Sąsiedni młyn daje +2 za swój poziom. Zimą połowa plonów.',
  },
  sawmill: {
    name: 'Tartak',
    cost: cost(6, 2),
    description: '2 drewna +1 za każde sąsiadujące pole lasu, razy poziom.',
  },
  quarry: {
    name: 'Kamieniołom',
    cost: cost(8),
    description: '2 kamienia +1 za każde sąsiadujące pole skał, razy poziom.',
  },
  mill: {
    name: 'Młyn',
    cost: cost(10, 5),
    description: '+2 żywności na poziom dla każdej sąsiedniej farmy. Bonusy młynów sumują się.',
  },
  market: {
    name: 'Targ',
    cost: cost(8, 4),
    description: '2 monety +1 za każdy sąsiadujący dom, razy poziom.',
  },
  orchard: {
    name: 'Sad',
    cost: cost(6, 0, 3),
    description: '2 żywności, jesienią 4, razy poziom. Zimą połowa plonów.',
  },
}
export const key = (x: number, y: number) => `${x},${y}`
export const neighbors = ({ x, y }: Point): Point[] => [
  { x: x - 1, y },
  { x: x + 1, y },
  { x, y: y - 1 },
  { x, y: y + 1 },
]
export const season = (turn: number) => Math.floor((turn % 12) / 3)
export const year = (turn: number) => Math.floor(turn / 12) + 1
export const sectorOf = ({ x, y }: Point): Point => ({
  x: Math.floor(x / SIZE),
  y: Math.floor(y / SIZE),
})
export const capacity = (state: Kingdom) =>
  5 + Object.values(state.buildings).reduce((n, b) => n + (b.kind === 'house' ? b.level * 3 : 0), 0)
export const hasSector = (state: Kingdom, p: Point) =>
  state.sectors.some((s) => s.x === p.x && s.y === p.y)
export const discovered = (state: Kingdom, p: Point) => hasSector(state, sectorOf(p))
function random(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0
}
export function deal(seed: number) {
  const kinds = (Object.keys(BUILDINGS) as BuildingKind[]).filter(
    (k) => k !== 'farm' && !militaryBuilding(k),
  )
  const r1 = random(seed),
    first = kinds.splice(r1 % kinds.length, 1)[0]!
  const r2 = random(r1),
    second = kinds[r2 % kinds.length]!
  return { rng: r2, offer: ['farm', first, second] as BuildingKind[] }
}
export function newKingdom(seed = 1): Kingdom {
  return {
    affairs: emptyAffairs(),
    requests: emptyRequests(),
    rank: 0,
    promotions: [],
    seed: seed >>> 0,
    ...deal(seed >>> 0),
    sectors: [{ x: 0, y: 0 }],
    buildings: { '3,3': { x: 3, y: 3, kind: 'hall', level: 1 } },
    discoveries: {},
    resources: { wood: 20, stone: 12, food: 24, gold: 10 },
    population: 3,
    hunger: 0,
    turn: 0,
    status: 'playing',
  }
}
export function frontier(state: Kingdom): Point[] {
  const known = new Set(state.sectors.map((p) => key(p.x, p.y)))
  const result = new Map<string, Point>()
  for (const s of state.sectors)
    for (const p of neighbors(s)) if (!known.has(key(p.x, p.y))) result.set(key(p.x, p.y), p)
  return [...result.values()]
}
export function explorationCost(state: Kingdom): Resources {
  const n = state.sectors.length - 1
  return cost(10 + n * 5, 5 + n * 3, 5 + n * 3)
}
export function actionCost(state: Kingdom, action: Action): Resources {
  if (action.type === 'recruit') return UNITS[action.unit]?.cost ?? zero()
  if (action.type === 'truce') return WAR.truce
  if (action.type === 'diplomacy') return SETTLEMENTS[action.id]?.cost ?? zero()
  if (action.type === 'repair') {
    const b = state.buildings[key(action.x, action.y)]
    return b && b.kind !== 'hall'
      ? (Object.fromEntries(
          KEYS.map((k) => [k, Math.ceil(BUILDINGS[b.kind as BuildingKind].cost[k] / 2)]),
        ) as Resources)
      : zero()
  }
  if (action.type === 'landmark') {
    const d = state.discoveries[key(action.x, action.y)]
    return d ? DISCOVERIES[d.kind].cost : zero()
  }
  if (action.type === 'build') return BUILDINGS[action.kind]?.cost ?? zero()
  if (action.type === 'explore') return explorationCost(state)
  if (action.type === 'upgrade') {
    const b = state.buildings[key(action.x, action.y)]
    if (b && b.kind !== 'hall')
      return Object.fromEntries(
        KEYS.map((k) => [k, BUILDINGS[b.kind as BuildingKind].cost[k] * (b.level + 1)]),
      ) as Resources
  }
  return zero()
}
export function actionError(state: Kingdom, action: Action): string | null {
  if (state.status !== 'playing') return 'Ta osada opustoszała. Rozpocznij nową rozgrywkę.'
  if (action.tactic !== undefined && !Object.hasOwn(TACTICS, action.tactic))
    return 'Nieznana taktyka.'
  if (
    ![
      'build',
      'upgrade',
      'demolish',
      'explore',
      'landmark',
      'repair',
      'gather',
      'recruit',
      'dismiss',
      'diplomacy',
      'truce',
      'expedition',
    ].includes(action.type)
  )
    return 'Nieznana akcja.'
  if (
    ['build', 'upgrade', 'demolish', 'explore', 'landmark', 'repair'].includes(action.type) &&
    (!('x' in action) || !('y' in action))
  )
    return 'Nieprawidłowe pole.'
  if (action.type === 'recruit' || action.type === 'dismiss') {
    if (!Object.hasOwn(UNITS, action.unit)) return 'Nieznana jednostka.'
    if (
      action.type === 'recruit' &&
      (!Object.values(state.buildings).some((b) => b.kind === 'barracks') ||
        armySize(state.affairs.army) >= WAR.capacity)
    )
      return 'Rekrutacja wymaga koszar i wolnego miejsca (limit 6).'
    if (action.type === 'dismiss' && state.affairs.army[action.unit] < 1)
      return 'Nie masz takiej jednostki.'
  }
  if (action.type === 'diplomacy') {
    const s = state.affairs.settlements.find((s) => s.id === action.id)
    if (!s || s.id > 1 || s.giftTaken) return 'Ta wymiana nie jest dostępna.'
  }
  if (action.type === 'truce' || action.type === 'expedition') {
    if (!state.affairs.settlements.some((s) => s.relation === 'hostile'))
      return 'Nie masz wrogiej osady.'
    if (action.type === 'expedition') {
      if (state.affairs.raid) return 'Najpierw odeprzyj najazd lub opłać rozejm.'
      if (
        !action.army ||
        !(['spearman', 'archer'] as const).every(
          (u) =>
            Number.isSafeInteger(action.army[u]) &&
            action.army[u] >= 0 &&
            action.army[u] <= state.affairs.army[u],
        ) ||
        armySize(action.army) < 1
      )
        return 'Wybierz dostępny oddział na wyprawę.'
    }
  }
  if ('x' in action) {
    if (!Number.isSafeInteger(action.x) || !Number.isSafeInteger(action.y))
      return 'Nieprawidłowe pole.'
    if (action.type === 'explore') {
      if (hasSector(state, action) || !neighbors(action).some((p) => hasSector(state, p)))
        return 'Wybierz nieodkryty sektor przy granicy królestwa.'
    } else {
      if (!discovered(state, action)) return 'Najpierw odkryj ten teren.'
      const b = state.buildings[key(action.x, action.y)]
      const d = state.discoveries[key(action.x, action.y)]
      if (action.type === 'landmark') {
        if (!d || d.status !== 'available') return 'To miejsce nie czeka na zbadanie.'
      } else if (action.type === 'build') {
        if (settlementAt(state, action)) return 'To pole należy do sąsiedniej osady.'
        if (blocksBuilding(d))
          return 'To pole zajmuje wyjątkowe miejsce. Wybierz je, aby poznać dostępne działania.'
        if (
          !Object.hasOwn(BUILDINGS, action.kind) ||
          (!militaryBuilding(action.kind) && !state.offer.includes(action.kind))
        )
          return 'Tego budynku nie ma w bieżącej ofercie.'
        if (
          militaryBuilding(action.kind) &&
          (state.rank < 1 || Object.values(state.buildings).some((b) => b.kind === action.kind))
        )
          return 'Obrona wymaga rangi Wioska. Możesz mieć po jednym budynku wojskowym.'
        if (b || terrain(state.seed, action.x, action.y) !== 'meadow')
          return 'Budować można tylko na pustej łące.'
      } else {
        if (!b || b.kind === 'hall') return 'Wybierz budynek inny niż ratusz.'
        if (action.type === 'repair' && !b.damaged) return 'Ten budynek nie wymaga naprawy.'
        if (action.type === 'upgrade' && (b.damaged || militaryBuilding(b.kind)))
          return 'Tego budynku nie można teraz ulepszyć.'
        if (action.type === 'demolish' && b.kind === 'barracks' && armySize(state.affairs.army))
          return 'Najpierw rozwiąż armię.'
        if (action.type === 'upgrade' && b.level >= 3) return 'Budynek ma już najwyższy poziom.'
        if (
          action.type === 'demolish' &&
          b.kind === 'house' &&
          capacity(state) - b.level * 3 < state.population
        )
          return 'Ten dom jest potrzebny mieszkańcom. Zapewnij najpierw inne miejsca.'
      }
    }
  }
  const price = actionCost(state, action)
  const missing = KEYS.filter((k) => price[k] > state.resources[k])
  return missing.length
    ? `Brakuje zasobów: ${missing.map((k) => `${RESOURCE_NAMES[k].toLowerCase()} ${price[k] - state.resources[k]}`).join(', ')}.`
    : null
}
/** The same per-building report drives both UI explanations and the economy. */
export function buildingProduction(state: Kingdom, b: Building): Resources {
  if (b.damaged || militaryBuilding(b.kind)) return zero()
  const r = zero(),
    adjacent = neighbors(b).filter((p) => discovered(state, p))
  const countTerrain = (t: Terrain) =>
    adjacent.filter((p) => terrain(state.seed, p.x, p.y) === t).length
  if (b.kind === 'hall') return { wood: 1, food: 2, stone: 0, gold: 1 }
  if (b.kind === 'farm') {
    const mills = adjacent.reduce((n, p) => {
      const a = state.buildings[key(p.x, p.y)]
      return n + (a?.kind === 'mill' && !a.damaged ? a.level * 2 : 0)
    }, 0)
    r.food = (4 + (countTerrain('water') ? 1 : 0) + mills) * b.level
  }
  if (b.kind === 'sawmill') r.wood = (2 + countTerrain('forest')) * b.level
  if (b.kind === 'quarry') r.stone = (2 + countTerrain('rock')) * b.level
  if (b.kind === 'market')
    r.gold =
      (2 + adjacent.filter((p) => state.buildings[key(p.x, p.y)]?.kind === 'house').length) *
      b.level
  if (b.kind === 'orchard') r.food = (season(state.turn) === 2 ? 4 : 2) * b.level
  const bonus = discoveryBonus(state, b)
  if (bonus) r[bonus.resource]++
  if (season(state.turn) === 3 && (b.kind === 'farm' || b.kind === 'orchard'))
    r.food = Math.floor(r.food / 2)
  return r
}
export function production(state: Kingdom): Resources {
  const result = zero()
  for (const b of Object.values(state.buildings)) {
    const r = buildingProduction(state, b)
    for (const k of KEYS) result[k] += r[k]
  }
  return result
}
export interface TurnResult {
  battle: BattleReport | null
  armyFood: number
  deserters: Army
  diplomaticReward: Resources
  completedRequest: CompletedRequest | null
  requestReward: Resources
  promotion: Promotion | null
  promotionGift: Resources
  state: Kingdom
  cost: Resources
  produced: Resources
  delta: Resources
  shortage: boolean
  populationChange: number
  reward: Resources
  discovery: Discovery | null
}
export function resolveTurn(state: Kingdom, action: Action): TurnResult | null {
  if (actionError(state, action)) return null
  const price = actionCost(state, action)
  const next: Kingdom = {
    ...state,
    affairs: {
      ...state.affairs,
      army: { ...state.affairs.army },
      settlements: state.affairs.settlements.map((s) => ({ ...s })),
      raid: state.affairs.raid ? { ...state.affairs.raid } : null,
    },
    requests: { ...state.requests, completed: [...state.requests.completed] },
    promotions: [...state.promotions],
    resources: { ...state.resources },
    buildings: { ...state.buildings },
    discoveries: { ...state.discoveries },
    sectors: [...state.sectors],
    offer: [...state.offer],
  }
  for (const k of KEYS) next.resources[k] -= price[k]
  if (action.type === 'build') {
    next.buildings[key(action.x, action.y)] = {
      x: action.x,
      y: action.y,
      kind: action.kind,
      level: 1,
    }
    if (!militaryBuilding(action.kind)) Object.assign(next, deal(state.rng))
  }
  if (action.type === 'repair') {
    const k = key(action.x, action.y)
    next.buildings[k] = { ...next.buildings[k]!, damaged: false }
  }
  if (action.type === 'upgrade') {
    const k = key(action.x, action.y)
    next.buildings[k] = { ...next.buildings[k]!, level: next.buildings[k]!.level + 1 }
  }
  if (action.type === 'demolish') {
    const k = key(action.x, action.y),
      b = next.buildings[k]!
    for (const r of KEYS)
      next.resources[r] += b.damaged ? 0 : Math.floor(BUILDINGS[b.kind as BuildingKind].cost[r] / 2)
    delete next.buildings[k]
  }
  let discovery: Discovery | null = null
  const reward = zero()
  if (action.type === 'explore') {
    next.sectors.push({ x: action.x, y: action.y })
    discovery = discoveryForSector(state.seed, action, state.turn + 1)
    if (discovery) next.discoveries[key(discovery.x, discovery.y)] = discovery
    if (state.rank >= 1 && next.affairs.settlements.length < 3 && discovery) {
      const id = next.affairs.settlements.length
      next.affairs.settlements.push({
        ...settlementPosition(state.seed, action, discovery),
        id,
        discoveredTurn: state.turn + 1,
        relation: id === 0 ? 'friendly' : id === 1 ? 'neutral' : 'hostile',
        giftTaken: false,
      })
      if (id === 2) next.affairs.protectedUntil = state.turn + 1 + WAR.protection
    }
  }
  if (action.type === 'landmark') {
    const k = key(action.x, action.y),
      d = next.discoveries[k]!
    next.discoveries[k] = { ...d, status: 'used', usedTurn: state.turn + 1 }
    Object.assign(reward, DISCOVERIES[d.kind].reward)
    for (const k of KEYS) next.resources[k] += reward[k]
  }
  if (action.type === 'gather') {
    next.resources.food += 3
    next.resources.wood += 2
  }
  if (action.type === 'recruit') next.affairs.army[action.unit]++
  if (action.type === 'dismiss') next.affairs.army[action.unit]--
  const diplomaticReward = zero()
  if (action.type === 'diplomacy') {
    const s = next.affairs.settlements.find((s) => s.id === action.id)!
    s.giftTaken = true
    s.relation = 'friendly'
    Object.assign(diplomaticReward, SETTLEMENTS[s.id]!.reward)
  }
  if (action.type === 'truce') {
    next.affairs.raid = null
    next.affairs.protectedUntil = state.turn + 1 + WAR.protection
  }
  let report: BattleReport | null = null
  const defending = !!next.affairs.raid && next.affairs.raid.dueTurn === state.turn + 1
  if (defending || action.type === 'expedition') {
    const army = action.type === 'expedition' ? action.army : next.affairs.army
    const tower = Object.values(next.buildings).some((b) => b.kind === 'watchtower')
      ? WAR.towerStrength
      : 0
    report = battle(
      army,
      defending ? WAR.raiders : WAR.garrison,
      action.tactic ?? 'guard',
      defending,
      tower,
    )
    for (const u of ['spearman', 'archer'] as const) next.affairs.army[u] -= report.losses[u]
    next.affairs.raid = null
    next.affairs.protectedUntil = state.turn + 1 + WAR.protection
    if (defending && !report.victory) {
      report.populationLost = Math.min(1, next.population)
      next.population -= report.populationLost
      for (const k of KEYS) {
        report.plunder[k] = Math.min(next.resources[k], WAR.plunder[k])
        next.resources[k] -= report.plunder[k]
      }
      const target = Object.values(next.buildings)
        .filter(
          (b) => b.kind !== 'hall' && b.kind !== 'house' && !militaryBuilding(b.kind) && !b.damaged,
        )
        .sort((a, b) => a.y - b.y || a.x - b.x)[0]
      if (target) {
        report.damaged = { x: target.x, y: target.y }
        next.buildings[key(target.x, target.y)] = { ...target, damaged: true }
      }
    }
    if (!defending && report.victory) {
      next.affairs.settlements.find((s) => s.id === 2)!.relation = 'subdued'
      report.loot = { ...WAR.loot }
    }
  }
  // A fatal raid cannot be undone by end-of-season population growth.
  if (next.population === 0) next.status = 'gameover'
  const produced = production(next)
  for (const k of KEYS) next.resources[k] += produced[k]
  const shortage = next.resources.food < next.population
  next.resources.food = Math.max(0, next.resources.food - next.population)
  const armyFood = Math.min(next.resources.food, upkeep(next.affairs.army))
  const deserters = removeUnits(next.affairs.army, armyFood < upkeep(next.affairs.army) ? 1 : 0)
  next.resources.food -= armyFood
  for (const u of ['spearman', 'archer'] as const) next.affairs.army[u] -= deserters[u]
  next.hunger = shortage ? next.hunger + 1 : 0
  if (next.hunger >= 2) next.population = Math.max(0, next.population - 1)
  if (
    next.status === 'playing' &&
    next.population > 0 &&
    (next.turn + 1) % 3 === 0 &&
    !shortage &&
    next.population < capacity(next) &&
    next.resources.food >= next.population * 2
  )
    next.population++
  next.turn++
  if (next.population === 0) next.status = 'gameover'
  // The gift must never rescue this turn's shortage or trigger growth retroactively.
  const promotion = earnedPromotion(next)
  const promotionGift = promotion ? { ...RANKS[promotion.rank]!.gift } : zero()
  if (promotion) {
    next.rank = promotion.rank
    next.promotions.push(promotion)
    for (const k of KEYS) next.resources[k] += promotionGift[k]
  }
  // Optional goals pay after feeding/growth/rank evaluation, never retroactively.
  const fulfilled = completedRequest(next)
  const requestReward = fulfilled ? { ...REQUESTS[fulfilled.id].reward } : zero()
  if (fulfilled) {
    next.requests.completed.push(fulfilled)
    next.requests.active = null
    for (const k of KEYS) next.resources[k] += requestReward[k]
  }
  for (const k of KEYS) next.resources[k] += diplomaticReward[k] + (report?.loot[k] ?? 0)
  if (
    next.status === 'playing' &&
    next.affairs.settlements.some((s) => s.relation === 'hostile') &&
    !next.affairs.raid &&
    next.turn >= next.affairs.protectedUntil
  ) {
    next.affairs.raid = { announcedTurn: next.turn, dueTurn: next.turn + WAR.warning }
  }
  return {
    battle: report,
    armyFood,
    deserters,
    diplomaticReward,
    completedRequest: fulfilled,
    requestReward,
    promotion,
    promotionGift,
    state: next,
    cost: price,
    produced,
    delta: Object.fromEntries(
      KEYS.map((k) => [k, next.resources[k] - state.resources[k]]),
    ) as Resources,
    shortage,
    populationChange: next.population - state.population,
    reward,
    discovery,
  }
}

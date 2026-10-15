/** Pure, deterministic rules. Preview and commit both call resolveTurn; no browser state here. */
import { SIZE, terrain, type Terrain } from './terrain'
import { BALANCE, upgradeMultiplier, inventoryLimit } from './balance'
import { planExtraction, extractor, type ExtractionPlan } from './deposits'
import { advanceForestry, terrainAt, type PlantedForest, type ForestryReport } from './forestry'
import { CASTLES, castleAppears, plunderCastle } from './castles'
import {
  MILITARY,
  UNITS,
  TACTICS,
  WAR,
  militaryBuilding,
  armySize,
  upkeep,
  upkeepGold,
  removeUnits,
  UNIT_IDS,
  armyCapacity,
  towerStrength,
  subtractArmy,
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
import {
  newCampaign,
  cloneAffairs,
  advanceCampaign,
  returnRaid,
  makePeace,
  enemyTactic,
  enemyDefence,
  type CampaignUpdate,
} from './campaign'
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
  | 'forester'
  | 'quarry'
  | 'mill'
  | 'market'
  | 'orchard'
  | 'barracks'
  | 'watchtower'
export type Point = { x: number; y: number }
export type Building = Point & {
  kind: BuildingKind | 'hall'
  level: number
  damaged?: boolean
  plantingProgress?: number
}
export interface Kingdom {
  affairs: ForeignAffairs
  requests: ResidentRequests
  rank: SettlementRank
  promotions: Promotion[]
  seed: number
  sectors: Point[]
  buildings: Record<string, Building>
  discoveries: Record<string, Discovery>
  deposits: Record<string, number>
  forests: Record<string, PlantedForest>
  resources: Resources
  population: number
  hunger: number
  turn: number
  status: 'playing' | 'gameover'
}
export type Action = (
  | ({ type: 'build'; kind: BuildingKind } & Point)
  | ({ type: 'upgrade' | 'demolish' | 'explore' | 'landmark' | 'repair' } & Point)
  | { type: 'gather' }
  | { type: 'recruit' | 'dismiss'; unit: Unit }
  | { type: 'diplomacy'; id: number }
  | { type: 'truce' | 'negotiate'; enemyId: number }
  | { type: 'expedition' | 'intercept' | 'forcePeace'; enemyId: number; army: Army }
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
export const BUILDINGS: Record<
  BuildingKind,
  { name: string; cost: Resources; description: string }
> = {
  ...MILITARY,
  house: {
    name: 'Dom',
    cost: BALANCE.buildings.house,
    description:
      '+3 miejsca na poziom. Mieszkańcy przybywają na koniec pory roku, jeśli masz zapasy.',
  },
  farm: {
    name: 'Farma',
    cost: BALANCE.buildings.farm,
    description:
      '3/5/7 żywności na poziomach 1–3, +1 przy wodzie i do +3 od młynów. Zimą połowa plonów.',
  },
  sawmill: {
    name: 'Tartak',
    cost: BALANCE.buildings.sawmill,
    description:
      'Wydobywa 1/2/3 drewna na poziomach 1–3, do +2 za złoża w zasięgu 3 pól. Bez dostępnego lasu nie pracuje.',
  },
  forester: {
    name: 'Domek leśnika',
    cost: BALANCE.buildings.forester,
    description:
      'Sadzi las w zasięgu 3 pól co 4/3/2 tury na poziomach 1–3. Najpierw odnawia wycięte pola. Las dojrzewa przez 6 tur i daje 60 drewna.',
  },
  quarry: {
    name: 'Kamieniołom',
    cost: BALANCE.buildings.quarry,
    description:
      'Wydobywa 1/2/3 kamienia na poziomach 1–3, do +2 za złoża w zasięgu 3 pól. Bez dostępnych skał nie pracuje.',
  },
  mill: {
    name: 'Młyn',
    cost: BALANCE.buildings.mill,
    description:
      '+1 żywności na poziom sąsiadującym farmom. Łączna premia młynów: najwyżej +3 na farmę.',
  },
  market: {
    name: 'Targ',
    cost: BALANCE.buildings.market,
    description: '1/2/3 monety na poziomach 1–3 oraz do +2 od sąsiadujących domów.',
  },
  orchard: {
    name: 'Sad',
    cost: BALANCE.buildings.orchard,
    description: '2/3/4 żywności na poziomach 1–3, jesienią podwójne plony. Zimą połowa.',
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
/** The catalog is derived from definitions, not dealt or stored per settlement. */
export const ECONOMY_BUILDINGS = (Object.keys(BUILDINGS) as BuildingKind[]).filter(
  (kind) => !militaryBuilding(kind),
)
export function newKingdom(seed = 1): Kingdom {
  return {
    affairs: emptyAffairs(),
    requests: emptyRequests(),
    rank: 0,
    promotions: [],
    seed: seed >>> 0,
    sectors: [{ x: 0, y: 0 }],
    buildings: { '3,3': { x: 3, y: 3, kind: 'hall', level: 1 } },
    discoveries: {},
    deposits: {},
    forests: {},
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
  return Object.fromEntries(
    KEYS.map((k) => [k, BALANCE.exploration.base[k] + n * BALANCE.exploration.step[k]]),
  ) as Resources
}
export function actionCost(state: Kingdom, action: Action): Resources {
  if (action.type === 'recruit') return UNITS[action.unit]?.cost ?? zero()
  if (action.type === 'truce') return WAR.truce
  if (action.type === 'negotiate') return WAR.negotiate
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
        KEYS.map((k) => [
          k,
          BUILDINGS[b.kind as BuildingKind].cost[k] * upgradeMultiplier(b.level + 1),
        ]),
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
      'intercept',
      'forcePeace',
      'negotiate',
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
        armySize(state.affairs.army) >=
          armyCapacity(
            Object.values(state.buildings).find((b) => b.kind === 'barracks')?.level ?? 0,
          ))
    )
      return 'Rekrutacja wymaga koszar i wolnego miejsca. Ulepszenia zwiększają limit do 9 i 12.'
    if (action.type === 'dismiss' && state.affairs.army[action.unit] < 1)
      return 'Nie masz takiej jednostki.'
  }
  if (action.type === 'diplomacy') {
    const s = state.affairs.settlements.find((s) => s.id === action.id)
    if (!s || s.id > 1 || s.giftTaken) return 'Ta wymiana nie jest dostępna.'
  }
  if (['truce', 'expedition', 'intercept', 'forcePeace', 'negotiate'].includes(action.type)) {
    if (!('enemyId' in action) || !Number.isSafeInteger(action.enemyId))
      return 'Wybierz wrogi zamek.'
    const contact = state.affairs.settlements.find((s) => s.id === action.enemyId)
    if (!contact || contact.relation !== 'hostile') return 'Nie masz wrogiej osady.'
    const enemy = state.affairs.enemies[action.enemyId]
    if (!enemy || enemy.health === 0) return 'Zniszczony zamek nie może być celem wyprawy.'
    if ((action.type === 'negotiate' || action.type === 'forcePeace') && enemy.advantage < 2)
      return 'Zdobądź dwa punkty przewagi, aby zakończyć kampanię.'
    if (
      action.type === 'expedition' ||
      action.type === 'intercept' ||
      action.type === 'forcePeace'
    ) {
      if (action.type !== 'intercept' && state.affairs.raid)
        return 'Najpierw odeprzyj najazd lub opłać rozejm.'
      if (action.type === 'expedition' && state.turn + 1 < enemy.expeditionAvailableTurn)
        return `Kolejna wyprawa dostępna za ${enemy.expeditionAvailableTurn - state.turn - 1} tur.`
      if (
        action.type === 'intercept' &&
        (!state.affairs.raid ||
          state.affairs.raid.enemyId !== action.enemyId ||
          state.affairs.raid.intercepted)
      )
        return 'Ten najazd nie jest dostępny do przechwycenia.'
      if (action.type === 'intercept' && state.affairs.raid!.dueTurn <= state.turn + 1)
        return 'Wróg dotarł do osady. W tej turze przygotuj obronę lub zawrzyj rozejm.'
      if (
        !action.army ||
        !UNIT_IDS.every(
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
        if (!Object.hasOwn(BUILDINGS, action.kind)) return 'Nieznany rodzaj budynku.'
        if (
          militaryBuilding(action.kind) &&
          (state.rank < 1 || Object.values(state.buildings).some((b) => b.kind === action.kind))
        )
          return 'Obrona wymaga rangi Wioska. Możesz mieć po jednym budynku wojskowym.'
        if (b || terrainAt(state, action) !== 'meadow') return 'Budować można tylko na pustej łące.'
      } else {
        if (!b || b.kind === 'hall') return 'Wybierz budynek inny niż ratusz.'
        if (action.type === 'repair' && !b.damaged) return 'Ten budynek nie wymaga naprawy.'
        if (action.type === 'upgrade' && b.damaged) return 'Tego budynku nie można teraz ulepszyć.'
        if (action.type === 'upgrade' && !militaryBuilding(b.kind) && state.rank < b.level)
          return b.level === 1
            ? 'Ulepszenia do poziomu 2 wymagają Wioski.'
            : 'Ulepszenia do poziomu 3 wymagają Miasteczka.'
        if (action.type === 'upgrade' && militaryBuilding(b.kind) && state.rank < b.level + 1)
          return b.level === 1 ? 'Poziom 2 wymaga Miasteczka.' : 'Poziom 3 wymaga Małego królestwa.'
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
export function buildingProduction(
  state: Kingdom,
  b: Building,
  extraction?: ExtractionPlan,
): Resources {
  if (b.damaged || militaryBuilding(b.kind)) return zero()
  if (extractor(b.kind)) {
    const r = zero()
    const report = (extraction ?? planExtraction(state)).buildings[key(b.x, b.y)]
    if (report) r[report.resource] = report.amount
    return r
  }
  const r = zero(),
    adjacent = neighbors(b).filter((p) => discovered(state, p))
  const countTerrain = (t: Terrain) =>
    adjacent.filter((p) => terrain(state.seed, p.x, p.y) === t).length
  if (b.kind === 'hall') return { wood: 1, food: 2, stone: 0, gold: 1 }
  if (b.kind === 'farm') {
    const mills = adjacent.reduce((n, p) => {
      const a = state.buildings[key(p.x, p.y)]
      return n + (a?.kind === 'mill' && !a.damaged ? a.level * BALANCE.production.millPerLevel : 0)
    }, 0)
    r.food =
      BALANCE.production.farmBase +
      (b.level - 1) * BALANCE.production.farmPerLevel +
      (countTerrain('water') ? 1 : 0) +
      Math.min(BALANCE.production.maxMillBonus, mills)
  }
  if (b.kind === 'market')
    r.gold =
      BALANCE.production.marketBase +
      (b.level - 1) * BALANCE.production.marketPerLevel +
      Math.min(
        BALANCE.production.maxHouseBonus,
        adjacent.filter((p) => state.buildings[key(p.x, p.y)]?.kind === 'house').length,
      )
  if (b.kind === 'orchard')
    r.food =
      (BALANCE.production.orchardBase + (b.level - 1) * BALANCE.production.orchardPerLevel) *
      (season(state.turn) === 2 ? 2 : 1)
  const bonus = discoveryBonus(state, b)
  if (bonus) r[bonus.resource]++
  if (season(state.turn) === 3 && (b.kind === 'farm' || b.kind === 'orchard'))
    r.food = Math.floor(r.food / 2)
  return r
}
export function production(state: Kingdom, extraction = planExtraction(state)): Resources {
  const result = zero()
  for (const b of Object.values(state.buildings)) {
    const r = buildingProduction(state, b, extraction)
    for (const k of KEYS) result[k] += r[k]
  }
  return result
}
export interface TurnResult {
  forestry: ForestryReport
  extraction: ExtractionPlan
  storageLoss: Resources
  campaignUpdate: CampaignUpdate
  battle: BattleReport | null
  armyFood: number
  armyGold: number
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
    affairs: cloneAffairs(state),
    requests: { ...state.requests, completed: [...state.requests.completed] },
    promotions: [...state.promotions],
    resources: { ...state.resources },
    buildings: { ...state.buildings },
    discoveries: { ...state.discoveries },
    deposits: { ...state.deposits },
    forests: { ...state.forests },
    sectors: [...state.sectors],
  }
  for (const k of KEYS) next.resources[k] -= price[k]
  if (action.type === 'build') {
    next.buildings[key(action.x, action.y)] = {
      x: action.x,
      y: action.y,
      kind: action.kind,
      level: 1,
    }
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
    if (
      state.rank >= 1 &&
      discovery &&
      (next.affairs.settlements.length < 3 || castleAppears(state.seed, action))
    ) {
      const id = next.affairs.settlements.length
      next.affairs.settlements.push({
        ...settlementPosition(state.seed, action, discovery),
        id,
        discoveredTurn: state.turn + 1,
        relation: id === 0 ? 'friendly' : id === 1 ? 'neutral' : 'hostile',
        giftTaken: false,
      })
      if (id >= 2) {
        if (id === 2) next.affairs.protectedUntil = state.turn + 1 + WAR.protection
        next.affairs.enemies[id] = newCampaign(state.rank, state.turn + 1)
      }
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
    for (const k of KEYS) next.resources[k] += BALANCE.gather[k]
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
    if (next.affairs.raid?.enemyId === action.enemyId) {
      returnRaid(next)
      next.affairs.protectedUntil = state.turn + 1 + WAR.protection
    }
    next.affairs.enemies[action.enemyId]!.protectedUntil = state.turn + 1 + WAR.protection
  }
  if (action.type === 'negotiate') makePeace(next, action.enemyId, state.turn + 1)
  let report: BattleReport | null = null
  const defending = !!next.affairs.raid && next.affairs.raid.dueTurn === state.turn + 1
  const offensive =
    action.type === 'expedition' || action.type === 'intercept' || action.type === 'forcePeace'
  if (defending || offensive) {
    const army = offensive ? action.army : next.affairs.army
    const tower = towerStrength(
      Object.values(next.buildings).find((b) => b.kind === 'watchtower')?.level ?? 0,
    )
    const raid = next.affairs.raid,
      enemyId = offensive ? action.enemyId : raid!.enemyId,
      e = next.affairs.enemies[enemyId]!
    const againstRaid = defending || action.type === 'intercept'
    report = battle(
      army,
      againstRaid ? raid!.army : e.garrison,
      action.tactic ?? 'guard',
      defending,
      tower,
      againstRaid ? raid!.tactic : enemyTactic(e),
      againstRaid ? 0 : enemyDefence(state.rank),
    )
    report.kind = defending
      ? 'defence'
      : action.type === 'intercept'
        ? 'intercept'
        : action.type === 'forcePeace'
          ? 'forcePeace'
          : 'expedition'
    report.enemyId = enemyId
    next.affairs.army = subtractArmy(next.affairs.army, report.losses)
    e.advantage = Math.max(0, Math.min(2, e.advantage + (report.victory ? 1 : -1)))
    if (againstRaid) raid!.army = subtractArmy(raid!.army, report.enemyLosses)
    else e.garrison = subtractArmy(e.garrison, report.enemyLosses)
    if (defending || (action.type === 'intercept' && report.victory)) {
      returnRaid(next)
      next.affairs.protectedUntil = state.turn + 1 + WAR.protection
      e.protectedUntil = next.affairs.protectedUntil
      report.outcome =
        'Najazd zakończony. 12 tur ochrony; ocalali przeciwnicy wrócili do garnizonu.'
    } else if (action.type === 'intercept') {
      raid!.intercepted = true
      report.outcome = `Najazd osłabiony. Termin bez zmian: za ${raid!.dueTurn - state.turn - 1} tur.`
    }
    if (action.type === 'expedition') {
      e.expeditionAvailableTurn = state.turn + 1 + CASTLES.expeditionCooldown
      e.lastAttackedTurn = state.turn + 1
      if (report.victory) {
        report.castleDamage = Math.min(
          e.health,
          report.strength >= report.enemyStrength * 2 ? CASTLES.decisiveDamage : CASTLES.damage,
        )
        e.health -= report.castleDamage
        report.loot = plunderCastle(e, CASTLES.plunder)
        if (e.health === 0) {
          const remainder = plunderCastle(e, CASTLES.treasury)
          for (const k of KEYS) report.loot[k] += remainder[k]
          e.destroyedTurn = state.turn + 1
          e.garrison = { spearman: 0, archer: 0, shieldbearer: 0 }
          e.peaceUntil = null
          next.affairs.settlements.find((s) => s.id === enemyId)!.relation = 'ruins'
          report.castleDestroyed = true
        }
      }
      report.castleHealth = e.health
      report.outcome = report.castleDestroyed
        ? 'Zamek spłonął. Pozostają trwałe zgliszcza; ten wróg już nie wróci.'
        : report.victory
          ? 'Garnizon pokonany. Zabrano łupy i uszkodzono zamek. Następna wyprawa możliwa za 2 tury.'
          : 'Garnizon odparł wyprawę. Brak łupów i uszkodzeń zamku.'
    }
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
    if (action.type === 'forcePeace' && report.victory) {
      if (e.lootCampaign !== e.campaign) {
        report.loot = { ...WAR.loot }
        e.lootCampaign = e.campaign
      }
      makePeace(next, enemyId, state.turn + 1)
      report.outcome = 'Pokój na 36 tur. Garnizon odbudowuje się; po pokoju wróci nowa kampania.'
    } else if (action.type === 'forcePeace') {
      report.outcome = 'Wróg odparł próbę wymuszenia pokoju. Kampania trwa dalej.'
    }
  }
  // A fatal raid cannot be undone by end-of-season population growth.
  if (next.population === 0) next.status = 'gameover'
  const forestry = advanceForestry(next)
  const extraction = planExtraction(next)
  const produced = production(next, extraction)
  next.deposits = extraction.remaining
  for (const k of KEYS) next.resources[k] += produced[k]
  const shortage = next.resources.food < next.population
  next.resources.food = Math.max(0, next.resources.food - next.population)
  const armyFood = Math.min(next.resources.food, upkeep(next.affairs.army))
  const armyGold = Math.min(next.resources.gold, upkeepGold(next.affairs.army))
  const deserters = removeUnits(
    next.affairs.army,
    armyFood < upkeep(next.affairs.army) || armyGold < upkeepGold(next.affairs.army) ? 1 : 0,
  )
  next.resources.food -= armyFood
  next.resources.gold -= armyGold
  next.affairs.army = subtractArmy(next.affairs.army, deserters)
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
  const campaignUpdate = advanceCampaign(next)
  const storageLoss = zero(),
    limit = inventoryLimit(next.rank)
  for (const k of KEYS) {
    // Preserve existing above-limit stocks; only this turn's surplus can be lost.
    storageLoss[k] = Math.max(0, next.resources[k] - Math.max(limit[k], state.resources[k]))
    next.resources[k] -= storageLoss[k]
  }
  return {
    forestry,
    storageLoss,
    extraction,
    campaignUpdate,
    battle: report,
    armyFood,
    armyGold,
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

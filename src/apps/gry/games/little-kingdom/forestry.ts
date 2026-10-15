import type { Kingdom, Point } from './engine'
import { SIZE, baseTerrain, type Terrain } from './terrain'

/** Forestry uses coordinates and turn counters, independently of UI selection. */
export const FORESTRY = {
  radius: 3,
  stageTurns: 3,
  matureAge: 6,
  woodReserve: 60,
  plantingTurns: [4, 3, 2],
} as const
export interface PlantedForest {
  age: number
}
export type ForestState = Pick<Kingdom, 'seed' | 'landscape'> & Partial<Pick<Kingdom, 'forests'>>
const key = (p: Point) => `${p.x},${p.y}`
export const inForestRange = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= FORESTRY.radius
export const forestStage = (state: ForestState, p: Point): 1 | 2 | 3 => {
  const age = state.forests?.[key(p)]?.age ?? FORESTRY.matureAge
  return age < FORESTRY.stageTurns ? 1 : age < FORESTRY.matureAge ? 2 : 3
}
/** Seeded terrain remains immutable; planted forests are a saved overlay. */
export const terrainAt = (state: ForestState, p: Point): Terrain =>
  state.forests?.[key(p)] ? 'forest' : baseTerrain(state, p.x, p.y)
export const plantingInterval = (level: number) => FORESTRY.plantingTurns[level - 1] ?? 4

export function plantingSites(state: Kingdom, building: Point): Point[] {
  const known = new Set(state.sectors.map(key))
  const occupied = new Set([
    ...Object.keys(state.buildings),
    ...Object.keys(state.discoveries),
    ...state.affairs.settlements.map(key),
  ])
  const sites: Point[] = []
  for (let dy = -FORESTRY.radius; dy <= FORESTRY.radius; dy++)
    for (let dx = -FORESTRY.radius; dx <= FORESTRY.radius; dx++) {
      const p = { x: building.x + dx, y: building.y + dy },
        k = key(p)
      if (
        !inForestRange(building, p) ||
        occupied.has(k) ||
        !known.has(`${Math.floor(p.x / SIZE)},${Math.floor(p.y / SIZE)}`)
      )
        continue
      const t = terrainAt(state, p)
      if (
        t === 'meadow' ||
        (t === 'forest' && forestStage(state, p) === 3 && state.deposits[k] === 0)
      )
        sites.push(p)
    }
  return sites.sort(
    (a, b) =>
      Number(terrainAt(state, b) === 'forest') - Number(terrainAt(state, a) === 'forest') ||
      Math.abs(a.x - building.x) +
        Math.abs(a.y - building.y) -
        (Math.abs(b.x - building.x) + Math.abs(b.y - building.y)) ||
      a.y - b.y ||
      a.x - b.x,
  )
}
export interface ForestryReport {
  planted: Point[]
  matured: Point[]
}
export function forestryForecast(state: Kingdom): Kingdom {
  const next = {
    ...state,
    forests: { ...state.forests },
    buildings: { ...state.buildings },
    deposits: { ...state.deposits },
  }
  advanceForestry(next)
  return next
}
/** Run once, after the action/battle and before extraction. Existing trees grow even
 * without a forester; new seedlings start at zero and cannot be harvested that turn. */
export function advanceForestry(state: Kingdom): ForestryReport {
  const report: ForestryReport = { planted: [], matured: [] }
  for (const [k, forest] of Object.entries(state.forests)) {
    if (forest.age >= FORESTRY.matureAge) continue
    const age = forest.age + 1
    state.forests[k] = { age }
    if (age === FORESTRY.matureAge) {
      const [x, y] = k.split(',').map(Number)
      report.matured.push({ x: x!, y: y! })
    }
  }
  const foresters = Object.values(state.buildings)
    .filter((b) => b.kind === 'forester' && !b.damaged)
    .sort((a, b) => a.y - b.y || a.x - b.x)
  for (const b of foresters) {
    const interval = plantingInterval(b.level)
    let plantingProgress = Math.min(interval, (b.plantingProgress ?? 0) + 1)
    if (plantingProgress === interval) {
      const site = plantingSites(state, b)[0]
      if (site) {
        state.forests[key(site)] = { age: 0 }
        state.deposits[key(site)] = FORESTRY.woodReserve
        report.planted.push(site)
        plantingProgress = 0
      }
    }
    state.buildings[key(b)] = { ...b, plantingProgress }
  }
  return report
}

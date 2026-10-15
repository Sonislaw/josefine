import type { Building, Kingdom, Point } from './engine'
import { SIZE } from './terrain'
import { BALANCE } from './balance'
import { FORESTRY, forestStage, terrainAt, type ForestState } from './forestry'

export const DEPOSITS = { radius: 3, forest: FORESTRY.woodReserve, rock: 80 } as const
const key = (p: Point) => `${p.x},${p.y}`
export const extractor = (kind: string) => kind === 'sawmill' || kind === 'quarry'
export const inExtractionRange = (a: Point, b: Point) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= DEPOSITS.radius
export function depositCapacity(state: ForestState, p: Point) {
  const t = terrainAt(state, p)
  return t === 'forest' || t === 'rock' ? DEPOSITS[t] : 0
}
/** Sparse overrides: untouched natural tiles use full capacity; seedlings hold future stock. */
export const depositRemaining = (
  state: Pick<Kingdom, 'seed' | 'landscape' | 'deposits' | 'forests'>,
  p: Point,
) => state.deposits[key(p)] ?? depositCapacity(state, p)
export interface ExtractionReport {
  resource: 'wood' | 'stone'
  amount: number
  available: number
  sources: Point[]
}
export interface ExtractionPlan {
  remaining: Record<string, number>
  buildings: Record<string, ExtractionReport>
  exhausted: Point[]
}
/** One shared allocation for the whole settlement, used by preview, UI and commit.
 * Each extractor takes one unit per round, nearest source first. Stable coordinate order
 * breaks ties and prevents insertion order or reloading from changing the outcome. */
export function planExtraction(state: Kingdom): ExtractionPlan {
  const remaining = { ...state.deposits }
  const known = new Set(state.sectors.map((p) => key(p)))
  const buildings: ExtractionPlan['buildings'] = {}
  const exhausted: Point[] = []
  const workers = Object.values(state.buildings)
    .filter((b) => extractor(b.kind))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((b) => {
      const type = b.kind === 'sawmill' ? 'forest' : 'rock'
      const sources: Point[] = []
      for (let dy = -DEPOSITS.radius; dy <= DEPOSITS.radius; dy++)
        for (let dx = -DEPOSITS.radius; dx <= DEPOSITS.radius; dx++) {
          const p = { x: b.x + dx, y: b.y + dy }
          if (
            !inExtractionRange(b, p) ||
            !known.has(`${Math.floor(p.x / SIZE)},${Math.floor(p.y / SIZE)}`)
          )
            continue
          if (
            terrainAt(state, p) === type &&
            (type !== 'forest' || forestStage(state, p) === 3) &&
            depositRemaining(state, p) > 0
          )
            sources.push(p)
        }
      sources.sort(
        (a, c) =>
          Math.abs(a.x - b.x) + Math.abs(a.y - b.y) - (Math.abs(c.x - b.x) + Math.abs(c.y - b.y)) ||
          a.y - c.y ||
          a.x - c.x,
      )
      const report: ExtractionReport = {
        resource: type === 'forest' ? 'wood' : 'stone',
        amount: 0,
        available: sources.reduce((sum, p) => sum + depositRemaining(state, p), 0),
        sources,
      }
      buildings[key(b)] = report
      const rate =
        b.damaged || !sources.length
          ? 0
          : BALANCE.production.extractorBase +
            (b.level - 1) * BALANCE.production.extractorPerLevel +
            Math.min(BALANCE.production.maxTerrainBonus, sources.length)
      return { report, rate }
    })
  const maxRate = Math.max(0, ...workers.map((w) => w.rate))
  for (let round = 0; round < maxRate; round++)
    for (const { report, rate } of workers) {
      if (round >= rate) continue
      const p = report.sources.find((p) => (remaining[key(p)] ?? depositCapacity(state, p)) > 0)
      if (!p) continue
      const k = key(p)
      remaining[k] = (remaining[k] ?? depositCapacity(state, p)) - 1
      report.amount++
      if (!remaining[k]) exhausted.push(p)
    }
  return { remaining, buildings, exhausted }
}
export function extractionFor(state: Kingdom, b: Building) {
  return planExtraction(state).buildings[key(b)]
}

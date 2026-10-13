import type { Kingdom, Resources } from './engine'

export type SettlementRank = 0 | 1 | 2 | 3
export interface Promotion {
  rank: Exclude<SettlementRank, 0>
  turn: number
}
type Metric = 'population' | 'buildings' | 'kinds' | 'sectors' | 'discoveries'
export interface RankDefinition {
  name: string
  requirements: Record<Metric, number>
  gift: Resources
}
// Type-only engine dependency: progression is pure and never draws from the offer RNG.
export const RANKS: readonly RankDefinition[] = [
  {
    name: 'Osada',
    requirements: { population: 0, buildings: 0, kinds: 0, sectors: 0, discoveries: 0 },
    gift: { wood: 0, stone: 0, food: 0, gold: 0 },
  },
  {
    name: 'Wioska',
    requirements: { population: 6, buildings: 4, kinds: 3, sectors: 2, discoveries: 0 },
    gift: { wood: 10, stone: 5, food: 0, gold: 5 },
  },
  {
    name: 'Miasteczko',
    requirements: { population: 12, buildings: 8, kinds: 5, sectors: 4, discoveries: 1 },
    gift: { wood: 20, stone: 12, food: 10, gold: 12 },
  },
  {
    name: 'Małe królestwo',
    requirements: { population: 20, buildings: 12, kinds: 6, sectors: 7, discoveries: 3 },
    gift: { wood: 35, stone: 25, food: 20, gold: 25 },
  },
]
const METRICS: Record<Metric, { label: string; hint: string }> = {
  population: {
    label: 'Mieszkańcy',
    hint: 'Zapewnij miejsce w domach i zapasy na koniec pory roku.',
  },
  buildings: {
    label: 'Budynki',
    hint: 'Postaw kolejne budynki. Ratusz i poziomy ulepszeń nie zwiększają tej liczby.',
  },
  kinds: {
    label: 'Rodzaje budynków',
    hint: 'Sięgnij po inny rodzaj budynku z oferty. Ratusz nie jest wliczany.',
  },
  sectors: {
    label: 'Odkryte sektory',
    hint: 'Odkryj sąsiedni sektor. Liczymy także ziemię startową.',
  },
  discoveries: {
    label: 'Wykorzystane odkrycia',
    hint: 'Zbadaj ruiny, zbierz znalezisko lub odnów wyjątkowe miejsce.',
  },
}
export function rankProgress(state: Kingdom) {
  const target = RANKS[state.rank + 1]
  if (!target) return []
  const buildings = Object.values(state.buildings).filter((b) => b.kind !== 'hall')
  const values: Record<Metric, number> = {
    population: state.population,
    buildings: buildings.length,
    kinds: new Set(buildings.map((b) => b.kind)).size,
    sectors: state.sectors.length,
    discoveries: Object.values(state.discoveries).filter((d) => d.status === 'used').length,
  }
  return (Object.keys(METRICS) as Metric[])
    .filter((id) => target.requirements[id] > 0)
    .map((id) => ({
      id,
      ...METRICS[id],
      value: values[id],
      required: target.requirements[id],
      complete: values[id] >= target.requirements[id],
    }))
}
/** Evaluate AFTER feeding and population growth; at most one permanent step per turn. */
export function earnedPromotion(state: Kingdom): Promotion | null {
  if (state.status !== 'playing' || state.rank === 3) return null
  return rankProgress(state).every((p) => p.complete)
    ? { rank: (state.rank + 1) as Promotion['rank'], turn: state.turn }
    : null
}

import type { Kingdom, Point } from './engine'
import { SIZE, terrain } from './terrain'
import { supplies, type Army, emptyArmy } from './military'
import type { EnemyCampaign, Raid } from './campaign'

export const SETTLEMENTS = [
  {
    name: 'Brzeziny',
    description: 'Sąsiedzi witają Twoich posłańców zapasami na drogę.',
    cost: supplies(),
    reward: supplies(0, 0, 8, 4),
  },
  {
    name: 'Kamienny Bród',
    description: 'Pomóż w odbudowie mostu, aby zyskać przyjaznych sąsiadów.',
    cost: supplies(10, 5),
    reward: supplies(0, 0, 0, 12),
  },
  {
    name: 'Czerwone Wzgórze',
    description: 'Wojownicza osada. Przygotuj obronę, opłać rozejm lub pokonaj jej garnizon.',
    cost: supplies(),
    reward: supplies(),
  },
] as const
export type Relation = 'friendly' | 'neutral' | 'hostile' | 'peaceful'
export const RELATIONS: Record<Relation, string> = {
  friendly: 'Przyjazna',
  neutral: 'Neutralna',
  hostile: 'Wroga',
  peaceful: 'Pokój na pograniczu',
}
export interface Settlement extends Point {
  id: number
  relation: Relation
  discoveredTurn: number
  giftTaken: boolean
}
export interface ForeignAffairs {
  army: Army
  settlements: Settlement[]
  raid: Raid | null
  protectedUntil: number
  enemy: EnemyCampaign | null
}
export const emptyAffairs = (): ForeignAffairs => ({
  army: emptyArmy(),
  settlements: [],
  raid: null,
  protectedUntil: 0,
  enemy: null,
})
/** Separate coordinate hash: exploration never draws from the building-card RNG. */
export function settlementPosition(seed: number, sector: Point, excluded: Point): Point {
  const plots: Point[] = []
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const p = { x: sector.x * SIZE + x, y: sector.y * SIZE + y }
      // Preserve the useful meadow neighbours guaranteed for permanent discoveries.
      if (
        terrain(seed, p.x, p.y) === 'meadow' &&
        Math.abs(p.x - excluded.x) + Math.abs(p.y - excluded.y) > 1
      )
        plots.push(p)
    }
  const hash =
    (Math.imul(sector.x, 73856093) ^ Math.imul(sector.y, 19349663) ^ seed ^ 0x781fab) >>> 0
  return plots[hash % plots.length]!
}
export function settlementAt(state: Kingdom, p: Point) {
  return state.affairs.settlements.find((s) => s.x === p.x && s.y === p.y)
}

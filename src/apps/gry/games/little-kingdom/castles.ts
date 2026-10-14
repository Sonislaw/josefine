import type { Point, Resources } from './engine'
import type { EnemyCampaign } from './campaign'
import { supplies } from './military'

/** Castle attrition and finite loot, separate from the unchanged civilian economy. */
export const CASTLES = {
  health: 100,
  repair: 3,
  damage: 26,
  decisiveDamage: 35,
  expeditionCooldown: 2,
  treasury: supplies(24, 18, 16, 20),
  plunder: supplies(8, 6, 4, 6),
  replenish: supplies(2, 2, 1, 2),
  replenishTurns: 6,
}
export function castleAppears(seed: number, p: Point): boolean {
  let h = (seed ^ Math.imul(p.x, 73856093) ^ Math.imul(p.y, 19349663) ^ 0x35ea971b) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) % 3 === 0
}
/** Mutates only the already-cloned campaign inside resolveTurn. Never creates free loot. */
export function plunderCastle(e: EnemyCampaign, limit: Resources): Resources {
  const loot = supplies()
  for (const k of ['wood', 'stone', 'food', 'gold'] as const) {
    loot[k] = Math.min(e.treasury[k], limit[k])
    e.treasury[k] -= loot[k]
  }
  return loot
}

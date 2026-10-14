import type { Point, Resources } from './engine'
import { armySize, baseStrength, removeUnits, supplies, type Army, type Tactic } from './military'

export interface BattleReport {
  defending: boolean
  tactic: Tactic
  army: Army
  enemy: Army
  strength: number
  enemyStrength: number
  victory: boolean
  losses: Army
  damaged: Point | null
  populationLost: number
  plunder: Resources
  loot: Resources
}
/** No RNG or mutation; the exact same report is previewed and committed. */
export function battle(
  army: Army,
  enemy: Army,
  tactic: Tactic,
  defending: boolean,
  tower = 0,
): BattleReport {
  const base = baseStrength(army)
  const bonus =
    tactic === 'guard'
      ? army.spearman * 2
      : tactic === 'volley'
        ? army.archer * 2
        : Math.floor(base / 4)
  const strength = base + bonus + (defending ? tower : 0),
    enemyStrength = baseStrength(enemy)
  const victory = defending ? strength >= enemyStrength : strength > enemyStrength
  const count = victory
    ? strength >= enemyStrength * 2
      ? 0
      : Math.ceil(armySize(army) / 4)
    : Math.ceil(armySize(army) / 2)
  return {
    defending,
    tactic,
    army: { ...army },
    enemy: { ...enemy },
    strength,
    enemyStrength,
    victory,
    losses: removeUnits(army, count + (tactic === 'charge' ? 1 : 0)),
    damaged: null,
    populationLost: 0,
    plunder: supplies(),
    loot: supplies(),
  }
}

import type { Point, Resources } from './engine'
import { BALANCE } from './balance'
import {
  armySize,
  baseStrength,
  removeUnits,
  supplies,
  type Army,
  type Tactic,
  type EnemyTactic,
} from './military'

export interface BattleReport {
  defending: boolean
  tactic: Tactic
  army: Army
  enemy: Army
  strength: number
  enemyStrength: number
  enemySupport: number
  victory: boolean
  losses: Army
  enemyLosses: Army
  enemyTactic: EnemyTactic
  kind: 'defence' | 'expedition' | 'intercept' | 'forcePeace'
  outcome: string
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
  enemyTactic: EnemyTactic = 'none',
  enemySupport = 0,
): BattleReport {
  const strength = tacticalStrength(army, tactic) + (defending ? tower : 0),
    enemyStrength = tacticalStrength(enemy, enemyTactic) + enemySupport
  const victory = defending ? strength >= enemyStrength : strength > enemyStrength
  return {
    defending,
    tactic,
    army: { ...army },
    enemy: { ...enemy },
    strength,
    enemyStrength,
    enemySupport,
    victory,
    losses: casualties(army, victory, strength, enemyStrength, tactic),
    enemyLosses: casualties(enemy, !victory, enemyStrength, strength, enemyTactic),
    enemyTactic,
    kind: defending ? 'defence' : 'expedition',
    outcome: '',
    damaged: null,
    populationLost: 0,
    plunder: supplies(),
    loot: supplies(),
  }
}
export function tacticalStrength(army: Army, tactic: EnemyTactic) {
  const base = baseStrength(army)
  return (
    base +
    (tactic === 'guard'
      ? army.spearman * 2 + army.shieldbearer
      : tactic === 'volley'
        ? army.archer * 2
        : tactic === 'charge'
          ? Math.floor(base / 2)
          : 0)
  )
}
function casualties(
  army: Army,
  won: boolean,
  strength: number,
  opponent: number,
  tactic: EnemyTactic,
) {
  const initial = won
    ? strength >= opponent * BALANCE.combat.overwhelmingRatio
      ? 0
      : Math.ceil(
          armySize(army) *
            BALANCE.combat.winnerLossRate *
            Math.min(1, opponent / Math.max(1, strength)),
        )
    : Math.ceil(armySize(army) * BALANCE.combat.loserLossRate)
  return removeUnits(
    army,
    Math.max(0, initial - Math.floor(army.shieldbearer / BALANCE.combat.shieldsPerProtection)) +
      (tactic === 'charge' ? 1 : 0),
  )
}

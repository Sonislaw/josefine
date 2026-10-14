import type { Resources } from './engine'

export type Unit = 'spearman' | 'archer' | 'shieldbearer'
export type Army = Record<Unit, number>
export type Tactic = 'guard' | 'volley' | 'charge'
export type EnemyTactic = Tactic | 'none'
export const UNIT_IDS: Unit[] = ['spearman', 'archer', 'shieldbearer']
export type MilitaryBuilding = 'barracks' | 'watchtower'
export const militaryBuilding = (kind: string): kind is MilitaryBuilding =>
  kind === 'barracks' || kind === 'watchtower'
export const supplies = (wood = 0, stone = 0, food = 0, gold = 0): Resources => ({
  wood,
  stone,
  food,
  gold,
})
export const MILITARY = {
  barracks: {
    name: 'Koszary',
    cost: supplies(12, 8, 0, 6),
    description: 'Rekrutacja najemników. Poziomy 1–3: miejsce dla 6, 9 lub 12 jednostek.',
  },
  watchtower: {
    name: 'Wieża strażnicza',
    cost: supplies(10, 12),
    description: 'Obrona całej osady. Poziomy 1–3: +6, +9 lub +12 siły.',
  },
}
export const UNITS = {
  spearman: { name: 'Włócznik', strength: 4, cost: supplies(3, 0, 0, 2) },
  archer: { name: 'Łucznik', strength: 3, cost: supplies(4, 0, 0, 3) },
  shieldbearer: { name: 'Tarczownik', strength: 2, cost: supplies(2, 3, 0, 4) },
}
export const TACTICS = {
  guard: { name: 'Szyk obronny', description: '+2 siły na włócznika i +1 na tarczownika.' },
  volley: { name: 'Ostrzał', description: '+2 siły za każdego łucznika.' },
  charge: { name: 'Szturm', description: '+50% bazowej siły, ale tracisz dodatkową jednostkę.' },
}
export const WAR = {
  capacity: 6,
  capacityPerLevel: 3,
  towerStrength: 6,
  towerPerLevel: 3,
  protection: 12,
  warning: 4,
  // Only for validation/migration of old saves, never spawned in a new campaign.
  raiders: { spearman: 3, archer: 2, shieldbearer: 0 },
  garrison: { spearman: 4, archer: 2, shieldbearer: 0 },
  targets: [
    { spearman: 3, archer: 2, shieldbearer: 1 },
    { spearman: 4, archer: 3, shieldbearer: 2 },
    { spearman: 5, archer: 4, shieldbearer: 3 },
  ],
  peace: 36,
  recovery: 3,
  stanceTurns: 4,
  expeditionCooldown: 6,
  raidMax: 8,
  raidMin: 3,
  negotiate: supplies(0, 0, 12, 20),
  truce: supplies(0, 0, 0, 12),
  plunder: supplies(10, 6, 8, 6),
  loot: supplies(0, 12, 0, 15),
}
export const emptyArmy = (): Army => ({ spearman: 0, archer: 0, shieldbearer: 0 })
export const armySize = (army: Army) => UNIT_IDS.reduce((n, u) => n + army[u], 0)
export const armyCapacity = (level: number) =>
  level ? WAR.capacity + (level - 1) * WAR.capacityPerLevel : 0
export const towerStrength = (level: number) =>
  level ? WAR.towerStrength + (level - 1) * WAR.towerPerLevel : 0
export const upkeep = (army: Army) => Math.ceil(armySize(army) / 3)
export const baseStrength = (army: Army) =>
  UNIT_IDS.reduce((n, u) => n + army[u] * UNITS[u].strength, 0)
export function removeUnits(army: Army, count: number): Army {
  const losses = emptyArmy()
  for (const u of UNIT_IDS) {
    losses[u] = Math.min(army[u], Math.max(0, count))
    count -= losses[u]
  }
  return losses
}
export const subtractArmy = (army: Army, losses: Army): Army =>
  Object.fromEntries(UNIT_IDS.map((u) => [u, army[u] - losses[u]])) as Army
export const addArmy = (a: Army, b: Army): Army =>
  Object.fromEntries(UNIT_IDS.map((u) => [u, a[u] + b[u]])) as Army

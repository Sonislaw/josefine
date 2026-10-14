import type { Resources } from './engine'

export type Unit = 'spearman' | 'archer'
export type Army = Record<Unit, number>
export type Tactic = 'guard' | 'volley' | 'charge'
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
    description: 'Rekrutacja najemników. Miejsce dla 6 jednostek; jeden poziom.',
  },
  watchtower: {
    name: 'Wieża strażnicza',
    cost: supplies(10, 12),
    description: '+6 siły w obronie całej osady; jeden poziom.',
  },
}
export const UNITS = {
  spearman: { name: 'Włócznik', strength: 4, cost: supplies(3, 0, 0, 2) },
  archer: { name: 'Łucznik', strength: 3, cost: supplies(4, 0, 0, 3) },
}
export const TACTICS = {
  guard: { name: 'Szyk obronny', description: '+2 siły za każdego włócznika.' },
  volley: { name: 'Ostrzał', description: '+2 siły za każdego łucznika.' },
  charge: { name: 'Szturm', description: '+25% bazowej siły, ale tracisz dodatkową jednostkę.' },
}
export const WAR = {
  capacity: 6,
  towerStrength: 6,
  protection: 12,
  warning: 4,
  raiders: { spearman: 3, archer: 2 },
  garrison: { spearman: 4, archer: 2 },
  truce: supplies(0, 0, 0, 12),
  plunder: supplies(10, 6, 8, 6),
  loot: supplies(0, 12, 0, 15),
}
export const emptyArmy = (): Army => ({ spearman: 0, archer: 0 })
export const armySize = (army: Army) => army.spearman + army.archer
export const upkeep = (army: Army) => Math.ceil(armySize(army) / 3)
export const baseStrength = (army: Army) =>
  army.spearman * UNITS.spearman.strength + army.archer * UNITS.archer.strength
export function removeUnits(army: Army, count: number): Army {
  const spearman = Math.min(army.spearman, count)
  return { spearman, archer: Math.min(army.archer, count - spearman) }
}

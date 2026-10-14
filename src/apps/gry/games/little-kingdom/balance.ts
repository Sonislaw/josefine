import type { Resources } from './engine'
const cost = (wood = 0, stone = 0, food = 0, gold = 0): Resources => ({ wood, stone, food, gold })
/** Economic tuning in one place. Existing settlements keep buildings and stocks. */
export const BALANCE = {
  buildings: {
    house: cost(18, 8, 0, 4),
    farm: cost(12, 3, 0, 2),
    sawmill: cost(16, 6, 0, 3),
    quarry: cost(16, 4, 0, 3),
    mill: cost(24, 14, 0, 8),
    market: cost(22, 12, 0, 8),
    orchard: cost(14, 4, 0, 6),
    barracks: cost(30, 20, 0, 16),
    watchtower: cost(24, 30, 0, 12),
  },
  upgradeMultipliers: [0, 0, 3, 6],
  gather: cost(1, 1, 2),
  inventory: [
    cost(120, 120, 80, 80),
    cost(200, 200, 140, 140),
    cost(320, 320, 240, 220),
    cost(480, 480, 360, 320),
  ],
  production: {
    farmBase: 3,
    farmPerLevel: 2,
    millPerLevel: 1,
    maxMillBonus: 3,
    extractorBase: 1,
    extractorPerLevel: 1,
    maxTerrainBonus: 2,
    marketBase: 1,
    marketPerLevel: 1,
    maxHouseBonus: 2,
    orchardBase: 2,
    orchardPerLevel: 1,
  },
  exploration: { base: cost(18, 10, 0, 8), step: cost(8, 5, 0, 5) },
  upkeep: { soldiersPerFood: 2, soldiersPerGold: 4 },
  combat: {
    winnerLossRate: 1 / 3,
    loserLossRate: 0.6,
    overwhelmingRatio: 3,
    shieldsPerProtection: 3,
    garrisonSupport: [4, 6, 8],
  },
}
export const upgradeMultiplier = (target: number) => BALANCE.upgradeMultipliers[target] ?? 0
export const inventoryLimit = (rank: number): Resources => ({ ...BALANCE.inventory[rank]! })

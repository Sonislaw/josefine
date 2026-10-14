// Test-only fixtures: never imported by the application or exposed in a browser harness.
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const { newKingdom, terrain, key } = await jiti.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { discoveryForSector, blocksBuilding } = await jiti.import(
  '../../src/apps/gry/games/little-kingdom/discoveries.ts',
)

export function developedKingdom(rank = 0) {
  const s = newKingdom(42)
  s.turn = 60
  s.population = 20
  s.rank = rank
  s.promotions = Array.from({ length: rank }, (_, i) => ({ rank: i + 1, turn: i + 30 }))
  s.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  s.sectors = Array.from({ length: 7 }, (_, x) => ({ x, y: 0 }))
  for (const p of s.sectors.slice(1, 4)) {
    const d = discoveryForSector(s.seed, p, p.x)
    s.discoveries[key(d.x, d.y)] = { ...d, status: 'used', usedTurn: p.x + 10 }
  }
  const plots = []
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 49; x++)
      if (
        terrain(s.seed, x, y) === 'meadow' &&
        !s.buildings[key(x, y)] &&
        !blocksBuilding(s.discoveries[key(x, y)])
      )
        plots.push({ x, y })
  const kinds = [
    'house',
    'house',
    'house',
    'farm',
    'farm',
    'farm',
    'sawmill',
    'quarry',
    'mill',
    'market',
    'orchard',
    'farm',
  ]
  kinds.forEach((kind, i) => {
    const p = plots[i]
    s.buildings[key(p.x, p.y)] = { ...p, kind, level: 3 }
  })
  return s
}
export const encode = (state, version = 4) => {
  const copy = structuredClone(state)
  if (version < 4) delete copy.requests
  if (version < 3) {
    delete copy.rank
    delete copy.promotions
  }
  if (version === 1) delete copy.discoveries
  return JSON.stringify({ version, state: copy, tutorialDismissed: true })
}

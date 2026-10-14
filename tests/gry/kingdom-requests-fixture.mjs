// Valid saved-map fixtures shared by pure and browser tests; absent from application imports.
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { newKingdom, terrain, neighbors, key } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { discoveryForSector, blocksBuilding } = await j.import(
  '../../src/apps/gry/games/little-kingdom/discoveries.ts',
)

export function requestsKingdom() {
  const s = newKingdom(42)
  s.rank = 3
  s.promotions = [
    { rank: 1, turn: 30 },
    { rank: 2, turn: 31 },
    { rank: 3, turn: 32 },
  ]
  s.turn = 60
  s.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  s.sectors = Array.from({ length: 16 }, (_, i) => ({ x: i % 8, y: Math.floor(i / 8) }))
  for (const [i, p] of s.sectors.slice(1).entries()) {
    const d = discoveryForSector(s.seed, p, i + 1)
    s.discoveries[key(d.x, d.y)] = { ...d, status: 'used', usedTurn: i + 17 }
  }
  const free = (p) =>
    p.x >= 0 &&
    p.x < 56 &&
    p.y >= 0 &&
    p.y < 14 &&
    terrain(s.seed, p.x, p.y) === 'meadow' &&
    !s.buildings[key(p.x, p.y)] &&
    !blocksBuilding(s.discoveries[key(p.x, p.y)])
  const all = s.sectors.flatMap((p) =>
    Array.from({ length: 49 }, (_, i) => ({
      x: p.x * 7 + (i % 7),
      y: p.y * 7 + Math.floor(i / 7),
    })),
  )
  const put = (kind, p, level = 3) => {
    s.buildings[key(p.x, p.y)] = { kind, ...p, level }
    return p
  }
  for (const [kind, t] of [
    ['farm', 'water'],
    ['sawmill', 'forest'],
    ['quarry', 'rock'],
  ]) {
    const p = all.find(
      (p) =>
        free(p) &&
        neighbors(p).some(
          (q) => q.x >= 0 && q.y >= 0 && q.x < 56 && q.y < 14 && terrain(s.seed, q.x, q.y) === t,
        ),
    )
    if (!p) throw Error(`Missing ${kind} fixture`)
    put(kind, p)
  }
  for (const [kind, neighbor] of [
    ['mill', 'farm'],
    ['market', 'house'],
  ]) {
    const p = all.find(
      (p) => free(p) && free({ x: p.x - 1, y: p.y }) && free({ x: p.x + 1, y: p.y }),
    )
    if (!p) throw Error(`Missing group ${kind}`)
    put(kind, p)
    put(neighbor, { x: p.x - 1, y: p.y })
    put(neighbor, { x: p.x + 1, y: p.y })
  }
  for (let i = 0; i < 2; i++) put('orchard', all.find(free))
  for (const [kind, b] of [
    ['spring', 'farm'],
    ['tradingPost', 'market'],
  ]) {
    const d = Object.values(s.discoveries).find((d) => d.kind === kind && neighbors(d).some(free))
    if (!d) throw Error(`Missing ${kind} discovery fixture`)
    put(b, neighbors(d).find(free))
  }
  return s
}

import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn, key, terrain } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const { blocksBuilding } = await j.import('../../src/apps/gry/games/little-kingdom/discoveries.ts')
export function emptyPlot(s) {
  for (const sector of s.sectors)
    for (let y = sector.y * 7; y < sector.y * 7 + 7; y++)
      for (let x = sector.x * 7; x < sector.x * 7 + 7; x++) {
        if (
          terrain(s.seed, x, y) === 'meadow' &&
          !s.buildings[key(x, y)] &&
          !blocksBuilding(s.discoveries[key(x, y)]) &&
          !s.affairs.settlements.some((c) => c.x === x && c.y === y)
        )
          return { x, y }
      }
  throw Error('No plot')
}
export function warKingdom(seed = 42) {
  let s = newKingdom(seed)
  s.rank = 1
  s.promotions = [{ rank: 1, turn: 12 }]
  s.turn = 12
  s.resources = { wood: 2000, stone: 2000, food: 2000, gold: 2000 }
  for (let x = 1; x <= 3; x++) s = resolveTurn(s, { type: 'explore', x, y: 0 }).state
  return s
}
export function beforeRaid(army = { spearman: 0, archer: 0 }, tower = false) {
  let s = warKingdom()
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  s.affairs.army = { ...army }
  if (tower) s = resolveTurn(s, { type: 'build', kind: 'watchtower', ...emptyPlot(s) }).state
  const p = emptyPlot(s)
  s.buildings[key(p.x, p.y)] = { ...p, kind: 'farm', level: 2 }
  while (!s.affairs.raid || s.turn < s.affairs.raid.dueTurn - 1)
    s = resolveTurn(s, { type: 'gather' }).state
  return s
}

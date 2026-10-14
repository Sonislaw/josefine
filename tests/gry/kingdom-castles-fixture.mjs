import { createJiti } from 'jiti'
import { warKingdom, emptyPlot } from './kingdom-war-fixture.mjs'
const j = createJiti(import.meta.url)
const { resolveTurn } = await j.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const { returnRaid } = await j.import('../../src/apps/gry/games/little-kingdom/campaign.ts')
export function castlesKingdom(count = 3) {
  let s = warKingdom(42)
  if (count >= 10) s.resources = { wood: 1000000, stone: 1000000, food: 1000000, gold: 1000000 }
  for (let x = 4; s.affairs.settlements.length < count + 2; x++) {
    if (x > 1000) throw Error('Not enough deterministic castles')
    s = resolveTurn(s, { type: 'explore', x, y: 0 }).state
  }
  s.rank = 3
  s.promotions = [
    { rank: 1, turn: 12 },
    { rank: 2, turn: 13 },
    { rank: 3, turn: 14 },
  ]
  const p = emptyPlot(s)
  s.buildings[`${p.x},${p.y}`] = { ...p, kind: 'barracks', level: 3 }
  s.affairs.army = { spearman: 12, archer: 0, shieldbearer: 0 }
  // Keep a valid already-earned defensive window, not a fictitious endless one.
  returnRaid(s)
  s.affairs.protectedUntil = s.turn + 12
  for (const e of Object.values(s.affairs.enemies)) e.protectedUntil = s.turn + 12
  return s
}

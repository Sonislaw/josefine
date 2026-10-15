// Test-only strategy: uses the full catalog, legal actions and earned resources throughout.
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const {
  newKingdom,
  resolveTurn,
  actionError,
  key,
  production,
  capacity,
  buildingProduction,
  ECONOMY_BUILDINGS,
} = await j.import('../../src/apps/gry/games/little-kingdom/engine.ts')
const { terrainAt, plantingSites, inForestRange } = await j.import(
  '../../src/apps/gry/games/little-kingdom/forestry.ts',
)
const { blocksBuilding } = await j.import('../../src/apps/gry/games/little-kingdom/discoveries.ts')
export function simulateDevelopment(seed, maxTurns = 700) {
  let state = newKingdom(seed)
  const milestones = [],
    turns = []
  const targets = {
    farm: 10,
    sawmill: 3,
    forester: 1,
    quarry: 3,
    house: 6,
    market: 3,
    orchard: 1,
    mill: 1,
  }
  for (let i = 0; i < maxTurns && state.rank < 3; i++) {
    const s = state,
      counts = Object.fromEntries(
        Object.keys(targets).map((k) => [
          k,
          Object.values(s.buildings).filter((b) => b.kind === k && !b.damaged).length,
        ]),
      )
    const output = production({ ...s, turn: 0 }),
      plots = []
    for (const sector of s.sectors)
      for (let y = sector.y * 7; y < sector.y * 7 + 7; y++)
        for (let x = sector.x * 7; x < sector.x * 7 + 7; x++)
          if (
            terrainAt(s, { x, y }) === 'meadow' &&
            !s.buildings[key(x, y)] &&
            !blocksBuilding(s.discoveries[key(x, y)]) &&
            !s.affairs.settlements.some((c) => c.x === x && c.y === y)
          )
            plots.push({ x, y })
    const candidates = []
    const add = (score, action) => {
      const error = actionError(s, action)
      if (!error) candidates.push({ score, action })
      else if (score > 0 && error.startsWith('Brakuje zasobów'))
        candidates.push({ score: score - 0.5, action: { type: 'gather' } })
    }
    if (s.affairs.raid) add(200, { type: 'truce', enemyId: s.affairs.raid.enemyId })
    for (const b of Object.values(s.buildings))
      if (b.damaged) add(120, { type: 'repair', x: b.x, y: b.y })
    for (const kind of ECONOMY_BUILDINGS) {
      if (counts[kind] >= targets[kind]) continue
      const resource =
        kind === 'sawmill'
          ? 'wood'
          : kind === 'quarry'
            ? 'stone'
            : kind === 'market'
              ? 'gold'
              : 'food'
      const score = (p) => {
        const b = { ...p, kind, level: 1 },
          probe = { ...s, buildings: { ...s.buildings, [key(p.x, p.y)]: b } }
        if (kind === 'forester')
          return plantingSites(probe, b).filter((site) =>
            Object.values(s.buildings).some(
              (other) => other.kind === 'sawmill' && inForestRange(other, site),
            ),
          ).length
        return buildingProduction({ ...probe, turn: 0 }, b)[resource]
      }
      const p = plots.reduce((best, p) => (!best || score(p) > score(best) ? p : best), null)
      if (!p) continue
      let urgency = 30
      if (kind === 'farm' && counts.farm < 2) urgency = 100
      else if (kind === 'sawmill' && !counts.sawmill) urgency = 95
      else if (kind === 'quarry' && !counts.quarry) urgency = 90
      else if (kind === 'market' && !counts.market) urgency = 88
      else if (kind === 'house' && capacity(s) <= s.population + 1) urgency = 85
      else if (kind === 'farm' && output.food < s.population + 5) urgency = 80
      else if (kind === 'sawmill' && output.wood < 5) urgency = 65
      else if (kind === 'quarry' && output.stone < 4) urgency = 64
      else if (kind === 'market' && output.gold < 5) urgency = 63
      else if (kind === 'house' && capacity(s) < 23) urgency = 55
      else if (!counts[kind]) urgency = 54
      const planned = { type: 'build', kind, ...p }
      // Save for an important building instead of buying the cheaper farm every time.
      add(urgency, planned)
    }
    for (const d of Object.values(s.discoveries))
      if (d.status === 'available') add(52, { type: 'landmark', x: d.x, y: d.y })
    // Establish coin income before discovering hostile neighbours and paying for truces.
    if (
      counts.sawmill &&
      counts.quarry &&
      (s.sectors.length < 3 || counts.market >= 2) &&
      s.sectors.length < 7
    )
      add(48, { type: 'explore', x: s.sectors.length, y: 0 })
    for (const b of Object.values(s.buildings))
      if (b.kind !== 'hall' && b.level < 3) add(25, { type: 'upgrade', x: b.x, y: b.y })
    if (plots.length) add(5, { type: 'build', kind: 'farm', ...plots[0] })
    add(0, { type: 'gather' })
    const action = candidates.sort((a, b) => b.score - a.score)[0].action,
      result = resolveTurn(s, action)
    if (!result) throw Error('Illegal simulated action')
    if (result.promotion) milestones.push({ rank: result.promotion.rank, turn: result.state.turn })
    turns.push({ before: s, action, result })
    state = result.state
    if (state.status !== 'playing') break
  }
  return { state, milestones, turns }
}

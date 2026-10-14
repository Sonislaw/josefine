import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { simulateDevelopment } from '../../../../../tests/gry/kingdom-balance-simulation.mjs'
import { warKingdom, emptyPlot } from '../../../../../tests/gry/kingdom-war-fixture.mjs'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn, actionError, buildingProduction, key } =
  await j.import('./engine.ts')
const { inventoryLimit } = await j.import('./balance.ts')
const { WAR, upkeep, upkeepGold, armySize, UNITS } = await j.import('./military.ts')
const { enemyTarget, enemyDefence } = await j.import('./campaign.ts')
const { battle } = await j.import('./battle.ts')
const { decode } = await j.import('./storage.ts')
test('opening builds one farm, not instant upgrades or two farms; no economy rank bypass', () => {
  const s = newKingdom(9),
    p = resolveTurn(s, { type: 'build', kind: 'farm', x: 0, y: 0 })
  assert.deepEqual(p.cost, { wood: 12, stone: 3, food: 0, gold: 2 })
  assert.equal(resolveTurn(p.state, { type: 'build', kind: 'farm', x: 1, y: 0 }), null)
  const rich = structuredClone(p.state)
  rich.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  assert.match(actionError(rich, { type: 'upgrade', x: 0, y: 0 }), /Wioski/)
})
test('max-level adjacent production is bounded, and winter halves the capped complete harvest', () => {
  const s = newKingdom(42),
    farm = { x: 0, y: 0, kind: 'farm', level: 3 }
  s.buildings['0,0'] = farm
  for (const p of [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ])
    s.buildings[key(p.x, p.y)] = { ...p, kind: 'mill', level: 3 }
  assert.equal(buildingProduction(s, farm).food, 10)
  s.turn = 9
  assert.equal(buildingProduction(s, farm).food, 5)
  const saw = { x: 2, y: 2, kind: 'sawmill', level: 3 }
  assert.ok(buildingProduction(s, saw).wood <= 5)
})
test('mercenaries require stone, recruitment rations, coins and continuous pay; no pay causes desertion', () => {
  let s = warKingdom()
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  s.affairs.army = { spearman: 4, archer: 0, shieldbearer: 0 }
  s.resources.gold = 0
  assert.equal(upkeep(s.affairs.army), 2)
  assert.equal(upkeepGold(s.affairs.army), 1)
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.armyGold, 1)
  assert.equal(armySize(r.deserters), 0)
  s.affairs.army.spearman = 6
  const unpaid = resolveTurn(s, { type: 'gather' })
  assert.equal(unpaid.armyGold, 1)
  assert.equal(armySize(unpaid.deserters), 1)
  assert.equal(UNITS.spearman.cost.food, 2)
  assert.equal(UNITS.spearman.cost.stone, 3)
})
test('full garrison cannot be swept by an inexpensive six-spearman army; sacrificial attacks cannot cheaply erase it', () => {
  const enemy = enemyTarget(1),
    army = { spearman: 6, archer: 0, shieldbearer: 0 }
  for (const t of ['guard', 'volley', 'charge'])
    assert.equal(battle(army, enemy, t, false, 0, 'guard', enemyDefence(1)).victory, false)
  const sacrifice = battle(
    { spearman: 1, archer: 0, shieldbearer: 0 },
    enemy,
    'guard',
    false,
    0,
    'guard',
    enemyDefence(1),
  )
  assert.ok(armySize(sacrifice.enemyLosses) <= 1)
  assert.equal(WAR.recovery, 2)
  assert.deepEqual(
    [1, 2, 3].map((r) => armySize(enemyTarget(r))),
    [8, 11, 14],
  )
})
test('existing v6 saves keep stocks, military levels, earned ranks and scheduled raid; previous recovery counter stays valid', () => {
  const s = warKingdom()
  s.affairs.enemy.garrison = { spearman: 3, archer: 2, shieldbearer: 1 }
  s.affairs.enemy.recovery = 2
  const before = structuredClone(s),
    restored = decode(encode(s))
  assert.deepEqual(restored.state, before)
  const r = resolveTurn(restored.state, { type: 'gather' })
  assert.equal(r.state.affairs.enemy.recovery, 0)
  assert.ok(armySize(r.state.affairs.enemy.garrison) > 6)
})
test('inventory limits stop hoarding, forecast excess exactly, and never confiscate existing above-limit stocks', () => {
  const s = newKingdom(),
    limit = inventoryLimit(0)
  s.resources = { ...limit }
  s.buildings['0,0'] = { x: 0, y: 0, kind: 'farm', level: 3 }
  const r = resolveTurn(s, { type: 'gather' })
  assert.deepEqual(r.state.resources, limit)
  assert.ok(r.storageLoss.food > 0 && r.storageLoss.wood > 0 && r.storageLoss.stone > 0)
  s.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  const legacy = resolveTurn(s, { type: 'gather' })
  assert.deepEqual(legacy.state.resources, s.resources)
  assert.ok(decode(encode(legacy.state)))
})
test('end-of-turn diplomatic coins cannot retroactively cover unpaid army wages', () => {
  let s = warKingdom()
  s = resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }).state
  s.resources.gold = 0
  s.affairs.army = { spearman: 6, archer: 0, shieldbearer: 0 }
  const r = resolveTurn(s, { type: 'diplomacy', id: 0 })
  assert.equal(r.armyGold, 1)
  assert.equal(armySize(r.deserters), 1)
  assert.equal(r.state.resources.gold, 4)
})
test('legal development is slower but all ranks remain attainable for different maps, with no injected resources', () => {
  for (const seed of [1, 42, 183]) {
    const { state, milestones, turns } = simulateDevelopment(seed)
    assert.equal(
      state.rank,
      3,
      JSON.stringify({
        seed,
        turn: state.turn,
        population: state.population,
        buildings: Object.keys(state.buildings).length,
        sectors: state.sectors.length,
        stocks: state.resources,
      }),
    )
    assert.ok(milestones[0].turn >= 20)
    assert.ok(milestones[2].turn >= 80 && milestones[2].turn < 700)
    for (const t of turns) {
      assert.deepEqual(resolveTurn(t.before, t.action), t.result)
      assert.ok(decode(encode(t.result.state)))
      const limit = inventoryLimit(t.result.state.rank)
      assert.ok(Object.entries(t.result.state.resources).every(([k, n]) => n >= 0 && n <= limit[k]))
    }
    console.log(
      'Balanced development:',
      JSON.stringify({ seed, milestones, stocks: state.resources }),
    )
  }
})

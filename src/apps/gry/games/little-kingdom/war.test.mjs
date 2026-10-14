import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { warKingdom, beforeRaid, emptyPlot } from '../../../../../tests/gry/kingdom-war-fixture.mjs'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const {
  newKingdom,
  resolveTurn,
  actionError,
  key,
  production,
  buildingProduction,
  actionCost,
  deal,
} = await j.import('./engine.ts')
const { WAR, armySize, addArmy, emptyArmy, armyCapacity, militaryBuilding, towerStrength } =
  await j.import('./military.ts')
const { battle, tacticalStrength } = await j.import('./battle.ts')
const { enemyTarget, enemyTactic, raidingParty } = await j.import('./campaign.ts')
const { decode, load, SAVE_KEY, WARFARE_KEY } = await j.import('./storage.ts')
const go = (s, a) => {
  const r = resolveTurn(s, a)
  assert.ok(r, actionError(s, a))
  return r.state
}
const port = (data) => ({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) })
const withArmy = (rank = 1) => {
  let s = warKingdom()
  s.rank = rank
  s.promotions = Array.from({ length: rank }, (_, i) => ({ rank: i + 1, turn: 12 + i }))
  s = go(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) })
  const b = Object.values(s.buildings).find((b) => b.kind === 'barracks')
  b.level = rank
  s.affairs.army = {
    spearman: rank === 1 ? 4 : 6,
    archer: rank === 1 ? 1 : 2,
    shieldbearer: rank === 1 ? 1 : 2,
  }
  s.affairs.enemies[2].garrison = enemyTarget(rank)
  return s
}

test('three contacts stay deterministic, outside discovery neighbours, without changing cards', () => {
  const s = warKingdom()
  assert.deepEqual(
    s.affairs.settlements.map((c) => c.relation),
    ['friendly', 'neutral', 'hostile'],
  )
  assert.deepEqual(s.affairs.settlements, warKingdom().affairs.settlements)
  assert.equal(s.rng, newKingdom(42).rng)
  for (const c of s.affairs.settlements)
    assert.equal(resolveTurn(s, { type: 'build', kind: 'farm', x: c.x, y: c.y }), null)
  assert.equal(go(s, { type: 'explore', x: 4, y: 0 }).affairs.settlements.length, 3)
  for (let i = 0; i < 100; i++) assert.ok(!deal(i).offer.some(militaryBuilding))
})
test('barracks and tower have rank-gated levels, exact costs, six/nine/twelve capacity and no offer changes', () => {
  let s = warKingdom(),
    p = emptyPlot(s)
  const offer = [...s.offer],
    rng = s.rng
  s = go(s, { type: 'build', kind: 'barracks', ...p })
  assert.deepEqual(s.offer, offer)
  assert.equal(s.rng, rng)
  assert.equal(resolveTurn(s, { type: 'upgrade', ...p }), null)
  s.rank = 2
  s.promotions.push({ rank: 2, turn: 13 })
  assert.equal(actionCost(s, { type: 'upgrade', ...p }).wood, 90)
  s = go(s, { type: 'upgrade', ...p })
  assert.equal(armyCapacity(s.buildings[key(p.x, p.y)].level), 9)
  assert.equal(resolveTurn(s, { type: 'upgrade', ...p }), null)
  s.rank = 3
  s.promotions.push({ rank: 3, turn: 14 })
  s = go(s, { type: 'upgrade', ...p })
  assert.equal(armyCapacity(s.buildings[key(p.x, p.y)].level), 12)
  assert.equal(resolveTurn(s, { type: 'upgrade', ...p }), null)
  assert.equal(resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }), null)
  assert.deepEqual([1, 2, 3].map(towerStrength), [4, 6, 8])
  s.affairs.army = { spearman: 10, archer: 1, shieldbearer: 1 }
  assert.equal(resolveTurn(s, { type: 'recruit', unit: 'shieldbearer' }), null)
  assert.equal(resolveTurn(s, { type: 'demolish', ...p }), null)
})
test('shield recruitment consumes resources, leaves civilians untouched, upkeep/desertion includes third unit', () => {
  let s = withArmy()
  s.affairs.army = emptyArmy()
  const r = resolveTurn(s, { type: 'recruit', unit: 'shieldbearer' })
  assert.deepEqual(r.cost, { wood: 5, stone: 7, food: 2, gold: 9 })
  assert.equal(r.state.affairs.army.shieldbearer, 1)
  s = r.state
  s.population = 2
  s.resources.food = 0
  s.affairs.army = { spearman: 0, archer: 0, shieldbearer: 3 }
  const d = resolveTurn(s, { type: 'dismiss', unit: 'shieldbearer' })
  assert.equal(d.armyFood, 0)
  assert.equal(d.deserters.shieldbearer, 1)
  assert.equal(d.state.population, 2)
})
test('symmetric tactics, defender ties, fifty-percent charge and shield protection with surcharge last', () => {
  const a = { spearman: 2, archer: 2, shieldbearer: 2 }
  assert.equal(tacticalStrength(a, 'guard'), 24)
  assert.equal(tacticalStrength(a, 'volley'), 22)
  assert.equal(tacticalStrength(a, 'charge'), 27)
  assert.equal(tacticalStrength(a, 'none'), 18)
  const enemy = { spearman: 3, archer: 0, shieldbearer: 0 }
  const r = battle(a, enemy, 'guard', false, 99, 'volley')
  assert.equal(r.strength, 24)
  assert.equal(r.enemyStrength, 12)
  assert.equal(armySize(r.losses), 1)
  assert.equal(armySize(r.enemyLosses), 2)
  const tie = battle(a, a, 'guard', true, 0, 'guard')
  assert.equal(tie.victory, true)
  const offence = battle(a, a, 'guard', false, 0, 'guard')
  assert.equal(offence.victory, false)
  const surcharge = battle(
    { spearman: 0, archer: 0, shieldbearer: 6 },
    enemy,
    'charge',
    false,
    0,
    'none',
  )
  assert.equal(armySize(surcharge.losses), 1)
})
test('raid transfers round-robin troops; total includes dispatched units and never exceeds rank cap', () => {
  assert.deepEqual(raidingParty({ spearman: 3, archer: 2, shieldbearer: 1 }), {
    spearman: 2,
    archer: 1,
    shieldbearer: 1,
  })
  assert.equal(armySize(raidingParty(enemyTarget(3))), 10)
  let s = warKingdom(),
    contact = s.affairs.settlements[2].discoveredTurn
  while (s.turn < contact + 12 - 1) {
    s = go(s, { type: 'gather' })
    assert.equal(s.affairs.raid, null)
  }
  const previous = { ...s.affairs.enemies[2].garrison }
  s = go(s, { type: 'gather' })
  assert.equal(s.affairs.raid.dueTurn, s.turn + 4)
  assert.deepEqual(addArmy(s.affairs.enemies[2].garrison, s.affairs.raid.army), previous)
  const snapshot = structuredClone(s.affairs.raid)
  for (let i = 0; i < 3; i++) {
    s = go(s, { type: 'gather' })
    assert.deepEqual(s.affairs.raid, snapshot)
    assert.equal(armySize(addArmy(s.affairs.enemies[2].garrison, s.affairs.raid.army)), 8)
  }
})
test('enemy recovery adds at most one troop every second turn, round-robin skips full quotas and rank up never grants army', () => {
  let s = warKingdom()
  s.affairs.enemies[2].garrison = emptyArmy()
  s.affairs.enemies[2].recovery = 0
  for (let i = 1; i <= 6; i++) {
    s = go(s, { type: 'gather' })
    assert.equal(armySize(s.affairs.enemies[2].garrison), Math.floor(i / 2))
  }
  assert.deepEqual(s.affairs.enemies[2].garrison, { spearman: 1, archer: 1, shieldbearer: 1 })
  const before = armySize(s.affairs.enemies[2].garrison)
  s.rank = 3
  s.promotions = [
    { rank: 1, turn: 12 },
    { rank: 2, turn: 13 },
    { rank: 3, turn: 14 },
  ]
  s = go(s, { type: 'gather' })
  assert.equal(armySize(s.affairs.enemies[2].garrison), before)
})
test('garrison stance changes every four conflict turns, raid stance locks, peace freezes its counter', () => {
  let s = warKingdom()
  s.affairs.enemies[2].warTurns = 3
  s = go(s, { type: 'gather' })
  assert.equal(enemyTactic(s.affairs.enemies[2]), 'volley')
  s.affairs.enemies[2].advantage = 2
  s = go(s, { type: 'negotiate', enemyId: 2 })
  const turns = s.affairs.enemies[2].warTurns
  for (let i = 0; i < 8; i++) s = go(s, { type: 'gather' })
  assert.equal(s.affairs.enemies[2].warTurns, turns)
})
test('interception victory cancels raid and returns only survivors, without duplicating the garnison', () => {
  const s = beforeRaid({ spearman: 6, archer: 0, shieldbearer: 0 }, false, 3),
    reserve = armySize(s.affairs.enemies[2].garrison),
    wave = armySize(s.affairs.raid.army)
  const r = resolveTurn(s, {
    type: 'intercept',
    enemyId: 2,
    army: { ...s.affairs.army },
    tactic: 'guard',
  })
  assert.ok(r.battle.victory)
  assert.equal(r.battle.kind, 'intercept')
  assert.equal(r.state.affairs.raid, null)
  assert.equal(r.state.affairs.enemies[2].advantage, 1)
  assert.equal(r.state.affairs.protectedUntil, r.state.turn + 12)
  assert.equal(
    armySize(r.state.affairs.enemies[2].garrison),
    reserve + wave - armySize(r.battle.enemyLosses) + (r.campaignUpdate.recruited ? 1 : 0),
  )
  assert.equal(r.battle.populationLost, 0)
  assert.equal(r.battle.damaged, null)
})
test('losing interception preserves date, weakens wave, cannot repeat and never triggers a second battle', () => {
  const s = beforeRaid({ spearman: 1, archer: 0, shieldbearer: 0 }, true, 3),
    due = s.affairs.raid.dueTurn
  const r = resolveTurn(s, {
    type: 'intercept',
    enemyId: 2,
    army: { ...s.affairs.army },
    tactic: 'charge',
  })
  assert.equal(r.battle.victory, false)
  assert.equal(r.state.affairs.raid.dueTurn, due)
  assert.equal(r.state.affairs.raid.intercepted, true)
  assert.equal(r.battle.damaged, null)
  assert.equal(r.battle.populationLost, 0)
  assert.equal(r.state.affairs.protectedUntil, s.affairs.protectedUntil)
  assert.equal(
    resolveTurn(r.state, {
      type: 'intercept',
      enemyId: 2,
      army: { spearman: 1, archer: 0, shieldbearer: 0 },
    }),
    null,
  )
  const last = beforeRaid({ spearman: 6, archer: 0, shieldbearer: 0 })
  assert.equal(
    resolveTurn(last, { type: 'intercept', enemyId: 2, army: { ...last.affairs.army } }),
    null,
  )
  assert.ok(decode(encode(r.state)))
})
test('ordinary expeditions have a two-turn cooldown, actual enemy losses, loot and no free protection', () => {
  let s = withArmy(),
    initial = s.affairs.protectedUntil
  s.affairs.enemies[2].garrison = { spearman: 2, archer: 1, shieldbearer: 0 }
  const r = resolveTurn(s, { type: 'expedition', enemyId: 2, army: { ...s.affairs.army } })
  assert.ok(r.battle.victory)
  assert.equal(r.state.affairs.enemies[2].advantage, 1)
  assert.equal(r.state.affairs.protectedUntil, initial)
  assert.equal(armySize(r.battle.enemyLosses), 2)
  assert.ok(Object.values(r.battle.loot).some((v) => v > 0))
  assert.ok(r.battle.castleDamage > 0)
  s = r.state
  assert.equal(
    resolveTurn(s, { type: 'expedition', enemyId: 2, army: { ...s.affairs.army } }),
    null,
  )
  s = go(s, { type: 'gather' })
  assert.ok(resolveTurn(s, { type: 'expedition', enemyId: 2, army: { ...s.affairs.army } }))
})
test('invalid or unavailable army/actions never mutate resources, RNG, raid or campaign', () => {
  const s = withArmy(),
    before = structuredClone(s)
  for (const action of [
    { type: 'forcePeace', enemyId: 2, army: { ...s.affairs.army } },
    { type: 'negotiate', enemyId: 2 },
    { type: 'intercept', enemyId: 2, army: { ...s.affairs.army } },
    { type: 'expedition', enemyId: 2, army: { spearman: 9, archer: 0, shieldbearer: 0 } },
    { type: 'expedition', enemyId: 2, army: { spearman: -1, archer: 1, shieldbearer: 0 } },
    { type: 'expedition', enemyId: 2, army: { spearman: 0, archer: 0, shieldbearer: 0 } },
  ])
    assert.equal(resolveTurn(s, action), null)
  assert.deepEqual(s, before)
})
test('truce returns live wave, keeps advantage, cancels even a due attack and protects twelve full turns', () => {
  const s = beforeRaid()
  s.affairs.enemies[2].advantage = 2
  const total = armySize(addArmy(s.affairs.enemies[2].garrison, s.affairs.raid.army)),
    r = resolveTurn(s, { type: 'truce', enemyId: 2 })
  assert.equal(r.battle, null)
  assert.equal(r.state.affairs.raid, null)
  assert.equal(r.state.affairs.enemies[2].advantage, 2)
  assert.equal(r.state.affairs.protectedUntil, r.state.turn + 12)
  assert.equal(armySize(r.state.affairs.enemies[2].garrison), total)
})
test('negotiated peace cancels raid, lasts 36 full turns, rebuilds enemy and resets advantage on next campaign', () => {
  let s = beforeRaid()
  s.affairs.enemies[2].advantage = 2
  const r = resolveTurn(s, { type: 'negotiate', enemyId: 2 })
  assert.deepEqual(r.cost, { wood: 0, stone: 0, food: 24, gold: 40 })
  s = r.state
  const until = s.affairs.enemies[2].peaceUntil,
    warTurns = s.affairs.enemies[2].warTurns
  assert.equal(until, s.turn + 36)
  assert.equal(s.affairs.raid, null)
  assert.equal(s.affairs.settlements[2].relation, 'peaceful')
  for (let i = 0; i < 35; i++) {
    s = go(s, { type: 'gather' })
    assert.equal(s.affairs.raid, null)
    assert.equal(s.affairs.enemies[2].warTurns, warTurns)
  }
  s = go(s, { type: 'gather' })
  assert.equal(s.turn, until)
  assert.equal(s.affairs.enemies[2].campaign, 2)
  assert.equal(s.affairs.enemies[2].advantage, 0)
  assert.equal(s.affairs.raid.dueTurn, s.turn + 4)
  assert.equal(s.affairs.enemies[2].warTurns, 0)
})
test('forced peace requires two advantage points, pays once per campaign after feeding and allows next campaign', () => {
  let s = withArmy()
  s.affairs.enemies[2].advantage = 2
  s.affairs.enemies[2].garrison = { spearman: 2, archer: 1, shieldbearer: 0 }
  const r = resolveTurn(s, {
    type: 'forcePeace',
    enemyId: 2,
    army: { ...s.affairs.army },
    tactic: 'guard',
  })
  assert.ok(r.battle.victory)
  assert.deepEqual(r.battle.loot, WAR.loot)
  assert.equal(r.state.affairs.enemies[2].lootCampaign, 1)
  assert.equal(r.state.affairs.enemies[2].peaceUntil, r.state.turn + 36)
  assert.equal(
    resolveTurn(r.state, { type: 'forcePeace', enemyId: 2, army: { ...r.state.affairs.army } }),
    null,
  )
  s = structuredClone(withArmy())
  s.affairs.enemies[2].advantage = 2
  s.affairs.enemies[2].lootCampaign = 1
  s.affairs.enemies[2].garrison = { spearman: 2, archer: 1, shieldbearer: 0 }
  assert.ok(
    Object.values(
      resolveTurn(s, { type: 'forcePeace', enemyId: 2, army: { ...s.affairs.army } }).battle.loot,
    ).every((v) => v === 0),
  )
})
test('failed forcePeace reduces advantage, keeps war and protection unchanged, and restores no casualties', () => {
  const s = withArmy()
  s.affairs.enemies[2].advantage = 2
  const r = resolveTurn(s, {
    type: 'forcePeace',
    enemyId: 2,
    army: { spearman: 1, archer: 0, shieldbearer: 0 },
  })
  assert.equal(r.battle.victory, false)
  assert.equal(r.state.affairs.enemies[2].advantage, 1)
  assert.equal(r.state.affairs.enemies[2].peaceUntil, null)
  assert.equal(r.state.affairs.protectedUntil, s.affairs.protectedUntil)
  assert.ok(Object.values(r.battle.loot).every((v) => v === 0))
})
test('raid damage still precedes harvest, repair preserves levels, new tower/recruit joins defence, fatal raid cannot regrow', () => {
  const s = beforeRaid(),
    r = resolveTurn(s, { type: 'gather' }),
    p = r.battle.damaged
  assert.equal(r.battle.victory, false)
  assert.equal(r.battle.populationLost, 1)
  const b = r.state.buildings[key(p.x, p.y)]
  assert.equal(buildingProduction(r.state, b).food, 0)
  assert.equal(b.level, 2)
  assert.deepEqual(r.produced, production(r.state))
  assert.equal(resolveTurn(r.state, { type: 'upgrade', ...p }), null)
  const fixed = resolveTurn(r.state, { type: 'repair', ...p })
  assert.equal(fixed.state.buildings[key(p.x, p.y)].damaged, false)
  assert.ok(fixed.produced.food > r.produced.food)
  const armed = beforeRaid({ spearman: 3, archer: 0, shieldbearer: 0 }),
    built = resolveTurn(armed, { type: 'build', kind: 'watchtower', ...emptyPlot(armed) })
  assert.equal(built.battle.strength, 22)
  assert.equal(built.battle.victory, false) // A small army plus a new tower no longer guarantees a win.
  const recruited = resolveTurn(armed, { type: 'recruit', unit: 'spearman' })
  assert.equal(recruited.battle.strength, 24)
  const last = beforeRaid()
  last.population = 1
  last.resources = { wood: 0, stone: 0, food: 0, gold: 0 }
  const dead = resolveTurn(last, { type: 'gather' })
  assert.equal(dead.state.population, 0)
  assert.equal(dead.state.status, 'gameover')
  assert.equal(dead.campaignUpdate.recruited, null)
})
test('v5 active raid migration preserves deadline, army, ranks, damage and original bytes; next forecast roundtrips', () => {
  const s = beforeRaid({ spearman: 2, archer: 2, shieldbearer: 0 }),
    raw = encode(s, 5),
    data = new Map([[WARFARE_KEY, raw]])
  const result = load(port(data))
  assert.equal(result.status, 'saved')
  assert.equal(data.get(WARFARE_KEY), raw)
  const migrated = result.state
  assert.equal(migrated.turn, s.turn)
  assert.deepEqual(migrated.resources, s.resources)
  assert.deepEqual(migrated.affairs.raid.army, WAR.raiders)
  assert.equal(migrated.affairs.raid.tactic, 'none')
  assert.equal(migrated.affairs.raid.dueTurn, s.affairs.raid.dueTurn)
  assert.deepEqual(migrated.affairs.army, s.affairs.army)
  assert.equal(
    armySize(addArmy(migrated.affairs.enemies[2].garrison, migrated.affairs.raid.army)),
    6,
  )
  assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 7)
  assert.deepEqual(decode(data.get(SAVE_KEY)).state, migrated)
  const before = structuredClone(migrated),
    a = { type: 'gather', tactic: 'guard' }
  assert.deepEqual(resolveTurn(migrated, a), resolveTurn(migrated, a))
  assert.deepEqual(migrated, before)
})
test('previously subdued save receives 36 quiet turns without migration rewards; malformed v6 never falls back', () => {
  const s = withArmy()
  s.affairs.enemies[2].advantage = 2
  const peaceful = go(s, { type: 'negotiate', enemyId: 2 })
  const raw = encode(peaceful, 5),
    data = new Map([[WARFARE_KEY, raw]])
  const migrated = load(port(data)).state
  assert.equal(migrated.affairs.enemies[2].peaceUntil, peaceful.turn + 36)
  assert.deepEqual(migrated.resources, peaceful.resources)
  for (const mutate of [
    (s) => (s.affairs.enemies[2].garrison.spearman = 13),
    (s) => (s.affairs.enemies[2].advantage = 3),
    (s) => (s.affairs.enemies[2].recovery = 3),
    (s) => (s.affairs.raid.dueTurn = s.turn),
    (s) => (s.affairs.raid.intercepted = 'yes'),
    (s) => (s.affairs.army.shieldbearer = -1),
  ]) {
    const bad = beforeRaid()
    mutate(bad)
    const broken = encode(bad)
    data.set(SAVE_KEY, broken)
    assert.equal(load(port(data)).status, 'corrupt')
    assert.equal(data.get(SAVE_KEY), broken)
  }
  const unavailable = {
    getItem: (k) => (k === WARFARE_KEY ? raw : null),
    setItem() {
      throw Error('quota')
    },
  }
  assert.equal(load(unavailable).migrationSaveFailed, true)
})
test('friendly and neutral one-time gifts stay unchanged and cannot rescue earlier feeding', () => {
  const s = warKingdom()
  s.population = 5
  s.resources.food = 0
  const r = resolveTurn(s, { type: 'diplomacy', id: 0 })
  assert.equal(r.shortage, true)
  assert.equal(r.state.resources.food, 8)
  assert.equal(resolveTurn(r.state, { type: 'diplomacy', id: 0 }), null)
  const next = go(r.state, { type: 'diplomacy', id: 1 })
  assert.equal(next.affairs.settlements[1].relation, 'friendly')
  assert.equal(resolveTurn(next, { type: 'diplomacy', id: 1 }), null)
})
test('multi-year campaigns at all ranks: offence, defence, rebuilding and peace permit recovery without offline time', () => {
  for (const rank of [1, 2, 3]) {
    let s = withArmy(rank),
      wars = 0,
      peaces = 0
    const p = emptyPlot(s)
    s.buildings[key(p.x, p.y)] = { ...p, kind: 'farm', level: 3 }
    s = go(s, { type: 'build', kind: 'watchtower', ...emptyPlot(s) })
    Object.values(s.buildings).find((b) => b.kind === 'watchtower').level = rank
    for (let i = 0; i < 180; i++) {
      const e = s.affairs.enemies[2],
        cap = armyCapacity(rank)
      let a = { type: 'gather' }
      const damaged = Object.values(s.buildings).find((b) => b.damaged)
      if (e.peaceUntil !== null) {
        if (armySize(s.affairs.army) < cap) a = { type: 'recruit', unit: 'spearman' }
      } else if (e.advantage === 2) a = { type: 'negotiate', enemyId: 2 }
      else if (damaged) a = { type: 'repair', x: damaged.x, y: damaged.y }
      else if (armySize(s.affairs.army) < cap) a = { type: 'recruit', unit: 'spearman' }
      else if (!s.affairs.raid && s.turn + 1 >= e.expeditionAvailableTurn)
        a = { type: 'expedition', enemyId: 2, army: { ...s.affairs.army } }
      const r = resolveTurn(s, a)
      assert.ok(r, actionError(s, a))
      s = r.state
      if (r.battle) wars++
      if (a.type === 'negotiate') peaces++
      assert.equal(s.status, 'playing')
      assert.ok(decode(encode(s)))
      assert.ok(
        armySize(addArmy(s.affairs.enemies[2].garrison, s.affairs.raid?.army ?? emptyArmy())) <=
          armySize(enemyTarget(rank)),
      )
    }
    assert.ok(wars >= 3 && peaces >= 2)
    assert.ok(s.resources.food > 0)
  }
})

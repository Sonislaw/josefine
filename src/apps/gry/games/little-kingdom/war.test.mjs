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
  actionCost,
  production,
  buildingProduction,
  key,
  deal,
} = await j.import('./engine.ts')
const { WAR, militaryBuilding } = await j.import('./military.ts')
const { battle } = await j.import('./battle.ts')
const { settlementPosition } = await j.import('./neighbours.ts')
const { discoveryForSector } = await j.import('./discoveries.ts')
const { requestProgress } = await j.import('./requests.ts')
const { rankProgress } = await j.import('./progression.ts')
const { decode, load, save, SAVE_KEY, REQUESTS_KEY } = await j.import('./storage.ts')
const port = (data) => ({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) })
const go = (s, a) => {
  const r = resolveTurn(s, a)
  assert.ok(r, actionError(s, a))
  return r.state
}

test('three sequential contacts are deterministic, separate from discoveries and cards; no backfill or fourth contact', () => {
  const s = warKingdom()
  assert.deepEqual(
    s.affairs.settlements.map((c) => c.relation),
    ['friendly', 'neutral', 'hostile'],
  )
  assert.deepEqual(s.offer, newKingdom(42).offer)
  assert.equal(s.rng, newKingdom(42).rng)
  assert.deepEqual(s.affairs.settlements, warKingdom().affairs.settlements)
  for (const c of s.affairs.settlements)
    assert.equal(resolveTurn(s, { type: 'build', kind: 'farm', x: c.x, y: c.y }), null)
  assert.equal(go(s, { type: 'explore', x: 4, y: 0 }).affairs.settlements.length, 3)
  for (let seed = 0; seed < 100; seed++) {
    const sec = { x: -2, y: 3 },
      d = discoveryForSector(seed, sec, 1),
      p = settlementPosition(seed, sec, d)
    assert.ok(Math.abs(d.x - p.x) + Math.abs(d.y - p.y) > 1)
    assert.deepEqual(p, settlementPosition(seed, sec, d))
    assert.ok(!deal(seed).offer.some(militaryBuilding))
  }
})
test('military construction unlock, uniqueness, level cap, offer preservation and capacity', () => {
  let s = warKingdom(),
    p = emptyPlot(s)
  const locked = newKingdom()
  locked.resources = { ...s.resources }
  assert.equal(resolveTurn(locked, { type: 'build', kind: 'barracks', ...emptyPlot(locked) }), null)
  const oldOffer = [...s.offer],
    rng = s.rng
  s = go(s, { type: 'build', kind: 'barracks', ...p })
  assert.deepEqual(s.offer, oldOffer)
  assert.equal(s.rng, rng)
  assert.equal(resolveTurn(s, { type: 'upgrade', ...p }), null)
  assert.equal(resolveTurn(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) }), null)
  const before = rankProgress(s).find((p) => p.id === 'buildings')?.value
  s = go(s, { type: 'build', kind: 'watchtower', ...emptyPlot(s) })
  assert.equal(rankProgress(s).find((p) => p.id === 'buildings')?.value, before)
  for (let i = 0; i < 6; i++) s = go(s, { type: 'recruit', unit: 'spearman' })
  assert.equal(s.affairs.army.spearman, 6)
  assert.equal(resolveTurn(s, { type: 'recruit', unit: 'archer' }), null)
  assert.equal(resolveTurn(s, { type: 'demolish', ...p }), null)
  for (let i = 0; i < 6; i++) s = go(s, { type: 'dismiss', unit: 'spearman' })
  assert.ok(resolveTurn(s, { type: 'demolish', ...p }))
})
test('raid has 12 quiet turns and 4 complete preparation turns; preview is immutable and roundtrips', () => {
  let s = warKingdom(),
    contact = s.affairs.settlements[2].discoveredTurn
  while (s.turn < contact + 12 - 1) {
    s = go(s, { type: 'gather' })
    assert.equal(s.affairs.raid, null)
  }
  s = go(s, { type: 'gather' })
  assert.deepEqual(s.affairs.raid, { announcedTurn: contact + 12, dueTurn: contact + 16 })
  for (let i = 0; i < 3; i++) {
    const r = resolveTurn(s, { type: 'gather' })
    assert.equal(r.battle, null)
    s = r.state
  }
  assert.deepEqual(decode(encode(s)).state, s)
  const before = structuredClone(s),
    a = { type: 'gather', tactic: 'guard' },
    r = resolveTurn(s, a)
  assert.deepEqual(s, before)
  assert.deepEqual(r, resolveTurn(s, a))
  assert.ok(r.battle)
  assert.equal(r.state.affairs.raid, null)
  assert.equal(r.state.affairs.protectedUntil, r.state.turn + 12)
})
test('combat tactics, defender ties, superiority, charge surcharge and spearmen-first casualties', () => {
  const a = { spearman: 2, archer: 2 },
    enemy = { spearman: 3, archer: 0 }
  assert.equal(battle(a, enemy, 'guard', false).strength, 18)
  assert.equal(battle(a, enemy, 'volley', false).strength, 18)
  assert.equal(battle(a, enemy, 'charge', false).strength, 17)
  assert.deepEqual(battle(a, enemy, 'charge', false).losses, { spearman: 2, archer: 0 })
  const tie = { spearman: 3, archer: 2 }
  assert.equal(battle({ spearman: 2, archer: 0 }, tie, 'guard', true, 6).victory, true)
  assert.equal(battle({ spearman: 3, archer: 0 }, tie, 'guard', false).victory, false)
  assert.deepEqual(
    battle({ spearman: 6, archer: 0 }, { spearman: 2, archer: 0 }, 'guard', false).losses,
    { spearman: 0, archer: 0 },
  )
})
test('losing raid damages production before harvest, loots bounded stocks, loses civilian; repair preserves level', () => {
  const s = beforeRaid(),
    r = resolveTurn(s, { type: 'gather' }),
    b = r.state.buildings[key(r.battle.damaged.x, r.battle.damaged.y)]
  assert.equal(r.battle.victory, false)
  assert.equal(r.battle.populationLost, 1)
  assert.deepEqual(r.battle.plunder, WAR.plunder)
  assert.equal(b.level, 2)
  assert.equal(b.damaged, true)
  assert.equal(buildingProduction(r.state, b).food, 0)
  assert.deepEqual(r.produced, production(r.state))
  assert.equal(resolveTurn(r.state, { type: 'upgrade', x: b.x, y: b.y }), null)
  assert.deepEqual(actionCost(r.state, { type: 'repair', x: b.x, y: b.y }), {
    wood: 3,
    stone: 0,
    food: 0,
    gold: 0,
  })
  const fixed = resolveTurn(r.state, { type: 'repair', x: b.x, y: b.y })
  assert.equal(fixed.state.buildings[key(b.x, b.y)].damaged, false)
  assert.equal(fixed.state.buildings[key(b.x, b.y)].level, 2)
  assert.ok(fixed.produced.food > r.produced.food)
  const demolished = resolveTurn(r.state, { type: 'demolish', x: b.x, y: b.y })
  assert.equal(demolished.delta.wood, demolished.produced.wood)
})
test('fatal raid cannot regrow civilians, no valid target causes no extra damage and loot never underflows', () => {
  const s = beforeRaid()
  s.population = 1
  s.resources = { wood: 0, stone: 0, food: 0, gold: 0 }
  s.turn = s.affairs.raid.dueTurn - 1
  for (const [k, b] of Object.entries(s.buildings)) if (b.kind === 'farm') delete s.buildings[k]
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.state.status, 'gameover')
  assert.equal(r.state.population, 0)
  assert.equal(r.battle.damaged, null)
  assert.ok(Object.values(r.state.resources).every((n) => n >= 0))
  assert.equal(resolveTurn(r.state, { type: 'gather' }), null)
})
test('new tower or recruit joins this turn defence; truce cancels even a due raid', () => {
  let s = beforeRaid({ spearman: 2, archer: 0 })
  const built = resolveTurn(s, { type: 'build', kind: 'watchtower', ...emptyPlot(s) })
  assert.equal(built.battle.victory, true)
  assert.equal(built.battle.strength, 18)
  const recruited = resolveTurn(s, { type: 'recruit', unit: 'spearman' })
  assert.equal(recruited.battle.strength, 18)
  assert.equal(recruited.battle.victory, true)
  const peace = resolveTurn(s, { type: 'truce' })
  assert.equal(peace.battle, null)
  assert.equal(peace.state.affairs.raid, null)
  assert.equal(peace.cost.gold, 12)
  assert.equal(peace.state.affairs.protectedUntil, peace.state.turn + 12)
})
test('upkeep follows civilian feeding, consumes remaining food and deserts one spearman first', () => {
  let s = warKingdom()
  s = go(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) })
  s.affairs.army = { spearman: 2, archer: 2 }
  s.resources.food = 0
  s.population = 2
  const r = resolveTurn(s, { type: 'dismiss', unit: 'archer' })
  assert.equal(r.shortage, false)
  assert.equal(r.armyFood, 0)
  assert.deepEqual(r.deserters, { spearman: 1, archer: 0 })
  assert.deepEqual(r.state.affairs.army, { spearman: 1, archer: 1 })
})
test('expedition validates selection and warning, pays once after feeding, ends hostility', () => {
  let s = warKingdom()
  s = go(s, { type: 'build', kind: 'barracks', ...emptyPlot(s) })
  s.affairs.army = { spearman: 6, archer: 0 }
  const before = structuredClone(s)
  for (const army of [
    { spearman: -1, archer: 1 },
    { spearman: 7, archer: 0 },
    { spearman: 0, archer: 0 },
    { spearman: 1.5, archer: 0 },
  ])
    assert.equal(resolveTurn(s, { type: 'expedition', army }), null)
  assert.deepEqual(s, before)
  const r = resolveTurn(s, {
    type: 'expedition',
    army: { spearman: 4, archer: 0 },
    tactic: 'guard',
  })
  assert.equal(r.battle.victory, true)
  assert.deepEqual(r.battle.loot, WAR.loot)
  assert.equal(r.state.affairs.army.spearman, 5)
  assert.equal(r.state.affairs.settlements[2].relation, 'subdued')
  assert.equal(resolveTurn(r.state, { type: 'expedition', army: { spearman: 1, archer: 0 } }), null)
  assert.equal(
    resolveTurn(beforeRaid({ spearman: 6, archer: 0 }), {
      type: 'expedition',
      army: { spearman: 6, archer: 0 },
    }),
    null,
  )
})
test('friendly gifts and neutral diplomacy are one-time turns; reward cannot feed civilians retroactively', () => {
  let s = warKingdom()
  s.population = 5
  s.resources.food = 0
  const r = resolveTurn(s, { type: 'diplomacy', id: 0 })
  assert.equal(r.shortage, true)
  assert.equal(r.state.resources.food, 8)
  assert.equal(resolveTurn(r.state, { type: 'diplomacy', id: 0 }), null)
  const n = resolveTurn(r.state, { type: 'diplomacy', id: 1 })
  assert.equal(n.state.affairs.settlements[1].relation, 'friendly')
  assert.equal(n.diplomaticReward.gold, 12)
  assert.equal(resolveTurn(n.state, { type: 'diplomacy', id: 1 }), null)
})
test('damaged mills stop bonuses; damaged farms do not count for requests or promotions', () => {
  const s = newKingdom()
  s.rank = 1
  s.buildings['0,0'] = { x: 0, y: 0, kind: 'mill', level: 2, damaged: true }
  s.buildings['1,0'] = { x: 1, y: 0, kind: 'farm', level: 3 }
  s.buildings['0,1'] = { x: 0, y: 1, kind: 'farm', level: 3, damaged: true }
  assert.equal(requestProgress(s, 'mill-farms').complete, false)
  const base = buildingProduction(s, s.buildings['1,0']).food
  s.buildings['0,0'].damaged = false
  assert.equal(buildingProduction(s, s.buildings['1,0']).food, base + 12)
  assert.equal(requestProgress(s, 'mill-farms').complete, false)
  assert.equal(rankProgress(s).find((p) => p.id === 'buildings').value, 2)
})
test('v5 roundtrip, v4 migration preserves requests and original bytes; corruption never falls back', () => {
  const s = beforeRaid({ spearman: 2, archer: 2 }, true)
  assert.deepEqual(decode(encode(s)).state, s)
  const old = newKingdom(77),
    raw = encode(old, 4),
    data = new Map([[REQUESTS_KEY, raw]])
  assert.deepEqual(load(port(data)).state, old)
  assert.equal(data.get(REQUESTS_KEY), raw)
  assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 5)
  for (const mutate of [
    (s) => (s.affairs.army.spearman = 7),
    (s) => (s.affairs.settlements[2].id = 1),
    (s) => (s.affairs.raid.dueTurn = s.turn),
    (s) => (s.buildings['3,3'].damaged = true),
  ]) {
    const bad = structuredClone(s)
    mutate(bad)
    data.set(SAVE_KEY, encode(bad))
    assert.equal(load(port(data)).status, 'corrupt')
    assert.equal(data.get(SAVE_KEY), encode(bad))
  }
  const unavailable = {
    getItem: (k) => (k === REQUESTS_KEY ? raw : null),
    setItem() {
      throw Error('quota')
    },
  }
  assert.equal(load(unavailable).migrationSaveFailed, true)
  assert.equal(save(unavailable, s, false), false)
})
test('multi-year playable paths: defend, pay peace, recover from loss and subdue', () => {
  for (const path of ['defend', 'peace', 'recover']) {
    let s = beforeRaid(
      path === 'defend' ? { spearman: 4, archer: 0 } : { spearman: 0, archer: 0 },
      path === 'defend',
    )
    let victories = 0,
      losses = 0
    for (let i = 0; i < 60; i++) {
      let a = { type: 'gather' }
      const damaged = Object.values(s.buildings).find((b) => b.damaged)
      if (path === 'peace' && s.affairs.raid) a = { type: 'truce' }
      else if (damaged) a = { type: 'repair', x: damaged.x, y: damaged.y }
      else if (path !== 'peace' && s.affairs.army.spearman < 4)
        a = { type: 'recruit', unit: 'spearman' }
      const r = resolveTurn(s, a)
      assert.ok(r)
      s = r.state
      if (r.battle) r.battle.victory ? victories++ : losses++
      assert.equal(s.status, 'playing')
      assert.ok(decode(encode(s)))
    }
    if (path === 'defend') assert.ok(victories > 0 && losses === 0)
    if (path === 'peace') assert.equal(losses, 0)
    if (path === 'recover') assert.ok(losses === 1 && victories > 0)
    if (path !== 'peace') {
      s = go(s, { type: 'truce' })
      while (s.affairs.army.spearman < 4) s = go(s, { type: 'recruit', unit: 'spearman' })
      s = go(s, { type: 'expedition', army: { spearman: 4, archer: 0 } })
      assert.equal(s.affairs.settlements[2].relation, 'subdued')
    }
  }
})

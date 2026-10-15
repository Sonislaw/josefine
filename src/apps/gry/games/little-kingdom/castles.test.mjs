import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { castlesKingdom } from '../../../../../tests/gry/kingdom-castles-fixture.mjs'
import { warKingdom, beforeRaid } from '../../../../../tests/gry/kingdom-war-fixture.mjs'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { resolveTurn, actionError, terrain, sectorOf, newKingdom } = await j.import('./engine.ts')
const { CASTLES, castleAppears } = await j.import('./castles.ts')
const { SAVE_KEY, CAMPAIGN_KEY, load, decode } = await j.import('./storage.ts')
const { armySize, emptyArmy } = await j.import('./military.ts')
const attack = (s, enemyId = 2) =>
  resolveTurn(s, { type: 'expedition', enemyId, army: { ...s.affairs.army }, tactic: 'guard' })
const step = (s) => resolveTurn(s, { type: 'gather' }).state

test('further exploration finds many unique deterministic castles without consuming offer RNG', () => {
  const a = castlesKingdom(6),
    b = castlesKingdom(6)
  assert.deepEqual(a, b)
  assert.equal(Object.keys(a.affairs.enemies).length, 6)
  assert.equal(a.affairs.settlements.length, 8)
  const original = warKingdom(42)
  assert.equal(a.seed, original.seed)
  for (const c of a.affairs.settlements.filter((c) => c.id >= 3)) {
    assert.ok(castleAppears(a.seed, sectorOf(c)))
    assert.equal(terrain(a.seed, c.x, c.y), 'meadow')
    assert.equal(a.buildings[`${c.x},${c.y}`], undefined)
  }
  assert.ok(decode(encode(a)))
})
test('preview is immutable, targeted victory withdraws finite loot and damages only its castle', () => {
  const s = castlesKingdom(2)
  s.affairs.enemies[3].garrison = emptyArmy()
  const before = structuredClone(s),
    r = attack(s, 3)
  assert.deepEqual(s, before)
  assert.ok(r.battle.victory)
  assert.equal(r.battle.enemyId, 3)
  assert.equal(r.battle.castleDamage, 35)
  assert.equal(r.state.affairs.enemies[3].health, 65)
  assert.equal(r.state.affairs.enemies[2].health, 100)
  assert.deepEqual(r.battle.loot, CASTLES.plunder)
  for (const k of ['wood', 'stone', 'food', 'gold'])
    assert.equal(
      r.state.affairs.enemies[3].treasury[k],
      before.affairs.enemies[3].treasury[k] - r.battle.loot[k],
    )
  assert.deepEqual(attack(s, 3), r)
  assert.ok(decode(encode(r.state)))
})
test('ordinary victory does 26 points; defeat gives neither loot nor damage', () => {
  const s = castlesKingdom(1)
  s.affairs.enemies[2].garrison = { spearman: 4, archer: 3, shieldbearer: 1 }
  s.affairs.army = { spearman: 8, archer: 0, shieldbearer: 0 }
  const r = attack(s)
  assert.ok(r.battle.victory)
  assert.equal(r.battle.castleDamage, 26)
  s.affairs.army.spearman = 1
  const lost = attack(s)
  assert.equal(lost.battle.victory, false)
  assert.equal(lost.state.affairs.enemies[2].health, 100)
  assert.deepEqual(lost.battle.loot, { wood: 0, stone: 0, food: 0, gold: 0 })
})
test('two-turn cooldown and slower repairs reward rapid consecutive attacks', () => {
  const s = castlesKingdom(1)
  s.affairs.enemies[2].garrison = emptyArmy()
  const first = attack(s).state
  assert.equal(attack(first), null)
  const ready = step(first)
  assert.equal(ready.affairs.enemies[2].health, 68)
  const second = attack(ready)
  assert.ok(second && second.state.affairs.enemies[2].health < 65)
  let waited = first
  for (let i = 0; i < 6; i++) waited = step(waited)
  assert.ok(attack(waited).state.affairs.enemies[2].health > second.state.affairs.enemies[2].health)
})
test('treasury shortage limits loot; destruction empties remainder once and leaves permanent unbuildable ruins', () => {
  const s = castlesKingdom(2),
    e = s.affairs.enemies[2]
  e.garrison = emptyArmy()
  e.health = 20
  e.treasury = { wood: 1, stone: 2, food: 0, gold: 1 }
  const r = attack(s),
    dead = r.state.affairs.enemies[2]
  assert.ok(r.battle.castleDestroyed)
  assert.deepEqual(r.battle.loot, e.treasury)
  assert.equal(dead.health, 0)
  assert.equal(dead.destroyedTurn, r.state.turn)
  assert.equal(armySize(dead.garrison), 0)
  assert.deepEqual(dead.treasury, emptyResources())
  const c = r.state.affairs.settlements.find((c) => c.id === 2)
  assert.equal(c.relation, 'ruins')
  assert.equal(attack(r.state), null)
  assert.equal(resolveTurn(r.state, { type: 'build', kind: 'farm', x: c.x, y: c.y }), null)
  let next = r.state
  for (let i = 0; i < 30; i++) next = step(next)
  assert.deepEqual(next.affairs.enemies[2], dead)
  assert.notEqual(next.affairs.raid?.enemyId, 2)
  assert.ok(decode(encode(next)))
})
const emptyResources = () => ({ wood: 0, stone: 0, food: 0, gold: 0 })
test('destruction awards the remaining treasury exactly once; slow restock conserves resources', () => {
  const s = castlesKingdom(1),
    e = s.affairs.enemies[2]
  e.health = 1
  e.garrison = emptyArmy()
  const r = attack(s)
  assert.deepEqual(r.battle.loot, e.treasury)
  assert.deepEqual(r.state.affairs.enemies[2].treasury, emptyResources())
  const a = castlesKingdom(1)
  a.affairs.enemies[2].garrison = emptyArmy()
  let next = attack(a).state
  const initial = { ...next.affairs.enemies[2].treasury }
  const count = next.affairs.enemies[2].stockRecovery
  for (let i = count; i < CASTLES.replenishTurns; i++) next = step(next)
  for (const k of ['wood', 'stone', 'food', 'gold'])
    assert.equal(
      next.affairs.enemies[2].treasury[k],
      Math.min(CASTLES.treasury[k], initial[k] + CASTLES.replenish[k]),
    )
})
test('every living enemy recovers independently, but only one fair incoming wave can exist', () => {
  let s = castlesKingdom(4)
  const ids = Object.keys(s.affairs.enemies).map(Number)
  for (const e of Object.values(s.affairs.enemies)) {
    e.garrison = emptyArmy()
    e.health = 60
    e.recovery = 0
  }
  s = step(step(s))
  for (const e of Object.values(s.affairs.enemies)) {
    assert.equal(armySize(e.garrison), 1)
    assert.equal(e.health, 66)
  }
  for (const e of Object.values(s.affairs.enemies))
    e.garrison = { spearman: 4, archer: 3, shieldbearer: 1 }
  while (!s.affairs.raid) s = step(s)
  const origin = s.affairs.raid.enemyId
  assert.ok(ids.includes(origin))
  const r = resolveTurn(s, { type: 'truce', enemyId: origin })
  assert.equal(r.state.affairs.raid, null)
  assert.equal(r.state.affairs.protectedUntil, r.state.turn + 12)
  s = r.state
  while (!s.affairs.raid) s = step(s)
  assert.notEqual(s.affairs.raid.enemyId, origin)
  assert.ok(decode(encode(s)))
})
test('peace, truce and intercept target only the chosen enemy; unknown IDs never mutate state', () => {
  const s = castlesKingdom(2)
  s.affairs.enemies[2].advantage = 2
  const peace = resolveTurn(s, { type: 'negotiate', enemyId: 2 })
  assert.equal(peace.state.affairs.settlements[2].relation, 'peaceful')
  assert.equal(peace.state.affairs.settlements[3].relation, 'hostile')
  assert.equal(peace.state.affairs.enemies[3].peaceUntil, null)
  assert.equal(peace.state.affairs.enemies[3].protectedUntil, s.affairs.enemies[3].protectedUntil)
  const before = structuredClone(s)
  for (const enemyId of [-1, 999, 1]) assert.equal(attack(s, enemyId), null)
  assert.equal(resolveTurn(s, { type: 'expedition', army: s.affairs.army }), null)
  assert.deepEqual(s, before)
})
test('v6 active wave and peaceful campaign migrate without advancing or altering stocks, armies or deadlines', () => {
  for (let s of [beforeRaid(), warKingdom()]) {
    if (!s.affairs.raid) {
      s.affairs.enemies[2].advantage = 2
      s = resolveTurn(s, { type: 'negotiate', enemyId: 2 }).state
    }
    const raw = encode(s, 6),
      values = new Map([[CAMPAIGN_KEY, raw]])
    const result = load({
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, v),
    })
    assert.equal(result.status, 'saved')
    const n = result.state
    assert.equal(n.turn, s.turn)
    assert.deepEqual(n.resources, s.resources)
    assert.deepEqual(n.buildings, s.buildings)
    assert.deepEqual(n.affairs.army, s.affairs.army)
    assert.deepEqual(n.affairs.raid, s.affairs.raid)
    assert.deepEqual(n.affairs.enemies[2].garrison, s.affairs.enemies[2].garrison)
    assert.equal(n.affairs.enemies[2].health, 100)
    assert.deepEqual(n.affairs.enemies[2].treasury, CASTLES.treasury)
    assert.equal(values.get(CAMPAIGN_KEY), raw)
    assert.equal(JSON.parse(values.get(SAVE_KEY)).version, 11)
  }
})
test('corrupt v11 blocks valid v6 fallback; denied writes keep migrated gameplay in memory', () => {
  const s = warKingdom(),
    raw = encode(s, 6)
  const values = new Map([
    [CAMPAIGN_KEY, raw],
    [SAVE_KEY, '{bad'],
  ])
  const memory = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
  assert.equal(load(memory).status, 'corrupt')
  assert.equal(values.get(SAVE_KEY), '{bad')
  values.delete(SAVE_KEY)
  const result = load({
    ...memory,
    setItem() {
      throw Error('quota')
    },
  })
  assert.ok(result.migrationSaveFailed)
  assert.ok(resolveTurn(result.state, { type: 'gather' }))
  assert.equal(values.get(CAMPAIGN_KEY), raw)
})
test('validation rejects missing enemy links, impossible ruins, health, treasury and foreign raid targets', () => {
  const s = castlesKingdom(2)
  for (const change of [
    (s) => delete s.affairs.enemies[3],
    (s) => (s.affairs.enemies[2].health = -1),
    (s) => (s.affairs.enemies[2].health = 101),
    (s) => (s.affairs.enemies[2].treasury.gold = 999),
    (s) => (s.affairs.enemies[2].health = 0),
    (s) => (s.affairs.settlements[2].relation = 'ruins'),
    (s) => (s.affairs.enemies[2].lastAttackedTurn = s.turn + 1),
    (s) => (s.affairs.enemy = s.affairs.enemies[2]),
  ]) {
    const broken = structuredClone(s)
    change(broken)
    assert.equal(decode(encode(broken)), null)
  }
})
test('repeated legal assaults can burn a castle while a long pause permits recovery', () => {
  let s = castlesKingdom(1)
  s.affairs.enemies[2].garrison = emptyArmy()
  let hits = 0
  for (let turn = 0; turn < 12 && s.affairs.enemies[2].health; turn++) {
    const r = attack(s)
    if (r) {
      assert.ok(r.battle.victory)
      hits++
      s = r.state
    } else s = step(s)
  }
  assert.equal(s.affairs.enemies[2].health, 0)
  assert.ok(hits >= 3 && hits <= 5)
  assert.ok(decode(encode(s)))
})

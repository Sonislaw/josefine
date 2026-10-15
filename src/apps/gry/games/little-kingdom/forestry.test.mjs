import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn, key, terrain, actionError, BUILDINGS } =
  await j.import('./engine.ts')
const { FORESTRY, forestStage, terrainAt, plantingSites, plantingInterval, inForestRange } =
  await j.import('./forestry.ts')
const { planExtraction, depositRemaining } = await j.import('./deposits.ts')
const { load, save, decode, SAVE_KEY, DEPOSITS_KEY } = await j.import('./storage.ts')
const step = (s, action = { type: 'gather' }) => {
  const before = structuredClone(s),
    result = resolveTurn(s, action)
  assert.ok(result)
  assert.deepEqual(s, before, 'preview must never mutate the saved settlement')
  assert.deepEqual(result, resolveTurn(s, action), 'preview and commit must agree')
  return result
}
function setup(level = 1) {
  const s = newKingdom(42, 1)
  s.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) if (terrain(s.seed, x, y) === 'forest') s.deposits[key(x, y)] = 0
  s.buildings['2,2'] = { kind: 'forester', level, x: 2, y: 2 }
  return s
}
test('forester construction uses the shared catalog, costs and normal upgrade requirements', () => {
  const s = setup()
  delete s.buildings['2,2']
  const r = step(s, { type: 'build', kind: 'forester', x: 2, y: 2 })
  assert.deepEqual(r.cost, BUILDINGS.forester.cost)
  assert.equal(r.state.buildings['2,2'].plantingProgress, 1)
  assert.deepEqual(r.forestry.planted, [])
  assert.match(actionError(r.state, { type: 'upgrade', x: 2, y: 2 }), /Wioski/)
})
for (const level of [1, 2, 3])
  test(`forester level ${level}: one planting every ${plantingInterval(level)} turns, no card RNG`, () => {
    let s = setup(level)
    for (let i = 1; i <= plantingInterval(level); i++) {
      const r = step(s)
      assert.equal(r.forestry.planted.length, i === plantingInterval(level) ? 1 : 0)
      s = r.state
    }
    const site = Object.keys(s.forests)[0]
    assert.equal(s.forests[site].age, 0)
    assert.equal(s.deposits[site], FORESTRY.woodReserve)
  })
test('three stages, six full growth turns, and extraction starts in the maturation turn', () => {
  let s = setup()
  s.buildings['2,2'].plantingProgress = 3
  s.buildings['1,2'] = { kind: 'sawmill', x: 1, y: 2, level: 1 }
  const r = step(s),
    p = r.forestry.planted[0],
    k = key(p.x, p.y)
  s = r.state
  // Remove the hut: already planted trees grow without it, including during winter.
  delete s.buildings['2,2']
  assert.equal(forestStage(s, p), 1)
  assert.equal(planExtraction(s).buildings['1,2'].amount, 0)
  for (let age = 1; age <= 6; age++) {
    const result = step(s)
    s = result.state
    assert.equal(forestStage(s, p), age < 3 ? 1 : age < 6 ? 2 : 3)
    assert.equal(result.extraction.buildings['1,2'].amount, age < 6 ? 0 : 2)
    assert.equal(depositRemaining(s, p), age < 6 ? 60 : 58)
    assert.equal(result.forestry.matured.length, age === 6 ? 1 : 0)
  }
  assert.equal(s.forests[k].age, 6)
})
test('meadow forests override terrain, block construction at every stage and can be replanted after cutting', () => {
  let s = setup()
  // Leave native forests full so planting uses a meadow instead of a stump.
  s.deposits = {}
  s.buildings['2,2'].plantingProgress = 3
  const r = step(s),
    p = r.forestry.planted[0],
    k = key(p.x, p.y)
  s = r.state
  assert.equal(terrain(s.seed, p.x, p.y), 'meadow')
  assert.equal(terrainAt(s, p), 'forest')
  for (const age of [0, 3, 6]) {
    s.forests[k] = { age }
    assert.match(actionError(s, { type: 'build', kind: 'house', ...p }), /pustej łące/)
  }
  s.deposits[k] = 0
  s.buildings['2,2'].plantingProgress = 3
  const replanted = step(s)
  assert.deepEqual(replanted.forestry.planted, [p])
  assert.equal(replanted.state.forests[k].age, 0)
  assert.equal(replanted.state.deposits[k], 60)
})
test('range, occupied sites, discoveries and other settlements; two huts cannot plant on the same tile', () => {
  const s = setup()
  assert.ok(inForestRange({ x: 0, y: 0 }, { x: 2, y: 1 }))
  assert.ok(!inForestRange({ x: 0, y: 0 }, { x: 2, y: 2 }))
  const sites = plantingSites(s, s.buildings['2,2'])
  assert.ok(sites.length > 2)
  const [a, b] = sites
  s.discoveries[key(a.x, a.y)] = { ...a, kind: 'cart', status: 'used' }
  s.affairs.settlements.push({ ...b, id: 0, relation: 'friendly' })
  const allowed = plantingSites(s, s.buildings['2,2'])
  assert.ok(
    !allowed.some((p) => key(p.x, p.y) === key(a.x, a.y) || key(p.x, p.y) === key(b.x, b.y)),
  )
  assert.ok(allowed.every((p) => p.x >= 0 && p.y >= 0 && p.x < 7 && p.y < 7))
  s.buildings['2,2'].plantingProgress = 3
  s.buildings['1,2'] = { kind: 'forester', level: 1, x: 1, y: 2, plantingProgress: 3 }
  const r = step(s)
  assert.equal(r.forestry.planted.length, 2)
  assert.notDeepEqual(r.forestry.planted[0], r.forestry.planted[1])
  const reversed = { ...s, buildings: Object.fromEntries(Object.entries(s.buildings).reverse()) }
  assert.deepEqual(resolveTurn(reversed, { type: 'gather' }).forestry, r.forestry)
})
test('damage pauses planting, repair resumes, upgrades keep progress, no room never overwrites terrain', () => {
  let s = setup()
  s.buildings['2,2'].plantingProgress = 3
  s.buildings['2,2'].damaged = true
  const damaged = step(s)
  assert.equal(damaged.state.buildings['2,2'].plantingProgress, 3)
  assert.equal(damaged.forestry.planted.length, 0)
  const repaired = step(damaged.state, { type: 'repair', x: 2, y: 2 })
  assert.equal(repaired.forestry.planted.length, 1)
  s = repaired.state
  s.rank = 1
  s.buildings['2,2'].plantingProgress = 2
  assert.equal(step(s, { type: 'upgrade', x: 2, y: 2 }).forestry.planted.length, 1)
  s = setup()
  for (const p of plantingSites(s, s.buildings['2,2'])) {
    if (terrain(s.seed, p.x, p.y) === 'forest') s.deposits[key(p.x, p.y)] = 60
    else s.buildings[key(p.x, p.y)] = { kind: 'house', level: 1, ...p }
  }
  s.buildings['2,2'].plantingProgress = 4
  assert.deepEqual(step(s).forestry.planted, [])
  assert.deepEqual(step(s).state.forests, {})
})
test('v8 migration keeps depletion and old bytes; v11 roundtrip saves growth and counters, corrupt saves protected', () => {
  const old = setup()
  delete old.buildings['2,2']
  delete old.forests
  const raw = encode(old, 8)
  const values = new Map([[DEPOSITS_KEY, raw]])
  const port = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
  const loaded = load(port)
  assert.equal(loaded.status, 'saved')
  assert.deepEqual(loaded.state, {
    ...old,
    forests: {},
    landscape: { version: 2, legacySectors: ['0,0'] },
  })
  assert.equal(values.get(DEPOSITS_KEY), raw)
  const s = setup()
  s.buildings['2,2'].plantingProgress = 3
  const grown = step(step(s).state).state
  assert.ok(save(port, grown, true))
  assert.deepEqual(load(port).state, grown)
  values.set(SAVE_KEY, '{broken')
  assert.equal(load(port).status, 'corrupt')
  assert.equal(values.get(SAVE_KEY), '{broken')
  values.delete(SAVE_KEY)
  assert.ok(
    load({
      ...port,
      setItem() {
        throw Error('quota')
      },
    }).migrationSaveFailed,
  )
})
test('save validation rejects forged forest ages, terrain, occupied tiles and harvestable seedlings', () => {
  let s = setup()
  s.deposits = {}
  s.buildings['2,2'].plantingProgress = 3
  const r = step(s),
    p = r.forestry.planted[0],
    k = key(p.x, p.y)
  s = r.state
  for (const change of [
    (v) => delete v.forests,
    (v) => (v.forests[k].age = -1),
    (v) => (v.forests[k].age = 7),
    (v) => (v.forests[k].age = 1.5),
    (v) => (v.deposits[k] = 59),
    (v) => (v.forests['3,3'] = { age: 6 }),
    (v) => (v.forests['4,3'] = { age: 6 }),
    (v) => (v.forests['900,900'] = { age: 6 }),
    (v) => (v.buildings['2,2'].plantingProgress = 5),
    (v) => (v.buildings['3,3'].plantingProgress = 1),
  ]) {
    const copy = structuredClone(s)
    change(copy)
    assert.equal(decode(JSON.stringify({ version: 11, state: copy })), null)
  }
})

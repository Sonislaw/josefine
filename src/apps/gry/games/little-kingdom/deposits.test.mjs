import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { newKingdom, terrain, key, resolveTurn, buildingProduction, production } =
  await j.import('./engine.ts')
const { planExtraction, depositRemaining, depositCapacity, inExtractionRange } =
  await j.import('./deposits.ts')
const { save, load, decode, SAVE_KEY, CASTLES_KEY } = await j.import('./storage.ts')

function setup(kind, amount = 2) {
  const state = newKingdom(42)
  const type = kind === 'sawmill' ? 'forest' : 'rock'
  const plots = [],
    sources = []
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const t = terrain(state.seed, x, y),
        p = { x, y }
      if (t === 'forest' || t === 'rock') state.deposits[key(x, y)] = 0
      if (t === type) sources.push(p)
      if (t === 'meadow' && !state.buildings[key(x, y)]) plots.push(p)
    }
  const source = sources.find((p) => plots.filter((b) => inExtractionRange(b, p)).length > 2)
  const sites = plots.filter((b) => inExtractionRange(b, source))
  const b = { ...sites[0], kind, level: 1 }
  state.buildings[key(b.x, b.y)] = b
  state.deposits[key(source.x, source.y)] = amount
  return { state, source, b, sites }
}
for (const kind of ['sawmill', 'quarry'])
  test(`${kind}: scarce deposits, conservation, shared preview and permanent exhaustion`, () => {
    const { state, source, b } = setup(kind)
    const resource = kind === 'sawmill' ? 'wood' : 'stone'
    const original = JSON.stringify(state),
      plan = planExtraction(state)
    assert.equal(plan.buildings[key(b.x, b.y)].amount, 2)
    assert.equal(buildingProduction(state, b)[resource], 2)
    const result = resolveTurn(state, { type: 'gather' })
    assert.deepEqual(result, resolveTurn(state, { type: 'gather' }))
    assert.equal(JSON.stringify(state), original)
    assert.deepEqual(result.extraction, plan)
    assert.deepEqual(result.produced, production(state))
    assert.equal(depositRemaining(result.state, source), 0)
    assert.equal(buildingProduction(result.state, b)[resource], 0)
    assert.equal(depositRemaining(resolveTurn(result.state, { type: 'gather' }).state, source), 0)
    const values = new Map(),
      port = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
    assert.ok(save(port, result.state, true))
    assert.deepEqual(load(port).state, result.state)
  })
test('range is Manhattan three, unknown sectors cannot be mined, damaged extractors do not consume', () => {
  assert.ok(inExtractionRange({ x: 0, y: 0 }, { x: 2, y: 1 }))
  assert.ok(!inExtractionRange({ x: 0, y: 0 }, { x: 2, y: 2 }))
  const { state, b, source } = setup('sawmill', 60)
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++)
      if (terrain(state.seed, x, y) === 'forest') state.deposits[key(x, y)] = 0
  assert.equal(buildingProduction(state, b).wood, 0)
  state.deposits[key(source.x, source.y)] = 60
  b.damaged = true
  assert.equal(buildingProduction(state, b).wood, 0)
  assert.equal(planExtraction(state).remaining[key(source.x, source.y)], 60)
  // Even a hypothetical extractor at the border cannot see undiscovered resources.
  delete state.buildings[key(b.x, b.y)]
  state.buildings['0,0'] = { x: 0, y: 0, kind: 'sawmill', level: 3 }
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++)
      if (terrain(state.seed, x, y) === 'forest') state.deposits[key(x, y)] = 0
  assert.equal(planExtraction(state).buildings['0,0'].amount, 0)
})
test('overlapping extractors share finite stock fairly and ignore object insertion order', () => {
  const { state, source, sites } = setup('quarry', 3)
  for (const p of sites.slice(0, 3))
    state.buildings[key(p.x, p.y)] = { ...p, kind: 'quarry', level: 3 }
  const plan = planExtraction(state)
  assert.deepEqual(
    Object.values(plan.buildings).map((r) => r.amount),
    [1, 1, 1],
  )
  assert.equal(plan.remaining[key(source.x, source.y)], 0)
  const reversed = {
    ...state,
    buildings: Object.fromEntries(Object.entries(state.buildings).reverse()),
  }
  assert.deepEqual(planExtraction(reversed), plan)
})
test('new builds and repairs extract immediately, upgrades consume faster, invalid actions never consume', () => {
  const { state, b, source } = setup('sawmill', 60)
  state.resources = { wood: 500, stone: 500, food: 500, gold: 500 }
  delete state.buildings[key(b.x, b.y)]
  state.offer = ['farm', 'sawmill', 'quarry']
  const built = resolveTurn(state, { type: 'build', kind: b.kind, x: b.x, y: b.y })
  assert.equal(depositRemaining(built.state, source), 58)
  built.state.rank = 1
  const upgraded = resolveTurn(built.state, { type: 'upgrade', x: b.x, y: b.y })
  assert.equal(depositRemaining(upgraded.state, source), 55)
  upgraded.state.buildings[key(b.x, b.y)].damaged = true
  const repaired = resolveTurn(upgraded.state, { type: 'repair', x: b.x, y: b.y })
  assert.equal(depositRemaining(repaired.state, source), 52)
  const before = JSON.stringify(repaired.state)
  assert.equal(resolveTurn(repaired.state, { type: 'build', kind: 'sawmill', ...source }), null)
  assert.equal(JSON.stringify(repaired.state), before)
})
test('v7 migration starts full deposits, preserves old bytes and never falls back from corrupt v8', () => {
  const old = newKingdom(42)
  delete old.deposits
  const raw = JSON.stringify({ version: 7, state: old, tutorialDismissed: true })
  const data = new Map([[CASTLES_KEY, raw]]),
    port = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const loaded = load(port)
  assert.equal(loaded.status, 'saved')
  assert.deepEqual(loaded.state.deposits, {})
  assert.deepEqual(loaded.state.resources, old.resources)
  assert.equal(loaded.state.turn, old.turn)
  assert.equal(data.get(CASTLES_KEY), raw)
  assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 8)
  data.set(SAVE_KEY, 'broken')
  assert.equal(load(port).status, 'corrupt')
  assert.equal(data.get(SAVE_KEY), 'broken')
  data.delete(SAVE_KEY)
  assert.ok(
    load({
      ...port,
      setItem() {
        throw Error('quota')
      },
    }).migrationSaveFailed,
  )
  assert.equal(
    load({
      getItem() {
        throw Error('denied')
      },
    }).status,
    'unavailable',
  )
})
test('v8 validation rejects forged, unknown, fractional and excessive reserves', () => {
  const { state, source } = setup('sawmill')
  for (const change of [
    (s) => delete s.deposits,
    (s) => (s.deposits[key(source.x, source.y)] = -1),
    (s) => (s.deposits[key(source.x, source.y)] = 61),
    (s) => (s.deposits[key(source.x, source.y)] = 0.5),
    (s) => (s.deposits['3,3'] = 1),
    (s) => (s.deposits['900,900'] = 1),
    (s) => (s.deposits['01,4'] = 2),
  ]) {
    const s = structuredClone(state)
    change(s)
    assert.equal(decode(JSON.stringify({ version: 8, state: s })), null)
  }
  assert.equal(depositCapacity(state, source), 60)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { newKingdom, terrain, key, resolveTurn, buildingProduction, actionError } =
  await j.import('./engine.ts')
const { DISCOVERIES, discoveryForSector, discoveryBonus, blocksBuilding } =
  await j.import('./discoveries.ts')
const { decode, load, save, SAVE_KEY, LEGACY_KEY } = await j.import('./storage.ts')
const serialize = (state) => JSON.stringify({ version: 6, state, tutorialDismissed: true })
const rich = (seed) => ({
  ...newKingdom(seed),
  resources: { wood: 5000, stone: 5000, food: 5000, gold: 5000 },
})
function fixture(kind) {
  for (let seed = 1; seed < 10000; seed++) {
    const d = discoveryForSector(seed, { x: 1, y: 0 }, 1)
    if (d.kind === kind)
      return { state: resolveTurn(rich(seed), { type: 'explore', x: 1, y: 0 }).state, d }
  }
  throw Error('missing fixture')
}
function put(s, kind, x, y, level = 1) {
  return (s.buildings[key(x, y)] = { kind, x, y, level })
}
function mark(s, kind, x, y) {
  s.discoveries[key(x, y)] = { kind, x, y, status: 'used', discoveredTurn: 1, usedTurn: 2 }
}

test('deterministic places use meadows, support negative sectors, all kinds and no starting landmark', () => {
  const counts = new Map()
  for (let seed = 0; seed < 300; seed++)
    for (const sector of [
      { x: 1, y: 0 },
      { x: -4, y: 2 },
      { x: 0, y: -7 },
    ]) {
      const d = discoveryForSector(seed, sector, 4)
      assert.deepEqual(d, discoveryForSector(seed, sector, 4))
      assert.equal(terrain(seed, d.x, d.y), 'meadow')
      assert.equal(Math.floor(d.x / 7), sector.x)
      assert.equal(Math.floor(d.y / 7), sector.y)
      assert.equal(d.status, 'available')
      if (DISCOVERIES[d.kind].permanent)
        assert.ok(
          [
            { x: d.x - 1, y: d.y },
            { x: d.x + 1, y: d.y },
            { x: d.x, y: d.y - 1 },
            { x: d.x, y: d.y + 1 },
          ].some(
            (p) =>
              Math.floor(p.x / 7) === sector.x &&
              Math.floor(p.y / 7) === sector.y &&
              terrain(seed, p.x, p.y) === 'meadow',
          ),
        )
      counts.set(d.kind, (counts.get(d.kind) || 0) + 1)
    }
  assert.equal(counts.size, 4)
  for (const n of counts.values()) assert.ok(n > 150 && n < 300)
  assert.equal(discoveryForSector(1, { x: 0, y: 0 }, 1), null)
})

test('exploration preview matches commit, does not mutate input or spend offer RNG', () => {
  const s = rich(8),
    before = serialize(s),
    a = { type: 'explore', x: -1, y: 0 }
  const p = resolveTurn(s, a)
  assert.equal(serialize(s), before)
  assert.deepEqual(p, resolveTurn(s, a))
  assert.equal(p.state.rng, s.rng)
  assert.deepEqual(p.state.offer, s.offer)
  assert.deepEqual(p.cost, { wood: 10, stone: 5, food: 0, gold: 5 })
  assert.equal(Object.keys(p.state.discoveries).length, 1)
  assert.equal(p.discovery.discoveredTurn, 1)
  assert.deepEqual(p.reward, { wood: 0, stone: 0, food: 0, gold: 0 })
  assert.deepEqual(decode(serialize(p.state)).state, p.state)
})

for (const kind of ['ruins', 'wagon'])
  test(`${kind}: one-time reward precedes feeding, separate from production and never claimed twice`, () => {
    const { state: s, d } = fixture(kind),
      def = DISCOVERIES[kind]
    s.resources = { wood: def.cost.wood, stone: 0, food: 0, gold: 0 }
    const before = serialize(s),
      a = { type: 'landmark', x: d.x, y: d.y },
      r = resolveTurn(s, a)
    assert.deepEqual(r.reward, def.reward)
    assert.deepEqual(r.produced, { wood: 1, stone: 0, food: 2, gold: 1 })
    assert.equal(r.state.resources.food, Math.max(0, def.reward.food + 2 - 3))
    assert.equal(r.shortage, kind === 'ruins')
    assert.equal(r.state.resources.wood, def.reward.wood + 1)
    assert.equal(r.state.resources.stone, def.reward.stone)
    assert.equal(r.state.resources.gold, def.reward.gold + 1)
    assert.equal(serialize(s), before)
    assert.equal(resolveTurn(r.state, a), null)
    assert.equal(blocksBuilding(r.state.discoveries[key(d.x, d.y)]), false)
    assert.deepEqual(decode(serialize(r.state)).state, r.state)
  })

test('available places block building, used finds free the plot, restored places cannot be built over/upgraded/demolished', () => {
  for (const kind of Object.keys(DISCOVERIES)) {
    const { state: s, d } = fixture(kind),
      build = { type: 'build', kind: 'farm', x: d.x, y: d.y }
    assert.match(actionError(s, build), /wyjątkowe/)
    const r = resolveTurn(s, { type: 'landmark', x: d.x, y: d.y }).state
    const next = resolveTurn(r, build)
    assert.equal(!!next, !DISCOVERIES[kind].permanent)
    if (next) assert.ok(decode(serialize(next.state)))
    for (const type of ['upgrade', 'demolish'])
      assert.equal(resolveTurn(r, { type, x: d.x, y: d.y }), null)
  }
})

test('invalid, undiscovered and unaffordable interactions leave the complete state untouched', () => {
  const { state: s, d } = fixture('spring')
  s.resources.wood = 0
  const before = serialize(s)
  for (const a of [
    { type: 'landmark', x: d.x, y: d.y },
    { type: 'landmark', x: 0, y: 0 },
    { type: 'landmark', x: 50, y: 0 },
    { type: 'landmark', x: 0.5, y: 0 },
  ]) {
    assert.equal(resolveTurn(s, a), null)
    assert.equal(serialize(s), before)
  }
})

test('bonuses are cardinal, additive after levels, do not stack and winter halves the full food output', () => {
  const s = rich(7),
    farm = put(s, 'farm', 4, 2)
  assert.equal(buildingProduction(s, farm).food, 5) // Existing water below the farm.
  mark(s, 'spring', 3, 1)
  assert.equal(discoveryBonus(s, farm), null) // Diagonal.
  mark(s, 'spring', 3, 2)
  mark(s, 'spring', 5, 2)
  assert.equal(buildingProduction(s, farm).food, 6)
  farm.level = 3
  assert.equal(buildingProduction(s, farm).food, 16)
  put(s, 'mill', 4, 1, 2)
  assert.equal(buildingProduction(s, farm).food, 28) // (4+1+4)*3 +1.
  s.turn = 9
  assert.equal(buildingProduction(s, farm).food, 14)
  const orchard = put(s, 'orchard', 2, 2, 2)
  assert.equal(buildingProduction(s, orchard).food, 2) // floor((2*2+1)/2).
  s.turn = 6
  assert.equal(buildingProduction(s, orchard).food, 9)
  const market = put(s, 'market', 0, 0, 3)
  put(s, 'house', 0, 1, 1)
  mark(s, 'tradingPost', 1, 0)
  mark(s, 'tradingPost', -1, 0)
  assert.equal(buildingProduction(s, market).gold, 10) // (2+1)*3 +1.
  assert.equal(discoveryBonus(s, market).resource, 'gold')
})

test('restoration immediately changes this turn production without mutating previous discovery', () => {
  for (const kind of ['spring', 'tradingPost']) {
    const { state: s, d } = fixture(kind),
      b = put(s, kind === 'spring' ? 'farm' : 'market', d.x + 1, d.y)
    const before = buildingProduction(s, b),
      result = resolveTurn(s, { type: 'landmark', x: d.x, y: d.y })
    const resource = kind === 'spring' ? 'food' : 'gold'
    assert.equal(result.produced[resource], before[resource] + (resource === 'food' ? 2 : 1) + 1)
    assert.equal(s.discoveries[key(d.x, d.y)].status, 'available')
    assert.equal(result.state.discoveries[key(d.x, d.y)].usedTurn, 2)
    assert.equal(result.state.rng, s.rng)
  }
})

test('v1 migrates once without retroactive places, resources or turn changes, preserving original bytes', () => {
  const old = rich(7)
  old.sectors.push({ x: 1, y: 0 })
  delete old.discoveries
  const raw = JSON.stringify({ version: 1, state: old, tutorialDismissed: true }),
    data = new Map([[LEGACY_KEY, raw]])
  const port = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const result = load(port)
  assert.equal(result.status, 'saved')
  assert.equal(result.migrationSaveFailed, false)
  assert.deepEqual(result.state, { ...old, discoveries: {} })
  assert.equal(data.get(LEGACY_KEY), raw)
  assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 6)
  assert.deepEqual(load(port).state, result.state)
  const explored = resolveTurn(result.state, { type: 'explore', x: 2, y: 0 })
  assert.equal(Object.keys(explored.state.discoveries).length, 1)
  assert.equal(explored.discovery.discoveredTurn, old.turn + 1)
})

test('existing or corrupt current save takes precedence; failed migration preserves v1', () => {
  const legacy = JSON.stringify({ version: 1, state: rich(5), tutorialDismissed: false }),
    data = new Map([
      [LEGACY_KEY, legacy],
      [SAVE_KEY, '{broken'],
    ])
  const port = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  assert.equal(load(port).status, 'corrupt')
  assert.equal(data.get(SAVE_KEY), '{broken')
  save(port, newKingdom(99), false)
  assert.equal(load(port).state.seed, 99)
  data.delete(SAVE_KEY)
  const failed = load({
    getItem: port.getItem,
    setItem() {
      throw Error('quota')
    },
  })
  assert.equal(failed.status, 'saved')
  assert.equal(failed.migrationSaveFailed, true)
  assert.equal(data.get(LEGACY_KEY), legacy)
  assert.equal(data.has(SAVE_KEY), false)
})

test('malformed discovery state is rejected rather than repaired or awarded again', () => {
  const { state: s, d } = fixture('ruins'),
    k = key(d.x, d.y)
  for (const mutate of [
    (s) => delete s.discoveries,
    (s) => (s.discoveries[k].kind = 'unknown'),
    (s) => s.discoveries[k].x++,
    (s) => (s.discoveries[k].discoveredTurn = 99),
    (s) => (s.discoveries[k].usedTurn = 1),
    (s) => (s.discoveries[k].status = 'used'),
    (s) => {
      s.discoveries[k].status = 'used'
      s.discoveries[k].usedTurn = 0
    },
    (s) => put(s, 'farm', d.x, d.y),
  ]) {
    const copy = structuredClone(s)
    mutate(copy)
    assert.equal(decode(serialize(copy)), null)
  }
})

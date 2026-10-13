import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const {
  newKingdom,
  deal,
  terrain,
  key,
  capacity,
  frontier,
  season,
  production,
  buildingProduction,
  actionCost,
  actionError,
  resolveTurn,
  BUILDINGS,
  KEYS,
} = await jiti.import('./engine.ts')
const { decode, load, save, SAVE_KEY, PREVIOUS_KEY, LEGACY_KEY } = await jiti.import('./storage.ts')
const serialize = (state) => JSON.stringify({ version: 3, state, tutorialDismissed: true })
const rich = () => ({
  ...newKingdom(42),
  resources: { wood: 5000, stone: 5000, food: 5000, gold: 5000 },
})
const put = (s, kind, x, y, level = 1) => {
  s.buildings[key(x, y)] = { kind, x, y, level }
  return s
}

test('starting resources, hall, capacity and seeded unique offers', () => {
  const s = newKingdom(42)
  assert.equal(capacity(s), 5)
  assert.equal(s.population, 3)
  assert.deepEqual(s.resources, { wood: 20, stone: 12, food: 24, gold: 10 })
  assert.deepEqual(production(s), { wood: 1, stone: 0, food: 2, gold: 1 })
  for (let seed = 0; seed < 1000; seed++) {
    const d = deal(seed)
    assert.equal(d.offer[0], 'farm')
    assert.equal(new Set(d.offer).size, 3)
    assert.deepEqual(deal(seed), d)
    assert.equal(decode(serialize(newKingdom(seed))).state.seed, seed)
  }
})
test('terrain is deterministic across negative coordinates, with guaranteed land and resources', () => {
  for (const seed of [0, 42, 0xffffffff])
    for (let sx = -3; sx <= 3; sx++)
      for (let sy = -3; sy <= 3; sy++) {
        const cells = []
        for (let y = 0; y < 7; y++)
          for (let x = 0; x < 7; x++) cells.push(terrain(seed, sx * 7 + x, sy * 7 + y))
        assert.ok(cells.filter((t) => t === 'meadow').length >= 20)
        for (const t of ['meadow', 'forest', 'rock', 'water']) assert.ok(cells.includes(t))
        assert.equal(terrain(seed, sx * 7 + 3, sy * 7 + 3), 'meadow')
      }
})
test('preview/commit deterministic, immutable; build costs precede immediate production', () => {
  const s = newKingdom(9),
    before = structuredClone(s),
    a = { type: 'build', kind: 'farm', x: 0, y: 0 }
  const p = resolveTurn(s, a)
  assert.deepEqual(s, before)
  assert.deepEqual(resolveTurn(s, a), p)
  assert.deepEqual(p.state.resources, { wood: 16, stone: 12, food: 27, gold: 11 })
  assert.equal(p.state.turn, 1)
  assert.deepEqual(p.state.offer, deal(s.rng).offer)
  assert.deepEqual(resolveTurn(s, { type: 'gather' }).state.offer, s.offer)
})
test('reject occupied, natural, unknown, unaffordable and unavailable offer without mutation', () => {
  const s = newKingdom(3),
    initial = serialize(s)
  const absent = Object.keys(BUILDINGS).find((k) => !s.offer.includes(k))
  for (const a of [
    { type: 'build', kind: 'farm', x: 3, y: 3 },
    { type: 'build', kind: 'farm', x: 2, y: 3 },
    { type: 'build', kind: 'farm', x: -1, y: 0 },
    { type: 'build', kind: absent, x: 0, y: 0 },
    { type: 'demolish', x: 3, y: 3 },
    { type: 'build', kind: 'farm', x: 0.5, y: 0 },
    { type: 'explore', x: 8, y: 8 },
  ]) {
    assert.ok(actionError(s, a))
    assert.equal(resolveTurn(s, a), null)
  }
  assert.equal(serialize(s), initial)
  s.resources.wood = 0
  assert.match(actionError(s, { type: 'build', kind: 'farm', x: 0, y: 0 }), /Brakuje/)
  assert.equal(resolveTurn(s, { type: 'build', kind: 'farm', x: 0, y: 0 }), null)
})
test('adjacency is cardinal, water is once, mills stack then farm level multiplies', () => {
  const s = newKingdom(7)
  put(s, 'farm', 4, 2, 2)
  put(s, 'mill', 3, 2, 2)
  put(s, 'mill', 5, 2, 1)
  put(s, 'mill', 5, 1, 3)
  assert.equal(buildingProduction(s, s.buildings['4,2']).food, (4 + 1 + 4 + 2) * 2)
  s.turn = 9
  assert.equal(buildingProduction(s, s.buildings['4,2']).food, 11)
  const winter = newKingdom(2)
  winter.turn = 9
  put(winter, 'farm', 4, 2)
  assert.equal(buildingProduction(winter, winter.buildings['4,2']).food, 2)
})
test('tartak, quarry, market, houses and orchard have correct effects', () => {
  const s = newKingdom(1)
  put(s, 'sawmill', 2, 2, 2)
  put(s, 'quarry', 3, 5, 1)
  put(s, 'market', 0, 0, 2)
  put(s, 'house', 0, 1, 3)
  put(s, 'house', 1, 1, 1)
  put(s, 'orchard', 6, 0, 3)
  assert.equal(buildingProduction(s, s.buildings['2,2']).wood, 6)
  const quarryNeighbors = [
    { x: 2, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 4 },
    { x: 3, y: 6 },
  ].filter((p) => terrain(1, p.x, p.y) === 'rock').length
  assert.equal(buildingProduction(s, s.buildings['3,5']).stone, 2 + quarryNeighbors)
  assert.equal(buildingProduction(s, s.buildings['0,0']).gold, 6)
  assert.equal(capacity(s), 17)
  assert.equal(buildingProduction(s, s.buildings['6,0']).food, 6)
  s.turn = 6
  assert.equal(buildingProduction(s, s.buildings['6,0']).food, 12)
  s.turn = 9
  assert.equal(buildingProduction(s, s.buildings['6,0']).food, 3)
})
test('upgrades use target-level price; maximum level and demolition refund', () => {
  let s = put(rich(), 'farm', 0, 0)
  assert.equal(actionCost(s, { type: 'upgrade', x: 0, y: 0 }).wood, 10)
  s = resolveTurn(s, { type: 'upgrade', x: 0, y: 0 }).state
  assert.equal(s.buildings['0,0'].level, 2)
  assert.equal(actionCost(s, { type: 'upgrade', x: 0, y: 0 }).wood, 15)
  s = resolveTurn(s, { type: 'upgrade', x: 0, y: 0 }).state
  assert.equal(resolveTurn(s, { type: 'upgrade', x: 0, y: 0 }), null)
  const demolished = resolveTurn(s, { type: 'demolish', x: 0, y: 0 })
  assert.equal(demolished.delta.wood, 3) // floor(5/2) refund + hall production
  assert.equal(demolished.state.buildings['0,0'], undefined)
  s = put(rich(), 'house', 0, 0)
  s.population = 6
  assert.match(actionError(s, { type: 'demolish', x: 0, y: 0 }), /mieszkańcom/)
})
test('exploration must touch known sectors, increases price and keeps offer', () => {
  let s = rich()
  assert.equal(frontier(s).length, 4)
  assert.deepEqual(actionCost(s, { type: 'explore', x: -1, y: 0 }), {
    wood: 10,
    stone: 5,
    food: 0,
    gold: 5,
  })
  const originalOffer = s.offer
  s = resolveTurn(s, { type: 'explore', x: -1, y: 0 }).state
  assert.equal(s.sectors.length, 2)
  assert.deepEqual(s.offer, originalOffer)
  assert.deepEqual(actionCost(s, { type: 'explore', x: -2, y: 0 }), {
    wood: 15,
    stone: 8,
    food: 0,
    gold: 8,
  })
  assert.equal(resolveTurn(s, { type: 'explore', x: -1, y: 0 }), null)
  assert.ok(resolveTurn(s, { type: 'build', kind: 'farm', x: -7, y: 0 }))
  assert.ok(decode(serialize(s)))
})
test('season boundaries, growth threshold, capacity and food use order', () => {
  assert.deepEqual(
    Array.from({ length: 13 }, (_, t) => season(t)),
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0],
  )
  let s = newKingdom()
  s.turn = 2
  s.resources.food = 4
  let r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.state.resources.food, 6)
  assert.equal(r.state.population, 4)
  s.resources.food = 3
  r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.state.population, 3)
  s.resources.food = 100
  s.population = 5
  assert.equal(resolveTurn(s, { type: 'gather' }).state.population, 5)
})
test('gather with zero stock is legal; hunger warns, loses people, resets and ends', () => {
  let s = newKingdom()
  s.resources = { wood: 0, stone: 0, food: 0, gold: 0 }
  const gathered = resolveTurn(s, { type: 'gather' })
  assert.deepEqual(gathered.state.resources, { wood: 3, stone: 0, food: 2, gold: 1 })
  s = put(rich(), 'house', 0, 0, 3)
  s.population = 14
  s.resources.food = 0
  let r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.state.population, 14)
  assert.equal(r.state.hunger, 1)
  r = resolveTurn(r.state, { type: 'gather' })
  assert.equal(r.state.population, 13)
  r.state.resources.food = 100
  const fed = resolveTurn(r.state, { type: 'gather' })
  assert.equal(fed.state.hunger, 0)
  // With remaining 1 resident the hall normally covers food; a synthetic no-hall state tests terminal rules independently.
  const starving = {
    ...newKingdom(),
    buildings: {},
    population: 1,
    hunger: 1,
    resources: { wood: 1000, stone: 1000, food: 0, gold: 1000 },
  }
  const dead = resolveTurn(starving, { type: 'explore', x: 1, y: 0 }).state
  assert.equal(dead.status, 'gameover')
  assert.equal(dead.population, 0)
  assert.equal(resolveTurn(dead, { type: 'gather' }), null)
})
test('valid storage round-trip, unavailable port and corrupted saves', () => {
  const s = newKingdom(123),
    raw = serialize(s)
  assert.deepEqual(decode(raw), { state: s, tutorialDismissed: true })
  for (const v of ['', '{', '{}', JSON.stringify({ version: 4, state: s })])
    assert.equal(decode(v), null)
  for (const mutate of [
    (s) => (s.resources.food = -1),
    (s) => (s.offer = ['farm', 'farm', 'mill']),
    (s) => s.sectors.push({ x: 99, y: 99 }),
    (s) => delete s.buildings['3,3'],
    (s) => (s.buildings['0,0'] = { x: 0, y: 0, level: 4, kind: 'farm' }),
    (s) => (s.buildings['2,3'] = { x: 2, y: 3, level: 1, kind: 'farm' }),
    (s) => (s.population = 999),
  ]) {
    const broken = structuredClone(s)
    mutate(broken)
    assert.equal(decode(serialize(broken)), null)
  }
  let stored = null
  const memory = {
    getItem: (k) => {
      assert.ok([SAVE_KEY, PREVIOUS_KEY, LEGACY_KEY].includes(k))
      if (k !== SAVE_KEY) return null
      return stored
    },
    setItem: (k, v) => {
      assert.equal(k, SAVE_KEY)
      stored = v
    },
  }
  assert.equal(load(memory).status, 'empty')
  assert.equal(save(memory, s, true), true)
  assert.equal(load(memory).status, 'saved')
  stored = '{bad'
  assert.equal(load(memory).status, 'corrupt')
  assert.equal(stored, '{bad')
  const denied = {
    getItem() {
      throw Error()
    },
    setItem() {
      throw Error()
    },
  }
  assert.equal(load(denied).status, 'unavailable')
  assert.equal(save(denied, s, false), false)
})
test('hall food provides a recovery floor of two residents under the agreed rules', () => {
  let s = put(rich(), 'house', 0, 0, 3)
  s.population = 14
  s.resources.food = 0
  for (let i = 0; i < 20; i++) {
    // Exploration adds no food; hall still produces its mandatory 2 food each turn.
    s = resolveTurn(s, { type: 'explore', x: i + 1, y: 0 }).state
  }
  assert.equal(s.population, 2)
  assert.equal(s.status, 'playing')
  assert.equal(s.hunger, 0)
  assert.ok(decode(serialize(s)))
})
test('20 years of legal decisions remain playable, deterministic and saveable', () => {
  for (const seed of [1, 17, 183, 0xffffffff]) {
    let s = newKingdom(seed)
    // First sustain the initial population, then upgrade and make economic decisions.
    for (let turn = 0; turn < 240; turn++) {
      const candidates = []
      for (const b of Object.values(s.buildings))
        if (b.kind !== 'hall' && b.level < 3) candidates.push({ type: 'upgrade', x: b.x, y: b.y })
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 7; x++)
          for (const kind of s.offer.filter((k) => k !== 'house'))
            candidates.push({ type: 'build', kind, x, y })
      candidates.push({ type: 'gather' })
      const a =
        turn === 0
          ? { type: 'build', kind: 'farm', x: 4, y: 2 }
          : candidates.find((a) => !actionError(s, a))
      const r = resolveTurn(s, a)
      assert.ok(r)
      assert.deepEqual(r, resolveTurn(structuredClone(s), a))
      s = r.state
      assert.equal(s.status, 'playing')
      assert.ok(KEYS.every((k) => s.resources[k] >= 0))
      assert.deepEqual(decode(serialize(s)).state, s)
    }
    assert.equal(s.turn, 240)
    assert.ok(s.population >= 3)
  }
})
test('100 connected sectors retain deterministic terrain and valid serialization', () => {
  const s = newKingdom(31)
  s.sectors = Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) }))
  assert.equal(frontier(s).length, 40)
  assert.deepEqual(decode(serialize(s)).state, s)
  assert.equal(terrain(s.seed, 69, 69), terrain(decode(serialize(s)).state.seed, 69, 69))
})

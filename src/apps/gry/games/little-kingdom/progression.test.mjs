import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { developedKingdom, encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const jiti = createJiti(import.meta.url)
const {
  newKingdom,
  resolveTurn,
  buildingProduction,
  production,
  terrain,
  key,
  actionError,
  capacity,
  KEYS,
} = await jiti.import('./engine.ts')
const { RANKS, rankProgress, earnedPromotion } = await jiti.import('./progression.ts')
const { blocksBuilding } = await jiti.import('./discoveries.ts')
const { decode, load, save, SAVE_KEY, PREVIOUS_KEY, LEGACY_KEY } = await jiti.import('./storage.ts')
const port = (data) => ({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) })

test('rank thresholds and gifts are exact; starting rank, hall and upgrades do not count', () => {
  assert.deepEqual(
    RANKS.slice(1).map((r) => Object.values(r.requirements)),
    [
      [6, 4, 3, 2, 0],
      [12, 8, 5, 4, 1],
      [20, 12, 6, 7, 3],
    ],
  )
  assert.deepEqual(
    RANKS.slice(1).map((r) => r.gift),
    [
      { wood: 10, stone: 5, food: 0, gold: 5 },
      { wood: 20, stone: 12, food: 10, gold: 12 },
      { wood: 35, stone: 25, food: 20, gold: 25 },
    ],
  )
  const s = newKingdom()
  assert.equal(s.rank, 0)
  assert.deepEqual(s.promotions, [])
  s.buildings['0,0'] = { x: 0, y: 0, kind: 'farm', level: 3 }
  const metrics = Object.fromEntries(rankProgress(s).map((p) => [p.id, p.value]))
  assert.deepEqual(metrics, { population: 3, buildings: 1, kinds: 1, sectors: 1 })
  assert.equal(earnedPromotion(s), null)
})

test('every requirement is simultaneous, counts current buildings and only used discoveries', () => {
  const s = developedKingdom(2)
  assert.ok(earnedPromotion(s))
  for (const mutate of [
    (s) => (s.population = 19),
    (s) => delete s.buildings[Object.keys(s.buildings).find((k) => s.buildings[k].kind === 'farm')],
    (s) =>
      Object.values(s.buildings)
        .filter((b) => ['mill', 'market'].includes(b.kind))
        .forEach((b) => (b.kind = 'farm')),
    (s) => s.sectors.pop(),
    (s) => (Object.values(s.discoveries)[0].status = 'available'),
  ]) {
    const changed = structuredClone(s)
    mutate(changed)
    assert.equal(earnedPromotion(changed), null)
  }
})

test('preview equals commit, gifts are separate, ranks advance once per turn and never repeat', () => {
  let s = developedKingdom()
  const before = structuredClone(s)
  for (let rank = 1; rank <= 3; rank++) {
    const prior = structuredClone(s),
      a = { type: 'gather' },
      result = resolveTurn(s, a)
    assert.deepEqual(s, prior)
    assert.deepEqual(result, resolveTurn(s, a))
    assert.equal(result.state.rank, rank)
    assert.deepEqual(result.promotion, { rank, turn: s.turn + 1 })
    assert.deepEqual(result.promotionGift, RANKS[rank].gift)
    assert.deepEqual(result.reward, { wood: 0, stone: 0, food: 0, gold: 0 })
    assert.deepEqual(result.produced, production(s))
    assert.equal(result.delta.wood, 2 + result.produced.wood + RANKS[rank].gift.wood)
    assert.deepEqual(result.state.offer, s.offer)
    assert.equal(result.state.rng, s.rng)
    assert.deepEqual(buildingProduction(result.state, result.state.buildings['3,3']), {
      wood: 1,
      stone: 0,
      food: 2,
      gold: 1,
    })
    assert.deepEqual(decode(encode(result.state)).state, result.state)
    s = result.state
  }
  assert.equal(before.rank, 0)
  assert.deepEqual(
    s.promotions.map((p) => p.turn),
    [61, 62, 63],
  )
  assert.deepEqual(rankProgress(s), [])
  const again = resolveTurn(s, { type: 'gather' })
  assert.equal(again.promotion, null)
  assert.deepEqual(again.promotionGift, { wood: 0, stone: 0, food: 0, gold: 0 })
  assert.equal(again.state.status, 'playing')
})

test('seasonal population growth can unlock rank at end of turn', () => {
  const s = developedKingdom()
  s.population = 5
  s.turn = 62
  assert.equal(earnedPromotion(s), null)
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.populationChange, 1)
  assert.equal(r.state.rank, 1)
})

test('gift never rescues shortage or triggers growth in its own turn', () => {
  const s = developedKingdom(1)
  s.population = 12
  s.turn = 62
  s.resources.food = 0
  for (const b of Object.values(s.buildings))
    if (b.kind === 'farm' || b.kind === 'orchard') b.kind = 'house'
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.shortage, true)
  assert.equal(r.state.hunger, 1)
  assert.equal(r.populationChange, 0)
  assert.equal(r.state.rank, 2)
  assert.equal(r.state.resources.food, 10)
  // Food after feeding = 23: just below 2×12; the gift takes it over AFTER growth.
  s.resources.food = 30
  const nearGrowth = resolveTurn(s, { type: 'gather' })
  assert.equal(nearGrowth.shortage, false)
  assert.equal(nearGrowth.state.resources.food, 33)
  assert.equal(nearGrowth.state.population, 12)
})

test('demolition and losses never demote; an invalid action cannot award or mutate', () => {
  let s = developedKingdom(3)
  s.population = 3
  const farm = Object.values(s.buildings).find((b) => b.kind === 'farm')
  s = resolveTurn(s, { type: 'demolish', x: farm.x, y: farm.y }).state
  assert.equal(s.rank, 3)
  const before = structuredClone(s)
  assert.equal(resolveTurn(s, { type: 'demolish', x: 3, y: 3 }), null)
  assert.deepEqual(s, before)
  assert.equal(resolveTurn(s, { type: 'gather' }).promotion, null)
})

test('discovery reward and promotion gift remain distinct when awarded in the same turn', () => {
  let s = developedKingdom(1)
  const { discoveryForSector } = jiti('./discoveries.ts')
  const d = discoveryForSector(s.seed, { x: 1, y: 0 }, 1)
  s.discoveries = { [key(d.x, d.y)]: d }
  const result = resolveTurn(s, { type: 'landmark', x: d.x, y: d.y })
  assert.equal(result.state.rank, 2)
  assert.deepEqual(result.promotionGift, RANKS[2].gift)
  assert.equal(result.state.discoveries[key(d.x, d.y)].status, 'used')
})

for (const version of [1, 2])
  test(`migration v${version} preserves raw save, economy and turns; promotion waits for next turn`, () => {
    const s = developedKingdom(),
      raw = encode(s, version),
      oldKey = version === 1 ? LEGACY_KEY : PREVIOUS_KEY
    const data = new Map([[oldKey, raw]])
    const result = load(port(data))
    assert.equal(result.status, 'saved')
    assert.equal(result.state.rank, 0)
    assert.deepEqual(result.state.promotions, [])
    assert.deepEqual(result.state.resources, s.resources)
    assert.equal(result.state.turn, s.turn)
    assert.equal(data.get(oldKey), raw)
    assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 5)
    assert.deepEqual(load(port(data)).state, result.state)
    assert.equal(resolveTurn(result.state, { type: 'gather' }).state.rank, 1)
  })

test('current save then v2 take priority even if corrupt; failed writes preserve old save', () => {
  const data = new Map([
    [LEGACY_KEY, encode(newKingdom(), 1)],
    [PREVIOUS_KEY, encode(developedKingdom(), 2)],
  ])
  assert.equal(load(port(data)).state.turn, 60)
  data.set(SAVE_KEY, '{bad')
  assert.equal(load(port(data)).status, 'corrupt')
  assert.equal(data.get(SAVE_KEY), '{bad')
  data.delete(SAVE_KEY)
  data.set(PREVIOUS_KEY, '{bad-v2')
  assert.equal(load(port(data)).status, 'corrupt')
  assert.equal(data.has(SAVE_KEY), false)
  const raw = encode(developedKingdom(), 2)
  data.set(PREVIOUS_KEY, raw)
  const quota = {
    getItem: port(data).getItem,
    setItem: () => {
      throw Error('quota')
    },
  }
  const result = load(quota)
  assert.equal(result.migrationSaveFailed, true)
  assert.equal(result.state.turn, 60)
  assert.equal(data.get(PREVIOUS_KEY), raw)
  assert.equal(save(quota, resolveTurn(result.state, { type: 'gather' }).state, true), false)
  assert.equal(data.has(SAVE_KEY), false)
  assert.equal(
    load({
      getItem: () => {
        throw Error('denied')
      },
    }).status,
    'unavailable',
  )
})

test('rank/history validation rejects repeated, missing, future and out-of-order awards', () => {
  const s = developedKingdom(3)
  for (const mutate of [
    (s) => delete s.rank,
    (s) => (s.rank = 4),
    (s) => (s.rank = -1),
    (s) => (s.rank = 1.5),
    (s) => s.promotions.pop(),
    (s) => (s.promotions[1].rank = 1),
    (s) => (s.promotions[0].turn = 0),
    (s) => (s.promotions[2].turn = 100),
    (s) => (s.promotions[1].turn = s.promotions[0].turn),
  ]) {
    const broken = structuredClone(s)
    mutate(broken)
    assert.equal(decode(encode(broken)), null)
  }
  s.population = 3 // Present-day thresholds need not still hold after earning a rank.
  assert.ok(decode(encode(s)))
})

test('from a fresh settlement all ranks are reachable using legal actions only', () => {
  for (const seed of [1, 42, 183]) {
    let s = newKingdom(seed)
    for (let i = 0; i < 600 && s.rank < 3; i++) {
      const count = (kind) => Object.values(s.buildings).filter((b) => b.kind === kind).length
      const targets = { farm: 9, sawmill: 3, quarry: 3, house: 6, market: 2, orchard: 1, mill: 1 }
      const candidates = []
      // Build a sustainable economy before expanding; all choices use actual dealt cards.
      const plot = s.sectors
        .flatMap((p) =>
          Array.from({ length: 49 }, (_, i) => ({
            x: p.x * 7 + (i % 7),
            y: p.y * 7 + Math.floor(i / 7),
          })),
        )
        .find(
          (p) =>
            terrain(s.seed, p.x, p.y) === 'meadow' &&
            !s.buildings[key(p.x, p.y)] &&
            !blocksBuilding(s.discoveries[key(p.x, p.y)]),
        )
      if (plot)
        for (const kind of Object.keys(targets))
          if (s.offer.includes(kind) && count(kind) < targets[kind])
            candidates.push({ type: 'build', kind, ...plot })
      if (count('sawmill') && count('quarry') && s.sectors.length < 7)
        candidates.push({ type: 'explore', x: s.sectors.length, y: 0 })
      for (const d of Object.values(s.discoveries))
        if (d.status === 'available') candidates.push({ type: 'landmark', x: d.x, y: d.y })
      if (plot) candidates.push({ type: 'build', kind: 'farm', ...plot }) // Cycle the offer legally.
      for (const b of Object.values(s.buildings))
        if (b.kind !== 'hall' && b.level < 3) candidates.push({ type: 'upgrade', x: b.x, y: b.y })
      candidates.push({ type: 'gather' })
      const a = candidates.find((a) => !actionError(s, a)),
        r = resolveTurn(s, a)
      assert.deepEqual(r, resolveTurn(s, a))
      s = r.state
      assert.ok(s.population <= capacity(s))
      assert.ok(KEYS.every((k) => s.resources[k] >= 0))
      assert.deepEqual(decode(encode(s)).state, s)
    }
    assert.equal(s.rank, 3, `seed ${seed}, turn ${s.turn}, population ${s.population}`)
    assert.equal(s.promotions.length, 3)
  }
})

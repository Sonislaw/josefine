import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { developedKingdom, encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
import { simulateDevelopment } from '../../../../../tests/gry/kingdom-balance-simulation.mjs'
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
      [8, 6, 4, 2, 1],
      [14, 10, 5, 4, 2],
      [22, 16, 7, 7, 4],
    ],
  )
  assert.deepEqual(
    RANKS.slice(1).map((r) => r.gift),
    [
      { wood: 6, stone: 3, food: 0, gold: 3 },
      { wood: 12, stone: 6, food: 6, gold: 6 },
      { wood: 20, stone: 12, food: 12, gold: 12 },
    ],
  )
  const s = newKingdom(1, 1)
  assert.equal(s.rank, 0)
  assert.deepEqual(s.promotions, [])
  s.buildings['0,0'] = { x: 0, y: 0, kind: 'farm', level: 3 }
  const metrics = Object.fromEntries(rankProgress(s).map((p) => [p.id, p.value]))
  assert.deepEqual(metrics, { population: 3, buildings: 1, kinds: 1, sectors: 1, discoveries: 0 })
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
    assert.equal(result.delta.wood, 1 + result.produced.wood + RANKS[rank].gift.wood)
    assert.equal(result.state.seed, s.seed)
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
  s.population = 7
  s.turn = 62
  assert.equal(earnedPromotion(s), null)
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.populationChange, 1)
  assert.equal(r.state.rank, 1)
})

test('gift never rescues shortage or triggers growth in its own turn', () => {
  const s = developedKingdom(1)
  s.population = 14
  s.turn = 62
  s.resources.food = 0
  for (const b of Object.values(s.buildings))
    if (b.kind === 'farm' || b.kind === 'orchard') b.kind = 'house'
  const r = resolveTurn(s, { type: 'gather' })
  assert.equal(r.shortage, true)
  assert.equal(r.state.hunger, 1)
  assert.equal(r.populationChange, 0)
  assert.equal(r.state.rank, 2)
  assert.equal(r.state.resources.food, 6)
  // Food after feeding = 23: just below 2×12; the gift takes it over AFTER growth.
  s.resources.food = 37
  const nearGrowth = resolveTurn(s, { type: 'gather' })
  assert.equal(nearGrowth.shortage, false)
  assert.equal(nearGrowth.state.resources.food, 33)
  assert.equal(nearGrowth.state.population, 14)
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
  s.discoveries[key(d.x, d.y)] = d
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
    assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 11)
    assert.deepEqual(load(port(data)).state, result.state)
    assert.equal(resolveTurn(result.state, { type: 'gather' }).state.rank, version === 1 ? 0 : 1)
  })

test('current save then v2 take priority even if corrupt; failed writes preserve old save', () => {
  const data = new Map([
    [LEGACY_KEY, encode(newKingdom(1, 1), 1)],
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
    const { state, turns } = simulateDevelopment(seed)
    assert.equal(state.rank, 3)
    assert.equal(state.promotions.length, 3)
    for (const turn of turns) {
      assert.deepEqual(resolveTurn(turn.before, turn.action), turn.result)
      assert.deepEqual(decode(encode(turn.result.state)).state, turn.result.state)
    }
  }
})

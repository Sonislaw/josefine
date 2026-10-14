import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { requestsKingdom } from '../../../../../tests/gry/kingdom-requests-fixture.mjs'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, resolveTurn, production, key } = await j.import('./engine.ts')
const {
  REQUEST_IDS,
  REQUESTS,
  emptyRequests,
  requestProgress,
  requestOffer,
  availableRequests,
  manageRequest,
} = await j.import('./requests.ts')
const { decode, load, SAVE_KEY, PROGRESSION_KEY, PREVIOUS_KEY, LEGACY_KEY } =
  await j.import('./storage.ts')
const port = (data) => ({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) })
const select = (s, id) => {
  for (let i = 0; i < 12; i++) {
    if (requestOffer(s).includes(id)) return manageRequest(s, { type: 'accept', id })
    s = manageRequest(s, { type: 'rotate' })
  }
  throw Error(`Unreachable request ${id}`)
}

test('rank offers have at most three distinct goals; rotation, acceptance and deferral preserve economy and RNG', () => {
  const original = requestsKingdom(),
    s = structuredClone(original)
  const seen = new Set()
  let current = s
  for (let i = 0; i < 4; i++) {
    const offered = requestOffer(current)
    assert.equal(offered.length, 3)
    assert.equal(new Set(offered).size, 3)
    offered.forEach((id) => seen.add(id))
    current = manageRequest(current, { type: 'rotate' })
  }
  assert.equal(seen.size, 12)
  current = manageRequest(current, { type: 'accept', id: requestOffer(current)[0] })
  assert.deepEqual(requestOffer(current), [])
  assert.equal(manageRequest(current, { type: 'accept', id: 'water-farm' }), null)
  assert.equal(manageRequest(current, { type: 'rotate' }), null)
  current = manageRequest(current, { type: 'defer' })
  for (const field of [
    'resources',
    'rng',
    'offer',
    'turn',
    'rank',
    'promotions',
    'buildings',
    'sectors',
    'discoveries',
  ])
    assert.deepEqual(current[field], original[field])
  assert.deepEqual(s, original)
  const fresh = newKingdom()
  assert.deepEqual(requestOffer(fresh), REQUEST_IDS.slice(0, 3))
  assert.equal(manageRequest(fresh, { type: 'accept', id: 'winter-mill' }), null)
  assert.equal(manageRequest(fresh, { type: 'defer' }), null)
  assert.equal(manageRequest(fresh, { type: 'rotate' }), null)
  for (let rank = 0; rank <= 3; rank++) {
    fresh.rank = rank
    assert.equal(availableRequests(fresh).length, 3 * (rank + 1))
  }
})

test('all twelve goals recognize existing valid buildings and restored places; empty map meets none', () => {
  const s = requestsKingdom()
  assert.ok(decode(encode(s)))
  for (const id of REQUEST_IDS) {
    assert.equal(requestProgress(s, id).complete, true, id)
    assert.ok(requestProgress(s, id).location, id)
    assert.equal(requestProgress(newKingdom(), id).complete, false, id)
  }
})

test('adjacency uses shared edges and discovered terrain; several separate mills cannot combine farms', () => {
  const s = newKingdom(42)
  s.buildings['3,2'] = { kind: 'farm', x: 3, y: 2, level: 3 } // diagonal to fixed water 4,3
  assert.equal(requestProgress(s, 'water-farm').complete, false)
  delete s.buildings['3,2']
  s.buildings['4,2'] = { kind: 'farm', x: 4, y: 2, level: 1 }
  assert.equal(requestProgress(s, 'water-farm').complete, true)
  s.buildings = {
    '3,3': s.buildings['3,3'],
    '0,0': { kind: 'mill', x: 0, y: 0, level: 3 },
    '1,0': { kind: 'farm', x: 1, y: 0, level: 3 },
    '4,0': { kind: 'mill', x: 4, y: 0, level: 3 },
    '5,0': { kind: 'farm', x: 5, y: 0, level: 3 },
  }
  assert.equal(requestProgress(s, 'mill-farms').value, 1)
  assert.equal(requestProgress(s, 'winter-mill').complete, false)
  s.buildings['0,1'] = { kind: 'farm', x: 0, y: 1, level: 1 }
  assert.equal(requestProgress(s, 'mill-farms').complete, true)
  assert.equal(requestProgress(s, 'winter-mill').complete, false)
  s.buildings['0,1'].level = 2
  assert.equal(requestProgress(s, 'winter-mill').complete, true)
  s.buildings['0,0'].level = 1
  assert.equal(requestProgress(s, 'winter-mill').complete, false)
  s.buildings['1,0'].kind = 'house'
  s.buildings['0,1'].kind = 'hall'
  s.buildings['0,0'].kind = 'market'
  assert.equal(requestProgress(s, 'market-houses').value, 1)
  // A building at a sector boundary must not count a still undiscovered water tile.
  const outside = newKingdom(42)
  outside.buildings['6,5'] = { kind: 'farm', x: 6, y: 5, level: 1 }
  const before = requestProgress(outside, 'water-farm')
  outside.sectors.push({ x: 1, y: 0 })
  assert.ok(requestProgress(outside, 'water-farm').value >= before.value)
})

test('restoration and correct neighboring building are both required; ruins and wagons do not count', () => {
  const s = requestsKingdom()
  for (const d of Object.values(s.discoveries))
    if (['spring', 'tradingPost'].includes(d.kind)) {
      d.status = 'available'
      d.usedTurn = null
    }
  for (const id of ['restored-place', 'spring-garden', 'trading-market'])
    assert.equal(requestProgress(s, id).complete, false)
  const d = Object.values(s.discoveries).find((d) => d.kind === 'spring')
  d.status = 'used'
  d.usedTurn = 30
  assert.equal(requestProgress(s, 'restored-place').complete, true)
})

test('preview/commit matches; reward is separate, once only, after feeding and growth', () => {
  const initial = requestsKingdom()
  let s = select(initial, 'two-orchards')
  const before = structuredClone(s)
  assert.equal(s.turn, initial.turn)
  assert.equal(s.requests.completed.length, 0)
  const r = resolveTurn(s, { type: 'gather' })
  assert.deepEqual(s, before)
  assert.deepEqual(r, resolveTurn(s, { type: 'gather' }))
  assert.deepEqual(r.requestReward, REQUESTS['two-orchards'].reward)
  assert.deepEqual(r.produced, production(s))
  assert.deepEqual(r.reward, { wood: 0, stone: 0, food: 0, gold: 0 })
  assert.deepEqual(r.completedRequest, { id: 'two-orchards', acceptedTurn: 60, turn: 61 })
  assert.equal(r.state.requests.active, null)
  assert.deepEqual(decode(encode(r.state)).state, r.state)
  assert.equal(availableRequests(r.state).includes('two-orchards'), false)
  assert.equal(resolveTurn(r.state, { type: 'gather' }).completedRequest, null)
  assert.equal(manageRequest(r.state, { type: 'accept', id: 'two-orchards' }), null)
  s.turn = 62
  s.population = 20
  s.resources.food = 0
  for (const b of Object.values(s.buildings)) if (b.kind === 'farm') b.kind = 'house'
  const shortage = resolveTurn(s, { type: 'gather' })
  assert.equal(shortage.shortage, true)
  assert.equal(shortage.state.hunger, 1)
  assert.equal(shortage.populationChange, 0)
  assert.equal(shortage.state.resources.food, 6)
  s.population = 12
  // End feeding with 23 food: the 6-food reward takes stocks above the growth threshold later.
  s.resources.food = 2 * s.population - 1 + s.population - production(s).food - 3
  const below = resolveTurn(s, { type: 'gather' })
  assert.equal(below.state.population, 12)
  assert.equal(below.state.resources.food, 29)
})

test('building, upgrading or restoring may finish a goal; demolishing it cancels forecast and rejected turns stay immutable', () => {
  let s = newKingdom(42)
  s = manageRequest(s, { type: 'accept', id: 'water-farm' })
  assert.equal(requestProgress(s, 'water-farm').complete, false)
  const build = resolveTurn(s, { type: 'build', kind: 'farm', x: 4, y: 2 })
  assert.equal(build.completedRequest.id, 'water-farm')
  const master = select(requestsKingdom(), 'master-farm')
  for (const b of Object.values(master.buildings)) if (b.kind === 'farm') b.level = 2
  const farm = Object.values(master.buildings).find((b) => b.kind === 'farm')
  assert.equal(
    resolveTurn(master, { type: 'upgrade', x: farm.x, y: farm.y }).completedRequest.id,
    'master-farm',
  )
  farm.level = 3
  assert.equal(
    resolveTurn(master, { type: 'demolish', x: farm.x, y: farm.y }).completedRequest,
    null,
  )
  const before = structuredClone(master)
  assert.equal(resolveTurn(master, { type: 'demolish', x: 3, y: 3 }), null)
  assert.deepEqual(master, before)
  let restored = select(requestsKingdom(), 'restored-place')
  for (const d of Object.values(restored.discoveries))
    if (['spring', 'tradingPost'].includes(d.kind)) {
      d.status = 'available'
      d.usedTurn = null
    }
  const place = Object.values(restored.discoveries).find((d) => d.kind === 'spring')
  assert.equal(
    resolveTurn(restored, { type: 'landmark', x: place.x, y: place.y }).completedRequest.id,
    'restored-place',
  )
})

test('promotion and request can complete together, with independent rewards and no card RNG change', () => {
  const s = requestsKingdom()
  s.rank = 0
  s.promotions = []
  s.turn = 62
  s.population = 5
  const chosen = select(s, 'water-farm'),
    r = resolveTurn(chosen, { type: 'gather' })
  assert.equal(r.state.rank, 1)
  assert.equal(r.completedRequest.id, 'water-farm')
  assert.equal(r.promotion.rank, 1)
  assert.equal(r.promotionGift.gold, 5)
  assert.equal(r.requestReward.gold, 2)
  assert.equal(r.state.rng, s.rng)
  assert.deepEqual(r.state.offer, s.offer)
})

test('all requests can be completed once; history and total reward remain bounded', () => {
  let s = requestsKingdom()
  const sum = { wood: 0, stone: 0, food: 0, gold: 0 }
  for (const id of REQUEST_IDS) {
    s = select(s, id)
    const base = resolveTurn(
      { ...s, requests: { ...s.requests, active: null } },
      { type: 'gather' },
    )
    const r = resolveTurn(s, { type: 'gather' })
    assert.equal(r.completedRequest.id, id)
    for (const k of Object.keys(sum)) {
      sum[k] += r.requestReward[k]
      assert.equal(r.state.resources[k], base.state.resources[k] + r.requestReward[k])
    }
    s = r.state
    assert.ok(decode(encode(s)))
  }
  assert.deepEqual(sum, { wood: 28, stone: 19, food: 40, gold: 60 })
  assert.equal(s.requests.completed.length, 12)
  assert.deepEqual(requestOffer(s), [])
  assert.equal(manageRequest(s, { type: 'rotate' }), null)
  assert.equal(resolveTurn(s, { type: 'gather' }).completedRequest, null)
})

for (const version of [1, 2, 3])
  test(`v${version} migration adds empty requests without advancing or granting rewards`, () => {
    const old = requestsKingdom(),
      raw = encode(old, version),
      oldKey = [null, LEGACY_KEY, PREVIOUS_KEY, PROGRESSION_KEY][version]
    const data = new Map([[oldKey, raw]]),
      result = load(port(data))
    assert.equal(result.status, 'saved')
    assert.deepEqual(result.state.requests, emptyRequests())
    assert.deepEqual(result.state.resources, old.resources)
    assert.equal(result.state.turn, old.turn)
    assert.equal(result.state.rank, version === 3 ? 3 : 0)
    assert.deepEqual(result.state.promotions, version === 3 ? old.promotions : [])
    assert.equal(data.get(oldKey), raw)
    assert.equal(JSON.parse(data.get(SAVE_KEY)).version, 5)
    assert.deepEqual(load(port(data)).state, result.state)
  })

test('corrupt newer saves never fall back, quota retains older data, active requests survive round-trip', () => {
  const state = select(requestsKingdom(), 'master-farm')
  assert.deepEqual(decode(encode(state)).state, state)
  const old = encode(state, 3),
    data = new Map([
      [PROGRESSION_KEY, old],
      [PREVIOUS_KEY, encode(state, 2)],
    ])
  data.set(SAVE_KEY, '{bad')
  assert.equal(load(port(data)).status, 'corrupt')
  assert.equal(data.get(SAVE_KEY), '{bad')
  data.delete(SAVE_KEY)
  data.set(PROGRESSION_KEY, '{bad3')
  assert.equal(load(port(data)).status, 'corrupt')
  data.set(PROGRESSION_KEY, old)
  const result = load({
    getItem: port(data).getItem,
    setItem() {
      throw Error('quota')
    },
  })
  assert.equal(result.migrationSaveFailed, true)
  assert.equal(result.state.rank, 3)
  assert.deepEqual(result.state.requests, emptyRequests())
  assert.equal(data.get(PROGRESSION_KEY), old)
  assert.equal(data.has(SAVE_KEY), false)
})

test('malformed request IDs, duplicate rewards, chronology and locked goals are rejected', () => {
  const s = select(requestsKingdom(), 'water-farm')
  for (const mutate of [
    (s) => delete s.requests,
    (s) => (s.requests.active.id = 'unknown'),
    (s) => (s.requests.active.acceptedTurn = 99),
    (s) => (s.requests.cursor = -1),
    (s) => (s.requests.cursor = 12),
    (s) => (s.requests.completed = [{ id: 'water-farm', acceptedTurn: 1, turn: 2 }]),
    (s) => {
      s.requests.active = null
      s.requests.completed = [{ id: 'unknown', acceptedTurn: 1, turn: 2 }]
    },
    (s) => {
      s.requests.active = null
      s.requests.completed = [{ id: 'master-farm', acceptedTurn: 2, turn: 2 }]
    },
    (s) => {
      s.requests.active = null
      s.requests.completed = [{ id: 'master-farm', acceptedTurn: 1, turn: 99 }]
    },
    (s) => {
      s.rank = 0
      s.promotions = []
      s.requests.active = { id: 'master-farm', acceptedTurn: 1 }
    },
  ]) {
    const broken = structuredClone(s)
    mutate(broken)
    assert.equal(decode(encode(broken)), null)
  }
  const ended = { ...s, status: 'gameover' }
  assert.equal(manageRequest(ended, { type: 'defer' }), null)
  assert.equal(resolveTurn(ended, { type: 'gather' }), null)
})

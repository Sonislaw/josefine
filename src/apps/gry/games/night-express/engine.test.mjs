import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { RULES } = await j.import('./config.ts')
const { createGame, step, execute, validate, upgrades, demandPassenger } =
  await j.import('./engine.ts')
const { createTrain, discoverDistrict, addStation } = await j.import('./world.ts')
const { network, trainPoint } = await j.import('./network.ts')
const { distance, swept, screenPoint, worldPoint } = await j.import('./geometry.ts')
const { decode, load, persist } = await j.import('./storage.ts')
const { createClock } = await j.import('./clock.ts')
const snapshot = (g) => JSON.stringify(g)
const run = (g, seconds) => {
  for (let i = 0; i < seconds * 60; i++) step(g)
}
const ids = (g) => {
  const stations = Object.values(g.nodes).filter((n) => n.kind === 'station'),
    junction = Object.values(g.nodes).find((n) => n.kind === 'junction')
  return { a: stations[0].id, b: stations[1].id, c: stations[2].id, j: junction.id }
}
const saved = (g) => ({
  version: 1,
  game: g,
  best: g.score,
  sound: false,
  tutorialDismissed: false,
})
function onEdge(g, t, edge, from, progress) {
  const e = g.edges[edge]
  Object.assign(t, {
    node: null,
    edge,
    from,
    to: e.a === from ? e.b : e.a,
    progress,
    inbound: null,
    dwell: 0,
    onboard: [],
  })
}
test('paused Y network, two trains, economy and shared topology cache', () => {
  const g = createGame(99),
    { a, c, j } = ids(g)
  assert.equal(g.mode, 'paused')
  assert.equal(g.trains.length, 2)
  assert.equal(g.rails, 48)
  assert.equal(g.capacity, 6)
  assert.deepEqual(g.nodes[j].pair, [a, c])
  assert.equal(network(g), network(g))
  assert.equal(Object.keys(g.edges).length, 3)
  assert.deepEqual(createGame(99), g)
})
test('preview and commit agree, illegal actions are immutable, cost and complete refund', () => {
  const g = createGame(),
    { a, b } = ids(g)
  const before = snapshot(g)
  assert.equal(execute(g, { type: 'connect', a, b: a }).ok, false)
  assert.equal(snapshot(g), before)
  const command = { type: 'connect', a, b },
    cost = validate(g, command).cost
  assert.equal(cost, 10)
  assert.equal(execute(g, command).ok, true)
  assert.equal(g.rails, 48 - cost)
  const edge = Object.values(g.edges).find((e) => e.a === a && e.b === b)
  assert.equal(execute(g, { type: 'remove', edge: edge.id }).ok, true)
  assert.equal(g.rails, 48)
  g.mode = 'playing'
  assert.equal(execute(g, command).ok, false)
})
test('degree limits, duplicate/overlap/crossing, undiscovered building and insufficient materials', () => {
  const g = createGame(),
    { a, b, c, j } = ids(g)
  assert.equal(validate(g, { type: 'connect', a, b: j }).ok, false)
  assert.equal(validate(g, { type: 'node', point: { x: 900, y: 900 } }).ok, false)
  execute(g, { type: 'connect', a, b })
  assert.equal(validate(g, { type: 'connect', a, b: c }).ok, false)
  const low = createGame()
  low.rails = 0
  assert.equal(validate(low, { type: 'connect', a, b }).ok, false)
  const cross = createGame()
  execute(cross, { type: 'node', point: { x: -240, y: -100 } })
  const left = cross.nextId - 1
  execute(cross, { type: 'node', point: { x: 240, y: -100 } })
  const right = cross.nextId - 1
  assert.equal(validate(cross, { type: 'connect', a: left, b: right }).ok, false)
})
test('occupied tracks cannot split/remove; empty splitting preserves total refundable material', () => {
  const g = createGame(),
    { a, j } = ids(g),
    e = Object.values(g.edges).find((e) => e.a === a)
  const p = { x: (g.nodes[a].x + g.nodes[j].x) / 2, y: (g.nodes[a].y + g.nodes[j].y) / 2 }
  onEdge(g, g.trains[0], e.id, a, 20)
  assert.equal(validate(g, { type: 'remove', edge: e.id }).ok, false)
  assert.equal(validate(g, { type: 'split', edge: e.id, point: p }).ok, false)
  g.trains[0] = createTrain(g, a, g.trains[0].id)
  const oldTotal = Object.values(g.edges).reduce((n, e) => n + e.cost, 0)
  assert.equal(execute(g, { type: 'split', edge: e.id, point: p }).ok, true)
  assert.equal(
    Object.values(g.edges).reduce((n, e) => n + e.cost, 0),
    oldTotal,
  )
  assert.equal(g.rails, 48)
})
test('locked turnouts reject switching; closed approach stops without moving backwards', () => {
  const g = createGame(),
    { a, b, j } = ids(g),
    e = Object.values(g.edges).find((e) => e.a === a),
    len = distance(g.nodes[a], g.nodes[j])
  onEdge(g, g.trains[0], e.id, a, len - 20)
  assert.equal(validate(g, { type: 'switch', node: j }).ok, false)
  g.trains[0].progress = len - 40
  g.nodes[j].pair = [b, ids(g).c]
  g.nodes[b].hold = true
  g.mode = 'playing'
  step(g)
  assert.equal(g.trains[0].progress, len - 40)
  assert.equal(validate(g, { type: 'switch', node: j }).ok, true)
})
test('station dwell, FIFO, graph reachability, capacity, delivery and terminal reversal', () => {
  const g = createGame(),
    { a, b, c } = ids(g)
  g.nodes[b].hold = true
  const disconnected = addStation(g, { x: -200, y: -200 }, '0,0', false)
  g.revision++
  g.nodes[a].waiting = [
    { origin: a, destination: c, since: 0 },
    { origin: a, destination: disconnected, since: 0 },
    ...Array.from({ length: 8 }, () => ({ origin: a, destination: b, since: 0 })),
  ]
  g.mode = 'playing'
  run(g, 1)
  assert.equal(g.trains[0].node, a)
  run(g, 1.1)
  assert.equal(g.trains[0].edge !== null, true)
  assert.equal(g.trains[0].onboard.length, 6)
  assert.equal(g.trains[0].onboard[0].destination, c)
  assert.ok(g.nodes[a].waiting.some((p) => p.destination === disconnected))
  run(g, 7)
  assert.ok(g.delivered >= 1)
  assert.ok(g.score >= 10)
  run(g, 3)
  assert.equal(g.trains[0].from, c)
})
test('manual departure signal, immediate exit clearance and safe platform queues', () => {
  const g = createGame(),
    { a } = ids(g)
  g.nodes[a].hold = true
  g.mode = 'playing'
  run(g, 4)
  assert.equal(g.trains[0].node, a)
  g.mode = 'paused'
  execute(g, { type: 'hold', node: a })
  const e = Object.values(g.edges).find((e) => e.a === a)
  onEdge(g, g.trains[1], e.id, a, 20)
  g.mode = 'playing'
  step(g)
  assert.equal(g.trains[0].node, a)
  const q = createGame()
  q.trains = [createTrain(q), createTrain(q), createTrain(q)]
  q.nodes[q.depot].hold = true
  q.mode = 'playing'
  run(q, 2)
  assert.equal(q.lives, 3)
})
test('head-on collision restores fleet at depot, loses one chance, third accident ends game', () => {
  const g = createGame(),
    { a, j } = ids(g),
    e = Object.values(g.edges).find((e) => e.a === a),
    len = distance(g.nodes[a], g.nodes[j])
  for (let i = 1; i <= 3; i++) {
    onEdge(g, g.trains[0], e.id, a, 100)
    onEdge(g, g.trains[1], e.id, j, len - 110)
    g.mode = 'playing'
    step(g)
    assert.equal(g.accidents, i)
    assert.equal(g.lives, 3 - i)
    assert.equal(g.mode, i === 3 ? 'gameover' : 'paused')
    assert.ok(g.trains.every((t) => t.node === g.depot))
    assert.equal(g.trains.length, 2)
  }
  const before = snapshot(g)
  step(g)
  assert.equal(snapshot(g), before)
})
test('rear-end and three-train pileup count as one accident', () => {
  const g = createGame(),
    { a } = ids(g),
    e = Object.values(g.edges).find((e) => e.a === a)
  g.trains.push(createTrain(g))
  g.trains.forEach((t, i) => onEdge(g, t, e.id, a, 100 + i * 12))
  g.mode = 'playing'
  step(g)
  assert.equal(g.accidents, 1)
  assert.equal(g.lastAccident.trains, 3)
  assert.equal(g.lives, 2)
})
test('different approaches collide at turnout; swept detection catches crossing between steps', () => {
  const g = createGame(),
    { a, b, j } = ids(g),
    edges = Object.values(g.edges)
  g.nodes[j].pair = [a, b]
  for (const [i, id] of [a, b].entries()) {
    const e = edges.find((e) => e.a === id),
      len = distance(g.nodes[id], g.nodes[j])
    onEdge(g, g.trains[i], e.id, id, len - 8)
  }
  g.mode = 'playing'
  step(g)
  assert.equal(g.accidents, 1)
  assert.ok(
    swept({ x: -40, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 0 }, { x: -40, y: 0 }).distance < 1e-8,
  )
})
test('waiting abandonment and full queue penalties never reduce score below zero', () => {
  const g = createGame(),
    { a, c } = ids(g)
  for (const n of Object.values(g.nodes)) n.hold = true
  g.elapsed = 121
  g.nextExpiry = 121
  g.nextUpgrade = 240
  g.score = 3
  g.nodes[a].waiting = [{ origin: a, destination: c, since: 0 }]
  g.mode = 'playing'
  step(g)
  assert.equal(g.nodes[a].waiting.length, 0)
  assert.equal(g.score, 0)
  assert.ok(g.lost > 0)
  for (const n of Object.values(g.nodes).filter((n) => n.kind === 'station'))
    n.waiting = Array.from({ length: 24 }, () => ({
      origin: n.id,
      destination: n.id === a ? c : a,
      since: g.elapsed,
    }))
  const lost = g.lost
  demandPassenger(g)
  assert.equal(g.lost, lost + 1)
})
test('deterministic neighboring districts, grace period, supplies and no overlapping infrastructure', () => {
  const a = createGame(818),
    b = createGame(818)
  for (let i = 0; i < 100; i++) {
    discoverDistrict(a)
    discoverDistrict(b)
  }
  assert.deepEqual(a, b)
  assert.equal(a.districts.length, 101)
  assert.equal(a.stationCount, 203)
  assert.equal(a.rails, 48 + 2400)
  assert.equal(new Set(a.districts.map((d) => d.key)).size, 101)
  const stations = Object.values(a.nodes).filter((n) => n.kind === 'station')
  for (let i = 0; i < stations.length; i++)
    for (let j = i + 1; j < stations.length; j++)
      assert.ok(distance(stations[i], stations[j]) >= RULES.nodeSpace)
  assert.ok(stations.slice(3).every((n) => n.opensAt === 60))
})
test('upgrade legality, caps and repeatable rails; unavailable choices do not mutate', () => {
  const g = createGame()
  g.mode = 'upgrade'
  assert.equal(execute(g, { type: 'upgrade', choice: 'train' }).ok, true)
  assert.equal(g.trains.length, 3)
  assert.equal(g.mode, 'paused')
  while (g.trains.length < 16) {
    g.mode = 'upgrade'
    execute(g, { type: 'upgrade', choice: 'train' })
  }
  while (g.capacity < 12) {
    g.mode = 'upgrade'
    execute(g, { type: 'upgrade', choice: 'capacity' })
  }
  g.mode = 'upgrade'
  assert.deepEqual(upgrades(g), ['rails'])
  const before = snapshot(g)
  assert.equal(execute(g, { type: 'upgrade', choice: 'train' }).ok, false)
  assert.equal(snapshot(g), before)
  execute(g, { type: 'upgrade', choice: 'rails' })
  assert.equal(g.rails, 60)
})
test('ten-minute deterministic simulation, growth schedule and modal time freeze', () => {
  const games = [createGame(77), createGame(77)]
  for (const g of games) {
    for (const n of Object.values(g.nodes)) n.hold = true
    g.mode = 'playing'
    for (let i = 0; i < 36005; i++) {
      step(g)
      if (g.mode === 'upgrade') {
        const time = g.elapsed
        step(g)
        assert.equal(g.elapsed, time)
        execute(g, { type: 'upgrade', choice: 'rails' })
        g.mode = 'playing'
      }
    }
    g.mode = 'paused'
    const time = g.elapsed
    run(g, 1)
    assert.equal(g.elapsed, time)
  }
  assert.deepEqual(games[0], games[1])
  assert.equal(games[0].districts.length, 4)
  assert.equal(games[0].lives, 3)
})
test('save round-trip restores trains, queues and RNG, always paused; corrupt references rejected', () => {
  const g = createGame(44)
  g.mode = 'playing'
  run(g, 3)
  const copy = decode(JSON.stringify(saved(g)))
  assert.ok(copy)
  assert.equal(copy.game.mode, 'paused')
  assert.deepEqual(copy.game.trains, g.trains)
  assert.equal(copy.game.random, g.random)
  const next = structuredClone(g)
  copy.game.mode = 'playing'
  run(next, 1)
  run(copy.game, 1)
  assert.deepEqual(copy.game, next)
  for (const mutate of [
    (s) => (s.game.trains[0].edge = 999),
    (s) => (s.game.nodes[1].x = null),
    (s) => (s.game.nextId = 1),
    (s) => (s.game.nodes[1].waiting = [{ origin: 1, destination: 999, since: 0 }]),
    (s) => (s.game.lives = 8),
  ]) {
    const s = saved(structuredClone(g))
    mutate(s)
    assert.equal(decode(JSON.stringify(s)), null)
  }
  assert.equal(decode('{broken'), null)
})
test('storage protects corrupt data on load; unavailable/quota errors are nonfatal; best is monotonic', () => {
  let raw = '{broken'
  const port = { getItem: () => raw, setItem: (k, v) => (raw = v) }
  assert.equal(load(port).status, 'corrupt')
  assert.equal(raw, '{broken')
  const s = saved(createGame())
  s.best = 100
  assert.equal(persist(port, s).ok, true)
  s.best = 0
  assert.equal(persist(port, s).best, 100)
  assert.equal(
    load({
      getItem() {
        throw Error()
      },
    }).status,
    'unavailable',
  )
  assert.equal(
    persist(
      {
        getItem: () => null,
        setItem() {
          throw Error()
        },
      },
      s,
    ).ok,
    false,
  )
})
test('camera conversion is invertible; clock freezes and never catches up after lost focus', () => {
  const camera = { x: 800, y: -300, zoom: 0.7 },
    p = { x: 333, y: 876 }
  const s = screenPoint(p, camera, 360, 435),
    w = worldPoint(s, camera, 360, 435)
  assert.ok(distance(p, w) < 1e-8)
  const clock = createClock()
  let playing = true,
    count = 0,
    stalls = 0
  const tick = (t) =>
    clock.tick(
      t,
      () => playing,
      () => count++,
      () => {
        stalls++
        playing = false
      },
    )
  tick(0)
  tick(100)
  assert.equal(count, 6)
  tick(1000)
  assert.equal(stalls, 1)
  tick(5000)
  assert.equal(count, 6)
})

import { RULES } from './config'
import { distance, pointSegment } from './geometry'
import { normalizePairs } from './network'
import type { Game, Point, Train } from './model'
export function random(g: Game) {
  g.random = (Math.imul(g.random, 1664525) + 1013904223) >>> 0
  return g.random / 2 ** 32
}
export function hash(seed: number, x: number, y: number) {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 2 ** 32
}
export function addStation(g: Game, p: Point, district: string, grace = true) {
  const id = g.nextId++
  g.nodes[id] = {
    ...p,
    id,
    kind: 'station',
    label: `S${++g.stationCount}`,
    district,
    hold: false,
    pair: [],
    waiting: [],
    opensAt: g.elapsed + (grace ? RULES.stationGrace : 0),
  }
  return id
}
export function createTrain(g: Game, node = g.depot, id = g.nextId++): Train {
  return {
    id,
    node,
    edge: null,
    from: node,
    to: node,
    progress: 0,
    inbound: null,
    dwell: RULES.stationStop,
    onboard: [],
  }
}
/** Sector positions depend only on seed and coordinates, not the order of camera visits. */
export function discoverDistrict(g: Game) {
  const known = new Set(g.districts.map((d) => d.key)),
    frontier = new Map<string, Point>()
  for (const d of g.districts)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const p = { x: d.x + dx!, y: d.y + dy! },
        key = `${p.x},${p.y}`
      if (!known.has(key)) frontier.set(key, p)
    }
  const options = [...frontier.values()].sort(
    (a, b) =>
      Math.abs(a.x) + Math.abs(a.y) - Math.abs(b.x) - Math.abs(b.y) || a.y - b.y || a.x - b.x,
  )
  // Fill the nearest ring first; the world has no preset number of rings.
  const nearest = Math.abs(options[0]!.x) + Math.abs(options[0]!.y)
  const candidates = options.filter((p) => Math.abs(p.x) + Math.abs(p.y) === nearest)
  const p = candidates[Math.floor(random(g) * candidates.length)]!,
    key = `${p.x},${p.y}`
  g.districts.push({ ...p, key, since: g.elapsed })
  for (let i = 0; i < 2; i++) {
    let point: Point = { x: 0, y: 0 }
    for (let attempt = 0; attempt < 40; attempt++) {
      point = {
        x:
          p.x * RULES.districtSize +
          (i ? 145 : -145) +
          (hash(g.seed + attempt, p.x * 7 + i, p.y * 11) - 0.5) * 90,
        y:
          p.y * RULES.districtSize +
          (i ? 125 : -125) +
          (hash(g.seed + attempt + 31, p.x * 5, p.y * 9 + i) - 0.5) * 90,
      }
      if (
        Object.values(g.nodes).every((n) => distance(n, point) >= RULES.nodeSpace) &&
        Object.values(g.edges).every(
          (e) => pointSegment(point, g.nodes[e.a]!, g.nodes[e.b]!) >= RULES.nodeSpace,
        )
      )
        break
    }
    addStation(g, point, key)
  }
  g.rails += RULES.districtRails
  g.revision++
  return g.districts.at(-1)!
}
export function createGame(seed = 1): Game {
  const g: Game = {
    seed: seed >>> 0,
    random: seed >>> 0,
    nextId: 1,
    revision: 0,
    mode: 'paused',
    elapsed: 0,
    score: 0,
    delivered: 0,
    lost: 0,
    lives: 3,
    accidents: 0,
    rails: RULES.initialRails,
    capacity: RULES.initialCapacity,
    depot: 0,
    nodes: {},
    edges: {},
    trains: [],
    districts: [{ x: 0, y: 0, key: '0,0', since: 0 }],
    stationCount: 0,
    nextDistrict: RULES.districtEvery,
    nextUpgrade: RULES.upgradeEvery,
    nextExpiry: 1,
    demand: 0,
    lastAccident: null,
  }
  const a = addStation(g, { x: -190, y: 120 }, '0,0', false),
    b = addStation(g, { x: 190, y: 120 }, '0,0', false),
    c = addStation(g, { x: 0, y: -180 }, '0,0', false)
  g.depot = a
  const j = g.nextId++
  g.nodes[j] = {
    id: j,
    kind: 'junction',
    x: 0,
    y: 0,
    label: `R${j}`,
    district: '0,0',
    hold: false,
    pair: [a, c],
    waiting: [],
    opensAt: 0,
  }
  for (const node of [a, b, c]) {
    const id = g.nextId++
    g.edges[id] = {
      id,
      a: node,
      b: j,
      cost: Math.ceil(distance(g.nodes[node]!, g.nodes[j]!) / RULES.railUnit),
    }
  }
  g.trains = [createTrain(g, a), createTrain(g, b)]
  g.nodes[a]!.waiting.push(
    { origin: a, destination: c, since: 0 },
    { origin: a, destination: b, since: 0 },
  )
  g.nodes[b]!.waiting.push({ origin: b, destination: a, since: 0 })
  normalizePairs(g)
  return g
}

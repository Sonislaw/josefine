import { RULES } from './config'
import { distance, swept } from './geometry'
import { exitFor, network, trainPoint } from './network'
import { createTrain, discoverDistrict, random } from './world'
import type { Game, Passenger, Point, Train } from './model'
export { createGame } from './world'
export { execute, validate, upgrades } from './commands'

export function losePassenger(g: Game) {
  g.lost++
  g.score = Math.max(0, g.score - RULES.lostPenalty)
}
export function demandPassenger(g: Game) {
  const all = network(g).stations.filter((id) => g.nodes[id]!.opensAt <= g.elapsed)
  if (all.length < 2) return
  const recent = new Set(g.districts.slice(-3).map((d) => d.key)),
    local = all.filter((id) => recent.has(g.nodes[id]!.district))
  const sourcePool = local.length && random(g) < RULES.recentWeight ? local : all
  const origin = sourcePool[Math.floor(random(g) * sourcePool.length)]!
  const destinations = all.filter((id) => id !== origin)
  const destination = destinations[Math.floor(random(g) * destinations.length)]!
  const n = g.nodes[origin]!
  if (n.waiting.length >= RULES.queue) {
    losePassenger(g)
    return
  }
  n.waiting.push({ origin, destination, since: g.elapsed })
}
function board(g: Game, t: Train, node: number) {
  const n = g.nodes[node]!,
    components = network(g).components,
    waiting: Passenger[] = []
  for (const p of n.waiting) {
    if (g.elapsed - p.since >= RULES.patience) {
      losePassenger(g)
      continue
    }
    if (t.onboard.length < g.capacity && components.get(node) === components.get(p.destination))
      t.onboard.push(p)
    else waiting.push(p)
  }
  n.waiting = waiting
}
function move(g: Game, t: Train, dt: number) {
  if (t.node !== null) {
    const node = g.nodes[t.node]!
    t.dwell = Math.max(0, t.dwell - dt)
    if (t.dwell > 1e-8) return
    const exit = exitFor(g, node.id, t.inbound)
    if (!exit) return
    // Platforms provide immediate departure clearance, not automatic block signalling.
    if (
      node.kind === 'station' &&
      g.trains.some(
        (other) =>
          other.id !== t.id &&
          other.edge === exit.edge &&
          distance(trainPoint(g, other), node) < RULES.exitSpace,
      )
    )
      return
    if (node.kind === 'station') board(g, t, node.id)
    t.from = node.id
    t.to = exit.node
    t.edge = exit.edge
    t.node = null
    t.progress = 0
    return
  }
  const a = g.nodes[t.from]!,
    b = g.nodes[t.to]!,
    length = distance(a, b)
  const blocked = b.kind === 'junction' && !exitFor(g, b.id, a.id)
  const limit = blocked ? length - RULES.stopDistance : length
  // A setting may close while the train is still outside the locked turnout area.
  // Never teleport an approaching train backward to the stop marker.
  if (t.progress < limit) t.progress = Math.min(limit, t.progress + RULES.speed * dt)
  if (t.progress < length - 1e-8) return
  t.node = b.id
  t.edge = null
  t.inbound = a.id
  t.progress = 0
  if (b.kind === 'station') {
    const delivered = t.onboard.filter((p) => p.destination === b.id).length
    t.onboard = t.onboard.filter((p) => p.destination !== b.id)
    g.delivered += delivered
    g.score += delivered * RULES.fare
    t.dwell = RULES.stationStop
  } else t.dwell = 0
}
interface Motion {
  train: Train
  before: Point
  after: Point
  active: boolean
  links: Set<number>
  stations: number[]
}
/** Connected collision components count once, even when three trains meet in the same step. */
export function resolveCollisions(g: Game, motions: Motion[]) {
  const parent = new Map<number, number>(),
    positions = new Map<number, Point>()
  const root = (id: number): number => {
    const p = parent.get(id)!
    if (p === id) return id
    const r = root(p)
    parent.set(id, r)
    return r
  }
  for (let i = 0; i < motions.length; i++)
    for (let j = i + 1; j < motions.length; j++) {
      const a = motions[i]!,
        b = motions[j]!
      if (!a.active || !b.active || ![...a.links].some((id) => b.links.has(id))) continue
      const hit = swept(a.before, a.after, b.before, b.after)
      if (hit.distance > RULES.radius * 2) continue
      const platform = a.stations.find(
        (id) =>
          b.stations.includes(id) && distance(hit.point, g.nodes[id]!) <= RULES.platformRadius,
      )
      if (platform !== undefined) continue
      for (const m of [a, b])
        if (!parent.has(m.train.id)) {
          parent.set(m.train.id, m.train.id)
          positions.set(m.train.id, hit.point)
        }
      parent.set(root(a.train.id), root(b.train.id))
    }
  if (!parent.size) return false
  const count = new Set([...parent.keys()].map(root)).size
  const involved = [...parent.keys()]
  g.accidents += count
  g.lives = Math.max(0, g.lives - count)
  g.lastAccident = { ...positions.get(involved[0]!)!, trains: involved.length, at: g.elapsed }
  g.trains = g.trains.map((t) => {
    if (!parent.has(t.id)) return t
    g.lost += t.onboard.length
    return createTrain(g, g.depot, t.id)
  })
  g.mode = g.lives === 0 ? 'gameover' : 'paused'
  return true
}
export function step(g: Game, dt = RULES.step) {
  if (g.mode !== 'playing' || !Number.isFinite(dt) || dt <= 0 || dt > RULES.step + 1e-9) return
  g.elapsed += dt
  const motions: Motion[] = g.trains.map((train) => {
    const before = { ...trainPoint(g, train) },
      links = new Set([train.from, train.to])
    const active =
      train.edge !== null || (train.node !== null && g.nodes[train.node]!.kind === 'junction')
    return {
      train,
      before,
      after: before,
      active,
      links,
      stations: [...links].filter((id) => g.nodes[id]!.kind === 'station'),
    }
  })
  for (const m of motions) {
    move(g, m.train, dt)
    m.after = { ...trainPoint(g, m.train) }
    m.active ||=
      m.train.edge !== null || (m.train.node !== null && g.nodes[m.train.node]!.kind === 'junction')
    m.links.add(m.train.from)
    m.links.add(m.train.to)
    m.stations = [...m.links].filter((id) => g.nodes[id]!.kind === 'station')
  }
  if (resolveCollisions(g, motions)) return
  if (g.elapsed + 1e-8 >= g.nextExpiry) {
    g.nextExpiry = Math.floor(g.elapsed) + 1
    for (const id of network(g).stations)
      g.nodes[id]!.waiting = g.nodes[id]!.waiting.filter((p) => {
        if (g.elapsed - p.since >= RULES.patience) {
          losePassenger(g)
          return false
        }
        return true
      })
  }
  g.demand += Math.min(RULES.maxDemand, RULES.demandBase + g.elapsed * RULES.demandGrowth) * dt
  while (g.demand >= 1) {
    g.demand--
    demandPassenger(g)
  }
  if (g.elapsed + 1e-8 >= g.nextDistrict) {
    discoverDistrict(g)
    g.nextDistrict += RULES.districtEvery
  }
  if (g.elapsed + 1e-8 >= g.nextUpgrade) {
    g.nextUpgrade += RULES.upgradeEvery
    g.mode = 'upgrade'
  }
}
export function warnings(g: Game): (Point & { first: number; second: number })[] {
  const result: (Point & { first: number; second: number })[] = []
  const trains = g.trains.filter((t) => t.edge !== null)
  for (let i = 0; i < trains.length; i++)
    for (let j = i + 1; j < trains.length; j++) {
      const a = trains[i]!,
        b = trains[j]!
      if (a.edge !== b.edge && a.to !== b.to) continue
      const p = trainPoint(g, a),
        q = trainPoint(g, b)
      if (distance(p, q) < RULES.warningDistance)
        result.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, first: a.id, second: b.id })
    }
  return result
}

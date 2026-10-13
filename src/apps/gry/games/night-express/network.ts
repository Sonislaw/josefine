import { RULES } from './config'
import { distance } from './geometry'
import type { Game, Train, Point } from './model'
interface Network {
  revision: number
  neighbors: Map<number, { node: number; edge: number }[]>
  components: Map<number, number>
  stations: number[]
}
const caches = new WeakMap<Game, Network>()
/** Topology is rebuilt only after edits / exploration, never for every train or passenger. */
export function network(g: Game): Network {
  const old = caches.get(g)
  if (old?.revision === g.revision) return old
  const neighbors = new Map<number, { node: number; edge: number }[]>(),
    components = new Map<number, number>()
  const nodes = Object.values(g.nodes)
  for (const n of nodes) neighbors.set(n.id, [])
  for (const e of Object.values(g.edges)) {
    neighbors.get(e.a)!.push({ node: e.b, edge: e.id })
    neighbors.get(e.b)!.push({ node: e.a, edge: e.id })
  }
  for (const n of nodes)
    if (!components.has(n.id)) {
      const queue = [n.id]
      components.set(n.id, n.id)
      for (let i = 0; i < queue.length; i++)
        for (const next of neighbors.get(queue[i]!)!)
          if (!components.has(next.node)) {
            components.set(next.node, n.id)
            queue.push(next.node)
          }
    }
  const result = {
    revision: g.revision,
    neighbors,
    components,
    stations: nodes.filter((n) => n.kind === 'station').map((n) => n.id),
  }
  caches.set(g, result)
  return result
}
export function trainPoint(g: Game, t: Train): Point {
  if (t.node !== null) return g.nodes[t.node]!
  const a = g.nodes[t.from]!,
    b = g.nodes[t.to]!,
    length = distance(a, b)
  return {
    x: a.x + ((b.x - a.x) * t.progress) / length,
    y: a.y + ((b.y - a.y) * t.progress) / length,
  }
}
export function exitFor(g: Game, node: number, inbound: number | null) {
  const n = g.nodes[node]!,
    ports = network(g).neighbors.get(node)!
  if (n.kind === 'station')
    return n.hold ? undefined : (ports.find((p) => p.node !== inbound) ?? ports[0])
  if (ports.length === 2) return ports.find((p) => p.node !== inbound)
  if (ports.length === 3 && inbound !== null && n.pair.includes(inbound))
    return ports.find((p) => p.node !== inbound && n.pair.includes(p.node))
  return undefined
}
export function normalizePairs(g: Game) {
  for (const n of Object.values(g.nodes)) {
    const ports = network(g)
      .neighbors.get(n.id)!
      .map((p) => p.node)
    n.pair = n.pair.filter((id) => ports.includes(id))
    if (n.pair.length !== 2) n.pair = ports.slice(0, 2)
  }
}
export const edgeOccupied = (g: Game, id: number) => g.trains.some((t) => t.edge === id)
export const junctionLocked = (g: Game, id: number) =>
  g.trains.some(
    (t) =>
      t.node === id ||
      (t.edge !== null &&
        (t.from === id || t.to === id) &&
        distance(trainPoint(g, t), g.nodes[id]!) <= RULES.switchLock),
  )
export function discovered(g: Game, p: Point) {
  const size = RULES.districtSize,
    x = Math.floor((p.x + size / 2) / size),
    y = Math.floor((p.y + size / 2) / size)
  return g.districts.some((d) => d.x === x && d.y === y)
}

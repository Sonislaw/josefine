import { RULES } from './config'
import { distance, intersects, pointSegment, projection } from './geometry'
import { discovered, edgeOccupied, junctionLocked, network, normalizePairs } from './network'
import { createTrain } from './world'
import type { Command, Game, Upgrade, Verdict } from './model'
const no = (message: string): Verdict => ({ ok: false, message, cost: 0 })
const yes = (cost = 0): Verdict => ({
  ok: true,
  message:
    cost < 0
      ? `Zwrot: ${-cost} jednostek torów.`
      : cost
        ? `Koszt: ${cost} jednostek torów.`
        : 'Gotowe do zatwierdzenia.',
  cost,
})
export function upgrades(g: Game): Upgrade[] {
  return [
    ...(g.trains.length < RULES.maxTrains ? ['train' as const] : []),
    ...(g.capacity < RULES.maxCapacity ? ['capacity' as const] : []),
    'rails',
  ]
}
export function validate(g: Game, c: Command): Verdict {
  if (g.mode === 'gameover') return no('Ta noc już się zakończyła.')
  if (c.type === 'upgrade')
    return g.mode === 'upgrade' && upgrades(g).includes(c.choice)
      ? yes()
      : no('To ulepszenie nie jest teraz dostępne.')
  if (g.mode === 'upgrade') return no('Najpierw wybierz rozwój sieci.')
  if (c.type === 'switch' || c.type === 'hold') {
    const n = g.nodes[c.node]
    if (!n) return no('Nie ma takiego punktu.')
    if (c.type === 'hold')
      return n.kind === 'station' ? yes() : no('Sygnał odjazdu jest dostępny przy stacji.')
    if (n.kind !== 'junction' || network(g).neighbors.get(n.id)!.length !== 3)
      return no('Zwrotnica wymaga trzech ramion.')
    return junctionLocked(g, n.id) ? no('Pociąg zajmuje rozjazd. Zaczekaj, aż go opuści.') : yes()
  }
  if (g.mode !== 'paused') return no('Budowa wymaga pauzy.')
  if (c.type === 'connect') {
    const a = g.nodes[c.a],
      b = g.nodes[c.b]
    if (!a || !b || a.id === b.id) return no('Wskaż dwa różne punkty.')
    const adj = network(g).neighbors
    if (adj.get(a.id)!.some((n) => n.node === b.id)) return no('Te punkty są już połączone.')
    if ([a, b].some((n) => adj.get(n.id)!.length >= (n.kind === 'station' ? 2 : 3)))
      return no('Stacja mieści dwa tory, węzeł trzy. Dodaj osobny węzeł.')
    const length = distance(a, b)
    if (length < RULES.minEdge || length > RULES.maxEdge)
      return no(`Odcinek musi mieć ${RULES.minEdge}–${RULES.maxEdge} jednostek długości.`)
    for (let t = 0; t <= 1; t += 1 / Math.ceil(length / 20))
      if (!discovered(g, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }))
        return no('Buduj tylko w odkrytych dzielnicach.')
    for (const n of Object.values(g.nodes))
      if (n.id !== a.id && n.id !== b.id && pointSegment(n, a, b) < RULES.switchLock)
        return no('Tor przechodzi przez inny punkt. Połącz odcinki przez ten węzeł.')
    for (const e of Object.values(g.edges)) {
      const x = g.nodes[e.a]!,
        y = g.nodes[e.b]!
      const shared = [a.id, b.id].find((id) => id === e.a || id === e.b)
      if (shared !== undefined) {
        const p = shared === a.id ? b : a,
          q = shared === e.a ? y : x,
          origin = g.nodes[shared]!
        if (pointSegment(p, origin, q) < 1e-5 || pointSegment(q, origin, p) < 1e-5)
          return no('Tory nie mogą nakładać się na siebie.')
      } else if (intersects(a, b, x, y))
        return no('Tory nie mogą się przecinać. Poprowadź je przez węzeł.')
    }
    const cost = Math.ceil(length / RULES.railUnit)
    return g.rails >= cost ? yes(cost) : no(`Potrzeba ${cost} jednostek torów; masz ${g.rails}.`)
  }
  if (c.type === 'remove') {
    const edge = g.edges[c.edge]
    if (!edge) return no('Nie ma tego odcinka.')
    return edgeOccupied(g, c.edge)
      ? no('Na tym odcinku jest pociąg. Nie można go usunąć.')
      : yes(-edge.cost)
  }
  if (!Number.isFinite(c.point.x) || !Number.isFinite(c.point.y))
    return no('Nieprawidłowe współrzędne.')
  const edge = c.type === 'split' ? g.edges[c.edge] : null
  if (c.type === 'split' && (!edge || edgeOccupied(g, edge.id)))
    return no('Podzielić można tylko pusty, istniejący tor.')
  const p = edge ? projection(c.point, g.nodes[edge.a]!, g.nodes[edge.b]!) : c.point
  if (!discovered(g, p)) return no('Wybierz odkrytą dzielnicę.')
  if (Object.values(g.nodes).some((n) => distance(n, p) < RULES.minEdge))
    return no('Zostaw co najmniej 72 jednostki odstępu od innych punktów.')
  if (
    Object.values(g.edges).some(
      (e) => e.id !== edge?.id && pointSegment(p, g.nodes[e.a]!, g.nodes[e.b]!) < RULES.switchLock,
    )
  )
    return no('Punkt leży zbyt blisko toru. Użyj podziału istniejącego odcinka.')
  return yes()
}
/** One validation path powers the preview and commit. Invalid commands never mutate the game. */
export function execute(g: Game, c: Command): Verdict {
  const result = validate(g, c)
  if (!result.ok) return result
  if (c.type === 'hold') g.nodes[c.node]!.hold = !g.nodes[c.node]!.hold
  else if (c.type === 'switch') {
    const n = g.nodes[c.node]!,
      p = network(g)
        .neighbors.get(c.node)!
        .map((n) => n.node)
        .sort((a, b) => a - b)
    const pairs = [
      [p[0]!, p[1]!],
      [p[0]!, p[2]!],
      [p[1]!, p[2]!],
    ]
    const index = pairs.findIndex((pair) => pair.every((id) => n.pair.includes(id)))
    n.pair = pairs[(index + 1) % 3]!
  } else if (c.type === 'upgrade') {
    if (c.choice === 'train') g.trains.push(createTrain(g))
    if (c.choice === 'capacity') g.capacity += RULES.capacityUpgrade
    if (c.choice === 'rails') g.rails += RULES.upgradeRails
    g.mode = 'paused'
  } else {
    if (c.type === 'connect') {
      const id = g.nextId++
      g.edges[id] = { id, a: c.a, b: c.b, cost: result.cost }
      g.rails -= result.cost
    }
    if (c.type === 'remove') {
      g.rails += g.edges[c.edge]!.cost
      delete g.edges[c.edge]
    }
    if (c.type === 'node' || c.type === 'split') {
      const edge = c.type === 'split' ? g.edges[c.edge]! : null
      const p = edge ? projection(c.point, g.nodes[edge.a]!, g.nodes[edge.b]!) : c.point,
        id = g.nextId++
      const size = RULES.districtSize
      g.nodes[id] = {
        ...p,
        id,
        kind: 'junction',
        label: `R${id}`,
        district: `${Math.floor((p.x + size / 2) / size)},${Math.floor((p.y + size / 2) / size)}`,
        hold: false,
        pair: [],
        waiting: [],
        opensAt: 0,
      }
      if (edge) {
        const cost = Math.floor(
          (edge.cost * distance(g.nodes[edge.a]!, p)) /
            distance(g.nodes[edge.a]!, g.nodes[edge.b]!),
        )
        delete g.edges[edge.id]
        // Preserve the original total refund; splitting must not manufacture free rails.
        const first = g.nextId++,
          second = g.nextId++
        g.edges[first] = { id: first, a: edge.a, b: id, cost }
        g.edges[second] = { id: second, a: id, b: edge.b, cost: edge.cost - cost }
      }
    }
    g.revision++
    normalizePairs(g)
  }
  return result
}

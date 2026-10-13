import { RULES } from './config'
import { distance } from './geometry'
import type { Game, Passenger } from './model'
export const SAVE_KEY = 'zgrana:gry:nocny-ekspres:v1'
export interface Save {
  version: 1
  game: Game
  best: number
  sound: boolean
  tutorialDismissed: boolean
}
interface Port {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const positive = (v: unknown) => number(v) && v >= 0
const integer = (v: unknown) => positive(v) && Number.isInteger(v)
const object = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v)
/** Untrusted localStorage never flows directly into simulation. No repair overwrites the original. */
export function decode(raw: string): Save | null {
  try {
    const s = JSON.parse(raw) as Save,
      g = s.game
    if (
      s.version !== 1 ||
      !object(g) ||
      !positive(s.best) ||
      typeof s.sound !== 'boolean' ||
      typeof s.tutorialDismissed !== 'boolean'
    )
      return null
    if (
      !['paused', 'playing', 'upgrade', 'gameover'].includes(g.mode) ||
      !object(g.nodes) ||
      !object(g.edges) ||
      !Array.isArray(g.trains) ||
      !Array.isArray(g.districts) ||
      !g.districts.length
    )
      return null
    for (const key of [
      'seed',
      'random',
      'nextId',
      'revision',
      'score',
      'delivered',
      'lost',
      'lives',
      'accidents',
      'rails',
      'capacity',
      'depot',
      'stationCount',
    ] as const)
      if (!integer(g[key])) return null
    if (
      g.seed > 0xffffffff ||
      g.random > 0xffffffff ||
      g.lives > 3 ||
      g.lives !== Math.max(0, 3 - g.accidents) ||
      g.capacity < 6 ||
      g.capacity > RULES.maxCapacity ||
      g.trains.length < 2 ||
      g.trains.length > RULES.maxTrains
    )
      return null
    if ((g.mode === 'gameover') !== (g.lives === 0)) return null
    for (const key of ['elapsed', 'nextDistrict', 'nextUpgrade', 'nextExpiry', 'demand'] as const)
      if (!positive(g[key])) return null
    if (
      g.nextDistrict + RULES.step < g.elapsed ||
      g.nextUpgrade + RULES.step < g.elapsed ||
      g.demand >= 1
    )
      return null
    const districtKeys = new Set<string>()
    for (const d of g.districts) {
      if (
        !object(d) ||
        !Number.isSafeInteger(d.x) ||
        !Number.isSafeInteger(d.y) ||
        d.key !== `${d.x},${d.y}` ||
        districtKeys.has(d.key) ||
        !positive(d.since) ||
        d.since > g.elapsed
      )
        return null
      districtKeys.add(d.key)
    }
    if (!districtKeys.has('0,0')) return null
    const ids = new Set<number>(),
      degree = new Map<number, number>(),
      adj = new Map<number, number[]>()
    const addId = (id: number) => {
      if (!integer(id) || id === 0 || ids.has(id) || id >= g.nextId) return false
      ids.add(id)
      return true
    }
    for (const [key, n] of Object.entries(g.nodes)) {
      if (
        !object(n) ||
        String(n.id) !== key ||
        !addId(n.id) ||
        !number(n.x) ||
        !number(n.y) ||
        !['station', 'junction'].includes(n.kind) ||
        typeof n.label !== 'string' ||
        n.label.length > 32 ||
        typeof n.hold !== 'boolean' ||
        !positive(n.opensAt) ||
        !Array.isArray(n.pair) ||
        !Array.isArray(n.waiting) ||
        n.waiting.length > RULES.queue ||
        !districtKeys.has(n.district)
      )
        return null
      const size = RULES.districtSize
      if (
        n.district !==
        `${Math.floor((n.x + size / 2) / size)},${Math.floor((n.y + size / 2) / size)}`
      )
        return null
      if (n.kind === 'junction' && n.waiting.length) return null
      degree.set(n.id, 0)
      adj.set(n.id, [])
    }
    if (
      g.nodes[g.depot]?.kind !== 'station' ||
      Object.values(g.nodes).filter((n) => n.kind === 'station').length !== g.stationCount
    )
      return null
    const passenger = (p: Passenger) =>
      object(p) &&
      g.nodes[p.origin]?.kind === 'station' &&
      g.nodes[p.destination]?.kind === 'station' &&
      p.origin !== p.destination &&
      positive(p.since) &&
      p.since <= g.elapsed
    for (const n of Object.values(g.nodes))
      if (n.waiting.some((p) => !passenger(p) || p.origin !== n.id)) return null
    const pairs = new Set<string>()
    for (const [key, e] of Object.entries(g.edges)) {
      if (
        !object(e) ||
        String(e.id) !== key ||
        !addId(e.id) ||
        !g.nodes[e.a] ||
        !g.nodes[e.b] ||
        e.a === e.b ||
        !integer(e.cost)
      )
        return null
      const length = distance(g.nodes[e.a]!, g.nodes[e.b]!),
        keyPair = [e.a, e.b].sort((a, b) => a - b).join(':')
      if (length < RULES.minEdge - 1e-6 || length > RULES.maxEdge + 1e-6 || pairs.has(keyPair))
        return null
      pairs.add(keyPair)
      for (const [a, b] of [
        [e.a, e.b],
        [e.b, e.a],
      ]) {
        degree.set(a!, degree.get(a!)! + 1)
        adj.get(a!)!.push(b!)
      }
    }
    for (const n of Object.values(g.nodes)) {
      if (
        degree.get(n.id)! > (n.kind === 'station' ? 2 : 3) ||
        n.pair.length > 2 ||
        new Set(n.pair).size !== n.pair.length ||
        n.pair.some((id) => !adj.get(n.id)!.includes(id))
      )
        return null
      if (degree.get(n.id)! >= 2 && n.pair.length !== 2) return null
    }
    for (const t of g.trains) {
      if (
        !object(t) ||
        !addId(t.id) ||
        !positive(t.progress) ||
        !positive(t.dwell) ||
        !Array.isArray(t.onboard) ||
        t.onboard.length > g.capacity ||
        t.onboard.some((p) => !passenger(p)) ||
        !g.nodes[t.from] ||
        !g.nodes[t.to] ||
        (t.inbound !== null && !g.nodes[t.inbound])
      )
        return null
      if ((t.node === null) === (t.edge === null)) return null
      if (t.node !== null && !g.nodes[t.node]) return null
      if (t.edge !== null) {
        const e = g.edges[t.edge]
        if (
          !e ||
          !((e.a === t.from && e.b === t.to) || (e.b === t.from && e.a === t.to)) ||
          t.progress > distance(g.nodes[t.from]!, g.nodes[t.to]!) + 1e-6
        )
          return null
      }
    }
    if (
      g.lastAccident !== null &&
      (!object(g.lastAccident) ||
        !number(g.lastAccident.x) ||
        !number(g.lastAccident.y) ||
        !integer(g.lastAccident.trains) ||
        !positive(g.lastAccident.at))
    )
      return null
    // The saved simulation time is authoritative; no wall-clock catch-up.
    if (g.mode === 'playing') g.mode = 'paused'
    return s
  } catch {
    return null
  }
}
export function load(port: Port): {
  status: 'empty' | 'ok' | 'corrupt' | 'unavailable'
  save: Save | null
} {
  try {
    const raw = port.getItem(SAVE_KEY)
    if (raw === null) return { status: 'empty', save: null }
    const save = decode(raw)
    return { status: save ? 'ok' : 'corrupt', save }
  } catch {
    return { status: 'unavailable', save: null }
  }
}
export function persist(port: Port, s: Save) {
  try {
    const old = port.getItem(SAVE_KEY)
    const previous = old ? decode(old) : null
    const best = Math.max(s.best, previous?.best ?? 0, s.game.score)
    port.setItem(SAVE_KEY, JSON.stringify({ ...s, best }))
    return { ok: true, best }
  } catch {
    return { ok: false, best: s.best }
  }
}

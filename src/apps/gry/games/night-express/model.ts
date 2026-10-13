export type Mode = 'paused' | 'playing' | 'upgrade' | 'gameover'
export interface Point {
  x: number
  y: number
}
export interface Passenger {
  origin: number
  destination: number
  since: number
}
export interface RailNode extends Point {
  id: number
  kind: 'station' | 'junction'
  label: string
  district: string
  hold: boolean
  pair: number[]
  waiting: Passenger[]
  opensAt: number
}
export interface Edge {
  id: number
  a: number
  b: number
  cost: number
}
export interface District {
  x: number
  y: number
  key: string
  since: number
}
export interface Train {
  id: number
  node: number | null
  edge: number | null
  from: number
  to: number
  progress: number
  inbound: number | null
  dwell: number
  onboard: Passenger[]
}
export interface Game {
  seed: number
  random: number
  nextId: number
  revision: number
  mode: Mode
  elapsed: number
  score: number
  delivered: number
  lost: number
  lives: number
  accidents: number
  rails: number
  capacity: number
  depot: number
  nodes: Record<number, RailNode>
  edges: Record<number, Edge>
  trains: Train[]
  districts: District[]
  stationCount: number
  nextDistrict: number
  nextUpgrade: number
  nextExpiry: number
  demand: number
  lastAccident: (Point & { trains: number; at: number }) | null
}
export type Upgrade = 'train' | 'capacity' | 'rails'
export type Command =
  | { type: 'connect'; a: number; b: number }
  | { type: 'node'; point: Point }
  | { type: 'split'; edge: number; point: Point }
  | { type: 'remove'; edge: number }
  | { type: 'switch'; node: number }
  | { type: 'hold'; node: number }
  | { type: 'upgrade'; choice: Upgrade }
export interface Verdict {
  ok: boolean
  message: string
  cost: number
}
export interface Camera extends Point {
  zoom: number
}
export type Selection = { kind: 'node' | 'train' | 'edge'; id: number } | null

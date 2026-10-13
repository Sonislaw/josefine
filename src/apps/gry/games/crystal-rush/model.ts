export type Mode = 'menu' | 'playing' | 'paused' | 'upgrade' | 'gameover'
export type Upgrade = 'speed' | 'magnet' | 'energy'
export interface Point {
  x: number
  y: number
}
export interface Input {
  x: number
  y: number
  pointer: Point | null
  dash: boolean
}
export interface Player extends Point {
  radius: number
  hp: number
  directionX: number
  directionY: number
  dashDirectionX: number
  dashDirectionY: number
  dashRemaining: number
  dashCooldownRemaining: number
  invulnerabilityRemaining: number
}
export interface Meteor extends Point {
  id: number
  previousX: number
  previousY: number
  radius: number
  speed: number
  angle: number
  rotationSpeed: number
  shape: number
  alive: boolean
}
export interface Gem extends Point {
  id: number
  radius: number
  phase: number
  alive: boolean
}
export interface Particle extends Point {
  vx: number
  vy: number
  life: number
  color: string
}
export type GameEvent = 'gem' | 'dash' | 'destroy' | 'hurt' | 'upgrade' | 'gameover' | 'choice'
export interface Game {
  mode: Mode
  elapsed: number
  score: number
  bestScore: number
  newRecord: boolean
  level: number
  xp: number
  combo: number
  comboRemaining: number
  spawnBudget: number
  totalMeteorsSpawned: number
  gemSpawnRemaining: number
  nextId: number
  player: Player
  upgrades: Record<Upgrade, number>
  meteors: Meteor[]
  gems: Gem[]
  particles: Particle[]
  events: GameEvent[]
  hitFlash: number
}
export type Random = () => number
export const emptyInput = (): Input => ({ x: 0, y: 0, pointer: null, dash: false })

export type Mode = 'menu' | 'playing' | 'paused' | 'upgrade' | 'victory' | 'gameover'
export type HeroId = 'flame' | 'storm' | 'iron'
export type Weapon = 'fire' | 'lightning' | 'frost' | 'blades'
export type Passive = 'power' | 'haste' | 'area' | 'speed'
export type EnemyKind = 'shade' | 'runner' | 'heavy' | 'elite' | 'boss'
export type Choice =
  | { type: 'weapon'; id: Weapon }
  | { type: 'passive'; id: Passive }
  | { type: 'evolve'; id: Weapon }
  | { type: 'heal' }
export interface Point {
  x: number
  y: number
}
export interface Body extends Point {
  radius: number
}
export interface Player extends Body {
  hp: number
  maxHp: number
  invulnerable: number
  hero: HeroId
}
export interface Enemy extends Body {
  id: number
  kind: EnemyKind
  hp: number
  maxHp: number
  speed: number
  slow: number
  flash: number
  attack: 'idle' | 'charge-warning' | 'charge' | 'ring-warning'
  timer: number
  alternate: boolean
  dx: number
  dy: number
}
export interface Projectile extends Body {
  id: number
  vx: number
  vy: number
  ttl: number
  damage: number
  explosive: boolean
}
export interface Gem extends Point {
  value: number
}
export interface Ring extends Point {
  id: number
  radius: number
  previous: number
  hit: boolean
  ttl: number
}
export interface Effect extends Point {
  kind: 'spark' | 'lightning' | 'frost' | 'blast'
  life: number
  maxLife: number
  radius: number
  tx: number
  ty: number
  color: string
}
export interface View {
  width: number
  height: number
}
export interface Input {
  x: number
  y: number
  pointer: { origin: Point; current: Point } | null
}
export type Event =
  'hurt' | 'attack' | 'upgrade' | 'victory' | 'gameover' | 'unlock-storm' | 'unlock-iron'
export interface Game {
  mode: Mode
  elapsed: number
  kills: number
  level: number
  xp: number
  nextId: number
  spawnBudget: number
  bossSpawned: boolean
  bossDefeated: boolean
  eliteFlags: [boolean, boolean]
  unlocked: HeroId[]
  player: Player
  weapons: Partial<Record<Weapon, number>>
  passives: Partial<Record<Passive, number>>
  evolved: Weapon[]
  cooldowns: Record<Weapon, number>
  choices: Choice[]
  enemies: Enemy[]
  projectiles: Projectile[]
  gems: Gem[]
  rings: Ring[]
  effects: Effect[]
  events: Event[]
  lastView: View
  bladeHits: Map<number, number>
}
export type Random = () => number
export const emptyInput = (): Input => ({ x: 0, y: 0, pointer: null })

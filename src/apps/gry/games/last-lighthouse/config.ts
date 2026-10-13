import type { EnemyKind, HeroId, Passive, Weapon } from './model'
export const CONFIG = {
  world: 2400,
  step: 1 / 60,
  maxGap: 0.25,
  maxEnemies: 180,
  maxProjectiles: 250,
  maxEffects: 200,
  maxGems: 140,
  playerRadius: 20,
  speed: 155,
  invulnerability: 0.8,
  contactDamage: 12,
  chargeDamage: 22,
  ringDamage: 18,
  bossAt: 600,
  eliteAt: [180, 360],
  attackRange: 390,
  projectileSpeed: 480,
  pickup: 34,
  magnet: 115,
  spawnBase: 0.65,
  spawnGrowth: 0.006,
  heal: 25,
} as const
export const HEROES: Record<
  HeroId,
  {
    name: string
    subtitle: string
    weapon: Weapon
    hp: number
    speed: number
    color: string
    unlock: string
  }
> = {
  flame: {
    name: 'Strażnik Płomienia',
    subtitle: 'Ogień wskazuje drogę.',
    weapon: 'fire',
    hp: 100,
    speed: 1,
    color: '#ffbb72',
    unlock: 'Dostępny od początku',
  },
  storm: {
    name: 'Wędrowczyni Burzy',
    subtitle: 'Szybsza niż nadchodzący mrok.',
    weapon: 'lightning',
    hp: 80,
    speed: 1.15,
    color: '#92d9ff',
    unlock: 'Przetrwaj 3 minuty jedną postacią',
  },
  iron: {
    name: 'Żelazny Wartownik',
    subtitle: 'Nie wszystko musi być szybkie.',
    weapon: 'blades',
    hp: 130,
    speed: 0.9,
    color: '#d2d5c2',
    unlock: 'Pokonaj finałowego bossa',
  },
}
export const WEAPONS: Record<
  Weapon,
  {
    name: string
    evolution: string
    passive: Passive
    color: string
    baseDamage: number
    damageStep: number
    interval: number
  }
> = {
  fire: {
    name: 'Ognisty pocisk',
    evolution: 'Serce pożogi',
    passive: 'power',
    color: '#ffb76b',
    baseDamage: 20,
    damageStep: 8,
    interval: 0.75,
  },
  lightning: {
    name: 'Łańcuch błyskawic',
    evolution: 'Podwójna burza',
    passive: 'haste',
    color: '#92d9ff',
    baseDamage: 16,
    damageStep: 6,
    interval: 1.3,
  },
  frost: {
    name: 'Lodowa aura',
    evolution: 'Oddech północy',
    passive: 'area',
    color: '#8cf4d6',
    baseDamage: 10,
    damageStep: 5,
    interval: 1.1,
  },
  blades: {
    name: 'Orbitujące ostrza',
    evolution: 'Żelazna korona',
    passive: 'speed',
    color: '#e4ddb8',
    baseDamage: 15,
    damageStep: 6,
    interval: 0.5,
  },
}
export const PASSIVES: Record<Passive, { name: string; description: string }> = {
  power: { name: 'Siła', description: '+20% obrażeń bazowych wszystkich broni na poziom.' },
  haste: { name: 'Tempo ataków', description: '+15% częstotliwości ataków bazowych na poziom.' },
  area: {
    name: 'Zasięg efektów',
    description: '+20% promienia obszarów i skoków błyskawicy na poziom.',
  },
  speed: { name: 'Szybkość ruchu', description: '+10% szybkości bazowej postaci na poziom.' },
}
export const ENEMIES: Record<EnemyKind, { hp: number; speed: number; radius: number; xp: number }> =
  {
    shade: { hp: 20, speed: 42, radius: 17, xp: 1 },
    runner: { hp: 28, speed: 92, radius: 13, xp: 2 },
    heavy: { hp: 115, speed: 32, radius: 27, xp: 4 },
    elite: { hp: 600, speed: 58, radius: 34, xp: 25 },
    boss: { hp: 6500, speed: 38, radius: 48, xp: 0 },
  }
export const xpRequired = (level: number) => 12 + (level - 1) * 4
export const timeText = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`

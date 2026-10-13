import { CONFIG } from './config'
import type { Game, Meteor, Random } from './model'

/** Twelve immutable silhouettes allow a tiny sprite cache instead of a canvas per meteor. */
export const meteorShapes = Array.from({ length: 12 }, (_, seed) =>
  Array.from(
    { length: 9 },
    (_, i) =>
      0.77 + ((((Math.sin((seed + 1) * (i + 2) * 12.9898) * 43758.5453) % 1) + 1) % 1) * 0.23,
  ),
)
export function createMeteor(time: number, id: number, rng: Random): Meteor {
  const edge = Math.floor(rng() * 4),
    along = rng(),
    margin = CONFIG.meteors.spawnMargin
  const x = edge === 0 ? -margin : edge === 1 ? CONFIG.width + margin : along * CONFIG.width
  const y = edge === 2 ? -margin : edge === 3 ? CONFIG.height + margin : along * CONFIG.height
  return {
    id,
    x,
    y,
    previousX: x,
    previousY: y,
    radius: CONFIG.meteors.radius,
    speed:
      CONFIG.meteors.baseSpeed +
      Math.min(CONFIG.meteors.speedGrowth * time, CONFIG.meteors.maximumSpeedBonus) +
      rng() * CONFIG.meteors.randomSpeed,
    angle: rng() * Math.PI * 2,
    rotationSpeed: (rng() - 0.5) * 2,
    shape: Math.floor(rng() * meteorShapes.length),
    alive: true,
  }
}

/** Sole owner of elapsed. Integrate the entire linear rate, preserving fractional births.
 * There is intentionally NO active-meteor cap, TTL, wave limit or rate ceiling. */
export function updateMeteorSpawner(game: Game, dt: number, rng: Random) {
  if (game.mode !== 'playing') return
  const t0 = game.elapsed,
    t1 = t0 + dt
  game.spawnBudget +=
    CONFIG.meteors.baseRate * dt + (CONFIG.meteors.rateGrowth / 2) * (t1 * t1 - t0 * t0)
  game.elapsed = t1
  const count = Math.floor(game.spawnBudget + 1e-9)
  game.spawnBudget = Math.max(0, game.spawnBudget - count)
  for (let i = 0; i < count; i++) {
    game.meteors.push(createMeteor(t1, game.nextId++, rng))
    game.totalMeteorsSpawned++
  }
}

export function addGem(game: Game, rng: Random) {
  game.gems.push({
    id: game.nextId++,
    x: CONFIG.gems.minX + rng() * (CONFIG.gems.maxX - CONFIG.gems.minX),
    y: CONFIG.gems.minY + rng() * (CONFIG.gems.maxY - CONFIG.gems.minY),
    radius: CONFIG.gems.radius,
    phase: rng() * Math.PI * 2,
    alive: true,
  })
}

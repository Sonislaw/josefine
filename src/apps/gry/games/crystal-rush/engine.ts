import { CONFIG, clamp, dashCooldown, magnetRadius, movementSpeed, xpRequired } from './config'
import { sweptContact } from './collisions'
import { addGem, updateMeteorSpawner } from './spawner'
import type { Game, Input, Random, Upgrade } from './model'

/** Mutable simulation, intentionally outside Vue reactivity. No DOM or wall-clock access. */
export function createGame(
  bestScore = 0,
  rng: Random = Math.random,
  mode: Game['mode'] = 'menu',
): Game {
  const game: Game = {
    mode,
    elapsed: 0,
    score: 0,
    bestScore,
    newRecord: false,
    level: 1,
    xp: 0,
    combo: 1,
    comboRemaining: 0,
    spawnBudget: 0,
    totalMeteorsSpawned: 0,
    gemSpawnRemaining: CONFIG.gems.interval,
    nextId: 0,
    player: {
      x: 450,
      y: 300,
      radius: CONFIG.player.radius,
      hp: CONFIG.player.hp,
      directionX: 0,
      directionY: -1,
      dashDirectionX: 0,
      dashDirectionY: -1,
      dashRemaining: 0,
      dashCooldownRemaining: 0,
      invulnerabilityRemaining: 0,
    },
    upgrades: { speed: 0, magnet: 0, energy: 0 },
    meteors: [],
    gems: [],
    particles: [],
    events: [],
    hitFlash: 0,
  }
  for (let i = 0; i < CONFIG.gems.initial; i++) addGem(game, rng)
  return game
}
function burst(game: Game, x: number, y: number, color: string) {
  // Effects have a budget; threats never do. Deterministic visuals don't consume gameplay RNG.
  for (let i = 0; i < 6 && game.particles.length < CONFIG.maxParticles; i++) {
    const angle = (i / 6) * Math.PI * 2
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * 65,
      vy: Math.sin(angle) * 65,
      life: 0.35,
      color,
    })
  }
}
export function activateDash(game: Game): boolean {
  const p = game.player
  if (game.mode !== 'playing' || p.dashCooldownRemaining > 1e-9) return false
  p.dashRemaining = CONFIG.dash.duration
  p.dashCooldownRemaining = dashCooldown(game.upgrades.energy)
  p.dashDirectionX = p.directionX
  p.dashDirectionY = p.directionY
  game.events.push('dash')
  return true
}
export function chooseUpgrade(game: Game, upgrade: Upgrade): boolean {
  if (game.mode !== 'upgrade') return false
  if (
    upgrade === 'energy' &&
    dashCooldown(game.upgrades.energy) <= CONFIG.dash.minimumCooldown &&
    game.player.hp === CONFIG.player.hp
  )
    return false
  game.upgrades[upgrade]++
  if (upgrade === 'energy') {
    game.player.hp = Math.min(CONFIG.player.hp, game.player.hp + 1)
    game.player.dashCooldownRemaining = Math.min(
      game.player.dashCooldownRemaining,
      dashCooldown(game.upgrades.energy),
    )
  }
  game.player.invulnerabilityRemaining = Math.max(
    game.player.invulnerabilityRemaining,
    CONFIG.player.upgradeProtection,
  )
  game.mode = 'playing'
  game.events.push('choice')
  return true
}
function compact<T extends { alive: boolean }>(items: T[]) {
  let write = 0
  for (const item of items) if (item.alive) items[write++] = item
  items.length = write
}
export function collectGem(game: Game) {
  if (game.mode !== 'playing') return
  game.score += CONFIG.combo.points * game.combo
  game.combo = Math.min(CONFIG.combo.maximum, game.combo + 1)
  game.comboRemaining = CONFIG.combo.duration
  game.xp++
  game.events.push('gem')
  if (game.xp >= xpRequired(game.level)) {
    game.xp -= xpRequired(game.level)
    game.level++
    game.mode = 'upgrade'
    game.events.push('upgrade')
  }
}
function direction(game: Game, input: Input) {
  let x = input.x,
    y = input.y,
    distance = Infinity
  if (input.pointer) {
    x = input.pointer.x - game.player.x
    y = input.pointer.y - game.player.y
    distance = Math.hypot(x, y)
    if (distance < CONFIG.pointerStopDistance) return { x: 0, y: 0, distance: 0 }
  }
  const length = Math.hypot(x, y)
  return { x: length ? x / length : 0, y: length ? y / length : 0, distance }
}

export function stepGame(game: Game, input: Input, dt = CONFIG.step, rng: Random = Math.random) {
  if (game.mode !== 'playing' || dt <= 0) return
  const move = direction(game, input)
  if (move.x || move.y) {
    game.player.directionX = move.x
    game.player.directionY = move.y
  }
  // Input commands occur at the step boundary, before any time is consumed.
  if (input.dash) {
    activateDash(game)
    input.dash = false
  }
  let remaining = dt
  while (remaining > 1e-10 && game.mode === 'playing') {
    const dashLeft = game.player.dashRemaining
    const part = dashLeft > 1e-10 ? Math.min(remaining, dashLeft) : remaining
    stepSegment(game, input, part, dashLeft > 1e-10, rng)
    remaining -= part
  }
}

function stepSegment(game: Game, input: Input, dt: number, dashing: boolean, rng: Random) {
  updateMeteorSpawner(game, dt, rng)
  const p = game.player
  // Timers started by collisions/collections below retain their full duration.
  p.dashRemaining = Math.max(0, p.dashRemaining - dt)
  p.dashCooldownRemaining = Math.max(0, p.dashCooldownRemaining - dt)
  p.invulnerabilityRemaining = Math.max(0, p.invulnerabilityRemaining - dt)
  game.comboRemaining = Math.max(0, game.comboRemaining - dt)
  game.hitFlash = Math.max(0, game.hitFlash - dt)
  if (game.comboRemaining <= 1e-9) {
    game.combo = 1
    game.comboRemaining = 0
  }
  const previous = { x: p.x, y: p.y }
  const move = direction(game, input)
  const step = dashing
    ? CONFIG.dash.speed * dt
    : Math.min(movementSpeed(game.upgrades.speed) * dt, move.distance)
  p.x = clamp(
    p.x + (dashing ? p.dashDirectionX : move.x) * step,
    CONFIG.bounds.minX,
    CONFIG.bounds.maxX,
  )
  p.y = clamp(
    p.y + (dashing ? p.dashDirectionY : move.y) * step,
    CONFIG.bounds.minY,
    CONFIG.bounds.maxY,
  )
  for (const meteor of game.meteors) {
    if (!meteor.alive) continue
    meteor.previousX = meteor.x
    meteor.previousY = meteor.y
    const dx = p.x - meteor.x,
      dy = p.y - meteor.y,
      distance = Math.hypot(dx, dy)
    const travel = Math.min(distance, meteor.speed * dt)
    if (distance) {
      meteor.x += (dx / distance) * travel
      meteor.y += (dy / distance) * travel
    }
    meteor.angle += meteor.rotationSpeed * dt
    if (
      !sweptContact(
        previous,
        p,
        { x: meteor.previousX, y: meteor.previousY },
        meteor,
        p.radius + meteor.radius,
      )
    )
      continue
    if (dashing) {
      meteor.alive = false
      game.score += CONFIG.dash.score
      game.events.push('destroy')
      burst(game, meteor.x, meteor.y, '#ff7185')
    } else if (p.invulnerabilityRemaining <= 0) {
      meteor.alive = false
      p.hp--
      p.invulnerabilityRemaining = CONFIG.player.hurtProtection
      game.combo = 1
      game.comboRemaining = 0
      game.hitFlash = CONFIG.hitFlash
      game.events.push('hurt')
      burst(game, p.x, p.y, '#82aaff')
      if (p.hp === 0) {
        game.mode = 'gameover'
        game.newRecord = game.score > game.bestScore
        game.bestScore = Math.max(game.bestScore, game.score)
        game.events.push('gameover')
        break
      }
    }
  }
  compact(game.meteors)
  if (game.mode === 'gameover') return
  for (const gem of game.gems) {
    if (!gem.alive) continue
    const dx = p.x - gem.x,
      dy = p.y - gem.y,
      distance = Math.hypot(dx, dy)
    if (distance < magnetRadius(game.upgrades.magnet) && distance > 0) {
      const travel = Math.min(distance, CONFIG.gems.magnetSpeed * dt)
      gem.x += (dx / distance) * travel
      gem.y += (dy / distance) * travel
    }
    if (Math.hypot(p.x - gem.x, p.y - gem.y) <= CONFIG.gems.collectDistance) {
      gem.alive = false
      burst(game, gem.x, gem.y, '#a9f477')
      collectGem(game)
      if (game.mode !== 'playing') break // Keep uncollected gems and excess XP for the next level.
    }
  }
  compact(game.gems)
  game.gemSpawnRemaining -= dt
  while (game.gemSpawnRemaining <= 1e-9) {
    game.gemSpawnRemaining += CONFIG.gems.interval
    if (game.gems.length < CONFIG.gems.maximum) addGem(game, rng)
  }
  let write = 0
  for (const particle of game.particles) {
    particle.life -= dt
    if (particle.life <= 0) continue
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt
    game.particles[write++] = particle
  }
  game.particles.length = write
}

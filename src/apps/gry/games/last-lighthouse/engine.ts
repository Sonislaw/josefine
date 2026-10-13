import { CONFIG, ENEMIES, HEROES, WEAPONS } from './config'
import { clamp, distance, segmentDistance, SpatialGrid } from './space'
import { spawn } from './spawner'
import { checkLevel } from './upgrades'
import type { Effect, Enemy, Game, HeroId, Input, Mode, Point, Random, Weapon } from './model'
export function createGame(hero: HeroId = 'flame', mode: Mode = 'menu'): Game {
  const spec = HEROES[hero]
  return {
    mode,
    elapsed: 0,
    kills: 0,
    level: 1,
    xp: 0,
    nextId: 1,
    spawnBudget: 0,
    bossSpawned: false,
    bossDefeated: false,
    eliteFlags: [false, false],
    unlocked: [],
    player: {
      x: 1200,
      y: 1270,
      radius: CONFIG.playerRadius,
      hp: spec.hp,
      maxHp: spec.hp,
      invulnerable: 0,
      hero,
    },
    weapons: { [spec.weapon]: 1 },
    passives: {},
    evolved: [],
    cooldowns: { fire: 0, lightning: 0, frost: 0, blades: 0 },
    choices: [],
    enemies: [],
    projectiles: [],
    gems: [],
    rings: [],
    effects: [],
    events: [],
    lastView: { width: 900, height: 600 },
    bladeHits: new Map(),
  }
}
export const areaScale = (g: Game) => 1 + (g.passives.area ?? 0) * 0.2
export const movementSpeed = (g: Game) =>
  CONFIG.speed * HEROES[g.player.hero].speed * (1 + (g.passives.speed ?? 0) * 0.1)
export const weaponDamage = (g: Game, w: Weapon) =>
  (WEAPONS[w].baseDamage + ((g.weapons[w] ?? 1) - 1) * WEAPONS[w].damageStep) *
  (1 + (g.passives.power ?? 0) * 0.2)
export const weaponInterval = (g: Game, w: Weapon) =>
  WEAPONS[w].interval / (1 + (g.passives.haste ?? 0) * 0.15)
export function bladePositions(g: Game): Point[] {
  const count = (g.weapons.blades ?? 0) + 1,
    result: Point[] = []
  for (const radius of g.evolved.includes('blades') ? [74, 126] : [74])
    for (let i = 0; i < count; i++) {
      const a = g.elapsed * 2.4 * (radius === 74 ? 1 : -1) + (i * Math.PI * 2) / count
      result.push({
        x: g.player.x + Math.cos(a) * radius * areaScale(g),
        y: g.player.y + Math.sin(a) * radius * areaScale(g),
      })
    }
  return result
}
export function addEffect(g: Game, effect: Omit<Effect, 'maxLife'>) {
  if (g.effects.length < CONFIG.maxEffects) g.effects.push({ ...effect, maxLife: effect.life })
}
function impact(g: Game, e: Enemy, damage: number) {
  if (e.hp <= 0) return
  e.hp -= damage
  e.flash = 0.12
}
export function hurtPlayer(g: Game, amount: number) {
  if (g.player.invulnerable > 0 || g.player.hp <= 0) return false
  g.player.hp = Math.max(0, g.player.hp - amount)
  g.player.invulnerable = CONFIG.invulnerability
  g.events.push('hurt')
  return true
}
export function addGem(g: Game, p: Point, value: number) {
  if (value <= 0) return
  // Merge with the nearest token at capacity. XP value is never discarded.
  if (g.gems.length >= CONFIG.maxGems) {
    let nearest = g.gems[0]!
    for (const gem of g.gems) if (distance(gem, p) < distance(nearest, p)) nearest = gem
    nearest.value += value
  } else g.gems.push({ ...p, value })
}
function moveEnemies(g: Game, dt: number) {
  for (const e of g.enemies) {
    if (e.hp <= 0) continue
    e.slow = Math.max(0, e.slow - dt)
    e.flash = Math.max(0, e.flash - dt)
    let dx = g.player.x - e.x,
      dy = g.player.y - e.y,
      speed = e.speed * (e.slow > 0 ? 0.55 : 1)
    const dist = Math.hypot(dx, dy) || 1
    dx /= dist
    dy /= dist
    if (e.kind === 'boss') {
      e.timer -= dt
      if (e.attack === 'idle' && e.timer <= 0) {
        e.attack = e.alternate ? 'ring-warning' : 'charge-warning'
        e.timer = e.alternate ? 1.5 : 1.1
        e.alternate = !e.alternate
        e.dx = dx
        e.dy = dy
      } else if (e.attack === 'charge-warning' && e.timer <= 0) {
        e.attack = 'charge'
        e.timer = 0.75
      } else if (e.attack === 'charge' && e.timer <= 0) {
        e.attack = 'idle'
        e.timer = 3
      } else if (e.attack === 'ring-warning' && e.timer <= 0) {
        g.rings.push({ id: g.nextId++, x: e.x, y: e.y, radius: 0, previous: 0, hit: false, ttl: 5 })
        e.attack = 'idle'
        e.timer = 3
      }
      if (e.attack.endsWith('warning')) speed = 0
      if (e.attack === 'charge') {
        speed = 620
        dx = e.dx
        dy = e.dy
      }
    }
    e.x = clamp(e.x + dx * speed * dt, e.radius, CONFIG.world - e.radius)
    e.y = clamp(e.y + dy * speed * dt, e.radius, CONFIG.world - e.radius)
    if (distance(e, g.player) <= e.radius + g.player.radius)
      hurtPlayer(g, e.attack === 'charge' ? CONFIG.chargeDamage : CONFIG.contactDamage)
  }
  for (const ring of g.rings) {
    ring.previous = ring.radius
    ring.radius += 185 * dt
    ring.ttl -= dt
    const d = distance(ring, g.player),
      pad = g.player.radius + 7
    if (!ring.hit && d + pad >= ring.previous && d - pad <= ring.radius) {
      hurtPlayer(g, CONFIG.ringDamage)
      ring.hit = true
    }
  }
  g.rings = g.rings.filter((r) => r.ttl > 0)
}
function nearest(grid: SpatialGrid<Enemy>, p: Point, range: number, excluded = new Set<number>()) {
  let best: Enemy | undefined,
    d = range
  for (const e of grid.query(p.x, p.y, range + 48))
    if (e.hp > 0 && !excluded.has(e.id)) {
      const n = distance(e, p)
      if (n <= d) {
        d = n
        best = e
      }
    }
  return best
}
function attack(g: Game, grid: SpatialGrid<Enemy>, dt: number) {
  for (const w of Object.keys(g.weapons) as Weapon[]) {
    if (w === 'blades') {
      for (const b of bladePositions(g))
        for (const e of grid.query(b.x, b.y, 65)) {
          if (
            e.hp > 0 &&
            distance(b, e) <= e.radius + 12 &&
            g.elapsed - (g.bladeHits.get(e.id) ?? -100) >= weaponInterval(g, w)
          ) {
            impact(g, e, weaponDamage(g, w))
            g.bladeHits.set(e.id, g.elapsed)
          }
        }
      continue
    }
    g.cooldowns[w] -= dt
    if (g.cooldowns[w] > 0) continue
    const target = nearest(grid, g.player, CONFIG.attackRange)
    if (!target) continue
    g.cooldowns[w] = weaponInterval(g, w)
    const damage = weaponDamage(g, w),
      area = areaScale(g)
    if (w === 'fire' && g.projectiles.length < CONFIG.maxProjectiles) {
      const d = distance(g.player, target) || 1
      g.projectiles.push({
        id: g.nextId++,
        x: g.player.x,
        y: g.player.y,
        radius: 6,
        vx: ((target.x - g.player.x) / d) * CONFIG.projectileSpeed,
        vy: ((target.y - g.player.y) / d) * CONFIG.projectileSpeed,
        damage,
        ttl: 1.5,
        explosive: g.evolved.includes('fire'),
      })
      g.events.push('attack')
    }
    if (w === 'lightning')
      for (let chain = 0; chain < (g.evolved.includes(w) ? 2 : 1); chain++) {
        let source: Point = g.player
        const hit = new Set<number>()
        for (let i = 0; i < (g.weapons.lightning ?? 1) + 1; i++) {
          const e = nearest(grid, source, i === 0 ? CONFIG.attackRange : 150 * area, hit)
          if (!e) break
          hit.add(e.id)
          impact(g, e, damage)
          addEffect(g, {
            kind: 'lightning',
            x: source.x,
            y: source.y,
            tx: e.x,
            ty: e.y,
            radius: 0,
            life: 0.22,
            color: WEAPONS.lightning.color,
          })
          source = e
        }
      }
    if (w === 'frost') {
      const evolved = g.evolved.includes(w),
        radius = (evolved ? 185 : 92) * area
      for (const e of grid.query(g.player.x, g.player.y, radius + 48))
        if (distance(g.player, e) <= radius + e.radius) {
          impact(g, e, damage * (evolved ? 1.5 : 1))
          e.slow = 1.5
        }
      addEffect(g, {
        kind: 'frost',
        x: g.player.x,
        y: g.player.y,
        tx: 0,
        ty: 0,
        radius,
        life: 0.45,
        color: WEAPONS.frost.color,
      })
    }
  }
  for (const p of g.projectiles) {
    const before = { x: p.x, y: p.y }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.ttl -= dt
    const candidates = grid.query(
      (p.x + before.x) / 2,
      (p.y + before.y) / 2,
      60 + distance(p, before),
    )
    let first: Enemy | undefined,
      closest = Infinity
    for (const e of candidates)
      if (e.hp > 0 && segmentDistance(before, p, e) <= p.radius + e.radius) {
        const d = distance(before, e)
        if (d < closest) {
          closest = d
          first = e
        }
      }
    if (!first) continue
    p.ttl = 0
    if (p.explosive) {
      const radius = 95 * areaScale(g)
      for (const e of grid.query(first.x, first.y, radius + 48))
        if (distance(first, e) <= radius + e.radius) impact(g, e, p.damage)
      addEffect(g, {
        kind: 'blast',
        x: first.x,
        y: first.y,
        tx: 0,
        ty: 0,
        radius,
        life: 0.3,
        color: WEAPONS.fire.color,
      })
    } else impact(g, first, p.damage)
  }
  g.projectiles = g.projectiles.filter(
    (p) => p.ttl > 0 && p.x >= 0 && p.y >= 0 && p.x <= CONFIG.world && p.y <= CONFIG.world,
  )
}
/** Per-game grid is external to serializable state and can be recreated by tests. */
export function createSimulation() {
  const grid = new SpatialGrid<Enemy>()
  return {
    step(g: Game, input: Input, dt: number, rng: Random) {
      if (g.mode !== 'playing' || !Number.isFinite(dt) || dt <= 0 || dt > CONFIG.step + 1e-9) return
      g.elapsed += dt
      if (g.elapsed + 1e-8 >= 180 && !g.unlocked.includes('storm')) {
        g.unlocked.push('storm')
        g.events.push('unlock-storm')
      }
      g.player.invulnerable = Math.max(0, g.player.invulnerable - dt)
      let dx = input.x,
        dy = input.y
      if (input.pointer) {
        dx = (input.pointer.current.x - input.pointer.origin.x) / 42
        dy = (input.pointer.current.y - input.pointer.origin.y) / 42
      }
      const length = Math.hypot(dx, dy)
      if (length > 1) {
        dx /= length
        dy /= length
      }
      const speed = movementSpeed(g)
      g.player.x = clamp(
        g.player.x + dx * speed * dt,
        g.player.radius,
        CONFIG.world - g.player.radius,
      )
      g.player.y = clamp(
        g.player.y + dy * speed * dt,
        g.player.radius,
        CONFIG.world - g.player.radius,
      )
      spawn(g, dt, rng)
      moveEnemies(g, dt)
      grid.rebuild(g.enemies)
      attack(g, grid, dt)
      for (const e of g.enemies)
        if (e.hp <= 0) {
          g.kills++
          addGem(g, e, ENEMIES[e.kind].xp)
          g.bladeHits.delete(e.id)
          if (e.kind === 'boss') g.bossDefeated = true
          addEffect(g, {
            kind: 'spark',
            x: e.x,
            y: e.y,
            tx: 0,
            ty: 0,
            radius: e.radius,
            life: 0.3,
            color: e.kind === 'boss' ? '#ffc276' : '#a2d0b2',
          })
        }
      g.enemies = g.enemies.filter((e) => e.hp > 0)
      for (const gem of g.gems) {
        const d = distance(g.player, gem)
        if (d < CONFIG.magnet && d > 0) {
          const amount = Math.min(d, 280 * dt)
          gem.x += ((g.player.x - gem.x) / d) * amount
          gem.y += ((g.player.y - gem.y) / d) * amount
        }
        if (distance(g.player, gem) <= CONFIG.pickup) {
          g.xp += gem.value
          gem.value = 0
        }
      }
      g.gems = g.gems.filter((gem) => gem.value > 0)
      for (const e of g.effects) e.life -= dt
      g.effects = g.effects.filter((e) => e.life > 0)
      // Defeat deliberately wins a simultaneous lethal exchange, before XP or unlock rewards.
      if (g.player.hp <= 0) {
        g.mode = 'gameover'
        g.events.push('gameover')
        return
      }
      if (g.bossDefeated) {
        g.mode = 'victory'
        g.unlocked.push('iron')
        g.events.push('unlock-iron', 'victory')
        return
      }
      checkLevel(g, rng)
    },
  }
}

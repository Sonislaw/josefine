import { CONFIG, ENEMIES } from './config'
import { clamp, distance, worldView } from './space'
import type { Enemy, EnemyKind, Game, Point, Random } from './model'
export function spawnPosition(g: Game, rng: Random): Point {
  const v = worldView(g.player, g.lastView)
  // Rejection is bounded; fallback chooses the farthest world corner (always off-camera).
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 2,
      radius = Math.max(v.width, v.height) * 0.65 + 100
    const p = {
      x: clamp(g.player.x + Math.cos(angle) * radius, 55, CONFIG.world - 55),
      y: clamp(g.player.y + Math.sin(angle) * radius, 55, CONFIG.world - 55),
    }
    if (
      distance(p, g.player) > 220 &&
      (p.x < v.x - 55 || p.x > v.x + v.width + 55 || p.y < v.y - 55 || p.y > v.y + v.height + 55)
    )
      return p
  }
  return [
    { x: 55, y: 55 },
    { x: 2345, y: 55 },
    { x: 55, y: 2345 },
    { x: 2345, y: 2345 },
  ].sort((a, b) => distance(b, g.player) - distance(a, g.player))[0]!
}
export function createEnemy(g: Game, kind: EnemyKind, p: Point): Enemy {
  const base = ENEMIES[kind],
    multiplier = kind === 'boss' || kind === 'elite' ? 1 : 1 + (g.elapsed / 600) * 0.9
  return {
    ...p,
    ...base,
    hp: base.hp * multiplier,
    maxHp: base.hp * multiplier,
    id: g.nextId++,
    kind,
    slow: 0,
    flash: 0,
    attack: 'idle',
    timer: kind === 'boss' ? 3 : 0,
    alternate: false,
    dx: 0,
    dy: 0,
  }
}
export function spawn(g: Game, dt: number, rng: Random) {
  for (const [i, time] of CONFIG.eliteAt.entries())
    if (g.elapsed >= time && !g.eliteFlags[i]) {
      g.eliteFlags[i] = true
      g.enemies.push(createEnemy(g, 'elite', spawnPosition(g, rng)))
    }
  if (g.elapsed >= CONFIG.bossAt) {
    g.spawnBudget = 0
    if (!g.bossSpawned) {
      g.bossSpawned = true
      g.enemies.push(createEnemy(g, 'boss', spawnPosition(g, rng)))
    }
    return
  }
  g.spawnBudget += (CONFIG.spawnBase + g.elapsed * CONFIG.spawnGrowth) * dt
  let count = g.enemies.filter((e) => e.kind !== 'boss' && e.kind !== 'elite' && e.hp > 0).length
  while (g.spawnBudget >= 1) {
    g.spawnBudget-- // Consume even at capacity; no delayed burst when slots become free.
    if (count >= CONFIG.maxEnemies) continue
    const r = rng(),
      kind: EnemyKind =
        g.elapsed > 120 && r < 0.18 ? 'heavy' : g.elapsed > 45 && r < 0.4 ? 'runner' : 'shade'
    g.enemies.push(createEnemy(g, kind, spawnPosition(g, rng)))
    count++
  }
}

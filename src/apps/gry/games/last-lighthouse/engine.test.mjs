import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const { CONFIG, HEROES, xpRequired } = await jiti.import('./config.ts')
const { createGame, createSimulation, addGem, hurtPlayer, bladePositions } =
  await jiti.import('./engine.ts')
const { legalChoices, chooseUpgrade, checkLevel, dealChoices } = await jiti.import('./upgrades.ts')
const { createEnemy, spawnPosition, spawn } = await jiti.import('./spawner.ts')
const { camera, worldView, SpatialGrid, segmentDistance, distance } =
  await jiti.import('./space.ts')
const { createClock } = await jiti.import('./clock.ts')
const { decode, load, save } = await jiti.import('./storage.ts')
const rng =
  (seed = 9) =>
  () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
const fresh = (hero = 'flame') => createGame(hero, 'playing')
const input = { x: 0, y: 0, pointer: null }
const step = (g, n = 1, i = input) => {
  const sim = createSimulation(),
    r = rng()
  for (let j = 0; j < n; j++) sim.step(g, i, CONFIG.step, r)
}
const enemy = (g, kind, x, y) => {
  const e = createEnemy(g, kind, { x, y })
  g.enemies.push(e)
  return e
}

test('heroes start with distinct health, weapon, no progression bonuses', () => {
  for (const id of ['flame', 'storm', 'iron']) {
    const g = fresh(id)
    assert.equal(g.player.hp, HEROES[id].hp)
    assert.deepEqual(g.weapons, { [HEROES[id].weapon]: 1 })
    assert.deepEqual(g.passives, {})
    assert.equal(g.mode, 'playing')
  }
})
test('normalized keyboard and joystick speed, bounds and resize only affect camera', () => {
  const a = fresh(),
    b = fresh()
  step(a, 60, { ...input, x: 1 })
  step(b, 60, { ...input, x: 1, y: 1 })
  assert.ok(
    Math.abs(distance(a.player, { x: 1200, y: 1270 }) - distance(b.player, { x: 1200, y: 1270 })) <
      0.001,
  )
  const c = fresh()
  step(c, 60, { ...input, pointer: { origin: { x: 0, y: 0 }, current: { x: 1000, y: 0 } } })
  assert.ok(Math.abs(c.player.x - a.player.x) < 0.001)
  c.player.x = 2390
  step(c, 60, { ...input, x: 1 })
  assert.equal(c.player.x, 2380)
  const before = { ...c.player }
  const mobile = camera(c.player, 312, 485),
    desktop = camera(c.player, 900, 600)
  assert.ok(mobile.scale * CONFIG.playerRadius * 2 >= 24)
  assert.deepEqual(c.player, before)
  assert.notEqual(mobile.width, desktop.width)
})
test('spawns stay offscreen and far from the player, also at island corners', () => {
  const g = fresh(),
    r = rng()
  for (const p of [
    { x: 20, y: 20 },
    { x: 2380, y: 2380 },
    { x: 1200, y: 1270 },
  ])
    for (const view of [
      { width: 420, height: 700 },
      { width: 900, height: 600 },
    ]) {
      Object.assign(g.player, p)
      g.lastView = view
      const v = worldView(p, view)
      for (let i = 0; i < 60; i++) {
        const s = spawnPosition(g, r)
        assert.ok(distance(s, p) > 220)
        assert.ok(s.x < v.x || s.y < v.y || s.x > v.x + v.width || s.y > v.y + v.height)
        assert.ok(s.x >= 0 && s.x <= 2400 && s.y >= 0 && s.y <= 2400)
      }
    }
})
test('spawner consumes cap overflow, elites have separate slots, boss stops ordinary births', () => {
  const g = fresh(),
    r = rng()
  g.elapsed = 179
  g.enemies = Array.from({ length: 180 }, () => createEnemy(g, 'shade', { x: 10, y: 10 }))
  spawn(g, 10, r)
  assert.equal(g.enemies.length, 180)
  assert.ok(g.spawnBudget < 1)
  g.elapsed = 180
  spawn(g, CONFIG.step, r)
  assert.equal(g.enemies.filter((e) => e.kind === 'elite').length, 1)
  g.elapsed = 360
  spawn(g, CONFIG.step, r)
  assert.equal(g.enemies.filter((e) => e.kind === 'elite').length, 2)
  g.elapsed = 600
  spawn(g, CONFIG.step, r)
  assert.equal(g.enemies.length, 183)
  assert.equal(g.enemies.filter((e) => e.kind === 'boss').length, 1)
  g.enemies = g.enemies.filter((e) => e.kind !== 'shade')
  for (let i = 0; i < 60; i++) spawn(g, 1, r)
  assert.equal(g.enemies.length, 3)
  assert.equal(g.spawnBudget, 0)
})
test('spatial lookup and swept projectile collision, automatic nearest targeting', () => {
  const grid = new SpatialGrid()
  grid.rebuild([
    { x: 10, y: 10, radius: 5 },
    { x: 1000, y: 1000, radius: 5 },
  ])
  assert.equal(grid.query(0, 0, 30).length, 1)
  assert.equal(segmentDistance({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 4 }), 4)
  const g = fresh()
  const near = enemy(g, 'shade', 1300, 1270),
    far = enemy(g, 'shade', 1500, 1270)
  step(g, 50)
  assert.ok(near.hp <= 0)
  assert.equal(far.hp, far.maxHp)
  assert.ok(g.kills >= 1)
})
test('invulnerability prevents stacked damage and expires', () => {
  const g = fresh()
  assert.equal(hurtPlayer(g, 12), true)
  assert.equal(hurtPlayer(g, 12), false)
  assert.equal(g.player.hp, 88)
  step(g, 50)
  assert.equal(hurtPlayer(g, 12), true)
  assert.equal(g.player.hp, 76)
})
test('explosive fire damages main target once and nearby targets', () => {
  const g = fresh()
  g.weapons = { fire: 4 }
  g.evolved = ['fire']
  g.cooldowns.fire = 99
  const a = enemy(g, 'heavy', 1300, 1270),
    b = enemy(g, 'heavy', 1330, 1270)
  a.speed = 0
  b.speed = 0
  g.projectiles = [
    { id: 99, x: 1290, y: 1270, radius: 6, vx: 480, vy: 0, damage: 44, ttl: 1, explosive: true },
  ]
  step(g)
  assert.equal(a.hp, a.maxHp - 44)
  assert.equal(b.hp, b.maxHp - 44)
})
test('lightning has unique targets per chain; evolution produces a second chain', () => {
  for (const evolved of [false, true]) {
    const g = fresh('storm')
    g.weapons = { lightning: 1 }
    if (evolved) g.evolved = ['lightning']
    const a = enemy(g, 'heavy', 1300, 1270),
      b = enemy(g, 'heavy', 1360, 1270),
      c = enemy(g, 'heavy', 1500, 1270)
    step(g)
    assert.equal(a.hp, a.maxHp - (evolved ? 32 : 16))
    assert.equal(b.hp, b.maxHp - (evolved ? 32 : 16))
    assert.equal(c.hp, c.maxHp)
  }
})
test('frost slows and evolved radius/damage are larger; blades hit through spatial queries', () => {
  const g = fresh()
  g.weapons = { frost: 4 }
  g.evolved = ['frost']
  const e = enemy(g, 'heavy', 1370, 1270)
  step(g)
  assert.equal(e.hp, e.maxHp - 37.5)
  assert.equal(e.slow, 1.5)
  const b = fresh('iron'),
    p = bladePositions(b)[0],
    target = enemy(b, 'heavy', p.x, p.y)
  target.speed = 0
  step(b)
  assert.equal(target.hp, target.maxHp - 15)
  step(b)
  assert.equal(target.hp, target.maxHp - 15)
  b.evolved = ['blades']
  assert.equal(bladePositions(b).length, 4)
})
test('XP token merging preserves total value and collecting can trigger a paused level', () => {
  const g = fresh()
  for (let i = 0; i < 1000; i++) addGem(g, { x: 1200 + (i % 30), y: 1270 }, (i % 5) + 1)
  assert.equal(g.gems.length, CONFIG.maxGems)
  assert.equal(
    g.gems.reduce((n, x) => n + x.value, 0),
    3000,
  )
  step(g)
  assert.equal(g.mode, 'upgrade')
  assert.equal(g.level, 2)
  assert.equal(g.xp, 3000 - xpRequired(1))
  const elapsed = g.elapsed
  step(g, 100)
  assert.equal(g.elapsed, elapsed)
})
test('choices are unique, respect slots and levels; forged selection cannot mutate game', () => {
  const g = fresh()
  g.weapons = { fire: 4, lightning: 4, frost: 4 }
  g.passives = { power: 3, haste: 3, area: 3 }
  const choices = legalChoices(g)
  assert.equal(choices.length, 3)
  assert.ok(choices.every((c) => c.type === 'evolve'))
  dealChoices(g, rng())
  g.mode = 'upgrade'
  assert.equal(chooseUpgrade(g, { type: 'weapon', id: 'blades' }, rng()), false)
  const c = g.choices[0]
  assert.equal(chooseUpgrade(g, c, rng()), true)
  assert.equal(g.evolved.length, 1)
  assert.equal(Object.keys(g.weapons).length, 3)
  for (let i = 0; i < 100; i++) {
    const s = fresh()
    dealChoices(s, rng(i))
    assert.equal(new Set(s.choices.map((c) => c.type + ('id' in c ? c.id : ''))).size, 3)
  }
})
test('evolutions require both levels, fully-developed fallback heals without overflow', () => {
  const g = fresh()
  g.weapons = { fire: 4 }
  g.passives = { power: 1 }
  assert.ok(!legalChoices(g).some((c) => c.type === 'evolve'))
  g.passives.power = 2
  assert.ok(legalChoices(g).some((c) => c.type === 'evolve' && c.id === 'fire'))
  g.weapons = { fire: 4, lightning: 4, frost: 4 }
  g.passives = { power: 3, haste: 3, area: 3 }
  g.evolved = ['fire', 'lightning', 'frost']
  g.mode = 'upgrade'
  dealChoices(g, rng())
  assert.deepEqual(g.choices, [{ type: 'heal' }])
  g.player.hp = 90
  chooseUpgrade(g, { type: 'heal' }, rng())
  assert.equal(g.player.hp, 100)
})
test('boss telegraphs charge and expanding ring before causing their damage', () => {
  const g = fresh(),
    boss = enemy(g, 'boss', 1450, 1270)
  g.weapons = {}
  boss.timer = 0.001
  step(g)
  assert.equal(boss.attack, 'charge-warning')
  const x = boss.x
  step(g, 30)
  assert.equal(boss.x, x)
  step(g, 40)
  assert.equal(boss.attack, 'charge')
  assert.ok(boss.x < x)
  boss.attack = 'idle'
  boss.timer = 0
  boss.alternate = true
  step(g)
  assert.equal(boss.attack, 'ring-warning')
  assert.equal(g.rings.length, 0)
  step(g, 100)
  assert.ok(g.rings.length > 0)
  assert.ok(g.rings[0].radius > 0)
})
test('terminal priority: simultaneous boss/player death loses, surviving boss kill unlocks iron once', () => {
  for (const die of [false, true]) {
    const g = fresh(),
      boss = enemy(g, 'boss', g.player.x, g.player.y)
    boss.hp = 0
    if (die) g.player.hp = 0
    step(g)
    assert.equal(g.mode, die ? 'gameover' : 'victory')
    assert.equal(g.unlocked.includes('iron'), !die)
    const events = [...g.events]
    step(g)
    assert.deepEqual(g.events, events)
  }
})
test('clock never catches up hidden time, pauses on stalls, freezes during all overlays', () => {
  const clock = createClock()
  let mode = 'playing',
    steps = 0,
    stalls = 0
  const tick = (t) =>
    clock.tick(
      t,
      () => mode,
      () => steps++,
      () => {
        stalls++
        mode = 'paused'
      },
    )
  tick(0)
  tick(100)
  assert.equal(steps, 6)
  tick(1000)
  assert.equal(stalls, 1)
  assert.equal(steps, 6)
  for (const m of ['paused', 'upgrade', 'menu', 'victory', 'gameover']) {
    mode = m
    tick(2000)
    assert.equal(steps, 6)
  }
})
test('local progress validation and monotonic merge; denied storage is nonfatal', () => {
  assert.deepEqual(decode('{broken').unlocked, ['flame'])
  assert.deepEqual(
    decode(JSON.stringify({ version: 1, unlocked: ['hacked', 'iron'], bestTime: -1 })).unlocked,
    ['flame', 'iron'],
  )
  let raw = JSON.stringify({ ...decode(null), unlocked: ['flame', 'storm'], bestTime: 200 })
  const port = { getItem: () => raw, setItem: (k, v) => (raw = v) }
  const result = save(port, { ...decode(null), bestTime: 10, unlocked: ['flame', 'iron'] })
  assert.equal(result.available, true)
  assert.equal(result.preferences.bestTime, 200)
  assert.deepEqual(new Set(result.preferences.unlocked), new Set(['flame', 'storm', 'iron']))
  assert.equal(
    load({
      getItem() {
        throw Error()
      },
    }).available,
    false,
  )
  assert.equal(
    save(
      {
        getItem() {
          throw Error()
        },
      },
      decode(null),
    ).available,
    false,
  )
})
test('first upgrade takes 20–40 seconds in five seeded collection runs', () => {
  for (const seed of [1, 5, 23, 47, 123]) {
    const g = fresh(),
      sim = createSimulation(),
      random = rng(seed)
    for (let i = 0; i < 2400 && g.mode === 'playing'; i++) {
      const targets = g.gems.length ? g.gems : g.enemies
      const target = targets.toSorted((a, b) => distance(a, g.player) - distance(b, g.player))[0]
      sim.step(
        g,
        {
          x: target ? target.x - g.player.x : 0,
          y: target ? target.y - g.player.y : 0,
          pointer: null,
        },
        CONFIG.step,
        random,
      )
      g.events.length = 0
    }
    assert.equal(g.mode, 'upgrade', `seed ${seed}`)
    assert.ok(g.elapsed >= 20 && g.elapsed <= 40, `seed ${seed}: ${g.elapsed}`)
  }
})
test('complete ten-minute seeded simulation: caps, levels, elites and single boss', () => {
  const g = fresh(),
    sim = createSimulation(),
    r = rng(139)
  // Invulnerability is a fixture, not a production option; all other systems run normally.
  g.player.invulnerable = 10000
  let firstEvolution = Infinity
  for (let i = 0; i < 36005; i++) {
    if (g.mode === 'upgrade')
      chooseUpgrade(g, g.choices.find((c) => c.type === 'evolve') ?? g.choices[0], r)
    const gem = g.gems[0],
      dx = gem ? gem.x - g.player.x : Math.cos(i / 1200),
      dy = gem ? gem.y - g.player.y : Math.sin(i / 1200)
    sim.step(g, { x: dx, y: dy, pointer: null }, CONFIG.step, r)
    g.events.length = 0
    if (g.evolved.length) firstEvolution = Math.min(firstEvolution, g.elapsed)
    assert.ok(g.enemies.filter((e) => e.kind !== 'boss' && e.kind !== 'elite').length <= 180)
    assert.ok(g.projectiles.length <= 250)
    assert.ok(g.effects.length <= 200)
    assert.ok(g.gems.length <= 140)
  }
  // XP screens consume no active time, so continue until precisely crossing the boss threshold.
  while (g.elapsed < 600.05) {
    if (g.mode === 'upgrade') chooseUpgrade(g, g.choices[0], r)
    sim.step(g, input, CONFIG.step, r)
    g.events.length = 0
  }
  assert.ok(g.unlocked.includes('storm'))
  assert.deepEqual(g.eliteFlags, [true, true])
  assert.equal(g.bossSpawned, true)
  assert.equal(g.enemies.filter((e) => e.kind === 'boss').length, 1)
  assert.ok(g.level > 5)
  assert.ok(firstEvolution < 600, 'Evolution is reachable before the final encounter')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const jiti = createJiti(import.meta.url)
const { CONFIG, spawnRate, expectedBirths, dashCooldown, movementSpeed, magnetRadius } =
  await jiti.import('./config.ts')
const { createGame, stepGame, activateDash, chooseUpgrade, collectGem } =
  await jiti.import('./engine.ts')
const { createMeteor, updateMeteorSpawner } = await jiti.import('./spawner.ts')
const { emptyInput } = await jiti.import('./model.ts')
const { sweptContact } = await jiti.import('./collisions.ts')
const { worldPoint } = await jiti.import('./input.ts')
const { createClock } = await jiti.import('./clock.ts')
const { parseBest, loadPreferences, saveBest } = await jiti.import('./storage.ts')
const rng = () => 0.9
const fresh = () => {
  const game = createGame(0, rng, 'playing')
  game.gems = []
  return game
}
const meteor = (x, y, speed = 0) => ({
  ...createMeteor(0, 1, rng),
  x,
  y,
  previousX: x,
  previousY: y,
  speed,
})
const gem = (x, y, id = 1) => ({ id, x, y, radius: 7, phase: 0, alive: true })
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`)

test('initial state, boundaries and 12 crystals', () => {
  const game = createGame(50, rng)
  assert.equal(game.mode, 'menu')
  assert.equal(game.gems.length, 12)
  assert.equal(game.player.hp, 3)
  assert.equal(game.bestScore, 50)
  assert.equal(game.player.x, 450)
  assert.equal(game.player.y, 300)
  for (const g of game.gems) {
    assert.ok(g.x >= 35 && g.x <= 865)
    assert.ok(g.y >= 90 && g.y <= 570)
  }
  game.mode = 'playing'
  game.gems = []
  for (let i = 0; i < 300; i++) stepGame(game, { ...emptyInput(), x: 1, y: 1 }, CONFIG.step, rng)
  assert.ok(game.player.x <= 885 && game.player.y <= 585)
})
test('normalized diagonal speed and pointer priority, no teleport or overshoot', () => {
  const a = fresh(),
    b = fresh()
  stepGame(a, { ...emptyInput(), x: 1 }, 0.2, rng)
  stepGame(b, { ...emptyInput(), x: 1, y: 1 }, 0.2, rng)
  close(
    Math.hypot(a.player.x - 450, a.player.y - 300),
    Math.hypot(b.player.x - 450, b.player.y - 300),
  )
  const c = fresh()
  stepGame(c, { x: -1, y: 0, pointer: { x: 460, y: 300 }, dash: false }, 0.2, rng)
  assert.equal(c.player.x, 460)
  stepGame(c, { x: -1, y: 0, pointer: { x: 463, y: 300 }, dash: false }, 0.2, rng)
  assert.equal(c.player.x, 460)
})
test('five gems award 150; combo timeout/receiving damage reset it; meteors do not add XP', () => {
  const game = fresh()
  for (let i = 0; i < 5; i++) collectGem(game)
  assert.equal(game.score, 150)
  assert.equal(game.combo, 5)
  assert.equal(game.xp, 5)
  game.mode = 'paused'
  stepGame(game, emptyInput(), 3, rng)
  assert.equal(game.combo, 5)
  close(game.comboRemaining, 2.8)
  game.mode = 'playing'
  stepGame(game, emptyInput(), 2.8, rng)
  assert.equal(game.combo, 1)
  game.combo = 5
  game.meteors = [meteor(game.player.x, game.player.y)]
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.player.hp, 2)
  assert.equal(game.combo, 1)
  assert.equal(game.comboRemaining, 0)
  close(game.player.invulnerabilityRemaining, 1.8)
})
test('simultaneous hits cost exactly one life; protected contacts remain', () => {
  const game = fresh()
  game.meteors = [meteor(450, 300), meteor(450, 300), meteor(450, 300)]
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.player.hp, 2)
  assert.equal(game.meteors.length, 2)
  assert.equal(game.score, 0)
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.player.hp, 2)
  assert.equal(game.meteors.length, 2)
})
test('dash uses locked direction, destroys swept contacts exactly once and expires precisely', () => {
  const game = fresh()
  game.player.directionX = 1
  game.player.directionY = 0
  game.meteors = [meteor(520, 300), meteor(590, 300)]
  assert.equal(activateDash(game), true)
  assert.equal(activateDash(game), false)
  stepGame(game, { ...emptyInput(), y: 1 }, 0.22, rng)
  close(game.player.x, 626)
  close(game.player.y, 300)
  close(game.player.dashRemaining, 0)
  close(game.player.dashCooldownRemaining, 2.98)
  assert.equal(game.score, 30)
  assert.equal(game.xp, 0)
  assert.equal(game.meteors.length, 0)
  stepGame(game, emptyInput(), 0.1, rng)
  assert.equal(game.score, 30)
})
test('step splits at dash end: a later contact damages instead of awarding dash points', () => {
  const game = fresh()
  game.player.directionX = 1
  game.player.directionY = 0
  activateDash(game)
  game.player.dashRemaining = 0.01
  game.meteors = [meteor(487, 300)]
  stepGame(game, { ...emptyInput(), x: 1 }, 0.04, rng)
  assert.equal(game.score, 0)
  assert.equal(game.player.hp, 2)
  close(game.player.invulnerabilityRemaining, 1.8)
})
test('relative collision detects two objects crossing between endpoints', () => {
  assert.equal(
    sweptContact({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 0 }, 23),
    true,
  )
  assert.equal(
    sweptContact({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 24 }, { x: 0, y: 24 }, 23),
    false,
  )
})
test('magnet cannot overshoot; crystal cap skips missed attempts without backlog', () => {
  const game = fresh()
  game.gems = [gem(480, 300)]
  stepGame(game, emptyInput(), 0.2, rng)
  assert.equal(game.gems.length, 0)
  assert.equal(game.score, 10)
  game.gems = Array.from({ length: 18 }, (_, i) => gem(50, 100, i))
  game.player.invulnerabilityRemaining = 100
  for (let i = 0; i < 240; i++) stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.gems.length, 18)
  game.gems = []
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.ok(game.gems.length <= 1)
})
test('level thresholds 8,11; freeze at first upgrade, preserve gems/meteors/time, choose once', () => {
  const game = fresh()
  game.gems = Array.from({ length: 12 }, (_, i) => gem(450, 300, i))
  game.meteors = [meteor(30, 20)]
  game.spawnBudget = 0.6
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.mode, 'upgrade')
  assert.equal(game.level, 2)
  assert.equal(game.xp, 0)
  assert.equal(game.gems.length, 4)
  const before = JSON.stringify(game)
  stepGame(game, emptyInput(), 60, rng)
  assert.equal(JSON.stringify(game), before)
  const t = game.elapsed,
    budget = game.spawnBudget
  assert.equal(chooseUpgrade(game, 'speed'), true)
  assert.equal(chooseUpgrade(game, 'speed'), false)
  assert.equal(game.elapsed, t)
  assert.equal(game.spawnBudget, budget)
  assert.equal(game.meteors.length, 1)
  close(game.player.invulnerabilityRemaining, 1.3)
  close(movementSpeed(game.upgrades.speed), 257.6)
  for (let i = 0; i < 10; i++) collectGem(game)
  assert.equal(game.mode, 'playing')
  collectGem(game)
  assert.equal(game.level, 3)
})
test('energy clamps cooldown/health and disabled maximum; upgrades are additive', () => {
  const game = fresh()
  for (let i = 0; i < 5; i++) {
    game.mode = 'upgrade'
    game.player.hp = 2
    game.player.dashCooldownRemaining = 3
    assert.ok(chooseUpgrade(game, 'energy'))
  }
  close(dashCooldown(game.upgrades.energy), 1.1)
  close(game.player.dashCooldownRemaining, 1.1)
  assert.equal(game.player.hp, 3)
  game.mode = 'upgrade'
  assert.equal(chooseUpgrade(game, 'energy'), false)
  game.player.hp = 2
  assert.equal(chooseUpgrade(game, 'energy'), true)
  assert.equal(game.player.hp, 3)
  close(movementSpeed(2), 285.2)
  assert.equal(magnetRadius(2), 125)
  game.mode = 'upgrade'
  game.player.invulnerabilityRemaining = 1.8
  chooseUpgrade(game, 'magnet')
  close(game.player.invulnerabilityRemaining, 1.8)
})
test('death precedes simultaneous crystal/level reward; replay creates clean round', () => {
  const game = fresh()
  game.score = 100
  game.xp = 7
  game.player.hp = 1
  game.meteors = [meteor(450, 300)]
  game.gems = [gem(450, 300)]
  stepGame(game, emptyInput(), CONFIG.step, rng)
  assert.equal(game.mode, 'gameover')
  assert.equal(game.score, 100)
  assert.equal(game.xp, 7)
  assert.equal(game.level, 1)
  assert.equal(game.bestScore, 100)
  const reset = createGame(game.bestScore, rng, 'playing')
  assert.equal(reset.bestScore, 100)
  assert.equal(reset.score, 0)
  assert.equal(reset.elapsed, 0)
  assert.equal(reset.spawnBudget, 0)
  assert.equal(reset.meteors.length, 0)
  assert.equal(reset.xp, 0)
  assert.deepEqual(reset.upgrades, { speed: 0, magnet: 0, energy: 0 })
})
test('births never stop at 35,100,500,1000 or 5000 active meteors', () => {
  for (const n of [35, 100, 500, 1000, 5000]) {
    const game = fresh()
    game.meteors = Array.from({ length: n }, () => meteor(-25, 0))
    updateMeteorSpawner(game, 10, rng)
    assert.equal(game.meteors.length, n + expectedBirths(10))
  }
})
test('unbounded spawn integral matches 60,120,300,600 seconds with different step partitions', () => {
  for (const seconds of [60, 120, 300, 600])
    for (const dt of [1 / 120, 1 / 30, 0.5]) {
      const game = fresh(),
        steps = Math.round(seconds / dt)
      for (let i = 0; i < steps; i++) updateMeteorSpawner(game, dt, rng)
      assert.ok(Math.abs(game.totalMeteorsSpawned - expectedBirths(seconds)) <= 1)
      assert.equal(game.meteors.length, game.totalMeteorsSpawned)
    }
  assert.equal(expectedBirths(60), 72)
  assert.equal(expectedBirths(120), 234)
  assert.equal(expectedBirths(300), 1260)
  assert.equal(expectedBirths(600), 4770)
  assert.ok(
    spawnRate(3600) > spawnRate(600) &&
      spawnRate(600) > spawnRate(300) &&
      spawnRate(300) > spawnRate(120),
  )
})
test('multiple births in one step, fractional remainder, pause, clearing enemies and restart', () => {
  const game = fresh()
  game.elapsed = 3600
  game.spawnBudget = 0.4
  updateMeteorSpawner(game, 0.1, rng)
  assert.equal(game.totalMeteorsSpawned, 9)
  assert.ok(game.spawnBudget > 0.4)
  for (const mode of ['paused', 'upgrade', 'menu', 'gameover']) {
    game.mode = mode
    const before = JSON.stringify(game)
    updateMeteorSpawner(game, 60, rng)
    assert.equal(JSON.stringify(game), before)
  }
  game.mode = 'playing'
  game.meteors.length = 0
  const count = game.totalMeteorsSpawned
  updateMeteorSpawner(game, 0.1, rng)
  assert.equal(game.totalMeteorsSpawned, count + 9)
  assert.equal(game.meteors.length, 9)
})
test('meteor edges are equiprobable by RNG branch and speeds are fixed at birth', () => {
  for (const [n, x, y] of [
    [0, -25, 150],
    [1, 925, 150],
    [2, 225, -25],
    [3, 225, 625],
  ]) {
    let i = 0
    const m = createMeteor(600, n, () => (i++ === 0 ? (n + 0.1) / 4 : 0.25))
    assert.equal(m.x, x)
    assert.equal(m.y, y)
    assert.ok(m.speed >= 170 && m.speed <= 192)
  }
})
test('fixed clock produces equal steps at 30/60/144Hz; long stalls explicitly pause, no debt', () => {
  for (const fps of [30, 60, 144]) {
    const clock = createClock()
    let mode = 'playing',
      ticks = 0
    clock.tick(
      0,
      () => mode,
      () => ticks++,
      () => {
        mode = 'paused'
      },
    )
    for (let i = 1; i <= fps; i++)
      clock.tick(
        (i * 1000) / fps,
        () => mode,
        () => ticks++,
        () => {
          mode = 'paused'
        },
      )
    assert.equal(ticks, 120)
    clock.tick(
      61000,
      () => mode,
      () => ticks++,
      () => {
        mode = 'paused'
      },
    )
    assert.equal(mode, 'paused')
    assert.equal(ticks, 120)
    mode = 'playing'
    clock.reset()
    clock.tick(
      62000,
      () => mode,
      () => ticks++,
      () => {},
    )
    assert.equal(ticks, 120)
  }
})
test('pointer coordinates respect scaling and letterboxing', () => {
  assert.deepEqual(worldPoint(200, 150, { left: 50, top: 50, width: 300, height: 200 }), {
    x: 450,
    y: 300,
  })
  assert.deepEqual(worldPoint(200, 200, { left: 50, top: 50, width: 300, height: 300 }), {
    x: 450,
    y: 300,
  })
})
test('storage validation, denied access, record never decreases', () => {
  for (const n of [null, '', 'bad', 'Infinity', '-1']) assert.equal(parseBest(n), 0)
  assert.equal(parseBest('12.5'), 12.5)
  const denied = {
    getItem() {
      throw Error('denied')
    },
    setItem() {
      throw Error('denied')
    },
  }
  assert.equal(loadPreferences(denied).available, false)
  assert.deepEqual(saveBest(denied, 150), { best: 150, available: false })
  let stored = '200'
  const memory = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value
    },
  }
  assert.equal(saveBest(memory, 150).best, 200)
  assert.equal(stored, '200')
  assert.equal(saveBest(memory, 250).best, 250)
})

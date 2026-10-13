import { chromium } from '@playwright/test'
import { cpus, platform, release, totalmem } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
const rows = []
try {
  for (const profile of [
    { width: 900, height: 600, dpr: 1 },
    { width: 312, height: 485, dpr: 2 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1000, height: 850 },
      deviceScaleFactor: profile.dpr,
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:5175/tests/gry/lighthouse-harness.html')
    await page.waitForFunction(() => window.lighthouseHarness)
    const result = await page.evaluate(async (profile) => {
      const api = window.lighthouseHarness
      window.lighthouseApp.unmount()
      const canvas = document.createElement('canvas')
      canvas.style.cssText = `width:${profile.width}px;height:${profile.height}px`
      document.body.append(canvas)
      const renderer = api.createRenderer(canvas)
      renderer.resize()
      const g = api.engine.createGame('flame', 'playing'),
        sim = api.engine.createSimulation(),
        input = api.emptyInput()
      const view = renderer.view(g)
      g.lastView = view
      g.elapsed = 601
      g.bossSpawned = true
      g.eliteFlags = [true, true]
      g.player.invulnerable = 1e9
      g.weapons = { fire: 4, lightning: 4, frost: 4 }
      g.passives = { power: 3, haste: 3, area: 3 }
      g.evolved = ['fire', 'lightning', 'frost']
      for (let i = 0; i < 183; i++) {
        const kind = i === 182 ? 'boss' : i >= 180 ? 'elite' : ['shade', 'runner', 'heavy'][i % 3],
          angle = i * 2.39996,
          r = 90 + (i % 8) * 18
        const e = api.spawner.createEnemy(g, kind, {
          x: g.player.x + Math.cos(angle) * r,
          y: g.player.y + Math.sin(angle) * r,
        })
        e.hp = e.maxHp = 1e9
        e.speed = 0
        e.timer = 1e9
        g.enemies.push(e)
      }
      const updates = [],
        renders = []
      for (let i = 0; i < 150; i++) {
        await new Promise(requestAnimationFrame)
        // Refill outside measurement so every sample starts at the declared visual/projectile caps.
        while (g.projectiles.length < 250)
          g.projectiles.push({
            id: g.nextId++,
            x: g.player.x - 150 + (g.projectiles.length % 20) * 15,
            y: g.player.y - 180 + Math.floor(g.projectiles.length / 20) * 20,
            radius: 6,
            vx: 80,
            vy: 0,
            ttl: 10,
            damage: 1,
            explosive: true,
          })
        while (g.effects.length < 200)
          g.effects.push({
            kind: 'spark',
            x: g.player.x - 160 + (g.effects.length % 20) * 16,
            y: g.player.y - 180 + Math.floor(g.effects.length / 20) * 30,
            tx: 0,
            ty: 0,
            radius: 15,
            life: 10,
            maxLife: 10,
            color: '#ffc888',
          })
        const a = performance.now()
        sim.step(g, input, 1 / 60, () => 0.5)
        const b = performance.now()
        renderer.render(g, input)
        const c = performance.now()
        g.events.length = 0
        if (i >= 30) {
          updates.push(b - a)
          renders.push(c - b)
        }
      }
      const summarize = (a) => ({
        meanMs: +(a.reduce((n, v) => n + v, 0) / a.length).toFixed(3),
        p95Ms: +a.toSorted((x, y) => x - y)[Math.floor(a.length * 0.95)].toFixed(3),
      })
      renderer.dispose()
      return { update: summarize(updates), render: summarize(renders), enemies: g.enemies.length }
    }, profile)
    rows.push({ ...profile, ...result })
    await context.close()
  }
  const report = {
    date: new Date().toISOString(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    ramGb: Math.round(totalmem() / 2 ** 30),
    system: `${platform()} ${release()}`,
    browser: browser.version(),
    warmup: 30,
    samples: 120,
    note: 'Headless desktop Chrome. CPU timings of one 1/60 simulation step and Canvas commands, not end-to-end FPS or physical phone results. 180 ordinary enemies + 2 elites + boss, 250 projectile and 200 effect slots replenished outside measurement.',
    rows,
  }
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/lighthouse-performance.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}

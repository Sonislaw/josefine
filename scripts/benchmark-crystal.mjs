import { chromium } from '@playwright/test'
import { cpus, platform, release, totalmem } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  await page.goto('http://127.0.0.1:5175/tests/gry/crystal-harness.html')
  await page.waitForFunction(() => window.crystalTest)
  const rows = await page.evaluate(async () => {
    window.crystalApp.unmount()
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:900px;height:600px'
    document.body.append(canvas)
    const renderer = window.crystalRenderer(canvas)
    renderer.resize()
    let seed = 871
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 2 ** 32
    }
    const rows = []
    for (const count of [100, 500, 1000, 5000]) {
      const game = window.crystalEngine.createGame(0, rng, 'playing')
      game.player.invulnerabilityRemaining = 1e9 // Test harness only, never offered in the game.
      game.gems = []
      game.meteors = Array.from({ length: count }, (_, id) => ({
        ...window.crystalSpawner.createMeteor(0, id, rng),
        x: rng() * 900,
        y: rng() * 600,
      }))
      const input = window.crystalInput(),
        updates = [],
        renders = []
      for (let i = 0; i < 150; i++) {
        // Yield to presentation between samples; do not flood the GPU with 150 queued frames.
        await new Promise(requestAnimationFrame)
        const t = performance.now()
        window.crystalEngine.stepGame(game, input, 1 / 120, rng)
        const u = performance.now()
        renderer.render(game, input)
        const r = performance.now()
        game.events.length = 0
        if (i >= 30) {
          updates.push(u - t)
          renders.push(r - u)
        }
      }
      const summarize = (samples) => ({
        meanMs: +(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3),
        p95Ms: +samples.toSorted((a, b) => a - b)[Math.floor(samples.length * 0.95)].toFixed(3),
      })
      rows.push({
        meteors: count,
        update120Hz: summarize(updates),
        render: summarize(renders),
        survivors: game.meteors.length,
      })
    }
    return rows
  })
  const report = {
    date: new Date().toISOString(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    ramGb: Math.round(totalmem() / 2 ** 30),
    system: `${platform()} ${release()}`,
    browser: browser.version(),
    viewport: '900×600 canvas, DPR 1, headless Chrome',
    samples: 120,
    warmup: 30,
    note: 'One sample per RAF: CPU update and canvas command timings, excluding frame wait. Not end-to-end FPS or mobile measurements. No meteor cap/removal.',
    rows,
  }
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/crystal-performance.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}

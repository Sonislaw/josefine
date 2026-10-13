import { chromium } from '@playwright/test'
import { cpus, platform, release, totalmem } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'

// Test entry only: no benchmark hooks or fixtures are shipped in the app.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
try {
  const results = []
  for (const profile of [
    { name: 'desktop', width: 900, height: 560, dpr: 1, zoom: 0.6 },
    { name: 'overview', width: 900, height: 560, dpr: 1, zoom: 0.18 },
    { name: 'mobile-emulation', width: 336, height: 435, dpr: 2, zoom: 0.6 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1000, height: 900 },
      deviceScaleFactor: profile.dpr,
    })
    const page = await context.newPage()
    await page.goto(
      `${process.env.GRY_BASE_URL || 'http://127.0.0.1:5175'}/tests/gry/express-harness.html`,
    )
    await page.waitForFunction(() => window.expressHarness)
    results.push(
      await page.evaluate(async (profile) => {
        const h = window.expressHarness
        window.expressApp.unmount()
        const g = h.engine.createGame(123)
        for (let i = 1; i < 100; i++) h.world.discoverDistrict(g)
        g.trains = []
        // Sixteen independent routes keep all trains moving without accidents ending measurement.
        for (const district of g.districts.slice(1, 17)) {
          const [a, b] = Object.values(g.nodes).filter(
            (n) => n.kind === 'station' && n.district === district.key,
          )
          const result = h.engine.execute(g, { type: 'connect', a: a.id, b: b.id })
          if (!result.ok) throw Error(result.message)
          g.trains.push(h.world.createTrain(g, a.id))
        }
        g.capacity = 12
        for (const station of Object.values(g.nodes).filter((n) => n.kind === 'station')) {
          station.opensAt = 0
          station.waiting = Array.from({ length: 24 }, () => ({
            origin: station.id,
            destination: g.depot,
            since: 0,
          }))
        }
        g.mode = 'playing'
        const canvas = document.createElement('canvas')
        canvas.style.cssText = `width:${profile.width}px;height:${profile.height}px`
        document.body.append(canvas)
        const renderer = h.createRenderer(canvas)
        renderer.resize()
        const simulation = [],
          render = [],
          camera = { x: 0, y: 0, zoom: profile.zoom }
        for (let i = 0; i < 210; i++) {
          await new Promise(requestAnimationFrame)
          const a = performance.now()
          h.engine.step(g)
          const b = performance.now()
          renderer.render(g, camera, null, null, true)
          const c = performance.now()
          if (i >= 30) {
            simulation.push(b - a)
            render.push(c - b)
          }
        }
        if (g.mode !== 'playing') throw Error('Measurement stopped unexpectedly')
        const stats = (data) => {
          const sorted = [...data].sort((a, b) => a - b)
          return {
            meanMs: +(data.reduce((a, b) => a + b, 0) / data.length).toFixed(3),
            p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(3),
          }
        }
        renderer.dispose()
        return {
          ...profile,
          districts: g.districts.length,
          stations: g.stationCount,
          trains: g.trains.length,
          samples: simulation.length,
          simulation: stats(simulation),
          render: stats(render),
        }
      }, profile),
    )
    await context.close()
  }
  const report = {
    date: new Date().toISOString(),
    environment: {
      os: `${platform()} ${release()}`,
      cpu: cpus()[0].model,
      logicalCores: cpus().length,
      ramGiB: +(totalmem() / 2 ** 30).toFixed(1),
      chrome: browser.version(),
    },
    note: 'Canvas command submission and simulation CPU time; excludes GPU completion/compositing. Desktop Chrome with viewport/DPR emulation, not a physical-phone measurement.',
    results,
  }
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/express-performance.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}

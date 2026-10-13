import { CONFIG } from './config'
import { meteorShapes } from './spawner'
import type { Game, Input } from './model'

/** Cached meteor silhouettes: cost stays linear, with no per-frame geometry allocation. */
export function createRenderer(canvas: HTMLCanvasElement, reducedMotion = false) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Ta przeglądarka nie udostępnia Canvas 2D.')
  const sprites = meteorShapes.map((shape) => {
    const sprite = document.createElement('canvas')
    sprite.width = 64
    sprite.height = 64
    const c = sprite.getContext('2d')!
    c.translate(32, 32)
    c.beginPath()
    shape.forEach((radius, i) => {
      const angle = (i / shape.length) * Math.PI * 2,
        x = Math.cos(angle) * radius * 21,
        y = Math.sin(angle) * radius * 21
      if (i === 0) c.moveTo(x, y)
      else c.lineTo(x, y)
    })
    c.closePath()
    c.fillStyle = '#552436'
    c.fill()
    c.lineWidth = 2.4
    c.strokeStyle = '#ff7185'
    c.stroke()
    c.beginPath()
    c.arc(-5, -4, 5, 0, Math.PI * 2)
    c.fillStyle = '#713047'
    c.fill()
    return sprite
  })
  function resize() {
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(rect.width * dpr)),
      height = Math.max(1, Math.round(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
  }
  function render(game: Game, input: Input) {
    if (!ctx) return
    const scale = Math.min(canvas.width / CONFIG.width, canvas.height / CONFIG.height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#0b1018'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(
      scale,
      0,
      0,
      scale,
      (canvas.width - CONFIG.width * scale) / 2,
      (canvas.height - CONFIG.height * scale) / 2,
    )
    ctx.save()
    if (game.hitFlash && !reducedMotion)
      ctx.translate(Math.sin(game.elapsed * 95) * 2, Math.cos(game.elapsed * 79) * 2)
    ctx.fillStyle = '#101a27'
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height)
    ctx.strokeStyle = '#1a2939'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    for (let x = 0; x <= CONFIG.width; x += 40) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CONFIG.height)
    }
    for (let y = 0; y <= CONFIG.height; y += 40) {
      ctx.moveTo(0, y)
      ctx.lineTo(CONFIG.width, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#586982'
    for (let i = 0; i < 35; i++) {
      ctx.globalAlpha = 0.2 + (i % 3) * 0.12
      ctx.fillRect((i * 197 + 73) % 900, (i * 131 + 23) % 600, 1.6, 1.6)
    }
    ctx.globalAlpha = 1
    for (const gem of game.gems) {
      const radius = gem.radius + (reducedMotion ? 0 : Math.sin(game.elapsed * 4 + gem.phase) * 1.4)
      ctx.beginPath()
      ctx.moveTo(gem.x, gem.y - radius)
      ctx.lineTo(gem.x + radius * 0.75, gem.y)
      ctx.lineTo(gem.x, gem.y + radius)
      ctx.lineTo(gem.x - radius * 0.75, gem.y)
      ctx.closePath()
      ctx.fillStyle = '#a9f477'
      ctx.fill()
      ctx.strokeStyle = '#e2ffd0'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    for (const meteor of game.meteors) {
      // Off-screen rendering may be skipped. Simulation never removes/caps these meteors.
      if (meteor.x < -20 || meteor.x > 920 || meteor.y < -20 || meteor.y > 620) continue
      ctx.save()
      ctx.translate(meteor.x, meteor.y)
      ctx.rotate(meteor.angle)
      ctx.drawImage(sprites[meteor.shape]!, -17, -17, 34, 34)
      ctx.restore()
    }
    if (!reducedMotion)
      for (const particle of game.particles) {
        ctx.globalAlpha = Math.min(1, particle.life * 3)
        ctx.fillStyle = particle.color
        ctx.fillRect(particle.x - 1.5, particle.y - 1.5, 3, 3)
      }
    ctx.globalAlpha = 1
    const p = game.player,
      dashing = p.dashRemaining > 0
    ctx.save()
    ctx.translate(p.x, p.y)
    if (p.invulnerabilityRemaining > 0) {
      ctx.beginPath()
      ctx.arc(0, 0, 21, 0, Math.PI * 2)
      ctx.strokeStyle = '#82aaff'
      ctx.lineWidth = 1.7
      ctx.stroke()
      if (!reducedMotion && Math.floor(game.elapsed * 12) % 2) ctx.globalAlpha = 0.5
    }
    ctx.rotate(
      Math.atan2(
        dashing ? p.dashDirectionY : p.directionY,
        dashing ? p.dashDirectionX : p.directionX,
      ) +
        Math.PI / 2,
    )
    if (dashing) {
      ctx.beginPath()
      ctx.moveTo(-7, 8)
      ctx.lineTo(0, 65)
      ctx.lineTo(7, 8)
      ctx.fillStyle = '#82aaff55'
      ctx.fill()
    }
    if (dashing || input.x || input.y || input.pointer) {
      ctx.beginPath()
      ctx.moveTo(-4, 9)
      ctx.lineTo(0, 19)
      ctx.lineTo(4, 9)
      ctx.fillStyle = '#82aaff'
      ctx.fill()
    }
    ctx.beginPath()
    ctx.moveTo(0, -16)
    ctx.lineTo(12, 12)
    ctx.lineTo(0, 6)
    ctx.lineTo(-12, 12)
    ctx.closePath()
    ctx.fillStyle = '#d9eaff'
    ctx.fill()
    ctx.strokeStyle = '#82aaff'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
    if (input.pointer && game.mode === 'playing') {
      ctx.beginPath()
      ctx.arc(input.pointer.x, input.pointer.y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = '#82aaff66'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    if (game.hitFlash) {
      ctx.fillStyle = `rgba(255,113,133,${game.hitFlash * 0.3})`
      ctx.fillRect(0, 0, 900, 600)
    }
    ctx.restore()
  }
  return { resize, render }
}

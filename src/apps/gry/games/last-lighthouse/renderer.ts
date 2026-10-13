import { CONFIG, HEROES, WEAPONS } from './config'
import { areaScale, bladePositions } from './engine'
import { camera, clamp } from './space'
import type { EnemyKind, Game, HeroId, Input } from './model'
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw Error('Ta przeglądarka nie obsługuje Canvas 2D.')
  const c = ctx
  let width = 900,
    height = 600,
    dpr = 1
  const cache = new Map<string, HTMLCanvasElement>()
  function sprite(kind: EnemyKind | HeroId) {
    const old = cache.get(kind)
    if (old) return old
    const image = document.createElement('canvas')
    image.width = 128
    image.height = 128
    const s = image.getContext('2d')!
    s.translate(64, 64)
    const hero = kind === 'flame' || kind === 'storm' || kind === 'iron'
    const color = hero
      ? HEROES[kind].color
      : kind === 'boss'
        ? '#c88aab'
        : kind === 'elite'
          ? '#b789d0'
          : kind === 'runner'
            ? '#a8c6c0'
            : kind === 'heavy'
              ? '#688e94'
              : '#82a7a1'
    s.shadowColor = color
    s.shadowBlur = 10
    s.fillStyle = hero ? '#263c45' : '#20333d'
    s.strokeStyle = color
    s.lineWidth = 3
    s.beginPath()
    if (hero) {
      s.moveTo(0, -35)
      s.quadraticCurveTo(-28, -23, -27, 32)
      s.lineTo(0, 22)
      s.lineTo(27, 32)
      s.quadraticCurveTo(26, -22, 0, -35)
    } else if (kind === 'runner') {
      s.moveTo(0, -35)
      s.lineTo(31, 17)
      s.lineTo(9, 9)
      s.lineTo(0, 32)
      s.lineTo(-9, 9)
      s.lineTo(-31, 17)
    } else if (kind === 'heavy') {
      s.moveTo(-30, -27)
      s.lineTo(25, -32)
      s.lineTo(36, 13)
      s.lineTo(15, 31)
      s.lineTo(-29, 25)
    } else {
      s.moveTo(-30, 30)
      s.quadraticCurveTo(-42, -22, 0, -30)
      s.quadraticCurveTo(42, -22, 30, 30)
      s.lineTo(14, 22)
      s.lineTo(0, 35)
      s.lineTo(-14, 22)
    }
    s.closePath()
    s.fill()
    s.stroke()
    s.shadowBlur = 0
    if (hero) {
      s.fillStyle = color
      s.beginPath()
      s.arc(0, -11, 11, 0, Math.PI * 2)
      s.fill()
      s.fillStyle = '#172d38'
      s.fillRect(-6, -12, 12, 5)
      s.strokeStyle = color
      s.beginPath()
      s.moveTo(20, 0)
      s.lineTo(28, 30)
      s.stroke()
      s.fillStyle = '#ffe3ac'
      s.fillRect(22, 7, 13, 13)
    } else {
      s.fillStyle = '#e9eabf'
      s.fillRect(-17, -8, 9, 5)
      s.fillRect(8, -8, 9, 5)
      s.strokeStyle = color
      s.beginPath()
      s.moveTo(-15, 12)
      s.quadraticCurveTo(0, 22, 15, 12)
      s.stroke()
    }
    if (kind === 'boss' || kind === 'elite') {
      s.strokeStyle = color
      s.lineWidth = 6
      s.beginPath()
      s.moveTo(-25, -17)
      s.lineTo(-39, -40)
      s.lineTo(-17, -30)
      s.moveTo(25, -17)
      s.lineTo(39, -40)
      s.lineTo(17, -30)
      s.stroke()
    }
    cache.set(kind, image)
    return image
  }
  const resize = () => {
    const r = canvas.getBoundingClientRect()
    width = Math.max(1, r.width)
    height = Math.max(1, r.height)
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
  }
  const view = (g: Game) => camera(g.player, width, height)
  function render(g: Game, input: Input, reduced = false) {
    const cam = view(g),
      time = reduced ? 0 : g.elapsed
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.clearRect(0, 0, width, height)
    c.fillStyle = '#081923'
    c.fillRect(0, 0, width, height)
    c.save()
    c.scale(cam.scale, cam.scale)
    c.translate(-cam.x, -cam.y)
    c.fillStyle = '#203438'
    c.fillRect(0, 0, CONFIG.world, CONFIG.world)
    // Water, shore and details are decorative; the whole rectangular island is walkable.
    c.strokeStyle = '#3d5350'
    c.lineWidth = 30
    c.strokeRect(15, 15, CONFIG.world - 30, CONFIG.world - 30)
    const startX = Math.floor(cam.x / 100) * 100,
      startY = Math.floor(cam.y / 100) * 100
    for (let y = startY; y < cam.y + cam.height + 100; y += 100)
      for (let x = startX; x < cam.x + cam.width + 100; x += 100) {
        if (x < 25 || y < 25 || x > 2375 || y > 2375) continue
        const n = ((Math.imul(x + 41, 31) ^ Math.imul(y + 17, 73)) >>> 0) % 97
        c.fillStyle = n % 2 ? '#2b4141' : '#314446'
        c.beginPath()
        c.ellipse(x + (n % 40), y + (n % 31), 3 + (n % 5), 2 + (n % 3), 0.4, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = '#3b5050'
        c.lineWidth = 1
        c.beginPath()
        c.moveTo(x + 48, y + 37)
        c.lineTo(x + 52, y + 31)
        c.lineTo(x + 55, y + 37)
        c.stroke()
      }
    // Lighthouse glow and rotating beam establish a fixed point in the scrolling world.
    if (
      Math.abs(cam.x + cam.width / 2 - 1200) < cam.width + 400 &&
      Math.abs(cam.y + cam.height / 2 - 1200) < cam.height + 400
    ) {
      const glow = c.createRadialGradient(1200, 1180, 8, 1200, 1180, 330)
      glow.addColorStop(0, '#d6a85335')
      glow.addColorStop(1, '#d6a85300')
      c.fillStyle = glow
      c.fillRect(870, 850, 660, 660)
      c.save()
      c.translate(1200, 1180)
      c.rotate(time * 0.16)
      c.fillStyle = '#f9d7830b'
      c.beginPath()
      c.moveTo(0, 0)
      c.lineTo(600, -90)
      c.lineTo(600, 90)
      c.fill()
      c.restore()
      c.fillStyle = '#172d33'
      c.beginPath()
      c.ellipse(1200, 1220, 80, 29, 0, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = '#a9aba0'
      c.beginPath()
      c.moveTo(1180, 1220)
      c.lineTo(1187, 1130)
      c.lineTo(1213, 1130)
      c.lineTo(1220, 1220)
      c.closePath()
      c.fill()
      c.fillStyle = '#596f70'
      c.fillRect(1185, 1160, 30, 15)
      c.fillStyle = '#ffdf8b'
      c.fillRect(1184, 1116, 32, 19)
      c.fillStyle = '#354c51'
      c.fillRect(1178, 1134, 44, 6)
      c.beginPath()
      c.moveTo(1178, 1116)
      c.lineTo(1200, 1100)
      c.lineTo(1222, 1116)
      c.fill()
      c.fillStyle = '#20383c'
      c.fillRect(1193, 1198, 14, 22)
    }
    for (const gem of g.gems) {
      if (
        gem.x < cam.x - 10 ||
        gem.y < cam.y - 10 ||
        gem.x > cam.x + cam.width + 10 ||
        gem.y > cam.y + cam.height + 10
      )
        continue
      c.fillStyle = gem.value > 4 ? '#f9ce86' : '#a9e4c8'
      const r = gem.value > 4 ? 8 : 5
      c.beginPath()
      c.moveTo(gem.x, gem.y - r)
      c.lineTo(gem.x + r * 0.7, gem.y)
      c.lineTo(gem.x, gem.y + r)
      c.lineTo(gem.x - r * 0.7, gem.y)
      c.fill()
    }
    for (const e of g.enemies) {
      if (e.attack === 'charge-warning') {
        c.strokeStyle = '#f1a08c'
        c.lineWidth = e.radius * 2
        c.globalAlpha = 0.22
        c.beginPath()
        c.moveTo(e.x, e.y)
        c.lineTo(e.x + e.dx * 500, e.y + e.dy * 500)
        c.stroke()
        c.globalAlpha = 1
        c.strokeStyle = '#ffb6a4'
        c.lineWidth = 2
        c.setLineDash([10, 10])
        c.stroke()
        c.setLineDash([])
      }
      if (e.attack === 'ring-warning') {
        c.strokeStyle = '#e7b8e9'
        c.lineWidth = 3
        c.setLineDash([10, 8])
        c.beginPath()
        c.arc(e.x, e.y, 75 + (1.5 - e.timer) * 25, 0, Math.PI * 2)
        c.stroke()
        c.setLineDash([])
      }
      if (
        e.x < cam.x - 80 ||
        e.y < cam.y - 80 ||
        e.x > cam.x + cam.width + 80 ||
        e.y > cam.y + cam.height + 80
      )
        continue
      const size = e.radius * 3
      c.globalAlpha = e.flash > 0 ? 0.55 : 1
      c.drawImage(sprite(e.kind), e.x - size / 2, e.y - size / 2, size, size)
      c.globalAlpha = 1
      if (e.hp < e.maxHp) {
        c.fillStyle = '#0b1922'
        c.fillRect(e.x - e.radius, e.y - e.radius - 12, e.radius * 2, 3)
        c.fillStyle = e.kind === 'boss' ? '#eeb6cc' : '#9dc6bb'
        c.fillRect(
          e.x - e.radius,
          e.y - e.radius - 12,
          e.radius * 2 * clamp(e.hp / e.maxHp, 0, 1),
          3,
        )
      }
    }
    for (const ring of g.rings) {
      c.strokeStyle = '#e7b2d2'
      c.lineWidth = 8
      c.beginPath()
      c.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
      c.stroke()
    }
    if (g.weapons.frost) {
      c.strokeStyle = '#8cf4d62c'
      c.lineWidth = 2
      c.beginPath()
      c.arc(
        g.player.x,
        g.player.y,
        (g.evolved.includes('frost') ? 185 : 92) * areaScale(g),
        0,
        Math.PI * 2,
      )
      c.stroke()
    }
    for (const p of g.projectiles) {
      c.strokeStyle = '#f0985266'
      c.lineWidth = 8
      c.beginPath()
      c.moveTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025)
      c.lineTo(p.x, p.y)
      c.stroke()
      c.fillStyle = '#ffe2a6'
      c.beginPath()
      c.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      c.fill()
    }
    for (const effect of g.effects) {
      c.globalAlpha = effect.life / effect.maxLife
      c.strokeStyle = effect.color
      c.fillStyle = effect.color
      c.lineWidth = effect.kind === 'lightning' ? 3 : 2
      if (effect.kind === 'lightning') {
        c.beginPath()
        c.moveTo(effect.x, effect.y)
        c.lineTo((effect.x + effect.tx) / 2 + 9, (effect.y + effect.ty) / 2 - 8)
        c.lineTo(effect.tx, effect.ty)
        c.stroke()
      } else {
        c.beginPath()
        c.arc(
          effect.x,
          effect.y,
          effect.radius * (1 - (effect.life / effect.maxLife) * 0.5),
          0,
          Math.PI * 2,
        )
        c.stroke()
        if (!reduced) {
          c.globalAlpha *= 0.09
          c.fill()
        }
      }
    }
    c.globalAlpha = 1
    if (g.weapons.blades)
      for (const b of bladePositions(g)) {
        c.save()
        c.translate(b.x, b.y)
        c.rotate(time * 5)
        c.fillStyle = WEAPONS.blades.color
        c.beginPath()
        c.moveTo(0, -14)
        c.lineTo(6, 0)
        c.lineTo(0, 14)
        c.lineTo(-6, 0)
        c.fill()
        c.restore()
      }
    c.globalAlpha = g.player.invulnerable > 0 && !reduced ? 0.6 + Math.sin(time * 30) * 0.25 : 1
    // The painted silhouette (not the transparent sprite bounds) remains about 25 px
    // wide on a 360 px phone. Collision geometry stays independent of the artwork.
    c.drawImage(sprite(g.player.hero), g.player.x - 40, g.player.y - 40, 80, 80)
    c.globalAlpha = 1
    if (g.player.invulnerable > 0) {
      c.strokeStyle = '#ffce9680'
      c.lineWidth = 2
      c.beginPath()
      c.arc(g.player.x, g.player.y, 27, 0, Math.PI * 2)
      c.stroke()
    }
    // Offscreen boss pointer helps locate the final target on the large island.
    const boss = g.enemies.find((e) => e.kind === 'boss')
    if (
      boss &&
      (boss.x < cam.x ||
        boss.y < cam.y ||
        boss.x > cam.x + cam.width ||
        boss.y > cam.y + cam.height)
    ) {
      const x = clamp(boss.x, cam.x + 25, cam.x + cam.width - 25),
        y = clamp(boss.y, cam.y + 25, cam.y + cam.height - 25)
      c.save()
      c.translate(x, y)
      c.rotate(Math.atan2(boss.y - g.player.y, boss.x - g.player.x))
      c.fillStyle = '#efb7cd'
      c.beginPath()
      c.moveTo(13, 0)
      c.lineTo(-8, -9)
      c.lineTo(-8, 9)
      c.fill()
      c.restore()
    }
    c.restore()
    const vignette = c.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.28,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72,
    )
    vignette.addColorStop(0, '#07151f00')
    vignette.addColorStop(1, '#07151f88')
    c.fillStyle = vignette
    c.fillRect(0, 0, width, height)
    if (input.pointer) {
      const p = input.pointer
      c.fillStyle = '#d2e6dd15'
      c.strokeStyle = '#d2e6dd88'
      c.lineWidth = 2
      c.beginPath()
      c.arc(p.origin.x, p.origin.y, 42, 0, Math.PI * 2)
      c.fill()
      c.stroke()
      const dx = p.current.x - p.origin.x,
        dy = p.current.y - p.origin.y,
        d = Math.hypot(dx, dy) || 1
      c.fillStyle = '#e6e8cc99'
      c.beginPath()
      c.arc(
        p.origin.x + (dx / d) * Math.min(d, 42),
        p.origin.y + (dy / d) * Math.min(d, 42),
        15,
        0,
        Math.PI * 2,
      )
      c.fill()
    }
  }
  return { resize, view, render, dispose: () => cache.clear() }
}

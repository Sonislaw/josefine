import { RULES, stationColor, stationSymbol } from './config'
import { distance, pointSegment, screenPoint, worldPoint } from './geometry'
import { network, trainPoint } from './network'
import { hash } from './world'
import { validate } from './commands'
import type { Camera, Command, Game, Point, Selection } from './model'
export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw Error('Canvas 2D jest niedostępny.')
  const c = ctx,
    cache = new Map<string, HTMLCanvasElement>()
  let width = 800,
    height = 560,
    dpr = 1
  const resize = () => {
    const r = canvas.getBoundingClientRect()
    width = Math.max(1, r.width)
    height = Math.max(1, r.height)
    dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
  }
  const screen = (p: Point, cam: Camera) => screenPoint(p, cam, width, height)
  const world = (p: Point, cam: Camera) => worldPoint(p, cam, width, height)
  const visible = (p: Point, cam: Camera, margin = 60) => {
    const s = screen(p, cam)
    return s.x >= -margin && s.y >= -margin && s.x <= width + margin && s.y <= height + margin
  }
  function tile(g: Game, x: number, y: number) {
    const key = `${g.seed}:${x},${y}`,
      old = cache.get(key)
    if (old) return old
    const img = document.createElement('canvas')
    img.width = 640
    img.height = 640
    const t = img.getContext('2d')!
    t.fillStyle = '#112637'
    t.fillRect(0, 0, 640, 640)
    t.strokeStyle = '#243947'
    t.lineWidth = 16
    for (let j = 0; j <= 640; j += 128) {
      t.beginPath()
      t.moveTo(j, 0)
      t.lineTo(j, 640)
      t.moveTo(0, j)
      t.lineTo(640, j)
      t.stroke()
    }
    t.strokeStyle = '#54708035'
    t.lineWidth = 1
    t.setLineDash([6, 12])
    for (let j = 0; j <= 640; j += 128) {
      t.beginPath()
      t.moveTo(j, 0)
      t.lineTo(j, 640)
      t.moveTo(0, j)
      t.lineTo(640, j)
      t.stroke()
    }
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++) {
        const r = hash(g.seed, x * 20 + col, y * 20 + row),
          bx = col * 128 + 23,
          by = row * 128 + 24
        t.fillStyle = r > 0.75 ? '#203d40' : '#1b3244'
        t.fillRect(bx, by, 80, 74)
        t.fillStyle = '#365363'
        t.fillRect(bx, by, 80, 3)
        for (let wy = 0; wy < 3; wy++)
          for (let wx = 0; wx < 4; wx++) {
            t.fillStyle =
              hash(g.seed + wx + wy * 4, x * 50 + col, y * 50 + row) > 0.55
                ? '#a9864a55'
                : '#0b2030'
            t.fillRect(bx + 10 + wx * 17, by + 13 + wy * 18, 7, 8)
          }
      }
    if (cache.size >= 24) cache.delete(cache.keys().next().value!)
    cache.set(key, img)
    return img
  }
  function mini(g: Game) {
    const minX = Math.min(...g.districts.map((d) => d.x)),
      maxX = Math.max(...g.districts.map((d) => d.x)),
      minY = Math.min(...g.districts.map((d) => d.y)),
      maxY = Math.max(...g.districts.map((d) => d.y))
    const scale = Math.min(100 / ((maxX - minX + 1) * 640), 66 / ((maxY - minY + 1) * 640))
    return {
      x: width - 120,
      y: height - 90,
      w: 110,
      h: 80,
      scale,
      origin: { x: minX * 640 - 320, y: minY * 640 - 320 },
    }
  }
  function minimapPoint(g: Game, p: Point): Point | null {
    const m = mini(g)
    return p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h
      ? { x: (p.x - m.x - 5) / m.scale + m.origin.x, y: (p.y - m.y - 7) / m.scale + m.origin.y }
      : null
  }
  function hit(g: Game, p: Point, cam: Camera, building = false): Selection {
    const wp = world(p, cam)
    if (!building)
      for (const t of [...g.trains].reverse())
        if (distance(screen(trainPoint(g, t), cam), p) < 20) return { kind: 'train', id: t.id }
    const node = Object.values(g.nodes)
      .filter((n) => distance(screen(n, cam), p) < 24)
      .sort((a, b) => distance(a, wp) - distance(b, wp))[0]
    if (node) return { kind: 'node', id: node.id }
    const edge = Object.values(g.edges).find(
      (e) => pointSegment(wp, g.nodes[e.a]!, g.nodes[e.b]!) < 12 / cam.zoom,
    )
    return edge ? { kind: 'edge', id: edge.id } : null
  }
  function render(
    g: Game,
    cam: Camera,
    selection: Selection,
    pending: Command | null,
    reduced = false,
  ) {
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    c.fillStyle = '#0a1a29'
    c.fillRect(0, 0, width, height)
    c.save()
    c.translate(width / 2, height / 2)
    c.scale(cam.zoom, cam.zoom)
    c.translate(-cam.x, -cam.y)
    for (const d of g.districts) {
      const p = { x: d.x * 640, y: d.y * 640 }
      if (!visible(p, cam, 460 * cam.zoom)) continue
      if (cam.zoom >= 0.4) c.drawImage(tile(g, d.x, d.y), p.x - 320, p.y - 320)
      else {
        c.fillStyle = '#142c3d'
        c.fillRect(p.x - 320, p.y - 320, 640, 640)
      }
      c.strokeStyle = '#7890a82b'
      c.lineWidth = 1 / cam.zoom
      c.strokeRect(p.x - 320, p.y - 320, 640, 640)
      c.fillStyle = '#668399'
      c.font = `${12 / cam.zoom}px system-ui`
      c.fillText(`DZIELNICA ${d.x}, ${d.y}`, p.x - 295, p.y - 285)
    }
    for (const e of Object.values(g.edges)) {
      const a = g.nodes[e.a]!,
        b = g.nodes[e.b]!,
        sa = screen(a, cam),
        sb = screen(b, cam)
      if (
        Math.max(sa.x, sb.x) < -20 ||
        Math.min(sa.x, sb.x) > width + 20 ||
        Math.max(sa.y, sb.y) < -20 ||
        Math.min(sa.y, sb.y) > height + 20
      )
        continue
      c.strokeStyle = '#071622'
      c.lineWidth = 18
      c.beginPath()
      c.moveTo(a.x, a.y)
      c.lineTo(b.x, b.y)
      c.stroke()
      c.strokeStyle = selection?.kind === 'edge' && selection.id === e.id ? '#ffcd83' : '#617e90'
      c.lineWidth = 10
      c.setLineDash([3, 9])
      c.stroke()
      c.setLineDash([])
      c.strokeStyle = '#a2b7c7'
      c.lineWidth = 4
      c.stroke()
      c.strokeStyle = '#0c2233'
      c.lineWidth = 2
      c.stroke()
    }
    for (const n of Object.values(g.nodes)) {
      if (!visible(n, cam)) continue
      const scale = Math.max(1, 0.65 / cam.zoom),
        r = (n.kind === 'station' ? 21 : 12) * scale
      c.fillStyle = '#0a1b29'
      c.strokeStyle =
        selection?.kind === 'node' && selection.id === n.id
          ? '#ffffff'
          : n.kind === 'station'
            ? stationColor(n.id)
            : '#e9bf7c'
      c.lineWidth = 2 / cam.zoom
      c.beginPath()
      c.arc(n.x, n.y, r, 0, Math.PI * 2)
      c.fill()
      c.stroke()
      if (n.kind === 'junction') {
        const ports = network(g).neighbors.get(n.id)!
        for (const p of ports) {
          const other = g.nodes[p.node]!,
            len = distance(n, other)
          c.strokeStyle = n.pair.includes(p.node) ? '#ffd898' : '#685665'
          c.lineWidth = 4 * scale
          c.beginPath()
          c.moveTo(n.x, n.y)
          c.lineTo(n.x + ((other.x - n.x) / len) * r, n.y + ((other.y - n.y) / len) * r)
          c.stroke()
        }
      } else {
        c.fillStyle = stationColor(n.id)
        c.font = `${16 * scale}px system-ui`
        c.textAlign = 'center'
        c.fillText(stationSymbol(n.id), n.x, n.y + 5 * scale)
        c.font = `bold ${12 / cam.zoom}px system-ui`
        c.fillText(`${n.label}${n.id === g.depot ? ' · Z' : ''}`, n.x, n.y - r - 9 / cam.zoom)
        c.font = `${10 / cam.zoom}px system-ui`
        c.fillStyle = n.waiting.length > 18 ? '#ffad9a' : '#c4d7de'
        c.fillText(`${n.waiting.length}/24${n.hold ? ' · STOP' : ''}`, n.x, n.y + r + 14 / cam.zoom)
      }
      c.textAlign = 'left'
    }
    for (const t of g.trains) {
      const p = trainPoint(g, t)
      if (!visible(p, cam)) continue
      const a = g.nodes[t.from]!,
        b = g.nodes[t.to]!,
        angle = t.edge !== null ? Math.atan2(b.y - a.y, b.x - a.x) : 0,
        scale = Math.max(1, 0.9 / cam.zoom)
      c.save()
      c.translate(p.x, p.y)
      c.rotate(angle)
      c.scale(scale, scale)
      c.shadowColor = '#f6ce85'
      c.shadowBlur = reduced ? 0 : 7
      c.fillStyle = selection?.kind === 'train' && selection.id === t.id ? '#fff3cf' : '#efbc74'
      c.beginPath()
      c.roundRect(-16, -9, 32, 18, 5)
      c.fill()
      c.shadowBlur = 0
      c.fillStyle = '#274155'
      c.fillRect(5, -6, 6, 12)
      c.fillRect(-11, -5, 7, 10)
      c.fillStyle = '#fff5c3'
      c.fillRect(14, -6, 3, 4)
      c.fillRect(14, 2, 3, 4)
      c.restore()
      c.fillStyle = '#f7e6c8'
      c.textAlign = 'center'
      c.font = `bold ${10 / cam.zoom}px system-ui`
      c.fillText(`T${t.id} · ${t.onboard.length}/${g.capacity}`, p.x, p.y - 19 * scale)
      c.textAlign = 'left'
    }
    if (pending) {
      const valid = validate(g, pending).ok
      c.strokeStyle = valid ? '#9be3bf' : '#ff9d92'
      c.fillStyle = c.strokeStyle
      c.lineWidth = 3 / cam.zoom
      c.setLineDash([8 / cam.zoom, 5 / cam.zoom])
      if (pending.type === 'connect') {
        const a = g.nodes[pending.a],
          b = g.nodes[pending.b]
        if (a && b) {
          c.beginPath()
          c.moveTo(a.x, a.y)
          c.lineTo(b.x, b.y)
          c.stroke()
        }
      } else if (pending.type === 'node' || pending.type === 'split') {
        c.beginPath()
        c.arc(pending.point.x, pending.point.y, 15 / cam.zoom, 0, Math.PI * 2)
        c.stroke()
      }
      c.setLineDash([])
    }
    if (g.lastAccident && g.elapsed - g.lastAccident.at < 12) {
      const p = g.lastAccident
      c.strokeStyle = '#ff987f'
      c.lineWidth = 3 / cam.zoom
      c.beginPath()
      c.arc(p.x, p.y, 32, 0, Math.PI * 2)
      c.stroke()
    }
    c.restore()
    const m = mini(g)
    c.fillStyle = '#071624e8'
    c.strokeStyle = '#546b7e'
    c.lineWidth = 1
    c.beginPath()
    c.roundRect(m.x, m.y, m.w, m.h, 8)
    c.fill()
    c.stroke()
    for (const d of g.districts) {
      c.fillStyle = d === g.districts.at(-1) ? '#b89158' : '#395364'
      c.fillRect(
        m.x + 5 + (d.x * 640 - 320 - m.origin.x) * m.scale,
        m.y + 7 + (d.y * 640 - 320 - m.origin.y) * m.scale,
        Math.max(1, 640 * m.scale - 1),
        Math.max(1, 640 * m.scale - 1),
      )
    }
    c.save()
    c.beginPath()
    c.rect(m.x + 1, m.y + 1, m.w - 2, m.h - 2)
    c.clip()
    c.strokeStyle = '#fff1cb'
    c.strokeRect(
      m.x + 5 + (cam.x - width / 2 / cam.zoom - m.origin.x) * m.scale,
      m.y + 7 + (cam.y - height / 2 / cam.zoom - m.origin.y) * m.scale,
      (width / cam.zoom) * m.scale,
      (height / cam.zoom) * m.scale,
    )
    c.restore()
  }
  return {
    resize,
    render,
    screen,
    world,
    visible,
    hit,
    minimapPoint,
    get size() {
      return { width, height }
    },
    dispose() {
      cache.clear()
    },
  }
}

import { RULES } from './config'
import { clamp, distance } from './geometry'
import type { Camera, Point, Selection } from './model'
interface Hooks {
  camera: Camera
  hit: (p: Point) => Selection
  world: (p: Point) => Point
  building: () => boolean
  tap: (p: Point) => void
  connect: (a: number, b: number) => void
  pause: () => void
  home: () => void
  changed: () => void
}
export function bindInput(canvas: HTMLCanvasElement, h: Hooks) {
  const pointers = new Map<number, Point>()
  let start: Point | null = null,
    origin: Point | null = null,
    target: Selection = null,
    moved = false,
    multiple = false,
    build = false
  let pinch: { distance: number; zoom: number; anchor: Point } | null = null
  const point = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const clear = () => {
    const ids = [...pointers.keys()]
    pointers.clear()
    start = null
    pinch = null
    target = null
    multiple = false
    for (const id of ids) if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id)
  }
  function down(e: PointerEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    canvas.focus({ preventScroll: true })
    const p = point(e)
    pointers.set(e.pointerId, p)
    canvas.setPointerCapture(e.pointerId)
    if (pointers.size === 1) {
      start = p
      origin = { x: h.camera.x, y: h.camera.y }
      target = h.hit(p)
      moved = false
      multiple = false
      build = h.building()
    } else if (pointers.size === 2) {
      multiple = true
      const [a, b] = [...pointers.values()] as [Point, Point]
      pinch = {
        distance: Math.max(1, distance(a, b)),
        zoom: h.camera.zoom,
        anchor: h.world({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
      }
    }
  }
  function move(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    const p = point(e)
    pointers.set(e.pointerId, p)
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()] as [Point, Point],
        mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      h.camera.zoom = clamp(
        (pinch.zoom * distance(a, b)) / pinch.distance,
        RULES.minZoom,
        RULES.maxZoom,
      )
      const w = h.world(mid)
      h.camera.x += pinch.anchor.x - w.x
      h.camera.y += pinch.anchor.y - w.y
      h.changed()
      return
    }
    if (multiple || !start || !origin) return
    if (distance(start, p) > 8) moved = true
    if (moved && !(build && target?.kind === 'node')) {
      h.camera.x = origin.x - (p.x - start.x) / h.camera.zoom
      h.camera.y = origin.y - (p.y - start.y) / h.camera.zoom
      h.changed()
    }
  }
  function up(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    const p = point(e),
      cancelled = e.type !== 'pointerup'
    if (!cancelled && !multiple && start && build === h.building()) {
      if (!moved) h.tap(p)
      else if (build && target?.kind === 'node') {
        const end = h.hit(p)
        if (end?.kind === 'node' && end.id !== target.id) h.connect(target.id, end.id)
      }
    }
    pointers.delete(e.pointerId)
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    if (!pointers.size) clear()
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
      e.preventDefault()
      clear()
      h.pause()
      return
    }
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -50, y: 0 },
      ArrowRight: { x: 50, y: 0 },
      ArrowUp: { x: 0, y: -50 },
      ArrowDown: { x: 0, y: 50 },
    }
    const d = delta[e.key]
    if (d) {
      e.preventDefault()
      h.camera.x += d.x / h.camera.zoom
      h.camera.y += d.y / h.camera.zoom
      h.changed()
    }
    if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault()
      h.camera.zoom = clamp(
        h.camera.zoom * (e.key === '-' ? 1 / 1.2 : 1.2),
        RULES.minZoom,
        RULES.maxZoom,
      )
      h.changed()
    }
    if (e.key === 'Home') {
      e.preventDefault()
      h.home()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const r = canvas.getBoundingClientRect()
      h.tap({ x: r.width / 2, y: r.height / 2 })
    }
  }
  function wheel(e: WheelEvent) {
    if (!e.ctrlKey) return
    e.preventDefault()
    h.camera.zoom = clamp(h.camera.zoom * Math.exp(-e.deltaY * 0.002), RULES.minZoom, RULES.maxZoom)
    h.changed()
  }
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(event, up as EventListener)
  canvas.addEventListener('keydown', key)
  canvas.addEventListener('wheel', wheel, { passive: false })
  return {
    clear,
    dispose() {
      clear()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
        canvas.removeEventListener(event, up as EventListener)
      canvas.removeEventListener('keydown', key)
      canvas.removeEventListener('wheel', wheel)
    },
  }
}

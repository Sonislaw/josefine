import type { Point, Camera } from './model'
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export function projection(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x,
    dy = b.y - a.y
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1)
  return { x: a.x + dx * t, y: a.y + dy * t }
}
export const pointSegment = (p: Point, a: Point, b: Point) => distance(p, projection(p, a, b))
const cross = (a: Point, b: Point, c: Point) =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
export function intersects(a: Point, b: Point, c: Point, d: Point) {
  if (
    Math.max(a.x, b.x) < Math.min(c.x, d.x) - 1e-6 ||
    Math.max(c.x, d.x) < Math.min(a.x, b.x) - 1e-6 ||
    Math.max(a.y, b.y) < Math.min(c.y, d.y) - 1e-6 ||
    Math.max(c.y, d.y) < Math.min(a.y, b.y) - 1e-6
  )
    return false
  return cross(a, b, c) * cross(a, b, d) <= 1e-6 && cross(c, d, a) * cross(c, d, b) <= 1e-6
}
/** Closest separation over the entire fixed step, not only at its endpoint. */
export function swept(a0: Point, a1: Point, b0: Point, b1: Point) {
  const p = { x: a0.x - b0.x, y: a0.y - b0.y },
    v = { x: a1.x - a0.x - b1.x + b0.x, y: a1.y - a0.y - b1.y + b0.y }
  const t = clamp(-(p.x * v.x + p.y * v.y) / (v.x * v.x + v.y * v.y || 1), 0, 1)
  return {
    distance: Math.hypot(p.x + v.x * t, p.y + v.y * t),
    point: { x: a0.x + (a1.x - a0.x) * t, y: a0.y + (a1.y - a0.y) * t },
  }
}
export const screenPoint = (p: Point, camera: Camera, width: number, height: number) => ({
  x: (p.x - camera.x) * camera.zoom + width / 2,
  y: (p.y - camera.y) * camera.zoom + height / 2,
})
export const worldPoint = (p: Point, camera: Camera, width: number, height: number) => ({
  x: (p.x - width / 2) / camera.zoom + camera.x,
  y: (p.y - height / 2) / camera.zoom + camera.y,
})

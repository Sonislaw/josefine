import { CONFIG } from './config'
import type { Body, Point, View } from './model'
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
/** One camera mapping is shared by rendering, spawning and pointer conversion. */
export function camera(player: Point, width: number, height: number) {
  const span = width < 600 ? 420 : 900
  const scale = Math.max(width / span, height / 1100)
  const view = { width: width / scale, height: height / scale }
  return {
    ...view,
    scale,
    x: clamp(player.x - view.width / 2, 0, CONFIG.world - view.width),
    y: clamp(player.y - view.height / 2, 0, CONFIG.world - view.height),
  }
}
export function worldView(player: Point, view: View) {
  return {
    x: clamp(player.x - view.width / 2, 0, CONFIG.world - view.width),
    y: clamp(player.y - view.height / 2, 0, CONFIG.world - view.height),
    ...view,
  }
}
/** Spatial hash is rebuilt once per simulation step, not once per projectile. */
export class SpatialGrid<T extends Body> {
  private cells = new Map<string, T[]>()
  constructor(private size = 100) {}
  rebuild(items: T[]) {
    this.cells.clear()
    for (const item of items) {
      const k = `${Math.floor(item.x / this.size)},${Math.floor(item.y / this.size)}`
      const bucket = this.cells.get(k)
      if (bucket) bucket.push(item)
      else this.cells.set(k, [item])
    }
  }
  query(x: number, y: number, radius: number): T[] {
    const result: T[] = []
    for (
      let gy = Math.floor((y - radius) / this.size);
      gy <= Math.floor((y + radius) / this.size);
      gy++
    )
      for (
        let gx = Math.floor((x - radius) / this.size);
        gx <= Math.floor((x + radius) / this.size);
        gx++
      ) {
        const bucket = this.cells.get(`${gx},${gy}`)
        if (bucket) result.push(...bucket)
      }
    return result
  }
}
/** Swept segment avoids tunnelling at high projectile speed. */
export function segmentDistance(a: Point, b: Point, p: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy
  const t = length ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / length, 0, 1) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}

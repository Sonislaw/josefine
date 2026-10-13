import { clamp } from './config'
import type { Point } from './model'

/** Swept relative motion: minimum distance from origin to the relative segment.
 * Detects crossings even when neither final position overlaps. */
export function sweptContact(a0: Point, a1: Point, b0: Point, b1: Point, radius: number): boolean {
  const x = a0.x - b0.x,
    y = a0.y - b0.y
  const dx = a1.x - b1.x - x,
    dy = a1.y - b1.y - y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared ? clamp(-(x * dx + y * dy) / lengthSquared, 0, 1) : 0
  return (x + t * dx) ** 2 + (y + t * dy) ** 2 <= radius ** 2
}

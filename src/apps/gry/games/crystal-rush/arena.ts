import { CONFIG } from './config'

export interface Arena {
  readonly width: number
  readonly height: number
}

export const DESKTOP_ARENA: Arena = { width: CONFIG.width, height: CONFIG.height }
export const MOBILE_ARENA: Arena = { width: 450, height: 600 }

/** One uniform transform for drawing and pointer coordinates, including letterboxing.
 * The arena is selected at round start, never changed during resize/rotation.
 * Mobile uses a smaller world, not larger sprites with misleading hitboxes. */
export function arenaViewport(width: number, height: number, arena: Arena) {
  const scale = Math.min(width / arena.width, height / arena.height)
  return {
    scale,
    x: (width - arena.width * scale) / 2,
    y: (height - arena.height * scale) / 2,
  }
}

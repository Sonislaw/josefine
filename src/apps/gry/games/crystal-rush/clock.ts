import { CONFIG } from './config'
import type { Mode } from './model'

/** One clock per mounted game. Long frames explicitly pause, never silently cap births. */
export function createClock() {
  let previous: number | null = null,
    accumulator = 0
  return {
    reset() {
      previous = null
      accumulator = 0
    },
    tick(now: number, mode: () => Mode, step: (dt: number) => void, stalled: () => void) {
      if (mode() !== 'playing') {
        previous = null
        accumulator = 0
        return
      }
      if (previous === null) {
        previous = now
        return
      }
      const delta = (now - previous) / 1000
      previous = now
      if (delta > CONFIG.maxFrameGap || delta < 0) {
        accumulator = 0
        previous = null
        stalled()
        return
      }
      accumulator += delta
      while (accumulator + 1e-10 >= CONFIG.step && mode() === 'playing') {
        step(CONFIG.step)
        accumulator = Math.max(0, accumulator - CONFIG.step)
      }
      if (mode() !== 'playing') {
        accumulator = 0
        previous = null
      }
    },
  }
}

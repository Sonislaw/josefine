import { CONFIG } from './config'
import type { Mode } from './model'
export function createClock() {
  let previous: number | null = null,
    accumulator = 0
  const reset = () => {
    previous = null
    accumulator = 0
  }
  return {
    reset,
    tick(now: number, mode: () => Mode, step: () => void, stalled: () => void) {
      if (mode() !== 'playing') {
        reset()
        return
      }
      if (previous === null) {
        previous = now
        return
      }
      const elapsed = (now - previous) / 1000
      previous = now
      if (elapsed < 0 || elapsed > CONFIG.maxGap) {
        reset()
        stalled()
        return
      }
      accumulator += elapsed
      while (accumulator + 1e-10 >= CONFIG.step && mode() === 'playing') {
        step()
        accumulator = Math.max(0, accumulator - CONFIG.step)
      }
      if (mode() !== 'playing') reset()
    },
  }
}

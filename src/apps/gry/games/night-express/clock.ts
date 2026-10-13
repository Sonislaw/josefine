import { RULES } from './config'
export function createClock() {
  let previous: number | null = null,
    accumulated = 0
  const reset = () => {
    previous = null
    accumulated = 0
  }
  return {
    reset,
    tick(now: number, playing: () => boolean, step: () => void, stall: () => void) {
      if (!playing()) {
        reset()
        return
      }
      if (previous === null) {
        previous = now
        return
      }
      const dt = (now - previous) / 1000
      previous = now
      if (dt < 0 || dt > RULES.maxFrameGap) {
        reset()
        stall()
        return
      }
      accumulated += dt
      while (accumulated + 1e-10 >= RULES.step && playing()) {
        step()
        accumulated = Math.max(0, accumulated - RULES.step)
      }
      if (!playing()) reset()
    },
  }
}

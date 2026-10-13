import type { GameEvent } from './model'

export function createAudio() {
  let context: AudioContext | null = null,
    voices = 0
  return {
    unlock() {
      try {
        context ??= new AudioContext()
        void context.resume().catch(() => {})
      } catch {
        /* Optional audio. */
      }
    },
    play(event: GameEvent, combo: number) {
      if (!context || context.state !== 'running' || voices >= 6 || event === 'upgrade') return
      try {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          time = context.currentTime
        oscillator.frequency.value =
          event === 'gem'
            ? 620 + combo * 95
            : event === 'choice'
              ? 1000
              : event === 'dash'
                ? 280
                : event === 'destroy'
                  ? 150
                  : 85
        oscillator.type = event === 'destroy' ? 'triangle' : 'sine'
        const duration = event === 'gameover' ? 0.45 : 0.1
        gain.gain.setValueAtTime(0.035, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
        oscillator.connect(gain)
        gain.connect(context.destination)
        voices++
        oscillator.onended = () => {
          voices--
          oscillator.disconnect()
          gain.disconnect()
        }
        oscillator.start()
        oscillator.stop(time + duration)
      } catch {
        /* A failed effect must not affect gameplay. */
      }
    },
    close() {
      void context?.close().catch(() => {})
      context = null
    },
  }
}

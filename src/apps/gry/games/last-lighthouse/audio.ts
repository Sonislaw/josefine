import type { Event } from './model'
export function createAudio() {
  let context: AudioContext | null = null,
    voices = 0,
    last = 0
  return {
    play(event: Event) {
      try {
        context ??= new AudioContext()
        void context.resume().catch(() => {})
        if (voices >= 4 || context.currentTime - last < 0.07) return
        last = context.currentTime
        const osc = context.createOscillator(),
          gain = context.createGain()
        voices++
        osc.type = event === 'hurt' ? 'triangle' : 'sine'
        osc.frequency.value =
          event === 'hurt'
            ? 110
            : event === 'upgrade'
              ? 640
              : event === 'victory'
                ? 820
                : event === 'attack'
                  ? 240
                  : 420
        gain.gain.setValueAtTime(0.035, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.14)
        osc.connect(gain)
        gain.connect(context.destination)
        osc.start()
        osc.stop(context.currentTime + 0.15)
        osc.onended = () => {
          osc.disconnect()
          gain.disconnect()
          voices--
        }
      } catch {
        /* Sound is optional and never stops a run. */
      }
    },
    dispose() {
      if (context) void context.close().catch(() => {})
      context = null
    },
  }
}

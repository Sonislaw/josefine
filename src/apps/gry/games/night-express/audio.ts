export function createAudio() {
  let context: AudioContext | null = null,
    last = 0
  return {
    play(accident = false) {
      try {
        context ??= new AudioContext()
        void context.resume().catch(() => {})
        if (context.currentTime - last < 0.15) return
        last = context.currentTime
        const o = context.createOscillator(),
          gain = context.createGain()
        o.type = accident ? 'triangle' : 'sine'
        o.frequency.value = accident ? 130 : 520
        o.connect(gain)
        gain.connect(context.destination)
        gain.gain.setValueAtTime(0.035, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16)
        o.start()
        o.stop(context.currentTime + 0.18)
        o.onended = () => {
          o.disconnect()
          gain.disconnect()
        }
      } catch {
        /* Optional audio never stops simulation. */
      }
    },
    dispose() {
      if (context) void context.close().catch(() => {})
      context = null
    },
  }
}

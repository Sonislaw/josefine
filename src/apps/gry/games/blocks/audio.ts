/** Tiny, optional feedback. No assets, music loop or dependency on another game's audio. */
export function createBlockAudio() {
  let context: AudioContext | null = null
  let voices = 0
  return {
    unlock() {
      try {
        context ??= new AudioContext()
        void context.resume().catch(() => {})
      } catch {
        /* Optional. */
      }
    },
    play(clear: boolean, gameover: boolean) {
      if (!context || context.state !== 'running' || voices >= 3) return
      try {
        const tone = context.createOscillator(),
          gain = context.createGain(),
          now = context.currentTime
        const duration = gameover ? 0.25 : 0.12
        tone.frequency.setValueAtTime(gameover ? 180 : clear ? 740 : 420, now)
        gain.gain.setValueAtTime(0.035, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
        tone.connect(gain)
        gain.connect(context.destination)
        voices++
        tone.onended = () => {
          voices--
          tone.disconnect()
          gain.disconnect()
        }
        tone.start()
        tone.stop(now + duration)
      } catch {
        /* Feedback never blocks a move. */
      }
    },
    close() {
      void context?.close().catch(() => {})
      context = null
    },
  }
}

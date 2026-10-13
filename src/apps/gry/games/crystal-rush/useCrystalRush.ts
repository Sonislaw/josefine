import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { dashCooldown, magnetRadius, movementSpeed, xpRequired } from './config'
import { createGame, chooseUpgrade, stepGame } from './engine'
import { createClock } from './clock'
import { bindInput } from './input'
import { emptyInput } from './model'
import type { Upgrade } from './model'
import { createRenderer } from './renderer'
import { createAudio } from './audio'
import { loadPreferences, saveBest, SOUND_KEY } from './storage'

export function useCrystalRush() {
  const canvas = ref<HTMLCanvasElement>(),
    root = ref<HTMLElement>(),
    overlay = ref<HTMLElement>()
  let game = createGame(),
    binding: ReturnType<typeof bindInput> | null = null
  let renderer: ReturnType<typeof createRenderer> | null = null,
    observer: ResizeObserver | null = null
  let frame = 0,
    disposed = false,
    lastHud = 0,
    fps = 0,
    previousFrame = 0
  const clock = createClock(),
    audio = createAudio()
  const sound = ref(false),
    storageAvailable = ref(true),
    error = ref(''),
    announcement = ref('')
  const debug = ref(false)
  function snapshot() {
    const p = game.player
    return {
      mode: game.mode,
      score: game.score,
      best: game.bestScore,
      newRecord: game.newRecord,
      elapsed: game.elapsed,
      level: game.level,
      xp: game.xp,
      xpRequired: xpRequired(game.level),
      hp: p.hp,
      combo: game.combo,
      comboRemaining: game.comboRemaining,
      cooldown: p.dashCooldownRemaining,
      fullCooldown: dashCooldown(game.upgrades.energy),
      speed: movementSpeed(game.upgrades.speed),
      magnet: magnetRadius(game.upgrades.magnet),
      upgrades: { ...game.upgrades },
      meteors: game.meteors.length,
      births: game.totalMeteorsSpawned,
      fps,
    }
  }
  const hud = shallowRef(snapshot())
  function focusArena() {
    void nextTick(() => canvas.value?.focus({ preventScroll: true }))
  }
  function synchronize() {
    if (hud.value.mode !== game.mode) {
      binding?.clear()
      clock.reset()
    }
    if (game.events.includes('upgrade'))
      announcement.value = `Poziom ${game.level}. Wybierz ulepszenie.`
    if (game.events.includes('gameover')) {
      announcement.value = `Koniec rundy. Wynik: ${game.score} punktów.`
      if (game.newRecord) {
        try {
          const saved = saveBest(window.localStorage, game.bestScore)
          game.bestScore = saved.best
          storageAvailable.value = saved.available
        } catch {
          storageAvailable.value = false
        }
      }
    }
    if (sound.value) for (const event of game.events) audio.play(event, game.combo)
    game.events.length = 0
    hud.value = snapshot()
  }
  function pause(reason = '') {
    if (game.mode !== 'playing') return
    game.mode = 'paused'
    announcement.value = reason || 'Pauza.'
    synchronize()
  }
  function togglePause() {
    if (game.mode === 'playing') pause()
    else if (game.mode === 'paused') {
      game.mode = 'playing'
      synchronize()
      focusArena()
    }
  }
  function start() {
    if (error.value || !renderer) return
    if (sound.value) audio.unlock()
    game = createGame(game.bestScore, Math.random, 'playing')
    binding?.clear()
    clock.reset()
    announcement.value = 'Nowa runda. Powodzenia!'
    synchronize()
    focusArena()
  }
  function upgrade(value: Upgrade) {
    if (chooseUpgrade(game, value)) {
      synchronize()
      focusArena()
    }
  }
  function dash() {
    if (game.mode === 'playing' && binding) binding.input.dash = true
  }
  function toggleSound() {
    sound.value = !sound.value
    if (sound.value) audio.unlock()
    try {
      localStorage.setItem(SOUND_KEY, sound.value ? '1' : '0')
    } catch {
      storageAvailable.value = false
    }
    if (game.mode === 'playing') focusArena()
  }
  function lostFocus() {
    binding?.clear()
    pause('Gra wstrzymana po opuszczeniu areny. Wznów, gdy będziesz gotowy.')
  }
  function visibility() {
    if (document.hidden) lostFocus()
  }
  function animate(now: number) {
    if (disposed) return
    if (previousFrame) fps = Math.round(1000 / Math.max(1, now - previousFrame))
    previousFrame = now
    clock.tick(
      now,
      () => game.mode,
      (dt) => {
        stepGame(game, binding?.input ?? emptyInput(), dt)
        if (game.events.length || hud.value.mode !== game.mode) synchronize()
      },
      () =>
        pause('Gra wstrzymana z powodu dłuższej przerwy w animacji. Wznów, gdy będziesz gotowy.'),
    )
    renderer?.render(game, binding?.input ?? emptyInput())
    if (now - lastHud >= 80) {
      hud.value = snapshot()
      lastHud = now
    }
    frame = requestAnimationFrame(animate)
  }
  watch(
    () => hud.value.mode,
    async (mode) => {
      await nextTick()
      if (disposed) return
      if (mode === 'playing') focusArena()
      else
        overlay.value
          ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
          ?.focus({ preventScroll: true })
    },
  )
  onMounted(() => {
    try {
      const saved = loadPreferences(window.localStorage)
      game.bestScore = saved.best
      sound.value = saved.sound
      storageAvailable.value = saved.available
    } catch {
      storageAvailable.value = false
    }
    try {
      renderer = createRenderer(
        canvas.value!,
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      )
      renderer.resize()
      observer = new ResizeObserver(() => renderer?.resize())
      observer.observe(canvas.value!)
      binding = bindInput(canvas.value!, root.value!, () => game.mode, togglePause)
      window.addEventListener('blur', lostFocus)
      document.addEventListener('visibilitychange', visibility)
      synchronize()
      frame = requestAnimationFrame(animate)
      void nextTick(() =>
        overlay.value?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }),
      )
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Nie udało się uruchomić gry.'
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelAnimationFrame(frame)
    observer?.disconnect()
    binding?.destroy()
    audio.close()
    window.removeEventListener('blur', lostFocus)
    document.removeEventListener('visibilitychange', visibility)
  })
  // getGame is used by the isolated test harness, never exposed on window in the app.
  return {
    canvas,
    root,
    overlay,
    hud,
    sound,
    storageAvailable,
    error,
    announcement,
    debug,
    start,
    togglePause,
    upgrade,
    dash,
    toggleSound,
    getGame: () => game,
    synchronize,
    development: import.meta.env.DEV,
  }
}

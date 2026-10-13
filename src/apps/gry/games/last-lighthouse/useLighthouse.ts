import {
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  type InjectionKey,
} from 'vue'
import { CONFIG, HEROES, xpRequired } from './config'
import { createGame, createSimulation } from './engine'
import { createClock } from './clock'
import { createRenderer } from './renderer'
import { bindInput } from './input'
import { createAudio } from './audio'
import { chooseUpgrade } from './upgrades'
import { defaults, load, save } from './storage'
import { emptyInput, type Choice, type HeroId } from './model'
export const lighthouseRuntimeKey: InjectionKey<{
  createGame: typeof createGame
  random: () => number
}> = Symbol('lighthouse-runtime')
/** Dependencies are injectable only through imports in a test harness, never a production global. */
export function useLighthouse() {
  const runtime = inject(lighthouseRuntimeKey, { createGame, random: () => Math.random() })
  const canvas = ref<HTMLCanvasElement>(),
    frameRoot = ref<HTMLElement>(),
    overlay = ref<HTMLElement>()
  const ready = ref(false),
    error = ref(''),
    storageAvailable = ref(true),
    preferences = shallowRef(defaults()),
    selectedHero = ref<HeroId>('flame'),
    help = ref(false),
    equipment = ref(false),
    confirmRestart = ref(false),
    announcement = ref('')
  let game = runtime.createGame(),
    frame = 0,
    observer: ResizeObserver | null = null,
    binding: ReturnType<typeof bindInput> | null = null,
    renderer: ReturnType<typeof createRenderer> | null = null,
    disposed = false,
    lastHud = 0,
    finished = false
  let newUnlocks: HeroId[] = []
  const simulation = createSimulation(),
    clock = createClock(),
    audio = createAudio()
  const snapshot = () => ({
    mode: game.mode,
    elapsed: game.elapsed,
    hp: game.player.hp,
    maxHp: game.player.maxHp,
    hero: game.player.hero,
    level: game.level,
    xp: game.xp,
    required: xpRequired(game.level),
    kills: game.kills,
    weapons: { ...game.weapons },
    passives: { ...game.passives },
    evolved: [...game.evolved],
    choices: game.choices.map((c) => ({ ...c })),
    unlocked: [...newUnlocks],
    boss: game.enemies.find((e) => e.kind === 'boss')
      ? {
          hp: game.enemies.find((e) => e.kind === 'boss')!.hp,
          maxHp: game.enemies.find((e) => e.kind === 'boss')!.maxHp,
        }
      : null,
  })
  const hud = shallowRef(snapshot())
  function persist() {
    try {
      const result = save(window.localStorage, preferences.value)
      preferences.value = result.preferences
      storageAvailable.value = result.available
    } catch {
      storageAvailable.value = false
    }
  }
  function focusArena() {
    void nextTick(() => canvas.value?.focus({ preventScroll: true }))
  }
  function sync() {
    const changed = hud.value.mode !== game.mode
    if (changed) {
      binding?.clear()
      clock.reset()
    }
    for (const id of game.unlocked)
      if (!preferences.value.unlocked.includes(id)) {
        newUnlocks.push(id)
        preferences.value = { ...preferences.value, unlocked: [...preferences.value.unlocked, id] }
        persist()
        announcement.value = `Odblokowano: ${HEROES[id].name}.`
      }
    if ((game.mode === 'victory' || game.mode === 'gameover') && !finished) {
      finished = true
      preferences.value = {
        ...preferences.value,
        bestTime: Math.max(preferences.value.bestTime, game.elapsed),
        bestKills: Math.max(preferences.value.bestKills, game.kills),
        victories: preferences.value.victories + (game.mode === 'victory' ? 1 : 0),
      }
      persist()
      announcement.value =
        game.mode === 'victory' ? 'Światło przetrwało. Zwycięstwo!' : 'Wyprawa zakończona.'
    }
    if (preferences.value.sound) for (const event of game.events) audio.play(event)
    game.events.length = 0
    hud.value = snapshot()
    if (changed && game.mode !== 'playing')
      void nextTick(() =>
        overlay.value
          ?.querySelector<HTMLButtonElement>('button:not(:disabled)')
          ?.focus({ preventScroll: true }),
      )
  }
  function pause(reason = 'Pauza. Twoja wyprawa czeka.') {
    binding?.clear()
    if (game.mode === 'playing') {
      game.mode = 'paused'
      announcement.value = reason
      sync()
    }
  }
  function resume() {
    if (game.mode !== 'paused' || help.value || equipment.value || confirmRestart.value) return
    game.mode = 'playing'
    sync()
    focusArena()
  }
  function align() {
    void nextTick(() => {
      if (window.innerWidth < 950)
        frameRoot.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
  }
  function start() {
    if (!ready.value || !preferences.value.unlocked.includes(selectedHero.value)) return
    game = runtime.createGame(selectedHero.value, 'playing')
    newUnlocks = []
    finished = false
    confirmRestart.value = false
    binding?.clear()
    clock.reset()
    sync()
    focusArena()
    align()
  }
  function pick(choice: Choice) {
    if (chooseUpgrade(game, choice, runtime.random)) {
      sync()
      if (game.mode === 'playing') {
        focusArena()
        align()
      }
    }
  }
  function toggleSound() {
    preferences.value = { ...preferences.value, sound: !preferences.value.sound }
    if (preferences.value.sound) audio.play('upgrade')
    persist()
  }
  function openHelp() {
    pause()
    help.value = true
  }
  function openEquipment() {
    pause()
    equipment.value = true
  }
  function askRestart() {
    pause()
    confirmRestart.value = true
  }
  function toMenu() {
    binding?.clear()
    game = runtime.createGame(selectedHero.value)
    newUnlocks = []
    finished = false
    confirmRestart.value = false
    sync()
  }
  function hidden() {
    binding?.clear()
    pause('Gra wstrzymana po opuszczeniu okna. Wznów, kiedy będziesz gotowy.')
  }
  const visibility = () => {
    if (document.hidden) hidden()
  }
  let reduced: MediaQueryList | null = null
  onMounted(() => {
    try {
      const stored = load(window.localStorage)
      preferences.value = stored.preferences
      storageAvailable.value = stored.available
    } catch {
      storageAvailable.value = false
    }
    if (!canvas.value) return
    try {
      renderer = createRenderer(canvas.value)
      renderer.resize()
    } catch {
      error.value = 'Nie udało się uruchomić areny. Potrzebna jest przeglądarka z Canvas 2D.'
      return
    }
    binding = bindInput(
      canvas.value,
      () => game.mode,
      () => pause(),
    )
    observer = new ResizeObserver(() => {
      renderer?.resize()
      binding?.clear()
    })
    observer.observe(canvas.value)
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('blur', hidden)
    document.addEventListener('visibilitychange', visibility)
    ready.value = true
    function tick(now: number) {
      if (disposed) return
      if (renderer) {
        const view = renderer.view(game)
        game.lastView = { width: view.width, height: view.height }
      }
      clock.tick(
        now,
        () => game.mode,
        () => {
          simulation.step(game, binding?.input ?? emptyInput(), CONFIG.step, runtime.random)
          if (game.events.length || hud.value.mode !== game.mode) sync()
        },
        () => pause('Krótka przerwa techniczna — wznów grę.'),
      )
      if (now - lastHud > 100) {
        sync()
        lastHud = now
      }
      renderer?.render(game, binding?.input ?? emptyInput(), reduced?.matches ?? false)
      frame = requestAnimationFrame(tick)
    }
    sync()
    frame = requestAnimationFrame(tick)
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelAnimationFrame(frame)
    binding?.dispose()
    observer?.disconnect()
    renderer?.dispose()
    audio.dispose()
    window.removeEventListener('blur', hidden)
    document.removeEventListener('visibilitychange', visibility)
  })
  return {
    canvas,
    frameRoot,
    overlay,
    ready,
    error,
    storageAvailable,
    preferences,
    selectedHero,
    help,
    equipment,
    confirmRestart,
    announcement,
    hud,
    start,
    pause,
    resume,
    pick,
    toggleSound,
    openHelp,
    openEquipment,
    askRestart,
    toMenu,
  }
}

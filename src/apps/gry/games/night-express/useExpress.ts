import {
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  type InjectionKey,
} from 'vue'
import { RULES } from './config'
import { createGame, execute, validate, step, upgrades, warnings } from './engine'
import { network, trainPoint } from './network'
import { clamp, projection } from './geometry'
import { createClock } from './clock'
import { createRenderer } from './renderer'
import { bindInput } from './input'
import { load, persist } from './storage'
import { createAudio } from './audio'
import type { Command, Point, Selection, Upgrade } from './model'
/** Test fixtures are injectable only by imports in a separate, non-built harness. */
export const expressRuntimeKey: InjectionKey<{
  createGame: typeof createGame
  seed: () => number
}> = Symbol('express-runtime')
export function useExpress() {
  const runtime = inject(expressRuntimeKey, {
    createGame,
    seed: () => Math.floor(Math.random() * 2 ** 32),
  })
  let game = runtime.createGame(),
    renderer: ReturnType<typeof createRenderer> | null = null,
    binding: ReturnType<typeof bindInput> | null = null,
    observer: ResizeObserver | null = null,
    frame = 0,
    disposed = false,
    lastHud = 0,
    lastSave = 0,
    protectedSave = false
  const clock = createClock(),
    audio = createAudio()
  const canvas = ref<HTMLCanvasElement>(),
    arena = ref<HTMLElement>(),
    ready = ref(false),
    error = ref(''),
    message = ref('Połącz miasto. Zacznij od uruchomienia gotowej sieci.'),
    storageWarning = ref(''),
    corrupt = ref(false),
    help = ref(false),
    restart = ref(false),
    sound = ref(false),
    tutorial = ref(true),
    best = ref(0)
  const camera = reactive({ x: 0, y: 0, zoom: 1 }),
    building = ref(false),
    tool = ref<'connect' | 'node' | 'split' | 'remove'>('connect'),
    selection = shallowRef<Selection>(null),
    pending = shallowRef<Command | null>(null),
    from = ref<number | null>(null),
    target = ref<number | null>(null)
  function snapshot() {
    const selected = selection.value,
      n = selected?.kind === 'node' ? game.nodes[selected.id] : null,
      t = selected?.kind === 'train' ? game.trains.find((t) => t.id === selected.id) : null,
      e = selected?.kind === 'edge' ? game.edges[selected.id] : null
    const stations = network(game).stations
    return {
      mode: game.mode,
      elapsed: game.elapsed,
      score: game.score,
      lives: game.lives,
      accidents: game.accidents,
      rails: game.rails,
      capacity: game.capacity,
      delivered: game.delivered,
      lost: game.lost,
      districts: game.districts.length,
      trains: game.trains.map((t) => ({ id: t.id, onboard: t.onboard.length })),
      waiting: stations.reduce((a, id) => a + game.nodes[id]!.waiting.length, 0),
      choices: upgrades(game),
      nodes: Object.values(game.nodes)
        .filter((n) => renderer?.visible(n, camera) || n.id === from.value || n.id === target.value)
        .map((n) => ({ id: n.id, label: n.label, kind: n.kind })),
      node: n
        ? {
            ...n,
            waiting: n.waiting.map((p) => ({ ...p })),
            ports: network(game)
              .neighbors.get(n.id)!
              .map((p) => ({ ...p, label: game.nodes[p.node]!.label })),
            locked: !validate(game, { type: 'switch', node: n.id }).ok,
          }
        : null,
      train: t
        ? {
            id: t.id,
            node: t.node,
            onboard: t.onboard.map((p) => ({ ...p, label: game.nodes[p.destination]!.label })),
            point: { ...trainPoint(game, t) },
          }
        : null,
      edge: e ? { ...e, aLabel: game.nodes[e.a]!.label, bLabel: game.nodes[e.b]!.label } : null,
      verdict: pending.value ? validate(game, pending.value) : null,
      warnings: warnings(game).map((w) => ({ ...w, offscreen: !renderer?.visible(w, camera, 0) })),
      lastAccident: game.lastAccident ? { ...game.lastAccident } : null,
    }
  }
  const hud = shallowRef(snapshot())
  const sync = () => {
    best.value = Math.max(best.value, game.score)
    hud.value = snapshot()
  }
  function save() {
    if (!ready.value || protectedSave) return
    try {
      const result = persist(window.localStorage, {
        version: 1,
        game,
        best: best.value,
        sound: sound.value,
        tutorialDismissed: !tutorial.value,
      })
      best.value = result.best
      storageWarning.value = result.ok
        ? ''
        : 'Nie udało się zapisać sieci. Możesz grać dalej, ale postęp może nie przetrwać zamknięcia strony.'
    } catch {
      storageWarning.value =
        'Pamięć przeglądarki jest niedostępna. Ta sieć działa tylko do zamknięcia strony.'
    }
  }
  function pause(text = 'Ruch zatrzymany. Możesz spokojnie zaplanować następny krok.') {
    binding?.clear()
    clock.reset()
    if (game.mode === 'playing') game.mode = 'paused'
    message.value = text
    sync()
    save()
  }
  function resume() {
    if (
      !ready.value ||
      error.value ||
      corrupt.value ||
      help.value ||
      restart.value ||
      game.mode !== 'paused'
    )
      return
    building.value = false
    pending.value = null
    from.value = null
    game.mode = 'playing'
    clock.reset()
    binding?.clear()
    message.value = 'Ruch trwa. Dotknij rozjazdu, aby zmienić kierunek.'
    sync()
    save()
    void nextTick(() => canvas.value?.focus({ preventScroll: true }))
  }
  function focus(p: Point) {
    camera.x = p.x
    camera.y = p.y
    sync()
  }
  function home() {
    focus(game.nodes[game.depot]!)
  }
  function newest() {
    const d = game.districts.at(-1)!
    focus({ x: d.x * RULES.districtSize, y: d.y * RULES.districtSize })
  }
  function zoom(factor: number) {
    camera.zoom = clamp(camera.zoom * factor, RULES.minZoom, RULES.maxZoom)
    sync()
  }
  function setBuilding(value: boolean) {
    if (game.mode === 'upgrade' || game.mode === 'gameover' || corrupt.value) return
    pause()
    building.value = value
    pending.value = null
    from.value = null
    target.value = null
    message.value = value
      ? 'Budowa: wybierz narzędzie. Zmiany wymagają zatwierdzenia.'
      : 'Tryb ruchu. Wznów, kiedy sieć będzie gotowa.'
    sync()
  }
  function setTool(value: typeof tool.value) {
    tool.value = value
    pending.value = null
    from.value = null
    target.value = null
    sync()
  }
  function propose(c: Command) {
    pending.value = c
    const v = validate(game, c)
    message.value = v.message
    sync()
  }
  function connect(a: number, b: number) {
    if (!building.value || tool.value !== 'connect') return
    from.value = a
    target.value = b
    propose({ type: 'connect', a, b })
  }
  function command(c: Command) {
    const result = execute(game, c)
    message.value = result.ok ? 'Zmiana zapisana.' : result.message
    if (result.ok) {
      if (sound.value) audio.play()
      save()
    }
    sync()
    return result.ok
  }
  function commit() {
    if (!pending.value) return
    if (command(pending.value)) {
      pending.value = null
      from.value = null
      target.value = null
      sync()
    }
  }
  function select(s: Selection) {
    selection.value = s
    sync()
  }
  function tap(p: Point) {
    if (!renderer) return
    const mini = renderer.minimapPoint(game, p)
    if (mini) {
      focus(mini)
      return
    }
    const hit = renderer.hit(game, p, camera, building.value),
      world = renderer.world(p, camera)
    if (building.value) {
      if (tool.value === 'connect' && hit?.kind === 'node') {
        select(hit)
        if (from.value === null) {
          from.value = hit.id
          message.value = 'Wskaż drugi punkt lub wybierz go w panelu.'
        } else connect(from.value, hit.id)
      }
      if (tool.value === 'node')
        propose({
          type: 'node',
          point: { x: Math.round(world.x / 8) * 8, y: Math.round(world.y / 8) * 8 },
        })
      if (tool.value === 'split' && hit?.kind === 'edge') {
        const e = game.edges[hit.id]!
        propose({
          type: 'split',
          edge: e.id,
          point: projection(world, game.nodes[e.a]!, game.nodes[e.b]!),
        })
      }
      if (tool.value === 'remove' && hit?.kind === 'edge') {
        select(hit)
        propose({ type: 'remove', edge: hit.id })
      }
    } else {
      select(hit)
      if (
        hit?.kind === 'node' &&
        game.nodes[hit.id]!.kind === 'junction' &&
        network(game).neighbors.get(hit.id)!.length === 3
      )
        command({ type: 'switch', node: hit.id })
    }
    sync()
  }
  function choose(choice: Upgrade) {
    if (command({ type: 'upgrade', choice })) {
      message.value = 'Rozwój gotowy. Sprawdź sieć i wznów ruch.'
      sync()
    }
  }
  function toggleSound() {
    sound.value = !sound.value
    if (sound.value) audio.play()
    save()
  }
  function openHelp() {
    pause()
    help.value = true
  }
  function askRestart() {
    pause()
    restart.value = true
  }
  function newGame() {
    game = runtime.createGame(runtime.seed())
    lastSave = 0
    protectedSave = false
    corrupt.value = false
    restart.value = false
    building.value = false
    pending.value = null
    selection.value = null
    from.value = null
    target.value = null
    tutorial.value = true
    clock.reset()
    binding?.clear()
    camera.x = 0
    camera.y = 0
    if (renderer) camera.zoom = Math.min(renderer.size.width / 560, 1)
    message.value = 'Nowa noc, nowa sieć. Masz trzy szanse.'
    sync()
    save()
  }
  function dismissTutorial() {
    tutorial.value = false
    save()
  }
  const blur = () => pause('Gra zatrzymana po opuszczeniu okna. Wznów ją, kiedy będziesz gotowy.')
  const visibility = () => {
    if (document.hidden) blur()
  }
  onMounted(() => {
    try {
      const result = load(window.localStorage)
      if (result.status === 'ok' && result.save) {
        game = result.save.game
        best.value = result.save.best
        sound.value = result.save.sound
        tutorial.value = !result.save.tutorialDismissed
        message.value = 'Twoja sieć czeka. Czas nie płynął podczas nieobecności.'
      } else if (result.status === 'corrupt') {
        protectedSave = true
        corrupt.value = true
        storageWarning.value =
          'Zapis jest uszkodzony lub niezgodny. Nie nadpisaliśmy go. Potwierdź nową grę, aby zacząć od początku.'
      } else if (result.status === 'unavailable')
        storageWarning.value =
          'Pamięć przeglądarki jest niedostępna. Postęp może nie zostać zapisany.'
    } catch {
      storageWarning.value = 'Nie mamy dostępu do pamięci przeglądarki.'
    }
    if (!canvas.value) return
    try {
      renderer = createRenderer(canvas.value)
      renderer.resize()
    } catch {
      error.value = 'Nie udało się uruchomić mapy. Potrzebna jest obsługa Canvas 2D.'
      return
    }
    camera.zoom = Math.min(renderer.size.width / 560, 1)
    binding = bindInput(canvas.value, {
      camera,
      hit: (p) => renderer!.hit(game, p, camera, building.value),
      world: (p) => renderer!.world(p, camera),
      building: () => building.value && tool.value === 'connect',
      tap,
      connect,
      pause,
      home,
      changed: sync,
    })
    observer = new ResizeObserver(() => {
      renderer?.resize()
      binding?.clear()
      sync()
    })
    observer.observe(canvas.value)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', visibility)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    ready.value = true
    sync()
    function tick(now: number) {
      if (disposed) return
      clock.tick(
        now,
        () => game.mode === 'playing',
        () => {
          const mode = game.mode,
            districts = game.districts.length
          step(game)
          if (mode !== game.mode || districts !== game.districts.length) {
            binding?.clear()
            if (game.mode === 'upgrade')
              message.value = 'Wybierz rozwój sieci. Czas jest zatrzymany.'
            else if (game.mode === 'gameover')
              message.value = 'Trzecia kolizja. Ta noc dobiegła końca.'
            else if (game.mode === 'paused') {
              message.value = 'Kolizja! Pociągi wróciły do zajezdni. Popraw sieć przed wznowieniem.'
              if (sound.value) audio.play(true)
            } else
              message.value =
                'Nowa dzielnica! Masz dodatkowe tory i minutę na podłączenie nowych stacji.'
            sync()
            save()
          }
        },
        () => pause('Przerwa techniczna — wznów ruch, gdy przeglądarka będzie gotowa.'),
      )
      if (now - lastHud >= 150) {
        sync()
        lastHud = now
      }
      if (game.elapsed - lastSave >= RULES.saveEvery) {
        save()
        lastSave = game.elapsed
      }
      renderer?.render(game, camera, selection.value, pending.value, reduced.matches)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  })
  onBeforeUnmount(() => {
    disposed = true
    if (game.mode === 'playing') game.mode = 'paused'
    save()
    cancelAnimationFrame(frame)
    binding?.dispose()
    observer?.disconnect()
    renderer?.dispose()
    audio.dispose()
    window.removeEventListener('blur', blur)
    document.removeEventListener('visibilitychange', visibility)
  })
  return {
    canvas,
    arena,
    ready,
    error,
    message,
    storageWarning,
    corrupt,
    help,
    restart,
    sound,
    tutorial,
    best,
    camera,
    building,
    tool,
    selection,
    pending,
    from,
    target,
    hud,
    sync,
    pause,
    resume,
    focus,
    home,
    newest,
    zoom,
    setBuilding,
    setTool,
    propose,
    connect,
    command,
    commit,
    select,
    choose,
    toggleSound,
    openHelp,
    askRestart,
    newGame,
    dismissTutorial,
  }
}

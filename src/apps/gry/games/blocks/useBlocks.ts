import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { fits, newRound, place, placement, shapeById, shapeSize, SIZE } from './engine'
import { load, save } from './storage'
import { createBlockAudio } from './audio'

export function useBlocks() {
  // Deterministic SSR shell; random deals and storage are client-only.
  const round = shallowRef(newRound(() => 0)),
    started = ref(false),
    ready = ref(false)
  const board = ref<HTMLElement>(),
    root = ref<HTMLElement>()
  const best = ref(0),
    sound = ref(false),
    storageAvailable = ref(true),
    restored = ref(false)
  const selected = ref<number | null>(null),
    cursor = ref(0)
  const target = ref<{ row: number; col: number } | null>(null)
  const ghost = ref<{ x: number; y: number; unit: number } | null>(null)
  const help = ref(false),
    restart = ref(false),
    announcement = ref(''),
    feedback = ref('Wybierz kształt. Znajdź mu miejsce.')
  const cleared = shallowRef<number[]>([])
  let animation: ReturnType<typeof setTimeout> | undefined
  let pointer: {
    id: number
    x: number
    y: number
    touch: boolean
    dragging: boolean
    element: HTMLElement
  } | null = null
  let suppressClick = false
  const audio = createBlockAudio()
  const blocked = computed(
    () =>
      !ready.value ||
      !started.value ||
      round.value.status === 'gameover' ||
      cleared.value.length > 0 ||
      help.value ||
      restart.value,
  )
  const chosen = computed(() =>
    selected.value === null ? undefined : shapeById(round.value.tray[selected.value]),
  )
  const tray = computed(() => round.value.tray.map((id) => shapeById(id)))
  const possible = computed(() =>
    tray.value.map((shape) => !!shape && fits(round.value.board, shape)),
  )
  const preview = computed(() =>
    chosen.value && target.value
      ? chosen.value.cells
          .map(([x, y]) => ({ row: target.value!.row + y, col: target.value!.col + x }))
          .filter((p) => p.row >= 0 && p.row < SIZE && p.col >= 0 && p.col < SIZE)
          .map((p) => p.row * SIZE + p.col)
      : [],
  )
  const valid = computed(
    () =>
      !!chosen.value &&
      !!target.value &&
      !!placement(round.value.board, chosen.value, target.value.row, target.value.col),
  )
  function persist() {
    try {
      const result = save(window.localStorage, {
        version: 1,
        round: started.value ? round.value : null,
        best: best.value,
        sound: sound.value,
      })
      best.value = result.best
      storageAvailable.value = result.available
    } catch {
      storageAvailable.value = false
    }
  }
  function say(text: string) {
    feedback.value = text
    announcement.value = text
  }
  function focusCell() {
    void nextTick(() =>
      board.value
        ?.querySelector<HTMLButtonElement>(`[data-cell="${cursor.value}"]`)
        ?.focus({ preventScroll: true }),
    )
  }
  function cancelPointer() {
    const old = pointer
    pointer = null
    ghost.value = null
    target.value = null
    if (old?.element.hasPointerCapture(old.id)) old.element.releasePointerCapture(old.id)
  }
  function start() {
    cancelPointer()
    clearTimeout(animation)
    cleared.value = []
    round.value = newRound()
    started.value = true
    restored.value = false
    selected.value = null
    restart.value = false
    cursor.value = 0
    if (sound.value) audio.unlock()
    say('Nowa plansza. Wybierz jeden z trzech kształtów.')
    persist()
    void nextTick(() =>
      root.value
        ?.querySelector<HTMLButtonElement>('[data-slot="0"]')
        ?.focus({ preventScroll: true }),
    )
    void nextTick(() => {
      const trayBottom = root.value?.querySelector('.blocks-tray')?.getBoundingClientRect().bottom
      if (
        window.matchMedia('(max-width: 600px)').matches ||
        (trayBottom && trayBottom > window.innerHeight)
      )
        root.value
          ?.querySelector('.blocks-play')
          ?.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
  }
  function requestRestart() {
    cancelPointer()
    if (started.value && round.value.status === 'playing' && round.value.moves) restart.value = true
    else start()
  }
  function select(slot: number, keyboard = false) {
    if (blocked.value || !tray.value[slot]) return
    selected.value = slot
    target.value = null
    const shape = tray.value[slot]!
    say(
      possible.value[slot]
        ? `${shape.name}. Wskaż lewy górny róg podglądu na planszy.`
        : `${shape.name} nie mieści się teraz. Użyj innego kształtu, aby zrobić miejsce.`,
    )
    if (keyboard) {
      target.value = { row: Math.floor(cursor.value / SIZE), col: cursor.value % SIZE }
      focusCell()
    }
  }
  function slotClick(slot: number, event: MouseEvent) {
    if (suppressClick && event.detail > 0) {
      suppressClick = false
      return
    }
    select(slot, event.detail === 0)
  }
  function commit(row: number, col: number) {
    if (blocked.value || selected.value === null) return
    if (sound.value) audio.unlock()
    const result = place(round.value, selected.value, row, col)
    if (!result) {
      say('Tu kształt się nie mieści. Wybierz wolne miejsce.')
      return
    }
    round.value = result.state
    best.value = Math.max(best.value, result.state.score)
    selected.value = null
    target.value = null
    ghost.value = null
    restored.value = false
    say(
      result.state.status === 'gameover'
        ? `Koniec rundy. ${result.state.score} punktów. Nie ma miejsca na żaden z pozostałych kształtów.`
        : result.lines
          ? `+${result.points} pkt · Linie: ${result.lines} · Seria ×${result.state.streak}`
          : `+${result.points} pkt${result.refilled ? ' · Nowa paczka kształtów!' : ' · Dobry ruch.'}`,
    )
    persist()
    if (sound.value) audio.play(result.lines > 0, result.state.status === 'gameover')
    cleared.value = result.cleared
    if (result.cleared.length)
      animation = setTimeout(() => {
        cleared.value = []
      }, 220)
    if (result.state.status === 'gameover')
      void nextTick(() =>
        root.value
          ?.querySelector<HTMLButtonElement>('.blocks-again')
          ?.focus({ preventScroll: true }),
      )
  }
  function cellClick(index: number) {
    cursor.value = index
    if (selected.value === null && !blocked.value) {
      say('Najpierw wybierz kształt pod planszą.')
      return
    }
    commit(Math.floor(index / SIZE), index % SIZE)
  }
  function hoverCell(index: number) {
    if (blocked.value || !chosen.value || pointer?.dragging) return
    target.value = { row: Math.floor(index / SIZE), col: index % SIZE }
  }
  function boardKey(event: KeyboardEvent) {
    if (blocked.value) return
    const delta: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -SIZE,
      ArrowDown: SIZE,
    }
    if (event.key === 'Escape') {
      selected.value = null
      target.value = null
      cancelPointer()
      return
    }
    if (!(event.key in delta)) return
    event.preventDefault()
    const row = Math.floor(cursor.value / SIZE),
      col = cursor.value % SIZE
    if (
      (event.key === 'ArrowLeft' && col === 0) ||
      (event.key === 'ArrowRight' && col === 7) ||
      (event.key === 'ArrowUp' && row === 0) ||
      (event.key === 'ArrowDown' && row === 7)
    )
      return
    cursor.value += delta[event.key]!
    hoverCell(cursor.value)
    focusCell()
  }
  function cellFocus(index: number) {
    cursor.value = index
    hoverCell(index)
  }
  function pointerDown(slot: number, event: PointerEvent) {
    if (blocked.value || pointer || event.button !== 0 || !tray.value[slot]) return
    suppressClick = false
    selected.value = slot
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      touch: event.pointerType === 'touch',
      dragging: false,
      element: event.currentTarget as HTMLElement,
    }
    pointer.element.setPointerCapture(event.pointerId)
  }
  function pointerMove(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId || !chosen.value || !board.value) return
    if (!pointer.dragging && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 8)
      return
    pointer.dragging = true
    const rect = board.value.getBoundingClientRect(),
      gap = 4,
      unit = (rect.width + gap) / SIZE
    const size = shapeSize(chosen.value),
      lift = pointer.touch ? 68 : 18
    const x = event.clientX - (size.width * unit) / 2,
      y = event.clientY - lift - size.height * unit
    ghost.value = { x, y, unit }
    target.value = {
      row: Math.round((y - rect.top) / unit),
      col: Math.round((x - rect.left) / unit),
    }
  }
  function pointerUp(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return
    const destination = target.value,
      dragged = pointer.dragging
    cancelPointer()
    suppressClick = dragged
    if (dragged && destination) commit(destination.row, destination.col)
  }
  function pointerCancel(event: PointerEvent) {
    if (pointer?.id === event.pointerId) cancelPointer()
  }
  function toggleSound() {
    sound.value = !sound.value
    if (sound.value) audio.unlock()
    persist()
  }
  function openHelp() {
    cancelPointer()
    help.value = true
  }
  function hidden() {
    if (document.hidden) cancelPointer()
  }
  onMounted(() => {
    try {
      const saved = load(window.localStorage)
      best.value = saved.best
      sound.value = saved.sound
      storageAvailable.value = saved.available
      if (saved.round) {
        round.value = saved.round
        started.value = true
        restored.value = true
        say('Zapisana runda czeka. Grasz dalej!')
      }
    } catch {
      storageAvailable.value = false
    }
    ready.value = true
    window.addEventListener('blur', cancelPointer)
    document.addEventListener('visibilitychange', hidden)
  })
  onBeforeUnmount(() => {
    cancelPointer()
    clearTimeout(animation)
    audio.close()
    window.removeEventListener('blur', cancelPointer)
    document.removeEventListener('visibilitychange', hidden)
  })
  // No global state, RAF or game API on window. Each mounted game owns its lifecycle.
  return {
    root,
    board,
    round,
    ready,
    started,
    best,
    sound,
    storageAvailable,
    restored,
    selected,
    cursor,
    target,
    ghost,
    help,
    restart,
    announcement,
    feedback,
    cleared,
    blocked,
    chosen,
    tray,
    possible,
    preview,
    valid,
    start,
    requestRestart,
    slotClick,
    cellClick,
    hoverCell,
    boardKey,
    cellFocus,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerCancel,
    toggleSound,
    openHelp,
  }
}

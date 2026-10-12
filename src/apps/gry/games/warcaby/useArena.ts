import { computed, onBeforeUnmount, onMounted, ref, shallowRef, toRaw } from 'vue'
import ComputerWorker from './ai.worker?worker&inline'
import { coordinate, createInitialState, getLegalMoves } from './engine'
import type { CompleteTurn, Mode, Move } from './engine'
import { createSession, playMove, safeXp } from './session'
import { powerInfo } from './powers'

/** Browser orchestration is game-specific; rules and rewards remain independently testable. */
export function useArena() {
  // Stable server/client seed avoids hydration differences; actual random game starts on mount.
  const session = shallowRef(
    createSession(
      'arena',
      0,
      createInitialState('arena', () => 0.5),
    ),
  )
  const selected = ref<number | null>(null)
  const powerMode = ref(false)
  const opponent = ref<'computer' | 'local'>('computer')
  const difficulty = ref(2)
  const thinking = ref(false)
  const sound = ref(false)
  const showHelp = ref(false)
  const showOutcome = ref(false)
  const restartMode = ref<Mode | null>(null)
  const ready = ref(false)
  const aiError = ref('')
  let generation = 0
  let worker: Worker | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let audio: AudioContext | null = null
  const state = computed(() => session.value.state)
  const moves = computed(() => getLegalMoves(state.value))
  const mandatory = computed(() => moves.value.some((m) => m.captureIndex !== undefined))
  const locked = computed(
    () =>
      !ready.value ||
      !!session.value.outcome ||
      thinking.value ||
      (opponent.value === 'computer' && state.value.side === 1),
  )
  const piece = computed(() => (selected.value === null ? null : state.value.board[selected.value]))
  const skillMoves = computed(() =>
    moves.value.filter((m) => m.from === selected.value && !!m.skill),
  )
  const targets = computed(() =>
    locked.value
      ? []
      : moves.value.filter((m) => m.from === selected.value && !!m.skill === powerMode.value),
  )
  const lastMove = computed(() => session.value.history[0]?.move)
  const level = computed(() => Math.floor(session.value.xp / 100) + 1)
  const rank = computed(() =>
    level.value < 4 ? 'Rekrut' : level.value < 10 ? 'Taktyk' : 'Strateg',
  )
  const status = computed(() =>
    session.value.outcome
      ? 'Partia zakończona. Zagraj jeszcze raz!'
      : aiError.value ||
        (thinking.value
          ? 'Komputer analizuje pozycję…'
          : state.value.forcedPiece !== null
            ? 'Kontynuuj bicie tym samym pionkiem.'
            : mandatory.value
              ? 'Bicie obowiązkowe — wybierz pionek, który może bić.'
              : powerMode.value
                ? 'Moc gotowa. Wybierz złote pole docelowe.'
                : state.value.side === 1
                  ? 'Ruch ciemnej drużyny. Wybierz pionek.'
                  : 'Wybierz pionek, żeby zobaczyć możliwe ruchy.'),
  )

  function persistXp() {
    try {
      localStorage.setItem('arena-xp', String(session.value.xp))
    } catch {
      /* Private mode/storage quota: game remains playable. */
    }
  }
  function unlockAudio() {
    if (!sound.value) return
    try {
      audio ??= new AudioContext()
      void audio.resume().catch(() => {})
    } catch {
      /* Optional audio. */
    }
  }
  function tone(move: Move) {
    if (!sound.value || !audio || audio.state !== 'running') return
    try {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.frequency.value = move.skill ? 620 : move.captureIndex !== undefined ? 220 : 380
      gain.gain.setValueAtTime(0.035, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start()
      oscillator.stop(audio.currentTime + 0.15)
    } catch {
      /* Sound never blocks a move. */
    }
  }
  function cancelComputer() {
    generation++
    clearTimeout(timer)
    worker?.terminate()
    worker = null
    thinking.value = false
    aiError.value = ''
  }
  function commit(move: Move) {
    const previousXp = session.value.xp
    session.value = playMove(session.value, move)
    if (session.value.xp !== previousXp) persistXp()
    tone(move)
    selected.value = state.value.forcedPiece
    powerMode.value = false
    if (session.value.outcome) showOutcome.value = true
  }
  function startComputer() {
    cancelComputer()
    if (
      !ready.value ||
      session.value.outcome ||
      opponent.value !== 'computer' ||
      state.value.side !== 1
    )
      return
    thinking.value = true
    selected.value = state.value.forcedPiece
    powerMode.value = false
    const token = generation
    timer = setTimeout(() => {
      if (token !== generation) return
      try {
        worker = new ComputerWorker()
        const fail = () => {
          if (token !== generation) return
          worker?.terminate()
          worker = null
          thinking.value = false
          aiError.value =
            'Nie udało się uruchomić komputera. Spróbuj ponownie lub wybierz grę we dwoje.'
        }
        worker.onerror = fail
        worker.onmessage = (event: MessageEvent<CompleteTurn | null>) => {
          if (token !== generation) return
          worker?.terminate()
          worker = null
          const sequence = event.data?.sequence
          if (!sequence?.length) {
            fail()
            return
          }
          let n = 0
          const step = () => {
            if (token !== generation) return
            const move = sequence[n++]
            if (!move) {
              thinking.value = false
              return
            }
            try {
              commit(move)
            } catch {
              fail()
              return
            }
            if (n < sequence.length && !session.value.outcome) timer = setTimeout(step, 320)
            else thinking.value = false
          }
          step()
        }
        worker.postMessage({ state: toRaw(state.value), depth: difficulty.value })
      } catch {
        thinking.value = false
        aiError.value =
          'Komputer jest niedostępny w tej przeglądarce. Wybierz grę we dwoje lub spróbuj ponownie.'
      }
    }, 360)
  }
  function clickSquare(i: number) {
    unlockAudio()
    if (locked.value) return
    const target = targets.value.find((m) => m.to === i)
    if (target) {
      commit(target)
      startComputer()
      return
    }
    if (state.value.forcedPiece !== null) {
      selected.value = state.value.forcedPiece
      return
    }
    selected.value = state.value.board[i] ? i : null
    powerMode.value = false
  }
  function togglePower() {
    if (locked.value || !skillMoves.value.length) return
    powerMode.value = !powerMode.value
  }
  function reset(mode: Mode) {
    cancelComputer()
    session.value = createSession(mode, session.value.xp)
    selected.value = null
    powerMode.value = false
    showOutcome.value = false
    restartMode.value = null
  }
  function requestRestart(mode = state.value.mode) {
    if (session.value.history.length && !session.value.outcome) restartMode.value = mode
    else reset(mode)
  }
  function changeOpponent(value: 'computer' | 'local') {
    opponent.value = value
    startComputer()
  }
  function squareLabel(i: number) {
    const p = state.value.board[i]
    return `${coordinate(i)}${p ? `, ${p.side === 0 ? 'jasny' : 'ciemny'} ${p.king ? 'król' : 'pionek'}${p.power ? `, moc ${powerInfo[p.power].name}${p.used ? ' zużyta' : ' dostępna'}` : ''}` : ', puste pole'}${targets.value.some((m) => m.to === i) ? ', możliwy ruch' : ''}`
  }
  onMounted(() => {
    let xp = 0
    try {
      xp = safeXp(localStorage.getItem('arena-xp'))
    } catch {
      /* Storage is optional. */
    }
    session.value = createSession('arena', xp)
    ready.value = true
  })
  onBeforeUnmount(() => {
    cancelComputer()
    void audio?.close().catch(() => {})
  })
  return {
    session,
    state,
    selected,
    powerMode,
    opponent,
    difficulty,
    thinking,
    sound,
    showHelp,
    showOutcome,
    restartMode,
    piece,
    mandatory,
    skillMoves,
    targets,
    lastMove,
    level,
    rank,
    status,
    locked,
    aiError,
    clickSquare,
    togglePower,
    requestRestart,
    reset,
    changeOpponent,
    squareLabel,
    startComputer,
    toggleSound: () => {
      sound.value = !sound.value
      unlockAudio()
    },
  }
}

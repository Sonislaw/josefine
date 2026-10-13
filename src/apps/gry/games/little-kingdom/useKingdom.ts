import { computed, onMounted, ref, shallowRef } from 'vue'
import {
  BUILDINGS,
  actionError,
  key,
  newKingdom,
  resolveTurn,
  sectorOf,
  terrain,
  type Action,
  type BuildingKind,
  type Point,
} from './engine'
import { load, save } from './storage'
export function useKingdom() {
  // Identical SSR/client initial state; browser-only saved state is restored after hydration.
  const state = shallowRef(newKingdom(1)),
    ready = ref(false),
    corrupt = ref(false),
    unavailable = ref(false)
  const selected = ref<Point | null>(null),
    action = ref<Action | null>(null),
    card = ref<BuildingKind | null>(null)
  const tutorialDismissed = ref(false),
    help = ref(false),
    restart = ref(false),
    message = ref('Wybierz budynek i pustą łąkę albo zbierz pierwsze zapasy.')
  const selectedBuilding = computed(() =>
    selected.value ? state.value.buildings[key(selected.value.x, selected.value.y)] : undefined,
  )
  const error = computed(() => (action.value ? actionError(state.value, action.value) : null))
  const preview = computed(() => (action.value ? resolveTurn(state.value, action.value) : null))
  const blocked = computed(() => !ready.value || corrupt.value || state.value.status === 'gameover')
  function persist() {
    if (corrupt.value) return
    try {
      unavailable.value = !save(window.localStorage, state.value, tutorialDismissed.value)
    } catch {
      unavailable.value = true
    }
  }
  function seed() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0]!
  }
  onMounted(() => {
    try {
      const saved = load(window.localStorage)
      corrupt.value = saved.status === 'corrupt'
      unavailable.value = saved.status === 'unavailable'
      tutorialDismissed.value = saved.tutorialDismissed
      state.value = saved.state ?? newKingdom(seed())
      if (saved.state)
        message.value =
          'Witaj z powrotem. Twoje królestwo czekało — czas nie płynął podczas przerwy.'
    } catch {
      unavailable.value = true
      state.value = newKingdom(Date.now())
    }
    ready.value = true
  })
  function select(p: Point) {
    selected.value = p
    action.value = null
    const b = state.value.buildings[key(p.x, p.y)]
    if (!b && card.value && terrain(state.value.seed, p.x, p.y) === 'meadow')
      action.value = { type: 'build', kind: card.value, ...p }
  }
  function chooseCard(kind: BuildingKind) {
    card.value = kind
    action.value = null
    if (selected.value && !selectedBuilding.value)
      action.value = { type: 'build', kind, ...selected.value }
  }
  function explore(p: Point) {
    action.value = { type: 'explore', ...p }
    selected.value = null
    card.value = null
  }
  function choose(a: Action) {
    action.value = a
    card.value = null
  }
  const actionName = computed(() => {
    const a = action.value
    if (!a) return 'Zaplanuj swój ruch'
    if (a.type === 'build') return `Budowa: ${BUILDINGS[a.kind].name}`
    if (a.type === 'gather') return 'Zbieranie zapasów'
    if (a.type === 'explore') return `Odkrycie sektora ${a.x}, ${a.y}`
    return a.type === 'upgrade' ? 'Ulepszenie budynku' : 'Wyburzenie budynku'
  })
  function commit() {
    if (blocked.value || !action.value) return
    const result = resolveTurn(state.value, action.value)
    if (!result) return
    message.value = `${actionName.value}. ${result.shortage ? (result.populationChange < 0 ? 'Brak żywności — jeden mieszkaniec odszedł.' : 'Brak żywności! Kolejna tura niedoboru spowoduje odejście mieszkańca.') : result.populationChange > 0 ? 'Do osady przybył nowy mieszkaniec!' : 'Mieszkańcy otrzymali żywność.'}`
    state.value = result.state
    action.value = null
    card.value = null
    persist()
  }
  function startNew() {
    state.value = newKingdom(seed())
    corrupt.value = false
    selected.value = null
    action.value = null
    card.value = null
    restart.value = false
    message.value = 'Nowa ziemia, nowy początek. Zadbaj o żywność przed zimą.'
    persist()
  }
  function dismissTutorial() {
    tutorialDismissed.value = true
    persist()
  }
  const selectedSector = computed(() => (selected.value ? sectorOf(selected.value) : null))
  return {
    state,
    ready,
    corrupt,
    unavailable,
    selected,
    selectedBuilding,
    selectedSector,
    action,
    card,
    error,
    preview,
    blocked,
    tutorialDismissed,
    help,
    restart,
    message,
    actionName,
    select,
    chooseCard,
    explore,
    choose,
    commit,
    startNew,
    dismissTutorial,
  }
}

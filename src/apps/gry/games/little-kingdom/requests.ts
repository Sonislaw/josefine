import type { Building, Kingdom, Point, Resources } from './engine'
import type { SettlementRank } from './progression'
import { SIZE, terrain } from './terrain'

export const REQUEST_IDS = [
  'water-farm',
  'forest-sawmill',
  'rock-quarry',
  'mill-farms',
  'market-houses',
  'two-orchards',
  'master-house',
  'master-farm',
  'restored-place',
  'spring-garden',
  'trading-market',
  'winter-mill',
] as const
export type RequestId = (typeof REQUEST_IDS)[number]
export interface ActiveRequest {
  id: RequestId
  acceptedTurn: number
}
export interface CompletedRequest extends ActiveRequest {
  turn: number
}
export interface ResidentRequests {
  active: ActiveRequest | null
  completed: CompletedRequest[]
  cursor: number
}
export interface RequestDefinition {
  title: string
  resident: string
  profession: string
  quote: string
  goal: string
  hint: string
  minRank: SettlementRank
  reward: Resources
}
const gift = (wood = 0, stone = 0, food = 0, gold = 0): Resources => ({ wood, stone, food, gold })
// Curated, finite requests. Neither the offer nor completion consumes building-card RNG.
export const REQUESTS: Record<RequestId, RequestDefinition> = {
  'water-farm': {
    title: 'Pole przy strumieniu',
    resident: 'Zosia',
    profession: 'Rolniczka',
    quote: 'Woda jest tuż obok. Posadźmy coś, co skorzysta z jej bliskości.',
    goal: 'Farma przy wspólnej krawędzi z wodą.',
    hint: 'Wybierz łąkę przy wodzie. Przekątna nie daje premii.',
    minRank: 0,
    reward: gift(4, 0, 0, 2),
  },
  'forest-sawmill': {
    title: 'Drewno z sąsiedztwa',
    resident: 'Bruno',
    profession: 'Drwal',
    quote: 'Krótsza droga do lasu to więcej drewna na nasze domy.',
    goal: 'Tartak przy wspólnej krawędzi z lasem.',
    hint: 'Postaw tartak na łące obok lasu. Poczekaj na jego kartę w ofercie.',
    minRank: 0,
    reward: gift(0, 3, 0, 2),
  },
  'rock-quarry': {
    title: 'Solidny fundament',
    resident: 'Iga',
    profession: 'Kamieniarka',
    quote: 'Dobre kamienie są na wyciągnięcie ręki. Wykorzystajmy to.',
    goal: 'Kamieniołom przy wspólnej krawędzi ze skałami.',
    hint: 'Skały zostają na mapie. Kamieniołom budujemy na sąsiedniej łące.',
    minRank: 0,
    reward: gift(4, 0, 0, 2),
  },
  'mill-farms': {
    title: 'Mąka dla sąsiadów',
    resident: 'Mikołaj',
    profession: 'Młynarz',
    quote: 'Jeden młyn może pomagać kilku gospodarstwom. Zróbmy mu miejsce pośrodku.',
    goal: 'Jeden młyn przy co najmniej dwóch farmach.',
    hint: 'Dwie różne farmy muszą dotykać tego samego młyna wspólną krawędzią.',
    minRank: 1,
    reward: gift(0, 0, 6, 4),
  },
  'market-houses': {
    title: 'Targ blisko domu',
    resident: 'Lena',
    profession: 'Kupczyni',
    quote: 'Chciałabym, żeby mieszkańcy mieli zakupy tuż za progiem.',
    goal: 'Jeden targ przy co najmniej dwóch domach.',
    hint: 'Liczymy domy po bokach targu, bez przekątnych i ratusza.',
    minRank: 1,
    reward: gift(6, 0, 0, 4),
  },
  'two-orchards': {
    title: 'Jesień pachnąca jabłkami',
    resident: 'Olek',
    profession: 'Sadownik',
    quote: 'Dwa sady dadzą nam więcej owoców, kiedy przyjdzie jesień.',
    goal: 'Dwa istniejące sady.',
    hint: 'Każdy sad liczy się raz, niezależnie od poziomu. Nie muszą sąsiadować.',
    minRank: 1,
    reward: gift(0, 0, 6, 4),
  },
  'master-house': {
    title: 'Dom na lata',
    resident: 'Ada',
    profession: 'Budowniczka',
    quote: 'Zadbajmy o dom, który pomieści kolejne rodziny.',
    goal: 'Dom na poziomie 3.',
    hint: 'Wybierz dom na mapie i ulepsz go dwukrotnie. Sprawdź koszt przed zatwierdzeniem.',
    minRank: 2,
    reward: gift(0, 6, 0, 6),
  },
  'master-farm': {
    title: 'Gospodarstwo z rozmachem',
    resident: 'Tomek',
    profession: 'Gospodarz',
    quote: 'Zamiast szukać nowego pola, rozwińmy to, które już nas żywi.',
    goal: 'Farma na poziomie 3.',
    hint: 'Ulepszenie zwiększa plony, także te wynikające z wody i młynów.',
    minRank: 2,
    reward: gift(0, 0, 8, 6),
  },
  'restored-place': {
    title: 'Przywrócone wspomnienie',
    resident: 'Mira',
    profession: 'Kronikarka',
    quote: 'Nie każde odkrycie musi zostać tylko zapisem w dzienniku.',
    goal: 'Odnowione źródło lub dawny punkt handlowy.',
    hint: 'Odkrywaj nowe sektory. Gdy trafisz na trwałe miejsce, wybierz je i zatwierdź odnowienie.',
    minRank: 2,
    reward: gift(6, 4, 0, 6),
  },
  'spring-garden': {
    title: 'Ogród wokół źródła',
    resident: 'Róża',
    profession: 'Ogrodniczka',
    quote: 'Niech odnowione źródło naprawdę służy naszym uprawom.',
    goal: 'Farma lub sad przy odnowionym źródle.',
    hint: 'Źródło musi być odnowione, a gospodarstwo stać przy jego wspólnej krawędzi.',
    minRank: 3,
    reward: gift(0, 0, 10, 8),
  },
  'trading-market': {
    title: 'Ożywiony szlak',
    resident: 'Filip',
    profession: 'Wędrowny kupiec',
    quote: 'Stary przystanek znów żyje. Teraz potrzebuje targu w sąsiedztwie.',
    goal: 'Targ przy odnowionym punkcie handlowym.',
    hint: 'Po odnowieniu punktu postaw targ na sąsiedniej łące. Premia działa przy wspólnej krawędzi.',
    minRank: 3,
    reward: gift(8, 0, 0, 8),
  },
  'winter-mill': {
    title: 'Dobrze przygotowana spiżarnia',
    resident: 'Hania',
    profession: 'Piekarka',
    quote: 'Silny młyn i rozwinięte gospodarstwa pomogą przygotować zapasy.',
    goal: 'Młyn na poziomie co najmniej 2 przy dwóch farmach na poziomie co najmniej 2.',
    hint: 'Ulepsz młyn oraz dwie farmy, które dotykają go krawędzią. Możesz zrobić to o każdej porze roku.',
    minRank: 3,
    reward: gift(0, 6, 10, 8),
  },
}
export const emptyRequests = (): ResidentRequests => ({ active: null, completed: [], cursor: 0 })
const xy = (p: Point) => `${p.x},${p.y}`
const adjacent = (p: Point): Point[] => [
  { x: p.x - 1, y: p.y },
  { x: p.x + 1, y: p.y },
  { x: p.x, y: p.y - 1 },
  { x: p.x, y: p.y + 1 },
]
export function requestProgress(state: Kingdom, id: RequestId) {
  const buildings = Object.values(state.buildings)
  const known = new Set(state.sectors.map(xy))
  const hasTerrain = (b: Building, kind: 'water' | 'forest' | 'rock') =>
    adjacent(b).some(
      (p) =>
        known.has(xy({ x: Math.floor(p.x / SIZE), y: Math.floor(p.y / SIZE) })) &&
        terrain(state.seed, p.x, p.y) === kind,
    )
  const nearby = (b: Building, kind: Building['kind'], level = 1) =>
    adjacent(b).filter(
      (p) => state.buildings[xy(p)]?.kind === kind && state.buildings[xy(p)]!.level >= level,
    ).length
  let value = 0,
    required = 1,
    location: Point | null = null
  const best = (kind: Building['kind'], score: (b: Building) => number) => {
    for (const b of buildings.filter((b) => b.kind === kind)) {
      const n = score(b)
      if (location === null || n > value) {
        value = n
        location = { x: b.x, y: b.y }
      }
    }
  }
  if (id === 'water-farm') best('farm', (b) => +hasTerrain(b, 'water'))
  if (id === 'forest-sawmill') best('sawmill', (b) => +hasTerrain(b, 'forest'))
  if (id === 'rock-quarry') best('quarry', (b) => +hasTerrain(b, 'rock'))
  if (id === 'mill-farms') {
    required = 2
    best('mill', (b) => nearby(b, 'farm'))
  }
  if (id === 'market-houses') {
    required = 2
    best('market', (b) => nearby(b, 'house'))
  }
  if (id === 'two-orchards') {
    required = 2
    const orchards = buildings.filter((b) => b.kind === 'orchard')
    value = orchards.length
    location = orchards[0] ? { x: orchards[0].x, y: orchards[0].y } : null
  }
  if (id === 'master-house' || id === 'master-farm') {
    required = 3
    best(id === 'master-house' ? 'house' : 'farm', (b) => b.level)
  }
  if (id === 'restored-place') {
    const places = Object.values(state.discoveries).filter(
      (d) => d.kind === 'spring' || d.kind === 'tradingPost',
    )
    const restored = places.find((d) => d.status === 'used')
    value = restored ? 1 : 0
    const p = restored ?? places[0]
    location = p ? { x: p.x, y: p.y } : null
  }
  if (id === 'spring-garden' || id === 'trading-market') {
    const kind = id === 'spring-garden' ? 'spring' : 'tradingPost'
    for (const b of buildings.filter((b) =>
      id === 'spring-garden' ? b.kind === 'farm' || b.kind === 'orchard' : b.kind === 'market',
    )) {
      if (
        adjacent(b).some(
          (p) =>
            state.discoveries[xy(p)]?.kind === kind && state.discoveries[xy(p)]!.status === 'used',
        )
      ) {
        value = 1
        location = { x: b.x, y: b.y }
        break
      }
    }
    if (!location) {
      const d = Object.values(state.discoveries).find((d) => d.kind === kind)
      if (d) location = { x: d.x, y: d.y }
    }
  }
  if (id === 'winter-mill') {
    required = 2
    best('mill', (b) => (b.level >= 2 ? nearby(b, 'farm', 2) : 0))
  }
  return { value, required, complete: value >= required, location }
}
export function availableRequests(state: Kingdom): RequestId[] {
  return REQUEST_IDS.filter(
    (id) =>
      REQUESTS[id].minRank <= state.rank && !state.requests.completed.some((c) => c.id === id),
  )
}
export function requestOffer(state: Kingdom): RequestId[] {
  if (state.requests.active) return []
  const available = availableRequests(state)
  if (!available.length) return []
  return Array.from(
    { length: Math.min(3, available.length) },
    (_, i) => available[(state.requests.cursor + i) % available.length]!,
  )
}
export type RequestCommand = { type: 'accept'; id: RequestId } | { type: 'defer' | 'rotate' }
/** Non-turn commands: selection only. Completion always goes through resolveTurn. */
export function manageRequest(state: Kingdom, command: RequestCommand): Kingdom | null {
  if (state.status !== 'playing') return null
  const requests = { ...state.requests, completed: [...state.requests.completed] }
  if (command.type === 'accept') {
    if (requests.active || !requestOffer(state).includes(command.id)) return null
    requests.active = { id: command.id, acceptedTurn: state.turn }
  } else if (command.type === 'defer') {
    if (!requests.active) return null
    requests.active = null
  } else if (command.type === 'rotate') {
    if (requests.active || availableRequests(state).length <= 3) return null
    requests.cursor = (requests.cursor + 3) % REQUEST_IDS.length
  } else return null
  return { ...state, requests }
}
export function completedRequest(state: Kingdom): CompletedRequest | null {
  const active = state.requests.active
  if (
    state.status !== 'playing' ||
    !active ||
    state.turn <= active.acceptedTurn ||
    state.requests.completed.some((c) => c.id === active.id)
  )
    return null
  return requestProgress(state, active.id).complete ? { ...active, turn: state.turn } : null
}

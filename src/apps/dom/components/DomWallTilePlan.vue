<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import { ArrowUpRight, House, Layers3, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  choiceShareField,
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import {
  calculateTileWallBreakdown,
  calculateTileRoomPlan,
  calculateTiledWallArea,
  calculateTiledWallOpenings,
  tileRoomWallSides,
  type TileOpeningKind,
  type TileSurfaceInput,
  type TileSurfaceResult,
  type TileRoomWallSide,
  type TileWallOpening,
  type TileWallCoverage,
} from '../lib/tile-room'
import { domPath } from '../seo/useDomSeo'
import { useDomShoppingList, type ShoppingDraft } from '../stores/shoppingList'
import AddToDomShoppingList from './AddToDomShoppingList.vue'
import DomRoomPicker from './DomRoomPicker.vue'

type SurfaceKey = 'tileLength' | 'tileWidth' | 'waste' | 'tilesPerBox' | 'boxPrice'
type SurfaceForm = Record<SurfaceKey, string>
type RoomKey = 'length' | 'width' | 'height' | 'openings'
type OpeningField = 'width' | 'height' | 'bottom'
interface OpeningForm {
  id: number
  kind: TileOpeningKind
  side: TileRoomWallSide
  width: string
  height: string
  bottom: string
}
type SerializedOpening = [TileOpeningKind, TileRoomWallSide, string, string, string]

interface FieldDefinition<T extends string> {
  id: T
  label: string
  unit: string
  min: number
  max: number
  integer?: boolean
  optional?: boolean
  positive?: boolean
}

const shoppingList = useDomShoppingList()
const selectedRoomId = ref('')
const wallMode = ref<'full' | 'selected'>('full')
const wallTileHeight = ref('1,2')
const openingMode = ref<'total' | 'detailed'>('total')
const openingForms = ref<OpeningForm[]>([])
let nextOpeningId = 1
const selectedWalls = reactive<Record<TileRoomWallSide, boolean>>({
  lengthA: true,
  lengthB: true,
  widthA: true,
  widthB: true,
})
const wallChoices = [
  { id: 'lengthA', label: 'Ściana A', dimension: 'length' },
  { id: 'lengthB', label: 'Ściana B', dimension: 'length' },
  { id: 'widthA', label: 'Ściana C', dimension: 'width' },
  { id: 'widthB', label: 'Ściana D', dimension: 'width' },
] as const
const maxOpeningCount = 12
function addOpening(kind: TileOpeningKind) {
  if (openingForms.value.length >= maxOpeningCount) return
  openingForms.value.push({
    id: nextOpeningId++,
    kind,
    side: wallMode.value === 'selected' ? (selectedWallSides.value[0] ?? 'lengthA') : 'lengthA',
    width: kind === 'door' ? '0,9' : '1',
    height: kind === 'door' ? '2' : '1',
    bottom: kind === 'door' ? '0' : '1',
  })
}
function removeOpening(id: number) {
  openingForms.value = openingForms.value.filter((opening) => opening.id !== id)
}
const roomDefaults = { length: '5', width: '4', height: '2,5', openings: '0' }
const wallDefaults: SurfaceForm = {
  tileLength: '30',
  tileWidth: '60',
  waste: '10',
  tilesPerBox: '8',
  boxPrice: '',
}
const room = reactive<Record<RoomKey, string>>({ ...roomDefaults })
const walls = reactive<SurfaceForm>({ ...wallDefaults })
const savedRoom = computed(() =>
  shoppingList.rooms.find((entry) => entry.id === selectedRoomId.value && entry.dimensions),
)

const roomFields: FieldDefinition<RoomKey>[] = [
  { id: 'length', label: 'Długość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'width', label: 'Szerokość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'height', label: 'Wysokość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'openings', label: 'Drzwi i okna łącznie', unit: 'm²', min: 0, max: 1_000_000 },
]
const wallTileHeightField: FieldDefinition<'tileHeight'> = {
  id: 'tileHeight',
  label: 'Wysokość ułożenia płytek',
  unit: 'm',
  min: 0,
  max: 1000,
  positive: true,
}
const openingFields: Record<OpeningField, FieldDefinition<OpeningField>> = {
  width: { id: 'width', label: 'Szerokość', unit: 'm', min: 0, max: 1000, positive: true },
  height: { id: 'height', label: 'Wysokość', unit: 'm', min: 0, max: 1000, positive: true },
  bottom: { id: 'bottom', label: 'Dolna krawędź od podłogi', unit: 'm', min: 0, max: 1000 },
}
const surfaceFields: FieldDefinition<SurfaceKey>[] = [
  { id: 'tileLength', label: 'Długość płytki', unit: 'cm', min: 0, max: 300, positive: true },
  { id: 'tileWidth', label: 'Szerokość płytki', unit: 'cm', min: 0, max: 300, positive: true },
  { id: 'waste', label: 'Zapas na docinki', unit: '%', min: 0, max: 100 },
  {
    id: 'tilesPerBox',
    label: 'Płytki w kartonie',
    unit: 'szt.',
    min: 1,
    max: 1_000_000,
    integer: true,
  },
  { id: 'boxPrice', label: 'Cena kartonu', unit: 'zł', min: 0, max: 100_000, optional: true },
]

function validNumber(raw: string, field: FieldDefinition<string>): boolean {
  if (field.optional && raw.trim() === '') return true
  const value = parseDomNumber(raw)
  if (value === null || value < field.min || value > field.max) return false
  if (field.positive && value <= 0) return false
  return !field.integer || Number.isSafeInteger(value)
}
function roomError(field: FieldDefinition<RoomKey>): string | null {
  if (validNumber(room[field.id], field)) return null
  return field.id === 'openings'
    ? 'Podaj powierzchnię otworów od 0 do 1 000 000 m².'
    : 'Podaj wymiar większy od 0 i nie większy niż 1000 m.'
}
function surfaceError(form: SurfaceForm, field: FieldDefinition<SurfaceKey>): string | null {
  if (validNumber(form[field.id], field)) return null
  if (field.id === 'boxPrice') return 'Podaj cenę od 0 do 100 000 zł albo zostaw pole puste.'
  if (field.id === 'tilesPerBox') return 'Wpisz całkowitą liczbę płytek w kartonie.'
  if (field.id === 'waste') return 'Wpisz zapas od 0% do 100%.'
  return 'Podaj wymiar większy od 0 i nie większy niż 300 cm.'
}
function openingFieldError(opening: OpeningForm, field: OpeningField): string | null {
  const raw = opening[field]
  if (!validNumber(raw, openingFields[field]))
    return field === 'bottom'
      ? 'Podaj odległość od podłogi od 0 do 1000 m.'
      : 'Podaj wymiar większy od 0 i nie większy niż 1000 m.'

  const value = parseDomNumber(raw)!
  const roomHeight = parseDomNumber(room.height)
  if (field === 'width') {
    const wallLength = parseDomNumber(
      room[opening.side === 'lengthA' || opening.side === 'lengthB' ? 'length' : 'width'],
    )
    if (wallLength !== null && wallLength > 0 && value > wallLength)
      return 'Otwór nie może być szerszy od tej ściany.'
  }
  if (field === 'height' && roomHeight !== null && roomHeight > 0 && value > roomHeight)
    return 'Otwór nie może być wyższy od pokoju.'
  if (field === 'bottom' && roomHeight !== null && roomHeight > 0) {
    const openingHeight = parseDomNumber(opening.height)
    if (openingHeight !== null && value + openingHeight > roomHeight + 1e-9)
      return 'Otwór wraz z położeniem przekracza wysokość pokoju.'
  }
  return null
}
const selectedWallSides = computed(() => tileRoomWallSides.filter((side) => selectedWalls[side]))
const selectedWallsError = computed(() =>
  wallMode.value === 'selected' && selectedWallSides.value.length === 0
    ? 'Wybierz co najmniej jedną ścianę do ułożenia płytek.'
    : null,
)
const wallTileHeightError = computed(() => {
  if (wallMode.value === 'full') return null
  if (!validNumber(wallTileHeight.value, wallTileHeightField))
    return 'Podaj wysokość płytek większą od 0 i nie większą niż 1000 m.'
  const height = parseDomNumber(room.height)
  if (height !== null && height > 0 && parseDomNumber(wallTileHeight.value)! > height)
    return 'Wysokość płytek nie może przekraczać wysokości pokoju.'
  return null
})
const wallCoverage = computed<TileWallCoverage | undefined>(() =>
  wallMode.value === 'selected'
    ? { sides: selectedWallSides.value, height: parseDomNumber(wallTileHeight.value) ?? NaN }
    : undefined,
)
const tiledWallArea = computed(() => {
  if (selectedWallsError.value || wallTileHeightError.value) return null
  const length = parseDomNumber(room.length)
  const width = parseDomNumber(room.width)
  const height = parseDomNumber(room.height)
  if (length === null || width === null || height === null) return null
  return calculateTiledWallArea({ length, width, height }, wallCoverage.value)
})
const detailedOpenings = computed<TileWallOpening[] | null>(() => {
  if (openingMode.value !== 'detailed') return null
  if (
    openingForms.value.some((opening) =>
      (['width', 'height', 'bottom'] as const).some((field) => openingFieldError(opening, field)),
    )
  )
    return null
  return openingForms.value.map((opening) => ({
    kind: opening.kind,
    side: opening.side,
    width: parseDomNumber(opening.width)!,
    height: parseDomNumber(opening.height)!,
    bottom: parseDomNumber(opening.bottom)!,
  }))
})
const detailedOpeningPreview = computed(() => {
  if (detailedOpenings.value === null) return null
  const length = parseDomNumber(room.length)
  const width = parseDomNumber(room.width)
  const height = parseDomNumber(room.height)
  if (length === null || width === null || height === null) return null
  return calculateTiledWallOpenings(
    { length, width, height },
    detailedOpenings.value,
    wallCoverage.value,
  )
})
const detailedWallBreakdown = computed(() => {
  if (!detailedOpeningPreview.value) return null
  const length = parseDomNumber(room.length)
  const width = parseDomNumber(room.width)
  const height = parseDomNumber(room.height)
  if (length === null || width === null || height === null) return null
  return calculateTileWallBreakdown(
    { length, width, height },
    wallCoverage.value,
    detailedOpeningPreview.value.details,
  )
})
const openingError = computed(() => {
  if (tiledWallArea.value === null) return null
  const overfilledWall = detailedWallBreakdown.value?.find(
    (wall) => wall.openingArea !== null && wall.openingArea > wall.grossArea + 1e-9,
  )
  if (overfilledWall) {
    const label = wallChoices.find((choice) => choice.id === overfilledWall.side)?.label
    return `Na ${label ?? 'wybranej ścianie'} powierzchnia otworów przekracza obszar płytek.`
  }
  const openings =
    openingMode.value === 'detailed'
      ? detailedOpeningPreview.value?.totalArea
      : parseDomNumber(room.openings)
  if (openings === null || openings === undefined || openings < 0) return null
  return openings >= tiledWallArea.value
    ? 'Otwory muszą być mniejsze niż powierzchnia ścian w wybranej strefie płytek.'
    : null
})

function parseSurface(form: SurfaceForm): TileSurfaceInput | null {
  if (surfaceFields.some((field) => surfaceError(form, field))) return null
  return {
    tileLength: parseDomNumber(form.tileLength)!,
    tileWidth: parseDomNumber(form.tileWidth)!,
    waste: parseDomNumber(form.waste)!,
    tilesPerBox: parseDomNumber(form.tilesPerBox)!,
    boxPrice: form.boxPrice.trim() === '' ? null : parseDomNumber(form.boxPrice),
  }
}

const plan = computed(() => {
  if (roomFields.slice(0, 3).some((field) => roomError(field))) return null
  if (
    (openingMode.value === 'total' && roomError(roomFields[3]!)) ||
    (openingMode.value === 'detailed' && detailedOpeningPreview.value === null) ||
    selectedWallsError.value ||
    wallTileHeightError.value ||
    openingError.value
  )
    return null
  const wallInput = parseSurface(walls)
  if (!wallInput) return null
  return calculateTileRoomPlan({
    room: {
      length: parseDomNumber(room.length)!,
      width: parseDomNumber(room.width)!,
      height: parseDomNumber(room.height)!,
    },
    openings: openingMode.value === 'total' ? parseDomNumber(room.openings)! : 0,
    detailedOpenings:
      openingMode.value === 'detailed' ? (detailedOpenings.value ?? undefined) : undefined,
    floor: null,
    walls: wallInput,
    wallCoverage: wallCoverage.value,
  })
})

function purchaseItems(result: TileSurfaceResult | null | undefined): ShoppingDraft[] {
  if (!result) return []
  return [
    {
      kind: 'tileBoxes',
      quantity: result.boxCount,
      cost: result.estimatedCost,
      tileSurface: 'walls',
      tileLengthCm: result.tileLength,
      tileWidthCm: result.tileWidth,
      piecesPerBox: result.tilesPerBox,
      tiledAreaM2: result.area,
    },
  ]
}
const wallShoppingItems = computed(() => purchaseItems(plan.value?.walls))
function optionalField(
  key: string,
  model: { value: string },
  active: () => boolean,
  fallback: string,
  field: FieldDefinition<string>,
): ShareField {
  return {
    key,
    read: () => {
      const raw = active() ? model.value : fallback
      return raw.length <= 100 && validNumber(raw, field) ? raw : null
    },
    restore: (raw) => {
      if (raw.length <= 100 && validNumber(raw, field)) model.value = raw
    },
  }
}
function parseSharedOpenings(raw: string): Omit<OpeningForm, 'id'>[] | null {
  if (raw.length > 2000) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(parsed) || parsed.length > maxOpeningCount) return null
  const items: Omit<OpeningForm, 'id'>[] = []
  for (const row of parsed) {
    if (!Array.isArray(row) || row.length !== 5) return null
    const [kind, side, width, height, bottom]: unknown[] = row
    if (
      (kind !== 'door' && kind !== 'window') ||
      typeof side !== 'string' ||
      !tileRoomWallSides.includes(side as TileRoomWallSide) ||
      typeof width !== 'string' ||
      typeof height !== 'string' ||
      typeof bottom !== 'string' ||
      [width, height, bottom].some((value) => value.length > 40) ||
      !validNumber(width, openingFields.width) ||
      !validNumber(height, openingFields.height) ||
      !validNumber(bottom, openingFields.bottom)
    )
      return null
    items.push({ kind, side: side as TileRoomWallSide, width, height, bottom })
  }
  return items
}
const detailedOpeningsShareField: ShareField = {
  key: 'roomOpeningItems',
  read: () => {
    if (openingMode.value !== 'detailed') return '[]'
    if (detailedOpenings.value === null) return null
    const rows: SerializedOpening[] = openingForms.value.map((opening) => [
      opening.kind,
      opening.side,
      opening.width,
      opening.height,
      opening.bottom,
    ])
    const encoded = JSON.stringify(rows)
    return encoded.length <= 2000 ? encoded : null
  },
  restore: (raw) => {
    const items = parseSharedOpenings(raw)
    if (items) openingForms.value = items.map((item) => ({ ...item, id: nextOpeningId++ }))
  },
}
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  choiceShareField('roomWallMode', wallMode, ['full', 'selected']),
  choiceShareField('roomOpeningMode', openingMode, ['total', 'detailed']),
  ...tileRoomWallSides.map((side) =>
    booleanShareField(`roomWall${side}`, toRef(selectedWalls, side)),
  ),
  textShareField('roomLength', toRef(room, 'length'), (raw) => validNumber(raw, roomFields[0]!)),
  textShareField('roomWidth', toRef(room, 'width'), (raw) => validNumber(raw, roomFields[1]!)),
  optionalField('roomHeight', toRef(room, 'height'), () => true, '2,5', roomFields[2]!),
  optionalField(
    'roomTileHeight',
    wallTileHeight,
    () => wallMode.value === 'selected',
    '1,2',
    wallTileHeightField,
  ),
  optionalField(
    'roomOpenings',
    toRef(room, 'openings'),
    () => openingMode.value === 'total',
    '0',
    roomFields[3]!,
  ),
  detailedOpeningsShareField,
  ...surfaceFields.map((field) =>
    optionalField(
      `roomWalls${field.id}`,
      toRef(walls, field.id),
      () => true,
      wallDefaults[field.id],
      field,
    ),
  ),
])

function useSavedRoom() {
  const dimensions = savedRoom.value?.dimensions
  if (!dimensions) return
  room.length = String(dimensions.length)
  room.width = String(dimensions.width)
  room.height = String(dimensions.height)
}
function reset() {
  Object.assign(room, roomDefaults)
  Object.assign(walls, wallDefaults)
  wallMode.value = 'full'
  wallTileHeight.value = '1,2'
  openingMode.value = 'total'
  openingForms.value = []
  for (const side of tileRoomWallSides) selectedWalls[side] = true
}
const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
function wallChoiceLength(dimension: 'length' | 'width'): string {
  const value = parseDomNumber(room[dimension])
  return value !== null && value > 0 && value <= 1000
    ? `${formatArea(value)} m długości`
    : 'Podaj poprawny wymiar pokoju'
}
function wallSideLabel(side: TileRoomWallSide): string {
  return wallChoices.find((choice) => choice.id === side)?.label ?? 'Ściana'
}
function groutLink(surface: TileSurfaceResult) {
  return {
    path: domPath('/kalkulator-fugi'),
    query: {
      area: String(surface.area),
      tileLength: String(surface.tileLength),
      tileWidth: String(surface.tileWidth),
      ...(selectedRoomId.value ? { roomId: selectedRoomId.value } : {}),
    },
  }
}
const adhesiveLink = computed(() => ({
  path: domPath('/klej-do-plytek'),
  query: {
    useFloor: '0',
    useWalls: '1',
    ...(plan.value?.walls ? { wallsArea: String(plan.value.walls.area) } : {}),
    ...(selectedRoomId.value ? { roomId: selectedRoomId.value } : {}),
  },
}))
</script>

<template>
  <DomRoomPicker v-model="selectedRoomId" focus="walls" @choose="useSavedRoom" />
  <section class="room-plan" aria-labelledby="tile-room-title">
    <div class="plan-header">
      <span class="header-icon"><House :size="22" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">KALKULATOR ŚCIAN</p>
        <h3 id="tile-room-title">Zaplanuj płytki na ścianach</h3>
        <p>Wybierz ściany, wysokość okładziny i sposób odliczenia drzwi oraz okien.</p>
      </div>
    </div>

    <div class="plan-body">
      <div class="room-fields">
        <div class="section-heading">
          <div>
            <p class="eyebrow">01 / POMIAR</p>
            <h4>Wymiary pomieszczenia</h4>
            <p>Podaj wymiary pokoju. Zakres układania na ścianach wybierzesz poniżej.</p>
          </div>
          <div class="heading-actions">
            <button v-if="savedRoom?.dimensions" type="button" @click="useSavedRoom">
              Wstaw zapisany pokój
            </button>
            <button type="button" @click="reset">
              <RotateCcw :size="15" aria-hidden="true" /> Przywróć przykład
            </button>
          </div>
        </div>
        <div class="field-grid">
          <div
            v-for="field in roomFields.filter((item) => item.id !== 'openings')"
            :key="field.id"
            class="field"
          >
            <label :for="`tile-room-${field.id}`">{{ field.label }}</label>
            <div class="input-wrap">
              <input
                :id="`tile-room-${field.id}`"
                v-model="room[field.id]"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!roomError(field)"
                :aria-describedby="roomError(field) ? `tile-room-help-${field.id}` : undefined"
              /><span>{{ field.unit }}</span>
            </div>
            <p v-if="roomError(field)" :id="`tile-room-help-${field.id}`" class="field-error">
              {{ roomError(field) }}
            </p>
          </div>
        </div>
      </div>

      <div class="wall-coverage">
        <div class="section-heading">
          <div>
            <p class="eyebrow">ZAKRES ŚCIAN</p>
            <h4>Gdzie układasz płytki?</h4>
            <p>Domyślnie liczymy wszystkie ściany do pełnej wysokości pokoju.</p>
          </div>
        </div>
        <div class="wall-modes" role="group" aria-label="Sposób liczenia ścian">
          <label>
            <input v-model="wallMode" type="radio" value="full" />
            <span><strong>Całe ściany</strong><small>4 ściany, pełna wysokość</small></span>
          </label>
          <label>
            <input v-model="wallMode" type="radio" value="selected" />
            <span
              ><strong>Wybrany fragment</strong
              ><small>Wybierz ściany i wysokość płytek</small></span
            >
          </label>
        </div>
        <div v-if="wallMode === 'selected'" class="custom-walls">
          <div class="field tile-height-field">
            <label for="tile-room-tile-height">Wysokość ułożenia płytek</label>
            <div class="input-wrap">
              <input
                id="tile-room-tile-height"
                v-model="wallTileHeight"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!wallTileHeightError"
                :aria-describedby="wallTileHeightError ? 'tile-room-tile-height-error' : undefined"
              /><span>m</span>
            </div>
            <p v-if="wallTileHeightError" id="tile-room-tile-height-error" class="field-error">
              {{ wallTileHeightError }}
            </p>
            <p class="field-hint">
              Mierz od podłogi. Ta sama wysokość dotyczy każdej zaznaczonej ściany.
            </p>
          </div>
          <fieldset class="wall-selection">
            <legend>Ściany do ułożenia</legend>
            <p>Ściany A i B mają długość pokoju; C i D — jego szerokość.</p>
            <div class="wall-diagram" aria-hidden="true">
              <span class="wall-diagram-top" :class="{ 'is-selected': selectedWalls.lengthA }"
                >A</span
              >
              <span class="wall-diagram-left" :class="{ 'is-selected': selectedWalls.widthA }"
                >C</span
              >
              <span class="wall-diagram-room">POKÓJ</span>
              <span class="wall-diagram-right" :class="{ 'is-selected': selectedWalls.widthB }"
                >D</span
              >
              <span class="wall-diagram-bottom" :class="{ 'is-selected': selectedWalls.lengthB }"
                >B</span
              >
            </div>
            <div class="wall-choice-grid">
              <label v-for="choice in wallChoices" :key="choice.id">
                <input v-model="selectedWalls[choice.id]" type="checkbox" />
                <span>
                  <strong>{{ choice.label }}</strong>
                  <small>{{ wallChoiceLength(choice.dimension) }}</small>
                </span>
              </label>
            </div>
            <p v-if="selectedWallsError" class="geometry-error" role="alert">
              {{ selectedWallsError }}
            </p>
          </fieldset>
        </div>
        <div class="opening-section">
          <fieldset class="opening-mode">
            <legend>Drzwi i okna</legend>
            <div class="wall-modes">
              <label>
                <input v-model="openingMode" type="radio" value="total" />
                <span
                  ><strong>Podam łączną powierzchnię</strong
                  ><small>Szybki wariant w m²</small></span
                >
              </label>
              <label>
                <input v-model="openingMode" type="radio" value="detailed" />
                <span
                  ><strong>Dodam otwory osobno</strong
                  ><small>Odliczymy tylko część pod płytkami</small></span
                >
              </label>
            </div>
          </fieldset>
          <p class="field-hint">W wyniku uwzględniamy tylko wybrany sposób odejmowania otworów.</p>
          <div v-if="openingMode === 'total'" class="field openings-field">
            <label for="tile-room-openings">Otwory w obszarze płytek łącznie</label>
            <div class="input-wrap">
              <input
                id="tile-room-openings"
                v-model="room.openings"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!roomError(roomFields[3]!) || !!openingError"
                :aria-describedby="
                  openingError
                    ? 'tile-room-opening-error'
                    : roomError(roomFields[3]!)
                      ? 'tile-room-help-openings'
                      : 'tile-room-opening-hint'
                "
              /><span>m²</span>
            </div>
            <p id="tile-room-opening-hint" class="field-hint">
              Odejmij tylko powierzchnię otworów na zaznaczonych ścianach, poniżej wysokości płytek.
              Jeśli ich nie ma, wpisz 0.
            </p>
            <p v-if="roomError(roomFields[3]!)" id="tile-room-help-openings" class="field-error">
              {{ roomError(roomFields[3]!) }}
            </p>
            <p v-if="openingError" id="tile-room-opening-error" class="geometry-error" role="alert">
              {{ openingError }}
            </p>
          </div>
          <div v-else class="detailed-openings">
            <p class="field-hint">
              Dla każdego otworu wybierz ścianę i podaj wymiary. Dolna krawędź drzwi zwykle jest na
              poziomie podłogi (0 m). Liczymy tylko część poniżej wysokości płytek.
            </p>
            <div class="opening-actions">
              <button
                type="button"
                :disabled="openingForms.length >= maxOpeningCount"
                @click="addOpening('door')"
              >
                <Plus :size="15" aria-hidden="true" /> Dodaj drzwi
              </button>
              <button
                type="button"
                :disabled="openingForms.length >= maxOpeningCount"
                @click="addOpening('window')"
              >
                <Plus :size="15" aria-hidden="true" /> Dodaj okno
              </button>
            </div>
            <p v-if="!openingForms.length" class="empty-openings">
              Nie dodano otworów. Odliczenie wynosi 0 m².
            </p>
            <article
              v-for="(opening, index) in openingForms"
              :key="opening.id"
              class="opening-card"
            >
              <div class="opening-card-heading">
                <h5>{{ opening.kind === 'door' ? 'Drzwi' : 'Okno' }} {{ index + 1 }}</h5>
                <button
                  type="button"
                  :aria-label="`Usuń ${opening.kind === 'door' ? 'drzwi' : 'okno'} ${index + 1}`"
                  @click="removeOpening(opening.id)"
                >
                  <Trash2 :size="16" aria-hidden="true" /> Usuń
                </button>
              </div>
              <div class="opening-input-grid">
                <div class="field">
                  <label :for="`tile-opening-${opening.id}-side`">Ściana</label>
                  <select :id="`tile-opening-${opening.id}-side`" v-model="opening.side">
                    <option v-for="choice in wallChoices" :key="choice.id" :value="choice.id">
                      {{ choice.label }} · {{ wallChoiceLength(choice.dimension) }}
                    </option>
                  </select>
                </div>
                <div v-for="field in openingFields" :key="field.id" class="field">
                  <label :for="`tile-opening-${opening.id}-${field.id}`">{{ field.label }}</label>
                  <div class="input-wrap">
                    <input
                      :id="`tile-opening-${opening.id}-${field.id}`"
                      v-model="opening[field.id]"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      :aria-invalid="!!openingFieldError(opening, field.id)"
                      :aria-describedby="
                        openingFieldError(opening, field.id)
                          ? `tile-opening-error-${opening.id}-${field.id}`
                          : undefined
                      "
                    /><span>{{ field.unit }}</span>
                  </div>
                  <p
                    v-if="openingFieldError(opening, field.id)"
                    :id="`tile-opening-error-${opening.id}-${field.id}`"
                    class="field-error"
                  >
                    {{ openingFieldError(opening, field.id) }}
                  </p>
                </div>
              </div>
              <p v-if="detailedOpeningPreview?.details[index]" class="opening-impact">
                <template v-if="!detailedOpeningPreview.details[index]!.onSelectedWall">
                  Ta ściana nie jest zaznaczona — otwór nie zmienia wyniku.
                </template>
                <template v-else-if="detailedOpeningPreview.details[index]!.area === 0">
                  Otwór leży ponad strefą płytek — odliczenie 0 m².
                </template>
                <template v-else>
                  Odliczamy {{ formatArea(detailedOpeningPreview.details[index]!.area) }} m² ({{
                    formatArea(detailedOpeningPreview.details[index]!.tiledHeight)
                  }}
                  m wysokości w strefie płytek).
                </template>
              </p>
            </article>
            <p v-if="openingForms.length >= maxOpeningCount" class="field-hint">
              Możesz dodać maksymalnie {{ maxOpeningCount }} otworów.
            </p>
            <p v-if="openingError" class="geometry-error" role="alert">{{ openingError }}</p>
            <p v-else-if="detailedOpeningPreview" class="opening-total">
              Razem odejmujemy
              <strong>{{ formatArea(detailedOpeningPreview.totalArea) }} m²</strong> z wybranych
              ścian.
            </p>
            <p class="field-hint">
              Jeśli otwory nachodzą na siebie, popraw dane — kalkulator nie zna ich poziomego
              położenia na ścianie.
            </p>
          </div>
        </div>
      </div>

      <div class="surface-grid">
        <div class="surface-card surface-card--walls">
          <div class="surface-heading">
            <span class="surface-icon"><Layers3 :size="19" aria-hidden="true" /></span>
            <div>
              <p class="eyebrow">PŁYTKI ŚCIENNE</p>
              <h4>Format i zakup</h4>
            </div>
          </div>
          <p class="surface-intro">
            Podaj format płytek, zapas na docinki oraz dane kartonu. Zakup policzymy z łącznego
            metrażu wybranych ścian.
          </p>
          <div class="field-grid">
            <div v-for="field in surfaceFields" :key="field.id" class="field">
              <label :for="`tile-room-walls-${field.id}`"
                >{{ field.label }} <small v-if="field.optional">opcjonalnie</small></label
              >
              <div class="input-wrap">
                <input
                  :id="`tile-room-walls-${field.id}`"
                  v-model="walls[field.id]"
                  type="text"
                  :inputmode="field.integer ? 'numeric' : 'decimal'"
                  autocomplete="off"
                  :aria-invalid="!!surfaceError(walls, field)"
                  :aria-describedby="
                    surfaceError(walls, field) ? `tile-room-help-walls-${field.id}` : undefined
                  "
                /><span>{{ field.unit }}</span>
              </div>
              <p
                v-if="surfaceError(walls, field)"
                :id="`tile-room-help-walls-${field.id}`"
                class="field-error"
              >
                {{ surfaceError(walls, field) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="results" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">02 / WYNIK</p>
            <h4>Wynik dla ścian</h4>
          </div>
        </div>
        <template v-if="plan">
          <div v-if="plan.walls" class="area-summary">
            Ściany ({{
              wallMode === 'full'
                ? '4 ściany, pełna wysokość'
                : `${selectedWallSides.length} z 4, do ${formatArea(parseDomNumber(wallTileHeight)!)} m`
            }}): {{ formatArea(plan.grossWalls) }} m² przed odjęciem otworów −
            {{ formatArea(plan.openings) }} m² =
            <strong>{{ formatArea(plan.netWalls) }} m²</strong> do ułożenia.
          </div>
          <div v-if="plan.wallBreakdown" class="wall-breakdown">
            <div class="wall-breakdown-heading">
              <h5>Jak powstaje metraż ścian?</h5>
              <p>
                Sprawdź każdą ścianę przed zakupem. Kartony liczymy z sumy, bez zaokrąglania osobno.
              </p>
            </div>
            <div class="wall-breakdown-grid">
              <article
                v-for="wall in plan.wallBreakdown"
                :key="wall.side"
                class="wall-breakdown-card"
                :class="{ 'wall-breakdown-card--excluded': !wall.selected }"
              >
                <div class="wall-breakdown-title">
                  <h6>{{ wallSideLabel(wall.side) }}</h6>
                  <small>{{ formatArea(wall.wallLength) }} m długości</small>
                </div>
                <p v-if="!wall.selected" class="excluded-note">Bez płytek</p>
                <dl v-else>
                  <div>
                    <dt>Przed odjęciem</dt>
                    <dd>{{ formatArea(wall.grossArea) }} m²</dd>
                  </div>
                  <div>
                    <dt>Otwory</dt>
                    <dd>
                      {{ wall.openingArea === null ? '—' : `${formatArea(wall.openingArea)} m²` }}
                    </dd>
                  </div>
                  <div class="wall-net">
                    <dt>Pod płytki</dt>
                    <dd>{{ wall.netArea === null ? '—' : `${formatArea(wall.netArea)} m²` }}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <p v-if="openingMode === 'total' && plan.openings > 0" class="unassigned-openings-note">
              Podano tylko łączną powierzchnię otworów, więc nie wiemy, na której ścianie je odjąć.
              Metraż netto ścian zobaczysz po dodaniu drzwi i okien osobno; łączny wynik powyżej już
              uwzględnia wpisane {{ formatArea(plan.openings) }} m².
            </p>
          </div>
          <div class="result-grid">
            <article class="result-card result-card--walls">
              <p class="eyebrow">PŁYTKI ŚCIENNE</p>
              <h5>Ściany</h5>
              <strong class="result-count"
                >{{ formatCount(plan.walls!.boxCount) }} <small>kart.</small></strong
              >
              <dl>
                <div>
                  <dt>Powierzchnia</dt>
                  <dd>{{ formatArea(plan.walls!.area) }} m²</dd>
                </div>
                <div>
                  <dt>Płytki z zapasem {{ walls.waste }}%</dt>
                  <dd>{{ formatCount(plan.walls!.tileCount) }} szt.</dd>
                </div>
                <div>
                  <dt>W zakupionych kartonach</dt>
                  <dd>{{ formatCount(plan.walls!.purchasedTiles) }} szt.</dd>
                </div>
                <div>
                  <dt>Nadwyżka ponad zapas</dt>
                  <dd>{{ formatCount(plan.walls!.spareTiles) }} szt.</dd>
                </div>
                <div>
                  <dt>Koszt</dt>
                  <dd>
                    {{
                      plan.walls!.estimatedCost === null
                        ? 'Cena niepodana'
                        : formatMoney(plan.walls!.estimatedCost)
                    }}
                  </dd>
                </div>
              </dl>
              <RouterLink :to="groutLink(plan.walls!)"
                >Policz fugę dla ścian <ArrowUpRight :size="15" aria-hidden="true"
              /></RouterLink>
              <AddToDomShoppingList
                :items="wallShoppingItems"
                :preferred-room-id="selectedRoomId"
                label="Dodaj płytki ścienne"
              />
            </article>
          </div>
          <RouterLink :to="adhesiveLink" class="adhesive-link">
            Policz klej do płytek ściennych <ArrowUpRight :size="16" aria-hidden="true" />
          </RouterLink>
          <div v-if="plan.missingPriceCount === 0" class="cost-summary">
            Koszt podanych kartonów <strong>{{ formatMoney(plan.knownCost) }}</strong>
          </div>
          <p v-else-if="plan.knownCost > 0" class="cost-note">
            Suma znanych cen: {{ formatMoney(plan.knownCost) }}. Brakuje ceny dla
            {{ plan.missingPriceCount }} powierzchni — to nie jest pełny koszt.
          </p>
          <p v-else class="cost-note">Dodaj ceny kartonów, aby zobaczyć koszt zakupu.</p>
        </template>
        <p v-else class="empty-result">
          Sprawdź wymiary pokoju, wybrane ściany i dane kartonów, aby zobaczyć plan.
        </p>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!plan || !canShareInputs"
          class="share-action"
        />
        <p class="caveat">
          To szacunek dla prostokątnego pokoju i jednego rodzaju płytek na wybranych ścianach. Nie
          uwzględnia narożnych docinek, wnęk, skosów, wzoru układania ani fug. Otwory odejmujemy
          tylko od obszaru układania płytek.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.room-plan {
  margin-top: 1.25rem;
  overflow: hidden;
  border: 1px solid #dce5d7;
  border-radius: 22px;
  background: #fffefa;
}
.plan-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.7rem;
  background: linear-gradient(110deg, #eef4e8, #f9eddf);
}
.header-icon {
  display: grid;
  place-items: center;
  flex: 0 0 46px;
  height: 46px;
  border-radius: 13px;
  background: #dceadd;
  color: #35644a;
}
.plan-header > div {
  flex: 1 1 280px;
}
.eyebrow {
  color: #a2684e;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
h3,
h4,
h5 {
  font-family: var(--font-heading);
  letter-spacing: -0.04em;
}
.plan-header h3 {
  margin-top: 0.3rem;
  color: #28523d;
  font-size: clamp(1.3rem, 2vw, 1.7rem);
}
.plan-header p:last-child {
  margin-top: 0.4rem;
  color: #697e6d;
  font-size: 0.77rem;
  line-height: 1.5;
}
.heading-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 41px;
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbdccd;
  border-radius: 10px;
  background: #fff;
  color: #356047;
  font: inherit;
  font-size: 0.73rem;
  font-weight: 800;
  cursor: pointer;
}
.heading-actions button:hover {
  background: #ecf5e9;
}
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid #4e8060;
  outline-offset: 2px;
}
.plan-body {
  display: grid;
  gap: 1.1rem;
  padding: 1.35rem 1.7rem 1.7rem;
}
.room-fields,
.wall-coverage,
.surface-card {
  min-width: 0;
  padding: 1.35rem;
  border: 1px solid #dce8db;
  border-radius: 16px;
  background: #f8faf4;
}
.wall-coverage {
  border-color: #e6ddce;
  background: #fbf7ee;
}
.wall-modes,
.wall-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.95rem;
}
.wall-modes label,
.wall-choice-grid label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid #dedfd3;
  border-radius: 11px;
  background: #fff;
  cursor: pointer;
}
.wall-modes label:has(input:checked),
.wall-choice-grid label:has(input:checked) {
  border-color: #80a985;
  background: #f0f6e9;
}
.wall-modes input,
.wall-choice-grid input {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  accent-color: #376c4e;
}
.wall-modes strong,
.wall-modes small,
.wall-choice-grid strong,
.wall-choice-grid small {
  display: block;
}
.wall-modes strong,
.wall-choice-grid strong {
  color: #355b43;
  font-size: 0.76rem;
}
.wall-modes small,
.wall-choice-grid small {
  margin-top: 0.2rem;
  color: #718274;
  font-size: 0.68rem;
}
.custom-walls {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed #cfdbcb;
  border-radius: 12px;
  background: #fffefa;
}
.tile-height-field {
  max-width: 20rem;
}
.wall-selection {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.wall-selection legend {
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
.wall-selection > p,
.field-hint {
  margin-top: 0.35rem;
  color: #718274;
  font-size: 0.71rem;
  line-height: 1.5;
}
.wall-diagram {
  display: grid;
  grid-template-columns: 34px minmax(90px, 180px) 34px;
  grid-template-rows: 25px 75px 25px;
  justify-content: center;
  margin: 0.75rem 0 0.2rem;
  color: #687b6b;
  font-size: 0.67rem;
  font-weight: 800;
}
.wall-diagram span {
  display: grid;
  place-items: center;
}
.wall-diagram-top {
  grid-area: 1 / 2;
  border-bottom: 3px solid #cbd8c9;
}
.wall-diagram-bottom {
  grid-area: 3 / 2;
  border-top: 3px solid #cbd8c9;
}
.wall-diagram-left {
  grid-area: 2 / 1;
  border-right: 3px solid #cbd8c9;
}
.wall-diagram-right {
  grid-area: 2 / 3;
  border-left: 3px solid #cbd8c9;
}
.wall-diagram .is-selected {
  border-color: #376c4e;
  color: #285b3d;
}
.wall-diagram-room {
  grid-area: 2 / 2;
  background: #f2f5ec;
  color: #93a396;
  font-size: 0.61rem;
  letter-spacing: 0.1em;
}
.wall-selection .geometry-error {
  color: #a6503d;
}
.openings-field {
  max-width: 32rem;
  margin-top: 1rem;
}
.opening-section {
  margin-top: 1.2rem;
  padding-top: 1.1rem;
  border-top: 1px solid #e2dfd3;
}
.opening-mode {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.opening-mode legend {
  color: #355b43;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
}
.opening-mode .wall-modes {
  margin-top: 0.6rem;
}
.detailed-openings {
  display: grid;
  gap: 0.8rem;
  margin-top: 0.95rem;
}
.opening-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.opening-actions button,
.opening-card-heading button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 37px;
  padding: 0.45rem 0.7rem;
  border: 1px solid #bfd2bf;
  border-radius: 9px;
  background: #fff;
  color: #315d42;
  font: inherit;
  font-size: 0.73rem;
  font-weight: 800;
  cursor: pointer;
}
.opening-actions button:hover,
.opening-card-heading button:hover {
  background: #eef6e9;
}
.opening-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.opening-card {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #dfd9cb;
  border-radius: 12px;
  background: #fffefa;
}
.opening-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}
.opening-card-heading h5 {
  color: #315d42;
  font-size: 0.98rem;
}
.opening-card-heading button {
  min-height: 33px;
  border-color: #eed8d0;
  color: #9b5849;
}
.opening-input-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 0.85rem;
}
.opening-input-grid select {
  width: 100%;
  min-height: 44px;
  padding: 0.45rem 0.6rem;
  border: 1px solid #ccddcc;
  border-radius: 9px;
  background: #fff;
  color: #244b37;
  font: inherit;
  font-size: 0.76rem;
}
.opening-impact,
.opening-total,
.empty-openings {
  padding: 0.75rem 0.9rem;
  border-radius: 9px;
  background: #eef5e8;
  color: #356149;
  font-size: 0.73rem;
  line-height: 1.5;
}
.opening-impact {
  margin-top: 0.85rem;
}
.opening-total strong {
  color: #26553d;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.section-heading h4,
.surface-heading h4 {
  margin-top: 0.25rem;
  color: #2c583f;
  font-size: 1.05rem;
}
.section-heading p:last-child,
.surface-intro {
  margin-top: 0.3rem;
  color: #728676;
  font-size: 0.72rem;
  line-height: 1.55;
}
.heading-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}
.field {
  min-width: 0;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.73rem;
  font-weight: 800;
}
.field label small {
  color: #7b8b7d;
  font-weight: 500;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0.45rem 0.6rem;
  border: 1px solid #ccddcc;
  border-radius: 9px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #58906a;
  box-shadow: 0 0 0 3px #58906a2d;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c97761;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #244b37;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #788b7b;
  font-size: 0.67rem;
  font-weight: 800;
}
.field-error,
.geometry-error {
  margin-top: 0.35rem;
  color: #a6503d;
  font-size: 0.71rem;
  line-height: 1.45;
}
.geometry-error {
  padding: 0.7rem 0.85rem;
  border: 1px solid #e5b4a4;
  border-radius: 9px;
  background: #fff5ee;
}
.surface-grid,
.result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.8rem;
}
.surface-card--walls {
  border-color: #e5d8c8;
  background: #fdf8f1;
}
.surface-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.surface-icon {
  display: grid;
  place-items: center;
  flex: 0 0 38px;
  height: 38px;
  border-radius: 10px;
  background: #e3eddf;
  color: #376346;
}
.surface-card--walls .surface-icon {
  background: #f3e5d8;
  color: #9a674e;
}
.results {
  padding: 1.4rem;
  border-radius: 17px;
  background: #265340;
  color: #fff;
}
.results .eyebrow {
  color: #bfe1c9;
}
.results h4 {
  color: #fff;
}
.area-summary {
  margin-top: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #ffffff30;
  border-radius: 10px;
  color: #d9eadb;
  font-size: 0.75rem;
  line-height: 1.5;
}
.area-summary strong {
  color: #fff;
}
.wall-breakdown {
  margin-top: 1.15rem;
}
.wall-breakdown-heading h5 {
  color: #fff;
  font-size: 1rem;
}
.wall-breakdown-heading p {
  margin-top: 0.25rem;
  color: #cde2d2;
  font-size: 0.72rem;
  line-height: 1.5;
}
.wall-breakdown-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.75rem;
}
.wall-breakdown-card {
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid #b7d4bd55;
  border-radius: 10px;
  background: #ffffff16;
}
.wall-breakdown-card--excluded {
  border-style: dashed;
  background: #ffffff0a;
}
.wall-breakdown-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.2rem 0.5rem;
}
.wall-breakdown-title h6 {
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.wall-breakdown-title small {
  color: #c6ddcb;
  font-size: 0.67rem;
}
.wall-breakdown-card dl {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.8rem;
}
.wall-breakdown-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
}
.wall-breakdown-card dt,
.wall-breakdown-card dd,
.excluded-note {
  font-size: 0.68rem;
}
.wall-breakdown-card dt {
  color: #c6ddcb;
}
.wall-breakdown-card dd {
  margin: 0;
  font-weight: 800;
  text-align: right;
}
.wall-breakdown-card .wall-net {
  padding-top: 0.45rem;
  border-top: 1px solid #ffffff36;
}
.excluded-note {
  margin-top: 0.75rem;
  color: #c6ddcb;
}
.unassigned-openings-note {
  margin-top: 0.7rem;
  color: #e8d7b6;
  font-size: 0.72rem;
  line-height: 1.5;
}
.result-grid {
  margin-top: 1rem;
}
.result-card {
  min-width: 0;
  padding: 1.1rem;
  border: 1px solid #ffffff30;
  border-radius: 12px;
  background: #ffffff15;
}
.result-card--walls {
  background: #a66a492e;
}
.result-card h5 {
  margin-top: 0.25rem;
  font-size: 1.05rem;
}
.result-count {
  display: block;
  margin-top: 0.7rem;
  font-family: var(--font-heading);
  font-size: 1.7rem;
}
.result-count small {
  font-size: 0.55em;
}
.result-card dl {
  display: grid;
  gap: 0.55rem;
  margin: 0.95rem 0 0;
}
.result-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.result-card dt {
  color: #cce2d1;
  font-size: 0.68rem;
}
.result-card dd {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: right;
}
.result-card a {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 1rem;
  color: #e4f4de;
  font-size: 0.73rem;
  font-weight: 800;
  text-underline-offset: 3px;
}
.cost-summary,
.cost-note {
  margin-top: 1rem;
  color: #e0eddf;
  font-size: 0.76rem;
  line-height: 1.5;
}
.cost-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem;
  border-radius: 9px;
  background: #ffffff1f;
}
.cost-summary strong {
  color: #fff;
  font-family: var(--font-heading);
}
.empty-result {
  margin-top: 0.9rem;
  color: #d3e7d6;
  font-size: 0.78rem;
}
.results :deep(.add-row) {
  margin-top: 1.1rem;
}
.results :deep(.room-picker label) {
  color: #e5f2df;
}
.results :deep(.add-button) {
  background: #fff;
  color: #28573e;
}
.results :deep(.add-row a) {
  color: #e5f2df;
}
.share-action {
  margin-top: 1rem;
}
.adhesive-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  color: #e5f2df;
  font-size: 0.83rem;
  font-weight: 800;
  text-underline-offset: 3px;
}
.caveat {
  margin-top: 1rem;
  color: #c7ddce;
  font-size: 0.7rem;
  line-height: 1.6;
}
@media (max-width: 850px) {
  .opening-input-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 1100px) {
  .wall-breakdown-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .plan-header {
    padding: 1.25rem;
  }
  .plan-body {
    padding: 1rem;
  }
  .room-fields,
  .wall-coverage,
  .surface-card,
  .results {
    padding: 1.1rem;
  }
  .field-grid {
    grid-template-columns: 1fr;
  }
  .wall-modes,
  .wall-choice-grid,
  .opening-input-grid,
  .wall-breakdown-grid {
    grid-template-columns: 1fr;
  }
  .cost-summary {
    flex-direction: column;
  }
}
</style>

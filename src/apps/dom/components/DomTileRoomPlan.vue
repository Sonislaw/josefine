<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef, watch } from 'vue'
import { ArrowUpRight, House, Layers3, Plus, RotateCcw } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import {
  calculateTileRoomPlan,
  type TileSurfaceInput,
  type TileSurfaceResult,
} from '../lib/tile-room'
import { domPath } from '../seo/useDomSeo'
import { useDomShoppingList, type ShoppingDraft } from '../stores/shoppingList'
import AddToDomShoppingList from './AddToDomShoppingList.vue'

type SurfaceKey = 'tileLength' | 'tileWidth' | 'waste' | 'tilesPerBox' | 'boxPrice'
type SurfaceForm = Record<SurfaceKey, string>
type RoomKey = 'length' | 'width' | 'height' | 'openings'

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

const props = defineProps<{
  baseTileLength: string
  baseTileWidth: string
  baseWaste: string
  baseRoomLength: string
  baseRoomWidth: string
  preferredRoomId?: string
}>()
const route = useRoute()
const shoppingList = useDomShoppingList()
const enabled = ref(false)
const started = ref(false)
const includeFloor = ref(true)
const includeWalls = ref(true)
const roomDefaults = { length: '5', width: '4', height: '2,5', openings: '0' }
const floorDefaults: SurfaceForm = {
  tileLength: '60',
  tileWidth: '60',
  waste: '10',
  tilesPerBox: '4',
  boxPrice: '',
}
const wallDefaults: SurfaceForm = {
  tileLength: '30',
  tileWidth: '60',
  waste: '10',
  tilesPerBox: '8',
  boxPrice: '',
}
const room = reactive<Record<RoomKey, string>>({ ...roomDefaults })
const floor = reactive<SurfaceForm>({ ...floorDefaults })
const walls = reactive<SurfaceForm>({ ...wallDefaults })
const savedRoom = computed(() =>
  shoppingList.rooms.find((entry) => entry.id === props.preferredRoomId && entry.dimensions),
)

const roomFields: FieldDefinition<RoomKey>[] = [
  { id: 'length', label: 'Długość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'width', label: 'Szerokość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'height', label: 'Wysokość pokoju', unit: 'm', min: 0, max: 1000, positive: true },
  { id: 'openings', label: 'Drzwi i okna łącznie', unit: 'm²', min: 0, max: 1_000_000 },
]
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
    ? 'Podaj powierzchnię otworów od 0 m².'
    : 'Podaj wymiar większy od 0 i nie większy niż 1000 m.'
}
function surfaceError(form: SurfaceForm, field: FieldDefinition<SurfaceKey>): string | null {
  if (validNumber(form[field.id], field)) return null
  if (field.id === 'boxPrice') return 'Podaj cenę od 0 do 100 000 zł albo zostaw pole puste.'
  if (field.id === 'tilesPerBox') return 'Wpisz całkowitą liczbę płytek w kartonie.'
  if (field.id === 'waste') return 'Wpisz zapas od 0% do 100%.'
  return 'Podaj wymiar większy od 0 i nie większy niż 300 cm.'
}
const openingError = computed(() => {
  if (!includeWalls.value) return null
  const length = parseDomNumber(room.length)
  const width = parseDomNumber(room.width)
  const height = parseDomNumber(room.height)
  const openings = parseDomNumber(room.openings)
  if (length === null || width === null || height === null || openings === null) return null
  if (length <= 0 || width <= 0 || height <= 0) return null
  return openings >= 2 * (length + width) * height
    ? 'Otwory nie mogą zajmować całej powierzchni ścian ani jej przekraczać.'
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
  if (!enabled.value || (!includeFloor.value && !includeWalls.value)) return null
  if (roomError(roomFields[0]!) || roomError(roomFields[1]!)) return null
  if (
    includeWalls.value &&
    (roomError(roomFields[2]!) || roomError(roomFields[3]!) || openingError.value)
  )
    return null
  const floorInput = includeFloor.value ? parseSurface(floor) : null
  const wallInput = includeWalls.value ? parseSurface(walls) : null
  if ((includeFloor.value && !floorInput) || (includeWalls.value && !wallInput)) return null
  return calculateTileRoomPlan({
    room: {
      length: parseDomNumber(room.length)!,
      width: parseDomNumber(room.width)!,
      height: includeWalls.value ? parseDomNumber(room.height)! : 2.5,
    },
    openings: includeWalls.value ? parseDomNumber(room.openings)! : 0,
    floor: floorInput,
    walls: wallInput,
  })
})

function purchaseItems(
  surface: 'floor' | 'walls',
  result: TileSurfaceResult | null | undefined,
): ShoppingDraft[] {
  if (!result) return []
  return [
    {
      kind: 'tileBoxes',
      quantity: result.boxCount,
      cost: result.estimatedCost,
      tileSurface: surface,
      tileLengthCm: result.tileLength,
      tileWidthCm: result.tileWidth,
      piecesPerBox: result.tilesPerBox,
    },
  ]
}
const floorShoppingItems = computed(() => purchaseItems('floor', plan.value?.floor))
const wallShoppingItems = computed(() => purchaseItems('walls', plan.value?.walls))
const views = computed(() => [
  ...(includeFloor.value
    ? [
        {
          id: 'floor' as const,
          title: 'Podłoga',
          label: 'PŁYTKI PODŁOGOWE',
          form: floor,
          result: plan.value?.floor,
          shoppingItems: floorShoppingItems.value,
        },
      ]
    : []),
  ...(includeWalls.value
    ? [
        {
          id: 'walls' as const,
          title: 'Ściany',
          label: 'PŁYTKI ŚCIENNE',
          form: walls,
          result: plan.value?.walls,
          shoppingItems: wallShoppingItems.value,
        },
      ]
    : []),
])

const planFlag: ShareField = {
  key: 'tileRoom',
  read: () => (enabled.value ? '1' : '0'),
  restore: (raw) => {
    if (raw !== '1' && raw !== '0') return
    enabled.value = raw === '1'
    if (enabled.value) started.value = true
  },
}
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
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  planFlag,
  booleanShareField('roomFloor', includeFloor),
  booleanShareField('roomWalls', includeWalls),
  textShareField('roomLength', toRef(room, 'length'), (raw) => validNumber(raw, roomFields[0]!)),
  textShareField('roomWidth', toRef(room, 'width'), (raw) => validNumber(raw, roomFields[1]!)),
  optionalField(
    'roomHeight',
    toRef(room, 'height'),
    () => includeWalls.value,
    '2,5',
    roomFields[2]!,
  ),
  optionalField(
    'roomOpenings',
    toRef(room, 'openings'),
    () => includeWalls.value,
    '0',
    roomFields[3]!,
  ),
  ...surfaceFields.flatMap((field) => [
    optionalField(
      `roomFloor${field.id}`,
      toRef(floor, field.id),
      () => includeFloor.value,
      floorDefaults[field.id],
      field,
    ),
    optionalField(
      `roomWalls${field.id}`,
      toRef(walls, field.id),
      () => includeWalls.value,
      wallDefaults[field.id],
      field,
    ),
  ]),
])

// A clean URL on the same route closes the optional panel; old input state remains editable.
onMounted(() => {
  if (route.query.tileRoom !== '1') enabled.value = false
})
watch(
  () => route.fullPath,
  () => {
    if (route.query.tileRoom !== '1') enabled.value = false
  },
)

function useSavedRoom() {
  const dimensions = savedRoom.value?.dimensions
  if (!dimensions) return
  room.length = String(dimensions.length)
  room.width = String(dimensions.width)
  room.height = String(dimensions.height)
}
function startPlan() {
  if (!started.value) {
    useSavedRoom()
    if (!savedRoom.value?.dimensions) {
      const length = parseDomNumber(props.baseRoomLength)
      const width = parseDomNumber(props.baseRoomWidth)
      if (length !== null && length > 0) room.length = props.baseRoomLength
      if (width !== null && width > 0) room.width = props.baseRoomWidth
    }
    if (validNumber(props.baseTileLength, surfaceFields[0]!))
      floor.tileLength = props.baseTileLength
    if (validNumber(props.baseTileWidth, surfaceFields[1]!)) floor.tileWidth = props.baseTileWidth
    if (validNumber(props.baseWaste, surfaceFields[2]!)) floor.waste = props.baseWaste
    started.value = true
  }
  enabled.value = true
}
function reset() {
  Object.assign(room, roomDefaults)
  Object.assign(floor, floorDefaults)
  Object.assign(walls, wallDefaults)
  includeFloor.value = true
  includeWalls.value = true
}
const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
function groutLink(surface: NonNullable<(typeof views.value)[number]['result']>) {
  return {
    path: domPath('/kalkulator-fugi'),
    query: {
      area: String(surface.area),
      tileLength: String(surface.tileLength),
      tileWidth: String(surface.tileWidth),
      ...(props.preferredRoomId ? { roomId: props.preferredRoomId } : {}),
    },
  }
}
</script>

<template>
  <section class="room-plan" aria-labelledby="tile-room-title">
    <div class="plan-header">
      <span class="header-icon"><House :size="22" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">JEDEN POKÓJ, DWIE POWIERZCHNIE</p>
        <h3 id="tile-room-title">Zaplanuj płytki w całym pomieszczeniu</h3>
        <p>Podłoga i ściany mogą mieć inny format, zapas, kartony i cenę.</p>
      </div>
      <button
        v-if="!enabled"
        type="button"
        class="toggle-button"
        :aria-expanded="false"
        @click="startPlan"
      >
        <Plus :size="17" aria-hidden="true" /> Policz cały pokój
      </button>
      <button
        v-else
        type="button"
        class="toggle-button"
        :aria-expanded="true"
        @click="enabled = false"
      >
        Ukryj plan
      </button>
    </div>

    <div v-if="enabled" class="plan-body">
      <div class="room-fields">
        <div class="section-heading">
          <div>
            <p class="eyebrow">01 / POMIAR</p>
            <h4>Wymiary pomieszczenia</h4>
            <p>Ściany liczymy do pełnej podanej wysokości; otwory odejmujemy tylko od ścian.</p>
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
            v-for="field in roomFields.filter(
              (item) => item.id === 'length' || item.id === 'width' || includeWalls,
            )"
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
                :aria-invalid="!!roomError(field) || (field.id === 'openings' && !!openingError)"
                :aria-describedby="roomError(field) ? `tile-room-help-${field.id}` : undefined"
              /><span>{{ field.unit }}</span>
            </div>
            <p v-if="roomError(field)" :id="`tile-room-help-${field.id}`" class="field-error">
              {{ roomError(field) }}
            </p>
          </div>
        </div>
        <p v-if="openingError" class="geometry-error" role="alert">{{ openingError }}</p>
      </div>

      <div class="surface-switches" role="group" aria-label="Powierzchnie do ułożenia">
        <label
          ><input v-model="includeFloor" type="checkbox" /><span
            ><strong>Podłoga</strong><small>Długość × szerokość</small></span
          ></label
        >
        <label
          ><input v-model="includeWalls" type="checkbox" /><span
            ><strong>Ściany</strong><small>Obwód × wysokość − otwory</small></span
          ></label
        >
      </div>
      <p v-if="!includeFloor && !includeWalls" class="geometry-error" role="alert">
        Wybierz co najmniej jedną powierzchnię.
      </p>

      <div class="surface-grid">
        <div
          v-for="view in views"
          :key="view.id"
          class="surface-card"
          :class="`surface-card--${view.id}`"
        >
          <div class="surface-heading">
            <span class="surface-icon"><Layers3 :size="19" aria-hidden="true" /></span>
            <div>
              <p class="eyebrow">{{ view.label }}</p>
              <h4>{{ view.title }}</h4>
            </div>
          </div>
          <p class="surface-intro">
            Podaj produkt przeznaczony dla tej powierzchni. Wielkości opakowań nie mieszamy między
            podłogą a ścianami.
          </p>
          <div class="field-grid">
            <div v-for="field in surfaceFields" :key="field.id" class="field">
              <label :for="`tile-room-${view.id}-${field.id}`"
                >{{ field.label }} <small v-if="field.optional">opcjonalnie</small></label
              >
              <div class="input-wrap">
                <input
                  :id="`tile-room-${view.id}-${field.id}`"
                  v-model="view.form[field.id]"
                  type="text"
                  :inputmode="field.integer ? 'numeric' : 'decimal'"
                  autocomplete="off"
                  :aria-invalid="!!surfaceError(view.form, field)"
                  :aria-describedby="
                    surfaceError(view.form, field)
                      ? `tile-room-help-${view.id}-${field.id}`
                      : undefined
                  "
                /><span>{{ field.unit }}</span>
              </div>
              <p
                v-if="surfaceError(view.form, field)"
                :id="`tile-room-help-${view.id}-${field.id}`"
                class="field-error"
              >
                {{ surfaceError(view.form, field) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="results" aria-live="polite">
        <div class="section-heading">
          <div>
            <p class="eyebrow">02 / WYNIK</p>
            <h4>Osobne zakupy dla każdej powierzchni</h4>
          </div>
        </div>
        <template v-if="plan">
          <div v-if="plan.walls" class="area-summary">
            Ściany: {{ formatArea(plan.grossWalls) }} m² przed odjęciem otworów −
            {{ formatArea(plan.openings) }} m² =
            <strong>{{ formatArea(plan.netWalls) }} m²</strong> do ułożenia.
          </div>
          <div class="result-grid">
            <article
              v-for="view in views"
              :key="view.id"
              class="result-card"
              :class="`result-card--${view.id}`"
            >
              <p class="eyebrow">{{ view.label }}</p>
              <h5>{{ view.title }}</h5>
              <strong class="result-count"
                >{{ formatCount(view.result!.boxCount) }} <small>kart.</small></strong
              >
              <dl>
                <div>
                  <dt>Powierzchnia</dt>
                  <dd>{{ formatArea(view.result!.area) }} m²</dd>
                </div>
                <div>
                  <dt>Płytki z zapasem {{ view.form.waste }}%</dt>
                  <dd>{{ formatCount(view.result!.tileCount) }} szt.</dd>
                </div>
                <div>
                  <dt>W zakupionych kartonach</dt>
                  <dd>{{ formatCount(view.result!.purchasedTiles) }} szt.</dd>
                </div>
                <div>
                  <dt>Nadwyżka ponad zapas</dt>
                  <dd>{{ formatCount(view.result!.spareTiles) }} szt.</dd>
                </div>
                <div>
                  <dt>Koszt</dt>
                  <dd>
                    {{
                      view.result!.estimatedCost === null
                        ? 'Cena niepodana'
                        : formatMoney(view.result!.estimatedCost)
                    }}
                  </dd>
                </div>
              </dl>
              <RouterLink :to="groutLink(view.result!)"
                >Policz fugę dla {{ view.id === 'floor' ? 'podłogi' : 'ścian' }}
                <ArrowUpRight :size="15" aria-hidden="true"
              /></RouterLink>
              <AddToDomShoppingList
                :items="view.shoppingItems"
                :preferred-room-id="preferredRoomId"
                :label="view.id === 'floor' ? 'Dodaj płytki podłogowe' : 'Dodaj płytki ścienne'"
              />
            </article>
          </div>
          <div v-if="plan.missingPriceCount === 0" class="cost-summary">
            Łączny koszt podanych kartonów <strong>{{ formatMoney(plan.knownCost) }}</strong>
          </div>
          <p v-else-if="plan.knownCost > 0" class="cost-note">
            Suma znanych cen: {{ formatMoney(plan.knownCost) }}. Brakuje ceny dla
            {{ plan.missingPriceCount }} powierzchni — to nie jest pełny koszt.
          </p>
          <p v-else class="cost-note">Dodaj ceny kartonów, aby zobaczyć koszt zakupu.</p>
        </template>
        <p v-else class="empty-result">
          Sprawdź wymiary pokoju, wybrane powierzchnie i dane kartonów, aby zobaczyć plan.
        </p>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!plan || !canShareInputs"
          class="share-action"
        />
        <p class="caveat">
          To szacunek dla prostokątnego pokoju i jednego rodzaju płytki na każdej wybranej
          powierzchni. Nie uwzględnia narożnych docinek, wnęk, skosów, wzoru układania ani fug.
          Zapas płytek ustaw osobno dla podłogi i ścian.
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
.toggle-button,
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
.toggle-button:hover,
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
.surface-card {
  min-width: 0;
  padding: 1.35rem;
  border: 1px solid #dce8db;
  border-radius: 16px;
  background: #f8faf4;
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
.surface-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}
.surface-switches label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1 1 180px;
  padding: 0.8rem 1rem;
  border: 1px solid #dbe5d8;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
}
.surface-switches input {
  width: 18px;
  height: 18px;
  accent-color: #376c4e;
}
.surface-switches strong,
.surface-switches small {
  display: block;
}
.surface-switches strong {
  color: #315a42;
  font-size: 0.8rem;
}
.surface-switches small {
  margin-top: 0.15rem;
  color: #788979;
  font-size: 0.68rem;
}
.surface-grid,
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
.caveat {
  margin-top: 1rem;
  color: #c7ddce;
  font-size: 0.7rem;
  line-height: 1.6;
}
@media (max-width: 850px) {
  .surface-grid,
  .result-grid {
    grid-template-columns: 1fr;
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
  .surface-card,
  .results {
    padding: 1.1rem;
  }
  .field-grid {
    grid-template-columns: 1fr;
  }
  .cost-summary {
    flex-direction: column;
  }
}
</style>

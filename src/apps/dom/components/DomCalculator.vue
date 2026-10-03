<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref, toRef, watch } from 'vue'
import { ArrowUpRight, RotateCcw, Sparkles } from '@lucide/vue'
import { RouterLink, useRoute } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  choiceShareField,
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import {
  calculateCompositeArea,
  parseAreaFragments,
  serializeAreaFragments,
  type AreaFragment,
} from '../lib/composite-area'
import type { VolumeRoomInput } from '../lib/multi-room-volume'
import {
  calculateDom,
  domCalculators,
  formatDomResult,
  parseDomNumber,
  type InputField,
  type ResultRow,
} from '../lib/calculations'
import {
  calculateMeterUsage,
  calculateSplitWaterCost,
  parseDailyHours,
  parseDaysPerWeek,
  parseWaterRate,
} from '../lib/practical'
import { calculateSkirtingPlan } from '../lib/skirting'
import { calculateRoomMetrics, parseRoomDimension, type RoomDimensions } from '../lib/room-metrics'
import type { TileOrientation } from '../lib/tile-layout'
import { isValidOptionalPaintCanPrice, parsePaintCanSize } from '../lib/paint-purchase'
import type { DomBasicToolId } from '../manifest'
import { domPath } from '../seo/useDomSeo'
import DomEnergyProjection from './DomEnergyProjection.vue'
import DomWaterMeter from './DomWaterMeter.vue'
import DomRoomPicker from './DomRoomPicker.vue'
import type { ShoppingRoom } from '../stores/shoppingList'

// Rozbudowane plany zakupów pobieramy tylko na stronach odpowiednich materiałów.
const DomPanelPurchasePlan = defineAsyncComponent(() => import('./DomPanelPurchasePlan.vue'))
const DomTilePurchasePlan = defineAsyncComponent(() => import('./DomTilePurchasePlan.vue'))
const DomTileLayoutPreview = defineAsyncComponent(() => import('./DomTileLayoutPreview.vue'))
const DomSkirtingPlan = defineAsyncComponent(() => import('./DomSkirtingPlan.vue'))
const DomCompositeArea = defineAsyncComponent(() => import('./DomCompositeArea.vue'))
const DomMultiRoomVolume = defineAsyncComponent(() => import('./DomMultiRoomVolume.vue'))
const DomWaterRates = defineAsyncComponent(() => import('./DomWaterRates.vue'))
const DomPaintPurchasePlan = defineAsyncComponent(() => import('./DomPaintPurchasePlan.vue'))

const props = defineProps<{
  toolId: DomBasicToolId
  preferredRoomId?: string
  roomPrefill?: RoomDimensions | null
}>()
const route = useRoute()
const definition = domCalculators[props.toolId]
const form = reactive<Record<string, string>>(
  Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue])),
)
const dailyHours = ref('3')
const daysPerWeek = ref('7')
const meterPrevious = ref('')
const meterCurrent = ref('')
const waterMode = ref<'combined' | 'split'>('combined')
const waterRate = ref('6,20')
const sewageRate = ref('11,50')
const panelPackPrice = ref('')
const includeUnderlay = ref(false)
const underlayCoverage = ref('10')
const underlayPackPrice = ref('')
const includeBoxes = ref(false)
const tilesPerBox = ref('4')
const boxPrice = ref('')
const tileLayoutEnabled = ref(false)
const tileRoomLength = ref('')
const tileRoomWidth = ref('')
const tileOrientation = ref<TileOrientation>('standard')
const openings = ref('0')
const boardLength = ref('2,4')
const reserve = ref('10')
const boardPrice = ref('')
const compositeEnabled = ref(false)
const areaFragments = ref<AreaFragment[]>([])
const volumeEnabled = ref(false)
const volumeRooms = ref<VolumeRoomInput[]>([])
const paintCanSize = defineModel<string>('paintCanSize', { default: '5' })
const paintCanPrice = defineModel<string>('paintCanPrice', { default: '' })
const selectedRoomId = ref('')
const effectiveRoomId = computed(() => props.preferredRoomId ?? selectedRoomId.value)

function useRoom(room: ShoppingRoom | null) {
  if (!room?.dimensions) return
  const metrics = calculateRoomMetrics(room.dimensions)
  if (!metrics) return

  if (props.toolId === 'liczba-paczek-paneli' || props.toolId === 'liczba-plytek') {
    form.area = String(Number(metrics.floor.toFixed(6)))
  }
  if (props.toolId === 'liczba-plytek') {
    tileRoomLength.value = String(room.dimensions.length)
    tileRoomWidth.value = String(room.dimensions.width)
    tileOrientation.value = 'standard'
    tileLayoutEnabled.value = room.dimensions.length >= 0.01 && room.dimensions.width >= 0.01
  }
  if (props.toolId === 'obwod-prostokata') {
    form.length = String(room.dimensions.length)
    form.width = String(room.dimensions.width)
  }
}

watch(
  () => props.roomPrefill,
  (dimensions) => {
    if (props.toolId !== 'ilosc-farby' || !dimensions) return
    const metrics = calculateRoomMetrics(dimensions)
    if (metrics) form.area = String(Number(metrics.walls.toFixed(6)))
  },
)

const fragmentsShareField: ShareField = {
  key: 'parts',
  read: () => (compositeEnabled.value ? serializeAreaFragments(areaFragments.value) : ''),
  restore: (raw) => {
    const restored = parseAreaFragments(raw)
    if (restored !== null) areaFragments.value = restored
  },
}

// Pola nieaktywnego podkładu nie powinny blokować linku do wyniku ani zapisywać starych błędów.
const shareUnderlayCoverage = computed({
  get: () => (includeUnderlay.value ? underlayCoverage.value : '10'),
  set: (value: string) => {
    underlayCoverage.value = value
  },
})
const shareUnderlayPackPrice = computed({
  get: () => (includeUnderlay.value ? underlayPackPrice.value : ''),
  set: (value: string) => {
    underlayPackPrice.value = value
  },
})
const shareTilesPerBox = computed({
  get: () => (includeBoxes.value ? tilesPerBox.value : '4'),
  set: (value: string) => {
    tilesPerBox.value = value
  },
})
const shareBoxPrice = computed({
  get: () => (includeBoxes.value ? boxPrice.value : ''),
  set: (value: string) => {
    boxPrice.value = value
  },
})
const validOptionalPrice = (raw: string) => raw.trim() === '' || parseDomNumber(raw) !== null
const validPreviewDimension = (raw: string) => {
  const value = parseRoomDimension(raw)
  return value !== null && value >= 0.01
}
// Invalid optional preview values never prevent sharing the main calculator result.
const tileLayoutShareField: ShareField = {
  key: 'showLayout',
  read: () =>
    tileLayoutEnabled.value &&
    validPreviewDimension(tileRoomLength.value) &&
    validPreviewDimension(tileRoomWidth.value)
      ? '1'
      : '0',
  restore: (raw) => {
    if (raw === '1' || raw === '0') tileLayoutEnabled.value = raw === '1'
  },
}
const tileRoomLengthShareField: ShareField = {
  key: 'roomLength',
  read: () =>
    tileLayoutEnabled.value && validPreviewDimension(tileRoomLength.value)
      ? tileRoomLength.value
      : '',
  restore: (raw) => {
    if (raw === '' || validPreviewDimension(raw)) tileRoomLength.value = raw
  },
}
const tileRoomWidthShareField: ShareField = {
  key: 'roomWidth',
  read: () =>
    tileLayoutEnabled.value && validPreviewDimension(tileRoomWidth.value)
      ? tileRoomWidth.value
      : '',
  restore: (raw) => {
    if (raw === '' || validPreviewDimension(raw)) tileRoomWidth.value = raw
  },
}
watch(
  () => route.fullPath,
  () => {
    if (props.toolId !== 'liczba-plytek') return
    // A second URL on the same calculator must not inherit an earlier room preview.
    tileLayoutEnabled.value = false
    tileRoomLength.value = ''
    tileRoomWidth.value = ''
    tileOrientation.value = 'standard'
  },
)
watch(
  () => route.fullPath,
  () => {
    if (props.toolId === 'koszt-wody' && route.query.mode !== 'split') waterMode.value = 'combined'
  },
)
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  ...definition.fields.map((field): ShareField => {
    const shared = textShareField(
      field.id,
      toRef(form, field.id),
      (raw) => parseDomNumber(raw) !== null,
    )
    return props.toolId === 'koszt-wody' && field.id === 'price'
      ? { ...shared, read: () => (waterMode.value === 'split' ? '' : shared.read()) }
      : shared
  }),
  ...(props.toolId === 'koszt-pradu'
    ? [
        textShareField('dailyHours', dailyHours, (raw) => parseDailyHours(raw) !== null),
        textShareField('daysPerWeek', daysPerWeek, (raw) => parseDaysPerWeek(raw) !== null),
      ]
    : []),
  ...(props.toolId === 'koszt-wody'
    ? [
        choiceShareField('mode', waterMode, ['combined', 'split']),
        ...(['waterRate', 'sewageRate'] as const).map((key): ShareField => ({
          key,
          read: () => {
            if (waterMode.value !== 'split') return ''
            const raw = key === 'waterRate' ? waterRate.value : sewageRate.value
            return raw.length <= 100 && parseWaterRate(raw) !== null ? raw : null
          },
          restore: (raw) => {
            if (raw.length > 100 || parseWaterRate(raw) === null) return
            if (key === 'waterRate') waterRate.value = raw
            else sewageRate.value = raw
          },
        })),
        textShareField(
          'meterPrevious',
          meterPrevious,
          (raw) => raw === '' || parseDomNumber(raw) !== null,
        ),
        textShareField(
          'meterCurrent',
          meterCurrent,
          (raw) => raw === '' || parseDomNumber(raw) !== null,
        ),
      ]
    : []),
  ...(props.toolId === 'liczba-paczek-paneli'
    ? [
        textShareField('packPrice', panelPackPrice, validOptionalPrice),
        booleanShareField('includeUnderlay', includeUnderlay),
        textShareField('underlayCoverage', shareUnderlayCoverage, (raw) => {
          const value = parseDomNumber(raw)
          return value !== null && value > 0
        }),
        textShareField('underlayPackPrice', shareUnderlayPackPrice, validOptionalPrice),
      ]
    : []),
  ...(props.toolId === 'liczba-plytek'
    ? [
        tileLayoutShareField,
        tileRoomLengthShareField,
        tileRoomWidthShareField,
        choiceShareField('tileOrientation', tileOrientation, ['standard', 'rotated']),
        booleanShareField('includeBoxes', includeBoxes),
        textShareField('tilesPerBox', shareTilesPerBox, (raw) => {
          const value = parseDomNumber(raw)
          return value !== null && Number.isSafeInteger(value) && value > 0
        }),
        textShareField('boxPrice', shareBoxPrice, validOptionalPrice),
      ]
    : []),
  ...(props.toolId === 'obwod-prostokata'
    ? [
        textShareField('openings', openings, (raw) => parseDomNumber(raw) !== null),
        textShareField('boardLength', boardLength, (raw) => {
          const value = parseDomNumber(raw)
          return value !== null && value > 0
        }),
        textShareField('reserve', reserve, (raw) => parseDomNumber(raw) !== null),
        textShareField('boardPrice', boardPrice, validOptionalPrice),
      ]
    : []),
  ...(props.toolId === 'ilosc-farby'
    ? [
        textShareField('canSize', paintCanSize, (raw) => parsePaintCanSize(raw) !== null),
        textShareField('canPrice', paintCanPrice, isValidOptionalPaintCanPrice),
      ]
    : []),
  ...(props.toolId === 'powierzchnia-prostokata'
    ? [booleanShareField('multi', compositeEnabled), fragmentsShareField]
    : []),
])
function buildCalculatorShareUrl() {
  if (props.toolId !== 'koszt-wody') return buildShareUrl()
  const url = new URL(buildShareUrl())
  if (waterMode.value === 'split') url.searchParams.delete('price')
  else {
    url.searchParams.delete('waterRate')
    url.searchParams.delete('sewageRate')
  }
  return url.href
}
const canSharePractical = computed(() => {
  if (props.toolId !== 'koszt-wody') return true
  if (meterPrevious.value === '' && meterCurrent.value === '') return true
  return calculateMeterUsage(meterPrevious.value, meterCurrent.value) !== null
})

function errorFor(field: InputField): string | null {
  const value = parseDomNumber(form[field.id] ?? '')
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz liczbę większą od zera.'
  if (field.integer && !Number.isInteger(value)) return 'Wpisz liczbę całkowitą.'
  return null
}

const visibleFields = computed(() =>
  props.toolId === 'koszt-wody' && waterMode.value === 'split'
    ? definition.fields.filter((field) => field.id !== 'price')
    : definition.fields,
)
const results = computed<ResultRow[] | null>(() => {
  const values: Record<string, number> = {}
  for (const field of visibleFields.value) {
    if (errorFor(field)) return null
    values[field.id] = parseDomNumber(form[field.id]!)!
  }
  if (props.toolId === 'koszt-wody' && waterMode.value === 'split') {
    const volume = values.volume
    if (volume === undefined) return null
    const split = calculateSplitWaterCost(
      volume,
      parseWaterRate(waterRate.value),
      parseWaterRate(sewageRate.value),
    )
    if (!split) return null
    const rows: ResultRow[] = [
      { label: 'Szacowany koszt', value: split.totalCost, unit: 'zł', kind: 'money' },
      { label: 'Woda', value: split.waterCost, unit: 'zł', kind: 'money' },
      { label: 'Ścieki', value: split.sewageCost, unit: 'zł', kind: 'money' },
      { label: 'Zużycie w litrach', value: volume * 1000, unit: 'l' },
    ]
    return rows.every((row) => Number.isFinite(row.value)) ? rows : null
  }
  const rows = calculateDom(props.toolId, values)
  return rows.every((row) => Number.isFinite(row.value)) ? rows : null
})
const compositeResult = computed(() => calculateCompositeArea(areaFragments.value))

const canShareSkirting = computed(() => {
  if (props.toolId !== 'obwod-prostokata') return true
  const perimeter = results.value?.[0]?.value
  if (perimeter === undefined) return false
  return (
    calculateSkirtingPlan({
      perimeter,
      openings: parseDomNumber(openings.value)!,
      boardLength: parseDomNumber(boardLength.value)!,
      reserve: parseDomNumber(reserve.value)!,
      boardPrice: boardPrice.value.trim() === '' ? null : parseDomNumber(boardPrice.value),
    }) !== null
  )
})

const nextTools = computed(() => {
  if (props.toolId !== 'powierzchnia-prostokata') return []
  const value = compositeEnabled.value ? compositeResult.value?.total : results.value?.[0]?.value
  if (value === undefined || !Number.isFinite(value) || value <= 0) return []
  const area = String(Number(value.toFixed(9)))
  if (Number(area) <= 0) return []
  const destinations = [
    { title: 'Panele', detail: 'Jeśli mierzysz podłogę', path: '/liczba-paczek-paneli' },
    { title: 'Płytki', detail: 'Na podłogę lub ścianę', path: '/liczba-plytek' },
    { title: 'Farba', detail: 'Jeśli mierzysz ścianę', path: '/ilosc-farby' },
  ]
  return (compositeEnabled.value ? destinations.slice(0, 2) : destinations).map((item) => ({
    ...item,
    to: { path: domPath(item.path), query: { area } },
  }))
})

function reset() {
  for (const field of definition.fields) form[field.id] = field.defaultValue
  dailyHours.value = '3'
  daysPerWeek.value = '7'
  meterPrevious.value = ''
  meterCurrent.value = ''
  waterMode.value = 'combined'
  waterRate.value = '6,20'
  sewageRate.value = '11,50'
  panelPackPrice.value = ''
  includeUnderlay.value = false
  underlayCoverage.value = '10'
  underlayPackPrice.value = ''
  includeBoxes.value = false
  tilesPerBox.value = '4'
  boxPrice.value = ''
  tileLayoutEnabled.value = false
  tileRoomLength.value = ''
  tileRoomWidth.value = ''
  tileOrientation.value = 'standard'
  openings.value = '0'
  boardLength.value = '2,4'
  reserve.value = '10'
  boardPrice.value = ''
  compositeEnabled.value = false
  areaFragments.value = []
  volumeEnabled.value = false
  volumeRooms.value = []
  if (props.toolId === 'ilosc-farby') {
    paintCanSize.value = '5'
    paintCanPrice.value = ''
  }
}

function useMeterVolume(volume: number) {
  if (volume > 0) form.volume = String(volume)
}
</script>

<template>
  <DomRoomPicker
    v-if="
      toolId === 'liczba-paczek-paneli' ||
      toolId === 'liczba-plytek' ||
      toolId === 'obwod-prostokata'
    "
    v-model="selectedRoomId"
    @choose="useRoom"
  />
  <DomCompositeArea
    v-if="toolId === 'powierzchnia-prostokata'"
    v-model:enabled="compositeEnabled"
    v-model:fragments="areaFragments"
    :base-length="form.length ?? ''"
    :base-width="form.width ?? ''"
    :get-share-url="buildShareUrl"
    :can-share="canShareInputs"
  />
  <DomMultiRoomVolume
    v-if="toolId === 'objetosc-pomieszczenia'"
    v-model:enabled="volumeEnabled"
    v-model:rooms="volumeRooms"
    :base-length="form.length ?? ''"
    :base-width="form.width ?? ''"
    :base-height="form.height ?? ''"
  />
  <section
    v-if="
      (toolId !== 'powierzchnia-prostokata' || !compositeEnabled) &&
      (toolId !== 'objetosc-pomieszczenia' || !volumeEnabled)
    "
    class="calculator"
    aria-labelledby="calculator-title"
  >
    <div class="calculator-header">
      <div>
        <p class="section-kicker"><Sparkles :size="14" aria-hidden="true" /> KALKULATOR</p>
        <h2 id="calculator-title">Twoje dane, Twój wynik</h2>
      </div>
      <button type="button" class="reset-button" @click="reset">
        <RotateCcw :size="16" aria-hidden="true" /> <span>Przywróć przykład</span>
      </button>
    </div>
    <div class="calculator-grid">
      <div class="input-panel">
        <div class="panel-heading">
          <span class="panel-index">01</span>
          <div>
            <strong>Wprowadź wartości</strong>
            <p>Obliczenia aktualizują się automatycznie.</p>
          </div>
        </div>
        <DomWaterRates
          v-if="toolId === 'koszt-wody'"
          v-model:mode="waterMode"
          v-model:water-rate="waterRate"
          v-model:sewage-rate="sewageRate"
        />
        <div class="fields">
          <div v-for="field in visibleFields" :key="field.id" class="field">
            <label :for="`dom-${field.id}`">{{ field.label }}</label>
            <div class="input-wrap">
              <input
                :id="`dom-${field.id}`"
                v-model="form[field.id]"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                :aria-invalid="!!errorFor(field)"
                :aria-describedby="
                  field.hint || errorFor(field) ? `dom-help-${field.id}` : undefined
                "
              /><span aria-hidden="true">{{ field.unit }}</span>
            </div>
            <p
              v-if="field.hint || errorFor(field)"
              :id="`dom-help-${field.id}`"
              class="field-help"
              :class="{ 'field-help--error': !!errorFor(field) }"
            >
              {{ errorFor(field) ?? field.hint }}
            </p>
          </div>
        </div>
        <p class="input-note">Możesz użyć przecinka lub kropki dziesiętnej.</p>
      </div>
      <div class="output-panel" aria-live="polite">
        <div class="panel-heading">
          <span class="panel-index">02</span>
          <div>
            <strong>Sprawdź wynik</strong>
            <p>Przeliczone na podstawie wpisanych danych.</p>
          </div>
        </div>
        <template v-if="results"
          ><div class="primary-result">
            <span>{{ results[0]!.label }}</span
            ><strong
              >{{ formatDomResult(results[0]!) }} <small>{{ results[0]!.unit }}</small></strong
            >
          </div>
          <div v-if="results.length > 1" class="secondary-results">
            <div v-for="row in results.slice(1)" :key="row.label">
              <span>{{ row.label }}</span
              ><strong>{{ formatDomResult(row) }} {{ row.unit }}</strong>
            </div>
          </div></template
        >
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>Popraw zaznaczone pola, aby zobaczyć wynik.</p>
        </div>
        <ShareResultButton
          :get-url="buildCalculatorShareUrl"
          :disabled="!results || !canShareInputs || !canSharePractical || !canShareSkirting"
          class="share-action"
        />
        <p class="output-note">
          {{
            toolId === 'koszt-wody' && waterMode === 'split'
              ? 'Zakładamy takie samo zużycie dla wody i ścieków. Wynik nie obejmuje opłat stałych ani innych pozycji rachunku.'
              : definition.note
          }}
        </p>
      </div>
    </div>
    <div class="formula-strip">
      <span>WZÓR</span
      ><strong>{{
        toolId === 'koszt-wody' && waterMode === 'split'
          ? 'zużycie × cena wody + zużycie × cena ścieków'
          : definition.formula
      }}</strong
      ><small>{{
        toolId === 'koszt-wody' && waterMode === 'split'
          ? '5 m³ × 6,20 zł/m³ + 5 m³ × 11,50 zł/m³ = 88,50 zł'
          : definition.example
      }}</small>
    </div>
  </section>
  <section v-if="nextTools.length" class="next-tools" aria-labelledby="next-tools-title">
    <div>
      <p class="section-kicker">CO DALEJ Z METRAŻEM?</p>
      <h3 id="next-tools-title">Przenieś ten wynik do kolejnego kalkulatora</h3>
    </div>
    <div class="next-tools-grid">
      <RouterLink v-for="item in nextTools" :key="item.title" :to="item.to">
        <span
          ><strong>{{ item.title }}</strong
          ><small>{{ item.detail }}</small></span
        >
        <ArrowUpRight :size="18" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
  <DomEnergyProjection
    v-if="toolId === 'koszt-pradu'"
    v-model:daily-hours="dailyHours"
    v-model:days-per-week="daysPerWeek"
    :power="parseDomNumber(form.power ?? '')"
    :price="parseDomNumber(form.price ?? '')"
  />
  <DomWaterMeter
    v-if="toolId === 'koszt-wody'"
    v-model:previous="meterPrevious"
    v-model:current="meterCurrent"
    @use-volume="useMeterVolume"
  />
  <DomPanelPurchasePlan
    v-if="toolId === 'liczba-paczek-paneli'"
    v-model:pack-price="panelPackPrice"
    v-model:include-underlay="includeUnderlay"
    v-model:underlay-coverage="underlayCoverage"
    v-model:underlay-pack-price="underlayPackPrice"
    :area="parseDomNumber(form.area ?? '')"
    :pack-coverage="parseDomNumber(form.packCoverage ?? '')"
    :waste="parseDomNumber(form.waste ?? '')"
    :preferred-room-id="effectiveRoomId"
  />
  <DomTileLayoutPreview
    v-if="toolId === 'liczba-plytek'"
    v-model:enabled="tileLayoutEnabled"
    v-model:room-length="tileRoomLength"
    v-model:room-width="tileRoomWidth"
    v-model:orientation="tileOrientation"
    :tile-length="parseDomNumber(form.tileLength ?? '')"
    :tile-width="parseDomNumber(form.tileWidth ?? '')"
    :calculator-area="parseDomNumber(form.area ?? '')"
    @apply-area="form.area = $event"
  />
  <DomTilePurchasePlan
    v-if="toolId === 'liczba-plytek'"
    v-model:include-boxes="includeBoxes"
    v-model:tiles-per-box="tilesPerBox"
    v-model:box-price="boxPrice"
    :tiles-needed="results?.[0]?.value ?? null"
    :preferred-room-id="effectiveRoomId"
  />
  <DomSkirtingPlan
    v-if="toolId === 'obwod-prostokata'"
    v-model:openings="openings"
    v-model:board-length="boardLength"
    v-model:reserve="reserve"
    v-model:board-price="boardPrice"
    :perimeter="results?.[0]?.value ?? null"
    :preferred-room-id="effectiveRoomId"
  />
  <DomPaintPurchasePlan
    v-if="toolId === 'ilosc-farby'"
    v-model:can-size="paintCanSize"
    v-model:can-price="paintCanPrice"
    :required-liters="results?.[1]?.value ?? null"
    id-prefix="paint-area"
    :preferred-room-id="effectiveRoomId"
  />
</template>

<style scoped>
.next-tools {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1.25rem;
  padding: 1.6rem 2rem;
  border: 1px solid #dfe8d9;
  border-radius: 20px;
  background: #f5f8ef;
}
.next-tools h3 {
  margin-top: 0.35rem;
  color: #2b523b;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.next-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.next-tools-grid a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.8rem;
  border: 1px solid #d2e1ce;
  border-radius: 12px;
  background: #fffefa;
  color: #2c6243;
  text-decoration: none;
}
.next-tools-grid a:hover,
.next-tools-grid a:focus-visible {
  border-color: #699875;
  background: #eaf4e6;
}
.next-tools-grid strong,
.next-tools-grid small {
  display: block;
}
.next-tools-grid strong {
  font-size: 0.8rem;
}
.next-tools-grid small {
  margin-top: 0.25rem;
  color: #758979;
  font-size: 0.68rem;
  line-height: 1.4;
}
.next-tools-grid svg {
  flex: 0 0 auto;
}
.calculator {
  overflow: hidden;
  border: 1px solid #e1e7db;
  border-radius: 24px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.8rem 2rem 1.35rem;
}
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #b66d50;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}
.calculator-header h2 {
  margin-top: 0.35rem;
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid #d6e0d3;
  border-radius: 10px;
  background: #fffefa;
  color: #557160;
  font-size: 0.77rem;
  font-weight: 800;
  cursor: pointer;
}
.reset-button:hover {
  background: #eef4e9;
}
.calculator-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
  padding: 0 2rem 2rem;
}
.input-panel,
.output-panel {
  min-width: 0;
  padding: 1.6rem;
  border-radius: 18px;
}
.input-panel {
  border: 1px solid #e1e8da;
  background: #f8faf3;
}
.output-panel {
  display: flex;
  flex-direction: column;
  background: #275340;
  color: white;
}
.panel-heading {
  display: flex;
  align-items: start;
  gap: 0.9rem;
}
.panel-index {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #e4efdc;
  color: #4a7855;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  font-weight: 800;
}
.panel-heading strong {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.95rem;
}
.panel-heading p {
  margin-top: 0.25rem;
  color: #748575;
  font-size: 0.75rem;
  line-height: 1.45;
}
.output-panel .panel-index {
  background: #45735a;
  color: #f1f8df;
}
.output-panel .panel-heading p {
  color: #c7dbc7;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  margin-top: 2rem;
}
.field label {
  display: block;
  margin-bottom: 0.55rem;
  color: #355b43;
  font-size: 0.78rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 53px;
  padding: 0.55rem 0.8rem;
  border: 1px solid #cfddcf;
  border-radius: 10px;
  background: #fffefa;
}
.input-wrap:focus-within {
  border-color: #5e9670;
  box-shadow: 0 0 0 3px #5e96702d;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c97561;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #213a30;
  font-family: var(--font-heading);
  font-size: 1.12rem;
  font-weight: 800;
}
.input-wrap span {
  max-width: 85px;
  color: #7c8c7d;
  font-size: 0.7rem;
  font-weight: 800;
  text-align: right;
}
.field-help {
  margin-top: 0.4rem;
  color: #748575;
  font-size: 0.7rem;
  line-height: 1.45;
}
.field-help--error {
  color: #a95242;
}
.input-note {
  margin-top: 1.6rem;
  color: #7d8c7e;
  font-size: 0.73rem;
}
.primary-result {
  display: grid;
  gap: 0.7rem;
  margin-top: 2.8rem;
}
.primary-result > span {
  color: #d0e4d0;
  font-size: 0.83rem;
  font-weight: 700;
}
.primary-result strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 4vw, 4.2rem);
  font-weight: 800;
  letter-spacing: -0.065em;
  line-height: 1.1;
}
.primary-result small {
  font-size: clamp(1.2rem, 2vw, 1.7rem);
  letter-spacing: 0;
}
.secondary-results {
  display: grid;
  gap: 0.7rem;
  margin-top: 1.6rem;
  padding-top: 1.3rem;
  border-top: 1px solid #ffffff39;
}
.secondary-results > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.secondary-results span {
  color: #d0e4d0;
  font-size: 0.76rem;
}
.secondary-results strong {
  font-family: var(--font-heading);
  font-size: 1rem;
  white-space: nowrap;
}
.empty-result {
  margin-top: 2rem;
}
.empty-result strong {
  font-family: var(--font-heading);
  font-size: 3rem;
}
.empty-result p {
  color: #d0e4d0;
  font-size: 0.8rem;
}
.share-action {
  align-self: flex-start;
  margin-top: 1.5rem;
}
.output-note {
  margin-top: auto;
  padding-top: 2.5rem;
  color: #cfdfce;
  font-size: 0.75rem;
  line-height: 1.65;
}
.formula-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.3rem;
  padding: 1.1rem 2rem;
  border-top: 1px solid #e8ecdf;
  background: #f7f5eb;
}
.formula-strip span {
  color: #a16953;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.formula-strip strong {
  font-size: 0.83rem;
}
.formula-strip small {
  margin-left: auto;
  color: #748273;
  font-size: 0.75rem;
}
@media (max-width: 800px) {
  .next-tools {
    grid-template-columns: 1fr;
  }
  .calculator-grid {
    grid-template-columns: 1fr;
  }
  .output-note {
    padding-top: 2rem;
  }
}
@media (max-width: 540px) {
  .next-tools {
    padding: 1.3rem;
  }
  .next-tools-grid {
    grid-template-columns: 1fr;
  }
  .calculator-header {
    padding: 1.4rem 1.2rem 1rem;
  }
  .calculator-header h2 {
    font-size: 1.3rem;
  }
  .reset-button span {
    display: none;
  }
  .calculator-grid {
    padding: 0 1.2rem 1.2rem;
  }
  .input-panel,
  .output-panel {
    padding: 1.25rem;
  }
  .fields {
    grid-template-columns: 1fr;
  }
  .formula-strip {
    padding: 1rem 1.2rem;
  }
  .formula-strip small {
    margin-left: 0;
  }
}
</style>

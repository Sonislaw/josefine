<script setup lang="ts">
import { computed, defineAsyncComponent, reactive, ref, toRef } from 'vue'
import { ArrowUpRight, RotateCcw, Sparkles } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  textShareField,
  useShareableCalculator,
} from '@/shared/composables/useShareableCalculator'
import {
  calculateDom,
  domCalculators,
  formatDomResult,
  parseDomNumber,
  type InputField,
} from '../lib/calculations'
import { calculateMeterUsage, parseDailyHours, parseDaysPerWeek } from '../lib/practical'
import type { DomToolId } from '../manifest'
import { domPath } from '../seo/useDomSeo'
import DomEnergyProjection from './DomEnergyProjection.vue'
import DomWaterMeter from './DomWaterMeter.vue'

// Rozbudowane plany zakupów pobieramy tylko na stronach odpowiednich materiałów.
const DomPanelPurchasePlan = defineAsyncComponent(() => import('./DomPanelPurchasePlan.vue'))
const DomTilePurchasePlan = defineAsyncComponent(() => import('./DomTilePurchasePlan.vue'))

const props = defineProps<{ toolId: DomToolId }>()
const definition = domCalculators[props.toolId]
const form = reactive<Record<string, string>>(
  Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue])),
)
const dailyHours = ref('3')
const daysPerWeek = ref('7')
const meterPrevious = ref('')
const meterCurrent = ref('')
const panelPackPrice = ref('')
const includeUnderlay = ref(false)
const underlayCoverage = ref('10')
const underlayPackPrice = ref('')
const includeBoxes = ref(false)
const tilesPerBox = ref('4')
const boxPrice = ref('')

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
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  ...definition.fields.map((field) =>
    textShareField(field.id, toRef(form, field.id), (raw) => parseDomNumber(raw) !== null),
  ),
  ...(props.toolId === 'koszt-pradu'
    ? [
        textShareField('dailyHours', dailyHours, (raw) => parseDailyHours(raw) !== null),
        textShareField('daysPerWeek', daysPerWeek, (raw) => parseDaysPerWeek(raw) !== null),
      ]
    : []),
  ...(props.toolId === 'koszt-wody'
    ? [
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
        booleanShareField('includeBoxes', includeBoxes),
        textShareField('tilesPerBox', shareTilesPerBox, (raw) => {
          const value = parseDomNumber(raw)
          return value !== null && Number.isSafeInteger(value) && value > 0
        }),
        textShareField('boxPrice', shareBoxPrice, validOptionalPrice),
      ]
    : []),
])
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

const results = computed(() => {
  const values: Record<string, number> = {}
  for (const field of definition.fields) {
    if (errorFor(field)) return null
    values[field.id] = parseDomNumber(form[field.id]!)!
  }
  const rows = calculateDom(props.toolId, values)
  return rows.every((row) => Number.isFinite(row.value)) ? rows : null
})

const nextTools = computed(() => {
  if (props.toolId !== 'powierzchnia-prostokata' || !results.value) return []
  const area = String(Number(results.value[0]!.value.toFixed(6)))
  return [
    { title: 'Panele', detail: 'Jeśli mierzysz podłogę', path: '/liczba-paczek-paneli' },
    { title: 'Płytki', detail: 'Na podłogę lub ścianę', path: '/liczba-plytek' },
    { title: 'Farba', detail: 'Jeśli mierzysz ścianę', path: '/ilosc-farby' },
  ].map((item) => ({ ...item, to: { path: domPath(item.path), query: { area } } }))
})

function reset() {
  for (const field of definition.fields) form[field.id] = field.defaultValue
  dailyHours.value = '3'
  daysPerWeek.value = '7'
  meterPrevious.value = ''
  meterCurrent.value = ''
  panelPackPrice.value = ''
  includeUnderlay.value = false
  underlayCoverage.value = '10'
  underlayPackPrice.value = ''
  includeBoxes.value = false
  tilesPerBox.value = '4'
  boxPrice.value = ''
}

function useMeterVolume(volume: number) {
  if (volume > 0) form.volume = String(volume)
}
</script>

<template>
  <section class="calculator" aria-labelledby="calculator-title">
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
        <div class="fields">
          <div v-for="field in definition.fields" :key="field.id" class="field">
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
          :get-url="buildShareUrl"
          :disabled="!results || !canShareInputs || !canSharePractical"
          class="share-action"
        />
        <p class="output-note">{{ definition.note }}</p>
      </div>
    </div>
    <div class="formula-strip">
      <span>WZÓR</span><strong>{{ definition.formula }}</strong
      ><small>{{ definition.example }}</small>
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
  />
  <DomTilePurchasePlan
    v-if="toolId === 'liczba-plytek'"
    v-model:include-boxes="includeBoxes"
    v-model:tiles-per-box="tilesPerBox"
    v-model:box-price="boxPrice"
    :tiles-needed="results?.[0]?.value ?? null"
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

<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import { Paintbrush, RotateCcw } from '@lucide/vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  choiceShareField,
  textShareField,
  useShareableCalculator,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import { calculatePaintRoom, PAINT_RESERVE_RATE } from '../lib/paint'
import { isValidOptionalPaintCanPrice, parsePaintCanSize } from '../lib/paint-purchase'
import DomPaintPurchasePlan from './DomPaintPurchasePlan.vue'

type PaintFieldId = 'length' | 'width' | 'height' | 'doors' | 'windows' | 'coats' | 'coverage'
interface PaintField {
  id: PaintFieldId
  label: string
  unit: string
  positive?: boolean
  integer?: boolean
  max?: number
}

const defaults: Record<PaintFieldId, string> = {
  length: '5',
  width: '4',
  height: '2,5',
  doors: '0',
  windows: '0',
  coats: '2',
  coverage: '10',
}
const fields: PaintField[] = [
  { id: 'length', label: 'Długość pokoju', unit: 'm', positive: true, max: 1000 },
  { id: 'width', label: 'Szerokość pokoju', unit: 'm', positive: true, max: 1000 },
  { id: 'height', label: 'Wysokość pokoju', unit: 'm', positive: true, max: 1000 },
  { id: 'doors', label: 'Drzwi łącznie', unit: 'm²' },
  { id: 'windows', label: 'Okna łącznie', unit: 'm²' },
  { id: 'coats', label: 'Liczba warstw', unit: 'warstwy', positive: true, integer: true },
  { id: 'coverage', label: 'Wydajność farby', unit: 'm²/l', positive: true },
]

const form = reactive<Record<PaintFieldId, string>>({ ...defaults })
const includeCeiling = ref(false)
const paintCanSize = defineModel<string>('paintCanSize', { default: '5' })
const paintCanPrice = defineModel<string>('paintCanPrice', { default: '' })
const shareMode = ref<'room'>('room')
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  choiceShareField('mode', shareMode, ['room']),
  ...fields.map((field) =>
    textShareField(field.id, toRef(form, field.id), (raw) => parseDomNumber(raw) !== null),
  ),
  booleanShareField('ceiling', includeCeiling),
  textShareField('canSize', paintCanSize, (raw) => parsePaintCanSize(raw) !== null),
  textShareField('canPrice', paintCanPrice, isValidOptionalPaintCanPrice),
])

function errorFor(field: PaintField): string | null {
  const value = parseDomNumber(form[field.id])
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz liczbę większą od zera.'
  if (field.integer && !Number.isSafeInteger(value)) return 'Wpisz liczbę całkowitą.'
  if (field.max !== undefined && value > field.max) return `Wpisz nie więcej niż ${field.max} m.`
  return null
}

const parsedValues = computed(() => {
  const values = {} as Record<PaintFieldId, number>
  for (const field of fields) {
    if (errorFor(field)) return null
    values[field.id] = parseDomNumber(form[field.id])!
  }
  return values
})

const openingError = computed(() => {
  const values = parsedValues.value
  if (!values) return null
  const walls = 2 * (values.length + values.width) * values.height
  const openings = values.doors + values.windows
  const tolerance = Number.EPSILON * Math.max(1, walls) * 16
  if (openings > walls + tolerance)
    return 'Powierzchnia drzwi i okien nie może być większa od powierzchni ścian.'
  if (walls - openings <= tolerance && !includeCeiling.value)
    return 'Po odjęciu otworów nie ma powierzchni do pomalowania. Zmniejsz otwory lub dodaj sufit.'
  return null
})

const result = computed(() => {
  const values = parsedValues.value
  if (!values || openingError.value) return null
  return calculatePaintRoom({ ...values, ceiling: includeCeiling.value })
})

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function reset() {
  Object.assign(form, defaults)
  includeCeiling.value = false
  paintCanSize.value = '5'
  paintCanPrice.value = ''
}
</script>

<template>
  <section class="paint-calculator" aria-labelledby="paint-room-title">
    <div class="calculator-header">
      <div class="heading-copy">
        <span class="heading-icon"><Paintbrush :size="20" aria-hidden="true" /></span>
        <div>
          <p class="eyebrow">POMIAR POKOJU</p>
          <h2 id="paint-room-title">Od wymiarów do ilości farby</h2>
        </div>
      </div>
      <button type="button" class="reset-button" @click="reset">
        <RotateCcw :size="16" aria-hidden="true" /> <span>Przywróć przykład</span>
      </button>
    </div>

    <div class="calculator-grid">
      <div class="input-panel">
        <div class="field-group">
          <h3>Wymiary pokoju</h3>
          <p>Zakładamy prostokątny pokój i pionowe ściany.</p>
          <div class="fields">
            <div v-for="field in fields.slice(0, 3)" :key="field.id" class="field">
              <label :for="`paint-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`paint-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!errorFor(field)"
                  :aria-describedby="errorFor(field) ? `paint-help-${field.id}` : undefined"
                /><span>{{ field.unit }}</span>
              </div>
              <p v-if="errorFor(field)" :id="`paint-help-${field.id}`" class="field-error">
                {{ errorFor(field) }}
              </p>
            </div>
          </div>
        </div>

        <div class="field-group">
          <h3>Odejmij otwory</h3>
          <p>
            Podaj łączną powierzchnię drzwi i okien. Jeśli jej nie znasz, zostaw 0 i potraktuj wynik
            jako szacunek.
          </p>
          <div class="fields">
            <div v-for="field in fields.slice(3, 5)" :key="field.id" class="field">
              <label :for="`paint-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`paint-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!errorFor(field)"
                  :aria-describedby="errorFor(field) ? `paint-help-${field.id}` : undefined"
                /><span>{{ field.unit }}</span>
              </div>
              <p v-if="errorFor(field)" :id="`paint-help-${field.id}`" class="field-error">
                {{ errorFor(field) }}
              </p>
            </div>
          </div>
          <label class="ceiling-toggle" for="paint-ceiling"
            ><input id="paint-ceiling" v-model="includeCeiling" type="checkbox" /><span
              ><strong>Maluję też sufit</strong
              ><small>Dodaj powierzchnię podłogi jako powierzchnię sufitu.</small></span
            ></label
          >
        </div>

        <div class="field-group">
          <h3>Farba</h3>
          <p>Wydajność dla jednej warstwy sprawdź na etykiecie wybranego produktu.</p>
          <div class="fields">
            <div v-for="field in fields.slice(5)" :key="field.id" class="field">
              <label :for="`paint-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`paint-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!errorFor(field)"
                  :aria-describedby="errorFor(field) ? `paint-help-${field.id}` : undefined"
                /><span>{{ field.unit }}</span>
              </div>
              <p v-if="errorFor(field)" :id="`paint-help-${field.id}`" class="field-error">
                {{ errorFor(field) }}
              </p>
            </div>
          </div>
        </div>
        <p v-if="openingError" class="form-error" role="alert">{{ openingError }}</p>
      </div>

      <div class="output-panel" aria-live="polite">
        <p class="eyebrow">TWOJE WYLICZENIE</p>
        <template v-if="result">
          <div class="primary-result">
            <span>Potrzebna farba</span
            ><strong>{{ format(result.liters) }} <small>l</small></strong>
          </div>
          <div class="reserve-result">
            <span>Z zapasem {{ PAINT_RESERVE_RATE * 100 }}%</span
            ><strong>{{ format(result.litersWithReserve) }} l</strong>
          </div>
          <dl class="breakdown">
            <div>
              <dt>Ściany przed odjęciem otworów</dt>
              <dd>{{ format(result.grossWalls) }} m²</dd>
            </div>
            <div>
              <dt>Drzwi i okna</dt>
              <dd>− {{ format(result.openings) }} m²</dd>
            </div>
            <div>
              <dt>Ściany do pomalowania</dt>
              <dd>{{ format(result.netWalls) }} m²</dd>
            </div>
            <div v-if="includeCeiling">
              <dt>Sufit</dt>
              <dd>+ {{ format(result.ceilingArea) }} m²</dd>
            </div>
            <div>
              <dt>Razem na jedną warstwę</dt>
              <dd>{{ format(result.paintArea) }} m²</dd>
            </div>
            <div>
              <dt>Powierzchnia dla {{ form.coats }} warstw</dt>
              <dd>{{ format(result.coatedArea) }} m²</dd>
            </div>
          </dl>
        </template>
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>Popraw pola formularza, aby zobaczyć ilość farby.</p>
        </div>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!result || !canShareInputs"
          class="share-action"
        />
        <p class="output-note">
          To szacunek. Rzeczywiste zużycie zależy od produktu i podłoża. Jeśli sufit wymaga innej
          farby lub liczby warstw, policz go osobno.
        </p>
      </div>
    </div>
    <div class="formula-strip">
      <span>WZÓR</span
      ><strong>(ściany − drzwi − okna + ewentualny sufit) × warstwy ÷ wydajność</strong
      ><small>Zapas: +10%</small>
    </div>
  </section>
  <DomPaintPurchasePlan
    v-model:can-size="paintCanSize"
    v-model:can-price="paintCanPrice"
    :required-liters="result?.litersWithReserve ?? null"
    id-prefix="paint-room"
  />
</template>

<style scoped>
.paint-calculator {
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
  padding: 1.7rem 2rem;
}
.heading-copy {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #f5e5d8;
  color: #b66d50;
}
.eyebrow {
  color: #b66d50;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h2,
h3 {
  font-family: var(--font-heading);
  letter-spacing: -0.04em;
}
h2 {
  margin-top: 0.28rem;
  font-size: 1.6rem;
  font-weight: 800;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
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
  grid-template-columns: 1.15fr 0.85fr;
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
.field-group + .field-group {
  margin-top: 1.7rem;
  padding-top: 1.5rem;
  border-top: 1px solid #dfe8db;
}
h3 {
  color: #315b40;
  font-size: 1.05rem;
  font-weight: 800;
}
.field-group > p {
  margin-top: 0.35rem;
  color: #788979;
  font-size: 0.75rem;
  line-height: 1.55;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.76rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 47px;
  padding: 0.5rem 0.7rem;
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
  outline: 0;
  background: transparent;
  color: #213a30;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #7c8c7d;
  font-size: 0.69rem;
  font-weight: 800;
}
.field-error,
.form-error {
  margin-top: 0.35rem;
  color: #a95242;
  font-size: 0.72rem;
  line-height: 1.45;
}
.form-error {
  margin-top: 1rem;
  padding: 0.8rem;
  border: 1px solid #e5b3a7;
  border-radius: 10px;
  background: #fff4ef;
}
.ceiling-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.15rem;
  padding: 0.85rem 1rem;
  border: 1px solid #d5e4d1;
  border-radius: 12px;
  background: #fffefa;
  cursor: pointer;
}
.ceiling-toggle input {
  width: 18px;
  height: 18px;
  margin-top: 0.1rem;
  accent-color: #315b40;
}
.ceiling-toggle strong,
.ceiling-toggle small {
  display: block;
}
.ceiling-toggle strong {
  color: #355b43;
  font-size: 0.78rem;
}
.ceiling-toggle small {
  margin-top: 0.25rem;
  color: #728577;
  font-size: 0.71rem;
  line-height: 1.45;
}
.output-panel {
  display: flex;
  flex-direction: column;
  background: #275340;
  color: #fff;
}
.output-panel .eyebrow {
  color: #d9e7ce;
}
.primary-result {
  display: grid;
  gap: 0.55rem;
  margin-top: 2rem;
}
.primary-result > span {
  color: #d0e4d0;
  font-size: 0.8rem;
  font-weight: 700;
}
.primary-result strong {
  font-family: var(--font-heading);
  font-size: clamp(2.4rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1.1;
}
.primary-result small {
  font-size: 0.55em;
}
.reserve-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: 1.35rem;
  padding: 0.85rem 0;
  border-block: 1px solid #ffffff44;
}
.reserve-result span {
  color: #d0e4d0;
  font-size: 0.78rem;
}
.reserve-result strong {
  font-family: var(--font-heading);
  font-size: 1.3rem;
}
.breakdown {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.4rem;
}
.breakdown > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.8rem;
}
.breakdown dt {
  color: #d0e4d0;
  font-size: 0.74rem;
}
.breakdown dd {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
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
  padding-top: 2rem;
  color: #cfdfce;
  font-size: 0.74rem;
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
@media (max-width: 850px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .calculator-header {
    padding: 1.3rem;
  }
  h2 {
    font-size: 1.25rem;
  }
  .reset-button span {
    display: none;
  }
  .calculator-grid {
    padding: 0 1.2rem 1.2rem;
  }
  .input-panel,
  .output-panel {
    padding: 1.2rem;
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

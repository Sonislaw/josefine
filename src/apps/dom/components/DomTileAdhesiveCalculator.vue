<script setup lang="ts">
import { computed, reactive, toRef } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  booleanShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import {
  calculateTileAdhesive,
  type TileAdhesiveInput,
  type TileAdhesiveResult,
} from '../lib/tile-adhesive'
import { domPath } from '../seo/useDomSeo'
import type { ShoppingDraft } from '../stores/shoppingList'
import AddToDomShoppingList from './AddToDomShoppingList.vue'

type Surface = 'floor' | 'walls'
type Field = 'area' | 'consumption' | 'reserve' | 'bagWeight' | 'bagPrice'
type SurfaceForm = Record<Field, string>

const formDefaults: SurfaceForm = {
  area: '',
  consumption: '',
  reserve: '0',
  bagWeight: '',
  bagPrice: '',
}
const forms = reactive<Record<Surface, SurfaceForm>>({
  floor: { ...formDefaults },
  walls: { ...formDefaults },
})
const enabled = reactive<Record<Surface, boolean>>({ floor: true, walls: true })
const surfaces = [
  { id: 'floor', label: 'Podłoga', eyebrow: '01 / POZIOM', hint: 'Klej pod płytki podłogowe' },
  { id: 'walls', label: 'Ściany', eyebrow: '02 / PION', hint: 'Klej pod płytki ścienne' },
] as const
const fields = [
  { id: 'area', label: 'Powierzchnia pod płytki', unit: 'm²', min: 0, max: 4_000_000 },
  { id: 'consumption', label: 'Zużycie wybranego kleju', unit: 'kg/m²', min: 0, max: 100 },
  { id: 'reserve', label: 'Dodatkowy zapas', unit: '%', min: 0, max: 100 },
  { id: 'bagWeight', label: 'Waga worka', unit: 'kg', min: 0, max: 1000 },
  { id: 'bagPrice', label: 'Cena worka', unit: 'zł', min: 0, max: 100_000, optional: true },
] as const

function validField(raw: string, field: (typeof fields)[number]): boolean {
  if (field.id === 'bagPrice' && raw.trim() === '') return true
  const value = parseDomNumber(raw)
  return (
    value !== null &&
    value >= field.min &&
    value <= field.max &&
    (field.id === 'reserve' || field.id === 'bagPrice' || value > 0)
  )
}
function fieldError(surface: Surface, field: (typeof fields)[number]): string | null {
  const raw = forms[surface][field.id]
  if (raw.trim() === '') return null
  if (validField(raw, field)) return null
  if (field.id === 'reserve') return 'Wpisz zapas od 0% do 100%.'
  if (field.id === 'bagPrice') return 'Wpisz cenę od 0 do 100 000 zł albo zostaw pole puste.'
  return `Podaj wartość większą od 0 i nie większą niż ${field.max.toLocaleString('pl-PL')} ${field.unit}.`
}
function parseInput(surface: Surface): TileAdhesiveInput | null {
  const form = forms[surface]
  if (fields.some((field) => !validField(form[field.id], field))) return null
  return {
    area: parseDomNumber(form.area)!,
    consumptionKgPerM2: parseDomNumber(form.consumption)!,
    reservePercent: parseDomNumber(form.reserve)!,
    bagWeightKg: parseDomNumber(form.bagWeight)!,
    bagPrice: form.bagPrice.trim() === '' ? null : parseDomNumber(form.bagPrice),
  }
}

function resultFor(surface: Surface): TileAdhesiveResult | null {
  if (!enabled[surface]) return null
  const input = parseInput(surface)
  return input ? calculateTileAdhesive(input) : null
}
const floorResult = computed(() => resultFor('floor'))
const wallsResult = computed(() => resultFor('walls'))
const views = computed(() =>
  surfaces
    .filter((surface) => enabled[surface.id])
    .map((surface) => ({
      ...surface,
      form: forms[surface.id],
      result: surface.id === 'floor' ? floorResult.value : wallsResult.value,
    })),
)
function shoppingItems(surface: Surface, result: TileAdhesiveResult | null): ShoppingDraft[] {
  if (!result) return []
  return [
    {
      kind: 'tileAdhesiveBags',
      quantity: result.bagCount,
      cost: result.estimatedCost,
      tileSurface: surface,
      packageWeightKg: parseDomNumber(forms[surface].bagWeight)!,
    },
  ]
}
const validResults = computed(() => views.value.filter((view) => view.result !== null))
const knownCost = computed(
  () =>
    validResults.value.reduce(
      (cents, view) => cents + Math.round((view.result?.estimatedCost ?? 0) * 100),
      0,
    ) / 100,
)
const missingPrices = computed(
  () => validResults.value.filter((view) => view.result?.estimatedCost === null).length,
)

function shareField(surface: Surface, field: (typeof fields)[number]): ShareField {
  const prefix = surface === 'floor' ? 'floor' : 'walls'
  const key = `${prefix}${field.id[0]!.toUpperCase()}${field.id.slice(1)}`
  return {
    key,
    read: () => {
      // Empty query values keep disabled surfaces blank if the recipient enables them later.
      if (!enabled[surface]) return ''
      const raw = forms[surface][field.id]
      return raw.length <= 80 && validField(raw, field) ? raw : null
    },
    restore: (raw) => {
      if (raw.length <= 80 && validField(raw, field)) forms[surface][field.id] = raw
    },
  }
}
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  booleanShareField('useFloor', toRef(enabled, 'floor')),
  booleanShareField('useWalls', toRef(enabled, 'walls')),
  ...surfaces.flatMap((surface) => fields.map((field) => shareField(surface.id, field))),
])

const formatKg = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)

function reset() {
  Object.assign(forms.floor, formDefaults)
  Object.assign(forms.walls, formDefaults)
  enabled.floor = true
  enabled.walls = true
}
</script>

<template>
  <section class="adhesive-calculator" aria-labelledby="adhesive-title">
    <header class="adhesive-header">
      <div>
        <p class="eyebrow">OD METRAŻU DO WORKÓW</p>
        <h2 id="adhesive-title">Policz klej bez zgadywania zużycia</h2>
        <p>
          Zużycie w kg/m² odczytaj z opakowania lub karty technicznej kleju dla wybranej pacy i
          podłoża. Podłogę oraz ściany liczymy osobno, a zakup zaokrąglamy do pełnych worków.
        </p>
      </div>
      <div class="bag-art" aria-hidden="true"><span>kg</span><span>m²</span></div>
    </header>

    <div class="adhesive-body">
      <div class="workbench-heading">
        <div>
          <p class="eyebrow">01 / ZAKRES</p>
          <h3>Co będziesz kleić?</h3>
        </div>
        <button type="button" class="reset-button" @click="reset">
          <RotateCcw :size="15" aria-hidden="true" /> Wyczyść dane
        </button>
      </div>
      <div class="surface-switches" role="group" aria-label="Powierzchnie do klejenia">
        <label v-for="surface in surfaces" :key="surface.id">
          <input v-model="enabled[surface.id]" type="checkbox" />
          <span
            ><strong>{{ surface.label }}</strong
            ><small>{{ surface.hint }}</small></span
          >
        </label>
      </div>
      <p v-if="!enabled.floor && !enabled.walls" class="form-warning" role="alert">
        Wybierz przynajmniej jedną powierzchnię.
      </p>

      <div class="surface-grid">
        <article v-for="view in views" :key="view.id" class="surface-card">
          <div class="surface-heading">
            <p class="eyebrow">{{ view.eyebrow }}</p>
            <h3>{{ view.label }}</h3>
          </div>
          <div class="field-grid">
            <div v-for="field in fields" :key="field.id" class="field">
              <label :for="`adhesive-${view.id}-${field.id}`">
                {{ field.label }} <small v-if="field.id === 'bagPrice'">opcjonalnie</small>
              </label>
              <div class="input-wrap">
                <input
                  :id="`adhesive-${view.id}-${field.id}`"
                  v-model="view.form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :placeholder="
                    field.id === 'consumption'
                      ? 'Z danych produktu'
                      : field.id === 'bagWeight'
                        ? 'Z opakowania'
                        : undefined
                  "
                  :aria-invalid="!!fieldError(view.id, field)"
                  :aria-describedby="
                    fieldError(view.id, field) ? `adhesive-error-${view.id}-${field.id}` : undefined
                  "
                /><span>{{ field.unit }}</span>
              </div>
              <p
                v-if="fieldError(view.id, field)"
                :id="`adhesive-error-${view.id}-${field.id}`"
                class="field-error"
              >
                {{ fieldError(view.id, field) }}
              </p>
            </div>
          </div>
          <p class="product-note">
            Zużycie dotyczy konkretnego produktu i sposobu nakładania; nie jest stałą dla wszystkich
            klejów. Zapas 0% oznacza zakup bez dodatkowego marginesu.
          </p>

          <div v-if="view.result" class="surface-result" aria-live="polite">
            <p class="eyebrow">WYNIK / {{ view.label.toUpperCase() }}</p>
            <strong class="bag-count"
              >{{ formatCount(view.result.bagCount) }} <small>work.</small></strong
            >
            <dl>
              <div>
                <dt>Bez zapasu</dt>
                <dd>{{ formatKg(view.result.baseKg) }} kg</dd>
              </div>
              <div>
                <dt>Z zapasem</dt>
                <dd>{{ formatKg(view.result.requiredKg) }} kg</dd>
              </div>
              <div>
                <dt>Kupujesz</dt>
                <dd>{{ formatKg(view.result.purchasedKg) }} kg</dd>
              </div>
              <div>
                <dt>Pozostanie około</dt>
                <dd>{{ formatKg(view.result.remainingKg) }} kg</dd>
              </div>
              <div>
                <dt>Koszt worków</dt>
                <dd>
                  {{
                    view.result.estimatedCost === null
                      ? 'Cena niepodana'
                      : formatMoney(view.result.estimatedCost)
                  }}
                </dd>
              </div>
            </dl>
            <AddToDomShoppingList
              :items="shoppingItems(view.id, view.result)"
              :label="`Dodaj klej — ${view.id === 'floor' ? 'podłoga' : 'ściany'}`"
            />
          </div>
          <p v-else class="empty-result">
            Wpisz metraż, zużycie z danych kleju i wagę worka, aby zobaczyć zakup.
          </p>
        </article>
      </div>

      <div v-if="validResults.length" class="total-card">
        <div>
          <p class="eyebrow">02 / ZESTAWIENIE</p>
          <h3>Oddzielne worki, wspólny budżet</h3>
          <p>Nie mieszamy zużycia ani worków różnych produktów. Sumujemy tylko podane ceny.</p>
        </div>
        <strong>{{
          missingPrices ? `Znane koszty: ${formatMoney(knownCost)}` : formatMoney(knownCost)
        }}</strong>
        <p v-if="missingPrices" class="missing-price">
          Brakuje ceny dla {{ missingPrices }} powierzchni — suma nie jest pełnym kosztem.
        </p>
      </div>
      <div class="bottom-actions">
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!views.length || validResults.length !== views.length || !canShareInputs"
        />
        <RouterLink :to="domPath('/liczba-plytek')">
          <ArrowLeft :size="16" aria-hidden="true" /> Wróć do płytek
        </RouterLink>
      </div>
      <p class="caveat">
        Wynik jest orientacyjny. Rzeczywiste zużycie zależy m.in. od równości podłoża, formatu
        płytek, pacy i zaleceń producenta. Sprawdź zgodność kleju z podłożem i płytkami; kalkulator
        nie dobiera produktu za Ciebie.
      </p>
    </div>
  </section>
</template>

<style scoped>
.adhesive-calculator {
  overflow: hidden;
  border: 1px solid #dce5d7;
  border-radius: 24px;
  background: #fffefa;
}
.adhesive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: clamp(1.4rem, 3vw, 2.3rem);
  background: linear-gradient(115deg, #e8efe2, #f8e8d9);
}
.adhesive-header > div:first-child {
  max-width: 760px;
}
.eyebrow {
  color: #9f674b;
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h2,
h3 {
  font-family: var(--font-heading);
  letter-spacing: -0.04em;
}
.adhesive-header h2 {
  margin-top: 0.5rem;
  color: #28523d;
  font-size: clamp(1.65rem, 3vw, 2.45rem);
}
.adhesive-header p:last-child {
  margin-top: 0.65rem;
  color: #607665;
  font-size: 0.87rem;
  line-height: 1.7;
}
.bag-art {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 125px;
  height: 125px;
  transform: rotate(8deg);
  border: 3px solid #a17655;
  border-radius: 17px 17px 22px 22px;
  background: #f3dcbf;
  box-shadow: 11px 12px 0 #d0e3cc;
  color: #7e674c;
  font-family: var(--font-heading);
  font-weight: 800;
}
.bag-art::before {
  content: '';
  position: absolute;
  top: 11px;
  width: 80%;
  border-top: 3px dashed #b69272;
}
.bag-art span:first-child {
  font-size: 2.1rem;
  line-height: 1;
}
.bag-art span:last-child {
  margin-top: -2.6rem;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
}
.adhesive-body {
  padding: clamp(1.1rem, 3vw, 2rem);
}
.workbench-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.workbench-heading h3,
.total-card h3 {
  margin-top: 0.25rem;
  color: #2d573f;
  font-size: 1.3rem;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.55rem 0.8rem;
  border: 1px solid #cbdccc;
  border-radius: 10px;
  background: #fff;
  color: #376149;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.surface-switches,
.surface-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}
.surface-switches label {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 1rem;
  border: 1px solid #dae4d8;
  border-radius: 11px;
  background: #f7faf4;
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
  font-size: 0.82rem;
}
.surface-switches small {
  margin-top: 0.15rem;
  color: #718674;
  font-size: 0.7rem;
}
.surface-card {
  min-width: 0;
  padding: 1.2rem;
  border: 1px solid #dce7d8;
  border-radius: 15px;
  background: #f8faf5;
}
.surface-card:nth-child(2) {
  border-color: #e8dacb;
  background: #fdf8f1;
}
.surface-heading h3 {
  margin-top: 0.2rem;
  color: #315b42;
  font-size: 1.25rem;
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
  margin-bottom: 0.35rem;
  color: #365c44;
  font-size: 0.73rem;
  font-weight: 800;
}
.field label small {
  color: #788d7a;
  font-weight: 500;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 44px;
  padding: 0.45rem 0.6rem;
  border: 1px solid #ccdbcb;
  border-radius: 9px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #4f8a62;
  box-shadow: 0 0 0 3px #4f8a6229;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c4755e;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #254b37;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
}
.input-wrap input::placeholder {
  color: #9daea0;
  font-size: 0.72rem;
  font-weight: 500;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #728b78;
  font-size: 0.69rem;
  font-weight: 800;
}
.field-error,
.form-warning {
  margin-top: 0.35rem;
  color: #a7503d;
  font-size: 0.72rem;
}
.product-note,
.empty-result,
.caveat {
  margin-top: 1rem;
  color: #6f8273;
  font-size: 0.73rem;
  line-height: 1.6;
}
.surface-result {
  margin-top: 1.1rem;
  padding: 1.1rem;
  border-radius: 12px;
  background: #2a5841;
  color: #fff;
}
.surface-result .eyebrow {
  color: #d5e5d5;
}
.bag-count {
  display: block;
  margin-top: 0.35rem;
  font-family: var(--font-heading);
  font-size: 2rem;
}
.bag-count small {
  font-size: 0.5em;
}
.surface-result dl {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.8rem;
}
.surface-result dl > div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.surface-result dt {
  color: #d0e3d2;
  font-size: 0.7rem;
}
.surface-result dd {
  margin: 0;
  font-size: 0.74rem;
  font-weight: 800;
  text-align: right;
}
.surface-result :deep(.room-picker label) {
  color: #e5f2df;
}
.surface-result :deep(.add-button) {
  background: #fff;
  color: #28573e;
}
.surface-result :deep(.add-row a) {
  color: #e5f2df;
}
.total-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.1rem;
  padding: 1.2rem;
  border: 1px solid #d9e6d7;
  border-radius: 13px;
  background: #edf4e9;
}
.total-card p:not(.eyebrow) {
  margin-top: 0.3rem;
  color: #647b69;
  font-size: 0.73rem;
  line-height: 1.5;
}
.total-card > strong {
  color: #28573e;
  font-family: var(--font-heading);
  font-size: 1.25rem;
}
.total-card .missing-price {
  flex-basis: 100%;
}
.bottom-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.2rem;
}
.bottom-actions a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #315e43;
  font-size: 0.8rem;
  font-weight: 800;
  text-underline-offset: 3px;
}
.caveat {
  margin-top: 1rem;
}
button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 2px solid #4f8a62;
  outline-offset: 2px;
}
@media (max-width: 850px) {
  .surface-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .adhesive-header {
    padding: 1.35rem;
  }
  .bag-art {
    display: none;
  }
  .surface-switches,
  .field-grid {
    grid-template-columns: 1fr;
  }
  .surface-card {
    padding: 1rem;
  }
}
</style>

<script setup lang="ts">
import { computed, reactive, toRef } from 'vue'
import { ArrowUpRight, Layers3, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import { textShareField, useShareableCalculator } from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import { calculateScreed, type ScreedInput } from '../lib/screed'
import { domPath } from '../seo/useDomSeo'

const defaults = {
  area: '20',
  thickness: '10',
  consumption: '1,8',
  reserve: '5',
  bagWeight: '25',
  bagPrice: '',
}
type FieldId = keyof typeof defaults
const form = reactive({ ...defaults })

const fields: readonly {
  id: FieldId
  label: string
  unit: string
  min: number
  max: number
  optional?: boolean
  hint: string
}[] = [
  {
    id: 'area',
    label: 'Powierzchnia podłogi',
    unit: 'm²',
    min: 0.01,
    max: 10_000,
    hint: 'Zmierz podłogę albo przenieś metraż z planera pokoju.',
  },
  {
    id: 'thickness',
    label: 'Grubość warstwy',
    unit: 'mm',
    min: 0.1,
    max: 500,
    hint: 'Sprawdź dopuszczalny zakres grubości wybranego produktu.',
  },
  {
    id: 'consumption',
    label: 'Zużycie produktu',
    unit: 'kg/m²/mm',
    min: 0.1,
    max: 10,
    hint: 'Przepisz z opakowania: kilogramy na 1 m² przy warstwie 1 mm.',
  },
  {
    id: 'bagWeight',
    label: 'Waga jednego worka',
    unit: 'kg',
    min: 1,
    max: 1000,
    hint: 'Zakup zaokrąglamy w górę do pełnych worków.',
  },
  {
    id: 'reserve',
    label: 'Zapas materiału',
    unit: '%',
    min: 0,
    max: 100,
    hint: 'Możesz ustawić 0%, jeśli nie chcesz doliczać zapasu.',
  },
  {
    id: 'bagPrice',
    label: 'Cena worka',
    unit: 'zł',
    min: 0,
    max: 100_000,
    optional: true,
    hint: 'Opcjonalnie — podaj cenę, aby oszacować koszt zakupu.',
  },
]

function validField(id: FieldId, raw = form[id]): boolean {
  const field = fields.find((item) => item.id === id)!
  if (field.optional && raw.trim() === '') return true
  const value = parseDomNumber(raw)
  if (value === null || value < field.min || value > field.max) return false
  if (id === 'bagPrice') {
    // Cena w interfejsie jest podawana w groszach; nie zaokrąglamy ukrytych cyfr.
    return /^\d+(?:[,.]\d{0,2})?$/.test(raw.replace(/[\s\u00a0\u202f]/g, ''))
  }
  return true
}

function fieldError(id: FieldId): string | null {
  if (validField(id)) return null
  if (id === 'bagPrice')
    return 'Wpisz cenę od 0 do 100 000 zł z dokładnością do groszy albo zostaw pole puste.'
  const field = fields.find((item) => item.id === id)!
  return `Wpisz wartość od ${field.min.toLocaleString('pl-PL')} do ${field.max.toLocaleString('pl-PL')} ${field.unit}.`
}

const input = computed<ScreedInput | null>(() => {
  if (fields.some((field) => !validField(field.id))) return null
  return {
    areaM2: parseDomNumber(form.area)!,
    thicknessMm: parseDomNumber(form.thickness)!,
    consumptionKgPerM2Mm: parseDomNumber(form.consumption)!,
    reservePercent: parseDomNumber(form.reserve)!,
    bagWeightKg: parseDomNumber(form.bagWeight)!,
    bagPrice: form.bagPrice.trim() === '' ? null : parseDomNumber(form.bagPrice),
  }
})
const result = computed(() => (input.value ? calculateScreed(input.value) : null))
const { buildShareUrl, canShareInputs } = useShareableCalculator(
  fields.map((field) =>
    textShareField(field.id, toRef(form, field.id), (raw) => validField(field.id, raw)),
  ),
)

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const money = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const areaQuery = computed(() => (validField('area') ? { area: form.area } : {}))

function reset() {
  Object.assign(form, defaults)
}
</script>

<template>
  <section class="screed-calculator" aria-labelledby="screed-title">
    <header class="screed-header">
      <div>
        <p class="eyebrow"><Layers3 :size="16" aria-hidden="true" /> OD METRAŻU DO WORKÓW</p>
        <h2 id="screed-title">Wylewka bez zgadywania ilości</h2>
        <p>
          Podaj powierzchnię i grubość warstwy. Zużycie mieszanki weź z opakowania wybranego
          produktu — dzięki temu wynik uwzględni jego rzeczywistą wydajność.
        </p>
      </div>
      <div class="screed-art" aria-hidden="true">
        <span class="art-layer art-layer--top"></span>
        <span class="art-layer art-layer--middle"></span>
        <span class="art-layer art-layer--bottom"></span>
        <span class="art-measure">mm <i></i> m²</span>
      </div>
    </header>

    <div class="screed-workbench">
      <div class="inputs-panel">
        <div class="panel-heading">
          <div>
            <span class="step">01 / DANE</span>
            <h3>Powierzchnia i wybrany produkt</h3>
          </div>
          <button type="button" class="reset-button" @click="reset">
            <RotateCcw :size="15" aria-hidden="true" /> Przywróć przykład
          </button>
        </div>
        <div class="field-grid">
          <div v-for="field in fields" :key="field.id" class="field">
            <label :for="`screed-${field.id}`"
              >{{ field.label }} <small v-if="field.optional">(opcjonalnie)</small></label
            >
            <span class="input-wrap">
              <input
                :id="`screed-${field.id}`"
                v-model="form[field.id]"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                :aria-invalid="!!fieldError(field.id)"
                :aria-describedby="`screed-help-${field.id}`"
              /><span>{{ field.unit }}</span>
            </span>
            <small :id="`screed-help-${field.id}`" :class="{ error: fieldError(field.id) }">{{
              fieldError(field.id) ?? field.hint
            }}</small>
          </div>
        </div>
        <p class="input-note">
          Wartości są przykładowe. Grubość warstwy i zużycie muszą odpowiadać temu samemu
          produktowi; możesz wpisywać przecinek dziesiętny.
        </p>
      </div>

      <div class="result-panel" aria-live="polite">
        <span class="step">02 / WYNIK</span>
        <h3>Plan zakupu</h3>
        <template v-if="result">
          <div class="hero-result">
            <span>Pełnych worków</span><strong>{{ format(result.bagCount) }}</strong
            ><small>przy {{ format(input!.bagWeightKg) }} kg na worek</small>
          </div>
          <dl class="result-list">
            <div>
              <dt>Objętość warstwy</dt>
              <dd>{{ format(result.volumeM3) }} m³</dd>
            </div>
            <div>
              <dt>Mieszanka bez zapasu</dt>
              <dd>{{ format(result.baseKg) }} kg</dd>
            </div>
            <div>
              <dt>Potrzebne z zapasem</dt>
              <dd>{{ format(result.requiredKg) }} kg</dd>
            </div>
            <div>
              <dt>Łącznie w workach</dt>
              <dd>{{ format(result.purchasedKg) }} kg</dd>
            </div>
            <div v-if="result.estimatedCost !== null" class="cost-row">
              <dt>Szacowany koszt zakupu</dt>
              <dd>{{ money(result.estimatedCost) }}</dd>
            </div>
          </dl>
          <p class="result-note">
            Objętość wynika z geometrii i nie zawiera zapasu. Worki liczymy z wydajności produktu i
            zaokrąglamy w górę; w zakupionych workach zostanie około
            {{ format(result.remainingKg) }} kg ponad obliczone zapotrzebowanie.
          </p>
        </template>
        <p v-else class="empty-result">Popraw zaznaczone pola, aby zobaczyć plan zakupu.</p>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!result || !canShareInputs"
          class="share-button"
        />
      </div>
    </div>

    <div class="formula-strip">
      <strong>Jak liczymy?</strong>
      <span>m³ = m² × mm ÷ 1000</span>
      <span>kg = m² × mm × kg/m²/mm × (1 + zapas/100)</span>
      <span>worki = zaokrąglenie w górę (kg ÷ kg/worek)</span>
    </div>
    <nav class="next-steps" aria-label="Kolejne kroki dla podłogi">
      <div>
        <span class="step">CO DALEJ?</span><strong>Podłoże policzone. Zaplanuj wykończenie.</strong>
      </div>
      <RouterLink :to="{ path: domPath('/liczba-paczek-paneli'), query: areaQuery }"
        >Panele <ArrowUpRight :size="17" aria-hidden="true"
      /></RouterLink>
      <RouterLink :to="{ path: domPath('/plytki-na-podloge'), query: areaQuery }"
        >Płytki na podłogę <ArrowUpRight :size="17" aria-hidden="true"
      /></RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.screed-calculator {
  overflow: hidden;
  border: 1px solid #dce5d8;
  border-radius: 26px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.screed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.2rem 2.4rem;
  background: linear-gradient(110deg, #edf4e9, #f8eee1);
}
.eyebrow,
.step {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #a8654d;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.screed-header h2 {
  margin-top: 0.6rem;
  color: #234b38;
  font-family: var(--font-heading);
  font-size: clamp(1.65rem, 3vw, 2.55rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1.14;
}
.screed-header p:last-child {
  max-width: 700px;
  margin-top: 0.7rem;
  color: #65796b;
  font-size: 0.86rem;
  line-height: 1.65;
}
.screed-art {
  position: relative;
  flex: 0 0 185px;
  height: 145px;
  transform: rotate(-7deg);
}
.art-layer {
  position: absolute;
  left: 15px;
  right: 15px;
  height: 28px;
  border: 2px solid #4c7759;
  border-radius: 8px;
  transform: skew(-18deg);
}
.art-layer--top {
  top: 14px;
  background: repeating-linear-gradient(90deg, #d6e5d1 0 17px, #c2d8bf 17px 19px);
}
.art-layer--middle {
  top: 54px;
  background: repeating-linear-gradient(90deg, #e6cdb6 0 16px, #cfad91 16px 19px);
}
.art-layer--bottom {
  top: 94px;
  background: #315b48;
}
.art-measure {
  position: absolute;
  right: -3px;
  top: 39px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #875b43;
  font-size: 0.72rem;
  font-weight: 800;
}
.art-measure i {
  display: block;
  height: 42px;
  border-left: 2px dashed #ad7052;
}
.screed-workbench {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 1rem;
  padding: 1.5rem;
}
.inputs-panel,
.result-panel {
  min-width: 0;
  padding: 1.65rem;
  border-radius: 18px;
}
.inputs-panel {
  border: 1px solid #e2e8dd;
  background: #f8faf4;
}
.result-panel {
  display: flex;
  flex-direction: column;
  background: #28533e;
  color: #fff;
}
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: start;
  flex-wrap: wrap;
  gap: 0.75rem;
}
h3 {
  margin-top: 0.4rem;
  font-family: var(--font-heading);
  font-size: 1.2rem;
  letter-spacing: -0.035em;
}
.result-panel .step {
  color: #d2dca6;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 38px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #d4e0d2;
  border-radius: 9px;
  background: #fffefa;
  color: #47694f;
  font: inherit;
  font-size: 0.73rem;
  font-weight: 800;
  cursor: pointer;
}
.reset-button:hover {
  background: #eaf4e8;
}
.reset-button:focus-visible,
.next-steps a:focus-visible {
  outline: 2px solid #285b42;
  outline-offset: 2px;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.15rem 0.9rem;
  margin-top: 1.6rem;
}
.field {
  min-width: 0;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.76rem;
  font-weight: 800;
}
.field label small {
  color: #718574;
  font-weight: 500;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 48px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ceddce;
  border-radius: 9px;
  background: #fff;
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
  font: inherit;
  font-size: 1rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #718574;
  font-size: 0.68rem;
  font-weight: 800;
}
.field > small {
  display: block;
  margin-top: 0.35rem;
  color: #768779;
  font-size: 0.67rem;
  line-height: 1.5;
}
.field > small.error {
  color: #aa5341;
}
.input-note {
  margin-top: 1.2rem;
  color: #718574;
  font-size: 0.72rem;
  line-height: 1.6;
}
.hero-result {
  display: grid;
  gap: 0.2rem;
  margin-top: 1.9rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid #ffffff36;
}
.hero-result > span {
  color: #d5e7d3;
  font-size: 0.78rem;
  font-weight: 800;
}
.hero-result strong {
  font-family: var(--font-heading);
  font-size: clamp(3.4rem, 5vw, 5rem);
  line-height: 1.1;
  letter-spacing: -0.07em;
}
.hero-result small,
.result-note {
  color: #cee0ca;
  font-size: 0.72rem;
  line-height: 1.65;
}
.result-list {
  display: grid;
  gap: 0.8rem;
  margin-top: 1.3rem;
}
.result-list > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}
.result-list dt {
  color: #cee0ca;
  font-size: 0.73rem;
}
.result-list dd {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}
.result-list .cost-row {
  margin-top: 0.25rem;
  padding-top: 0.85rem;
  border-top: 1px solid #ffffff36;
}
.result-list .cost-row dd {
  color: #f9dfa3;
  font-size: 1.2rem;
}
.result-note {
  margin-top: 1.3rem;
}
.empty-result {
  margin-top: 2rem;
  color: #cee0ca;
  font-size: 0.82rem;
}
.share-button {
  align-self: flex-start;
  margin-top: 1.4rem;
}
.formula-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.2rem;
  padding: 1rem 2.4rem;
  border-top: 1px solid #e2e8dc;
  background: #f5f4e9;
  color: #5e7663;
  font-size: 0.73rem;
}
.formula-strip strong {
  color: #9b654e;
}
.next-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  padding: 1.5rem 2.4rem;
  border-top: 1px solid #e2e8dc;
}
.next-steps > div {
  display: grid;
  gap: 0.4rem;
  margin-right: auto;
}
.next-steps > div strong {
  color: #2d563d;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.next-steps a {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  min-height: 42px;
  padding: 0.55rem 0.8rem;
  border: 1px solid #d6e3d3;
  border-radius: 10px;
  background: #f3f8ef;
  color: #2c6548;
  font-size: 0.75rem;
  font-weight: 800;
  text-decoration: none;
}
.next-steps a:hover {
  border-color: #7fae8a;
  background: #e8f4e5;
}
@media (max-width: 900px) {
  .screed-workbench {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .screed-header {
    padding: 1.5rem;
  }
  .screed-art {
    display: none;
  }
  .screed-workbench {
    padding: 0.9rem;
  }
  .inputs-panel,
  .result-panel {
    padding: 1.2rem;
  }
  .field-grid {
    grid-template-columns: 1fr;
  }
  .formula-strip,
  .next-steps {
    padding-inline: 1.5rem;
  }
}
</style>

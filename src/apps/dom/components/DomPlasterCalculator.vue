<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import { ArrowUpRight, Paintbrush, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  choiceShareField,
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import { calculatePlaster, type PlasterConsumptionMode } from '../lib/plaster'
import { domPath } from '../seo/useDomSeo'

const defaults = {
  area: '45',
  consumption: '1',
  thickness: '2',
  coats: '2',
  reserve: '10',
  packageWeight: '20',
  packagePrice: '',
}
type FieldId = keyof typeof defaults
const form = reactive({ ...defaults })
const mode = ref<PlasterConsumptionMode>('perMillimeter')
const packageKind = ref<'bag' | 'bucket'>('bag')

const fields = {
  area: { min: 0.01, max: 10_000 },
  consumption: { min: 0.1, max: 10 },
  thickness: { min: 0.1, max: 20 },
  coats: { min: 1, max: 10 },
  reserve: { min: 0, max: 100 },
  packageWeight: { min: 1, max: 1000 },
  packagePrice: { min: 0, max: 100_000 },
} as const

function validField(id: FieldId, raw = form[id]) {
  if (id === 'packagePrice' && raw.trim() === '') return true
  const value = parseDomNumber(raw)
  const { min, max } = fields[id]
  if (value === null || value < min || value > max) return false
  if (id === 'coats' && !Number.isSafeInteger(value)) return false
  if (id === 'packagePrice') {
    return /^\d+(?:[,.]\d{0,2})?$/.test(raw.replace(/[\s\u00a0\u202f]/g, ''))
  }
  return true
}

function errorFor(id: FieldId): string | null {
  if (validField(id)) return null
  if (id === 'packagePrice')
    return 'Wpisz cenę od 0 do 100 000 zł z dokładnością do groszy albo zostaw pole puste.'
  if (id === 'coats') return 'Wpisz całkowitą liczbę warstw od 1 do 10.'
  const field = fields[id]
  return `Wpisz wartość od ${field.min.toLocaleString('pl-PL')} do ${field.max.toLocaleString('pl-PL')}.`
}

const activeLayerField = computed<'thickness' | 'coats'>(() =>
  mode.value === 'perMillimeter' ? 'thickness' : 'coats',
)
const result = computed(() => {
  const activeFields: FieldId[] = [
    'area',
    'consumption',
    activeLayerField.value,
    'reserve',
    'packageWeight',
    'packagePrice',
  ]
  if (activeFields.some((id) => !validField(id))) return null
  return calculatePlaster({
    areaM2: parseDomNumber(form.area)!,
    mode: mode.value,
    consumptionKgPerM2Unit: parseDomNumber(form.consumption)!,
    totalThicknessMm: mode.value === 'perMillimeter' ? parseDomNumber(form.thickness) : null,
    coats: mode.value === 'perCoat' ? parseDomNumber(form.coats) : null,
    reservePercent: parseDomNumber(form.reserve)!,
    packageWeightKg: parseDomNumber(form.packageWeight)!,
    packagePrice: form.packagePrice.trim() === '' ? null : parseDomNumber(form.packagePrice),
  })
})

function layerShareField(
  id: 'thickness' | 'coats',
  activeMode: PlasterConsumptionMode,
): ShareField {
  return {
    key: id,
    read: () =>
      mode.value !== activeMode ? '' : validField(id) && form[id].length <= 100 ? form[id] : null,
    restore: (raw) => {
      if (raw.length <= 100 && validField(id, raw)) form[id] = raw
    },
  }
}
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  choiceShareField('mode', mode, ['perMillimeter', 'perCoat']),
  choiceShareField('packageKind', packageKind, ['bag', 'bucket']),
  ...(['area', 'consumption', 'reserve', 'packageWeight', 'packagePrice'] as const).map((id) =>
    textShareField(id, toRef(form, id), (raw) => validField(id, raw)),
  ),
  layerShareField('thickness', 'perMillimeter'),
  layerShareField('coats', 'perCoat'),
])
function shareUrl() {
  const url = new URL(buildShareUrl())
  url.searchParams.delete(mode.value === 'perMillimeter' ? 'coats' : 'thickness')
  if (!form.packagePrice.trim()) url.searchParams.delete('packagePrice')
  return url.href
}

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const money = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const paintLink = computed(() => ({
  path: domPath('/ilosc-farby'),
  query: validField('area') ? { area: form.area } : {},
}))

function reset() {
  Object.assign(form, defaults)
  mode.value = 'perMillimeter'
  packageKind.value = 'bag'
}
</script>

<template>
  <section class="plaster-calculator" aria-labelledby="plaster-title">
    <header class="plaster-header">
      <div>
        <p class="eyebrow"><Paintbrush :size="16" aria-hidden="true" /> PRZED MALOWANIEM</p>
        <h2 id="plaster-title">Ile gładzi na ściany i sufit?</h2>
        <p>
          Wpisz metraż oraz zużycie wybranego produktu. Kalkulator przeliczy ilość masy na pełne
          worki lub wiadra — bez zakładania jednej wydajności dla wszystkich gładzi.
        </p>
      </div>
      <div class="wall-art" aria-hidden="true"><span></span><span></span><span></span></div>
    </header>

    <div class="calculator-grid">
      <div class="input-panel">
        <div class="panel-heading">
          <div>
            <span class="step">01 / DANE</span>
            <h3>Powierzchnia i produkt</h3>
          </div>
          <button type="button" class="reset-button" @click="reset">
            <RotateCcw :size="15" aria-hidden="true" /> Przywróć przykład
          </button>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="plaster-area">Powierzchnia do wygładzenia</label>
            <span class="input-wrap"
              ><input
                id="plaster-area"
                v-model="form.area"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('area')"
                aria-describedby="plaster-area-help"
              /><span>m²</span></span
            >
            <small id="plaster-area-help" :class="{ error: errorFor('area') }">{{
              errorFor('area') ??
              'Podaj powierzchnię ścian po odjęciu otworów; sufit dodaj, jeśli też będzie wygładzany.'
            }}</small>
          </div>
          <div class="field">
            <label for="plaster-reserve">Zapas materiału</label>
            <span class="input-wrap"
              ><input
                id="plaster-reserve"
                v-model="form.reserve"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('reserve')"
                aria-describedby="plaster-reserve-help"
              /><span>%</span></span
            >
            <small id="plaster-reserve-help" :class="{ error: errorFor('reserve') }">{{
              errorFor('reserve') ?? 'Możesz wpisać 0%, jeśli nie chcesz doliczać zapasu.'
            }}</small>
          </div>
        </div>

        <fieldset class="mode-fieldset">
          <legend>Jak producent podaje zużycie?</legend>
          <div class="segmented">
            <button
              type="button"
              :aria-pressed="mode === 'perMillimeter'"
              :class="{ active: mode === 'perMillimeter' }"
              @click="mode = 'perMillimeter'"
            >
              Na 1 mm grubości
            </button>
            <button
              type="button"
              :aria-pressed="mode === 'perCoat'"
              :class="{ active: mode === 'perCoat' }"
              @click="mode = 'perCoat'"
            >
              Na jedną warstwę
            </button>
          </div>
        </fieldset>
        <div class="field-grid layer-grid">
          <div class="field">
            <label for="plaster-consumption">Zużycie produktu</label>
            <span class="input-wrap"
              ><input
                id="plaster-consumption"
                v-model="form.consumption"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('consumption')"
                aria-describedby="plaster-consumption-help"
              /><span>{{ mode === 'perMillimeter' ? 'kg/m²/mm' : 'kg/m²/warstwa' }}</span></span
            >
            <small id="plaster-consumption-help" :class="{ error: errorFor('consumption') }">{{
              errorFor('consumption') ?? 'Przepisz tę wartość z opakowania lub karty produktu.'
            }}</small>
          </div>
          <div v-if="mode === 'perMillimeter'" class="field">
            <label for="plaster-thickness">Łączna grubość gładzi</label>
            <span class="input-wrap"
              ><input
                id="plaster-thickness"
                v-model="form.thickness"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('thickness')"
                aria-describedby="plaster-thickness-help"
              /><span>mm</span></span
            >
            <small id="plaster-thickness-help" :class="{ error: errorFor('thickness') }">{{
              errorFor('thickness') ?? 'Suma grubości wszystkich nakładanych warstw.'
            }}</small>
          </div>
          <div v-else class="field">
            <label for="plaster-coats">Liczba warstw</label>
            <span class="input-wrap"
              ><input
                id="plaster-coats"
                v-model="form.coats"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :aria-invalid="!!errorFor('coats')"
                aria-describedby="plaster-coats-help"
              /><span>warstwy</span></span
            >
            <small id="plaster-coats-help" :class="{ error: errorFor('coats') }">{{
              errorFor('coats') ?? 'Zużycie z opakowania mnożymy przez liczbę warstw.'
            }}</small>
          </div>
        </div>

        <fieldset class="mode-fieldset">
          <legend>W czym kupujesz gładź?</legend>
          <div class="segmented">
            <button
              type="button"
              :aria-pressed="packageKind === 'bag'"
              :class="{ active: packageKind === 'bag' }"
              @click="packageKind = 'bag'"
            >
              Worki
            </button>
            <button
              type="button"
              :aria-pressed="packageKind === 'bucket'"
              :class="{ active: packageKind === 'bucket' }"
              @click="packageKind = 'bucket'"
            >
              Wiadra
            </button>
          </div>
        </fieldset>
        <div class="field-grid layer-grid">
          <div class="field">
            <label for="plaster-package-weight"
              >Masa {{ packageKind === 'bag' ? 'worka' : 'wiadra' }}</label
            >
            <span class="input-wrap"
              ><input
                id="plaster-package-weight"
                v-model="form.packageWeight"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('packageWeight')"
                aria-describedby="plaster-package-weight-help"
              /><span>kg</span></span
            >
            <small id="plaster-package-weight-help" :class="{ error: errorFor('packageWeight') }">{{
              errorFor('packageWeight') ?? 'Zakup zawsze zaokrąglamy do pełnego opakowania.'
            }}</small>
          </div>
          <div class="field">
            <label for="plaster-package-price"
              >Cena {{ packageKind === 'bag' ? 'worka' : 'wiadra' }}
              <small>(opcjonalnie)</small></label
            >
            <span class="input-wrap"
              ><input
                id="plaster-package-price"
                v-model="form.packagePrice"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="!!errorFor('packagePrice')"
                aria-describedby="plaster-package-price-help"
              /><span>zł</span></span
            >
            <small id="plaster-package-price-help" :class="{ error: errorFor('packagePrice') }">{{
              errorFor('packagePrice') ?? 'Po wpisaniu ceny pokażemy koszt zakupu.'
            }}</small>
          </div>
        </div>
        <p class="input-note">
          Przykładowe liczby możesz zmienić. Sprawdź na produkcie dopuszczalną grubość warstwy i
          zalecenia dla podłoża. W polach możesz używać przecinka dziesiętnego.
        </p>
      </div>

      <div class="result-panel" aria-live="polite">
        <span class="step">02 / PLAN ZAKUPU</span>
        <h3>Pełne {{ packageKind === 'bag' ? 'worki' : 'wiadra' }}</h3>
        <template v-if="result">
          <div class="hero-result">
            <strong>{{ format(result.packageCount) }}</strong
            ><small>po {{ format(parseDomNumber(form.packageWeight)!) }} kg</small>
          </div>
          <dl class="result-list">
            <div>
              <dt>Bez zapasu</dt>
              <dd>{{ format(result.baseKg) }} kg</dd>
            </div>
            <div>
              <dt>Z zapasem</dt>
              <dd>{{ format(result.requiredKg) }} kg</dd>
            </div>
            <div>
              <dt>Łącznie w opakowaniach</dt>
              <dd>{{ format(result.purchasedKg) }} kg</dd>
            </div>
            <div v-if="result.estimatedCost !== null" class="cost-row">
              <dt>Szacowany koszt</dt>
              <dd>{{ money(result.estimatedCost) }}</dd>
            </div>
          </dl>
          <p class="result-note">
            Po zakupie pełnych opakowań zostanie około {{ format(result.remainingKg) }} kg ponad
            obliczone zapotrzebowanie. Nie doliczamy gruntu, narzędzi ani robocizny.
          </p>
        </template>
        <p v-else class="empty-result">Popraw zaznaczone pola, aby zobaczyć plan zakupu.</p>
        <ShareResultButton
          :get-url="shareUrl"
          :disabled="!result || !canShareInputs"
          class="share-button"
        />
      </div>
    </div>

    <div class="formula-strip">
      <strong>Jak liczymy?</strong>
      <span
        >kg = m² × {{ mode === 'perMillimeter' ? 'łączna grubość w mm' : 'liczba warstw' }} ×
        zużycie</span
      >
      <span>z zapasem = kg × (1 + zapas/100)</span>
      <span>opakowania = zaokrąglenie w górę (kg ÷ kg/opakowanie)</span>
    </div>
    <nav class="next-step" aria-label="Kolejny etap wykończenia ścian">
      <div>
        <span class="step">CO DALEJ?</span><strong>Gładź policzona. Teraz zaplanuj farbę.</strong>
      </div>
      <RouterLink :to="paintLink"
        >Przejdź do farby <ArrowUpRight :size="17" aria-hidden="true"
      /></RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.plaster-calculator {
  overflow: hidden;
  border: 1px solid #dce5d8;
  border-radius: 26px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.plaster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.2rem 2.4rem;
  background: linear-gradient(110deg, #eaf3ed, #f4ede0);
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
.plaster-header h2 {
  margin-top: 0.6rem;
  color: #234b38;
  font-family: var(--font-heading);
  font-size: clamp(1.65rem, 3vw, 2.55rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1.14;
}
.plaster-header p:last-child {
  max-width: 700px;
  margin-top: 0.7rem;
  color: #65796b;
  font-size: 0.86rem;
  line-height: 1.65;
}
.wall-art {
  display: grid;
  gap: 0.45rem;
  flex: 0 0 160px;
  padding: 1.2rem;
  border: 2px solid #71977d;
  border-radius: 15px;
  background: repeating-linear-gradient(90deg, #dbe9de 0 28px, #bcd5c4 28px 30px);
  transform: rotate(6deg);
}
.wall-art span {
  display: block;
  height: 12px;
  border-radius: 4px;
  background: #f7f4e8;
  box-shadow: 4px 4px 0 #779d83;
}
.wall-art span:nth-child(2) {
  width: 85%;
}
.wall-art span:nth-child(3) {
  width: 65%;
}
.calculator-grid {
  display: grid;
  grid-template-columns: 1.18fr 0.82fr;
  gap: 1rem;
  padding: 1.5rem;
}
.input-panel,
.result-panel {
  min-width: 0;
  padding: 1.65rem;
  border-radius: 18px;
}
.input-panel {
  border: 1px solid #e2e8dd;
  background: #f8faf4;
}
.result-panel {
  display: flex;
  flex-direction: column;
  background: #28533e;
  color: #fff;
}
.result-panel .step {
  color: #d2dca6;
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
.segmented button:focus-visible,
.next-step a:focus-visible {
  outline: 2px solid #285b42;
  outline-offset: 2px;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem 0.9rem;
  margin-top: 1.5rem;
}
.layer-grid {
  margin-top: 0.8rem;
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
  white-space: nowrap;
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
.mode-fieldset {
  min-width: 0;
  margin: 1.4rem 0 0;
  padding: 0.95rem 0 0;
  border: 0;
  border-top: 1px solid #dee8db;
}
.mode-fieldset legend {
  padding: 0 0.35rem 0 0;
  color: #355b43;
  font-size: 0.78rem;
  font-weight: 800;
}
.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.segmented button {
  min-height: 39px;
  padding: 0.52rem 0.7rem;
  border: 1px solid #ccdccc;
  border-radius: 9px;
  background: #fffefa;
  color: #42684d;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}
.segmented button.active {
  border-color: #315f45;
  background: #315f45;
  color: #fff;
}
.input-note {
  margin-top: 1.2rem;
  color: #718574;
  font-size: 0.72rem;
  line-height: 1.6;
}
.hero-result {
  display: grid;
  gap: 0.15rem;
  margin-top: 1.9rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px solid #ffffff36;
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
.next-step {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  padding: 1.5rem 2.4rem;
  border-top: 1px solid #e2e8dc;
}
.next-step > div {
  display: grid;
  gap: 0.4rem;
  margin-right: auto;
}
.next-step > div strong {
  color: #2d563d;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.next-step a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
.next-step a:hover {
  border-color: #7fae8a;
  background: #e8f4e5;
}
@media (max-width: 900px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .plaster-header {
    padding: 1.5rem;
  }
  .wall-art {
    display: none;
  }
  .calculator-grid {
    padding: 0.9rem;
  }
  .input-panel,
  .result-panel {
    padding: 1.2rem;
  }
  .field-grid {
    grid-template-columns: 1fr;
  }
  .formula-strip,
  .next-step {
    padding-inline: 1.5rem;
  }
}
</style>

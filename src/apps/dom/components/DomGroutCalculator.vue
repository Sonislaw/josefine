<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import { ArrowRight, Grid3X3, PackageCheck, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import { textShareField, useShareableCalculator } from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import { calculateGrout } from '../lib/grout'
import type { ShoppingDraft } from '../stores/shoppingList'
import { domPath } from '../seo/useDomSeo'
import AddToDomShoppingList from './AddToDomShoppingList.vue'

type FieldId =
  | 'area'
  | 'tileLength'
  | 'tileWidth'
  | 'jointWidth'
  | 'jointDepth'
  | 'density'
  | 'reserve'
  | 'packageWeight'

interface GroutField {
  id: FieldId
  label: string
  unit: string
  min: number
  max: number
  positive?: boolean
  hint?: string
}

const defaults: Record<FieldId, string> = {
  area: '12',
  tileLength: '60',
  tileWidth: '60',
  jointWidth: '3',
  jointDepth: '8',
  density: '1,65',
  reserve: '10',
  packageWeight: '2',
}
const fields: GroutField[] = [
  {
    id: 'area',
    label: 'Powierzchnia do fugowania',
    unit: 'm²',
    min: 0,
    max: 100_000,
    positive: true,
  },
  { id: 'tileLength', label: 'Długość płytki', unit: 'cm', min: 0.1, max: 300 },
  { id: 'tileWidth', label: 'Szerokość płytki', unit: 'cm', min: 0.1, max: 300 },
  { id: 'jointWidth', label: 'Szerokość spoiny', unit: 'mm', min: 0.1, max: 30 },
  { id: 'jointDepth', label: 'Głębokość spoiny', unit: 'mm', min: 0.1, max: 30 },
  {
    id: 'density',
    label: 'Gęstość gotowej fugi',
    unit: 'kg/dm³',
    min: 0.1,
    max: 5,
    hint: 'Wartość przykładowa 1,65. Zastąp ją danymi wybranego produktu.',
  },
  { id: 'reserve', label: 'Zapas fugi', unit: '%', min: 0, max: 100 },
  { id: 'packageWeight', label: 'Waga jednego opakowania', unit: 'kg', min: 0.1, max: 100 },
]

const form = reactive<Record<FieldId, string>>({ ...defaults })
const packagePrice = ref('')

function fieldError(field: GroutField): string | null {
  const value = parseDomNumber(form[field.id])
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz wartość większą od zera.'
  if (value < field.min || value > field.max)
    return `Wpisz wartość od ${field.min.toLocaleString('pl-PL')} do ${field.max.toLocaleString('pl-PL')} ${field.unit}.`
  if (field.id === 'jointWidth') {
    const length = parseDomNumber(form.tileLength)
    const width = parseDomNumber(form.tileWidth)
    if (length !== null && width !== null && value >= Math.min(length, width) * 10)
      return 'Spoina musi być węższa od obu boków płytki.'
  }
  return null
}

const priceError = computed(() => {
  if (packagePrice.value.trim() === '') return null
  const value = parseDomNumber(packagePrice.value)
  return value !== null && value <= 100_000
    ? null
    : 'Wpisz cenę od 0 do 100 000 zł albo zostaw pole puste.'
})
const values = computed(() => {
  const parsed = {} as Record<FieldId, number>
  for (const field of fields) {
    if (fieldError(field)) return null
    parsed[field.id] = parseDomNumber(form[field.id])!
  }
  return parsed
})
const result = computed(() => {
  if (!values.value || priceError.value) return null
  return calculateGrout({
    ...values.value,
    packagePrice: packagePrice.value.trim() === '' ? null : parseDomNumber(packagePrice.value),
  })
})
const shoppingItems = computed<ShoppingDraft[]>(() =>
  result.value && values.value
    ? [
        {
          kind: 'groutPacks',
          quantity: result.value.packageCount,
          packageWeightKg: values.value.packageWeight,
          cost: result.value.estimatedCost,
        },
      ]
    : [],
)

const { buildShareUrl, canShareInputs } = useShareableCalculator([
  ...fields.map((field) =>
    textShareField(field.id, toRef(form, field.id), (raw) => {
      const value = parseDomNumber(raw)
      return (
        value !== null && value >= field.min && value <= field.max && (!field.positive || value > 0)
      )
    }),
  ),
  textShareField('packagePrice', packagePrice, (raw) => {
    const value = parseDomNumber(raw)
    return raw.trim() === '' || (value !== null && value <= 100_000)
  }),
])

const formatKg = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 4 }).format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)

function reset() {
  Object.assign(form, defaults)
  packagePrice.value = ''
}
</script>

<template>
  <section class="grout-calculator" aria-labelledby="grout-calculator-title">
    <header class="grout-header">
      <div>
        <p class="eyebrow">OD PŁYTEK DO ZAKUPU</p>
        <h2 id="grout-calculator-title">Spoiny policzone razem z opakowaniami</h2>
        <p>
          Wpisz format płytki, spoinę i dane wybranej fugi. Wynik pokaże zużycie materiału oraz
          liczbę pełnych opakowań — bez mieszania zapasu płytek z zapasem fugi.
        </p>
      </div>
      <div class="tile-art" aria-hidden="true">
        <span v-for="index in 9" :key="index"></span>
      </div>
    </header>

    <div class="workbench">
      <div class="input-panel">
        <div class="panel-heading">
          <span class="heading-icon"><Grid3X3 :size="19" aria-hidden="true" /></span>
          <div>
            <p class="eyebrow">01 / DANE</p>
            <h3>Powierzchnia i produkt</h3>
          </div>
          <button type="button" class="reset-button" @click="reset">
            <RotateCcw :size="15" aria-hidden="true" /> Przywróć przykład
          </button>
        </div>

        <div class="field-group">
          <h4>Płytki i metraż</h4>
          <p>Jeśli przyszłeś z kalkulatora płytek, te trzy pola są już uzupełnione.</p>
          <div class="fields">
            <div v-for="field in fields.slice(0, 3)" :key="field.id" class="field">
              <label :for="`grout-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`grout-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!fieldError(field)"
                  :aria-describedby="fieldError(field) ? `grout-help-${field.id}` : undefined"
                /><span>{{ field.unit }}</span>
              </div>
              <p v-if="fieldError(field)" :id="`grout-help-${field.id}`" class="field-error">
                {{ fieldError(field) }}
              </p>
            </div>
          </div>
        </div>

        <div class="field-group">
          <h4>Spoina i fuga</h4>
          <p>
            Głębokość spoiny zmierz między płytkami. Gęstość gotowej fugi odczytaj z karty
            technicznej konkretnego produktu.
          </p>
          <div class="fields">
            <div v-for="field in fields.slice(3, 6)" :key="field.id" class="field">
              <label :for="`grout-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`grout-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!fieldError(field)"
                  :aria-describedby="
                    fieldError(field) || field.hint ? `grout-help-${field.id}` : undefined
                  "
                /><span>{{ field.unit }}</span>
              </div>
              <p
                v-if="fieldError(field) || field.hint"
                :id="`grout-help-${field.id}`"
                class="field-help"
                :class="{ 'field-error': !!fieldError(field) }"
              >
                {{ fieldError(field) ?? field.hint }}
              </p>
            </div>
          </div>
        </div>

        <div class="field-group">
          <h4>Zakup</h4>
          <p>Zapas fugi dodaj osobno. Opakowania liczymy zawsze w całości.</p>
          <div class="fields">
            <div v-for="field in fields.slice(6)" :key="field.id" class="field">
              <label :for="`grout-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`grout-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!fieldError(field)"
                  :aria-describedby="fieldError(field) ? `grout-help-${field.id}` : undefined"
                /><span>{{ field.unit }}</span>
              </div>
              <p v-if="fieldError(field)" :id="`grout-help-${field.id}`" class="field-error">
                {{ fieldError(field) }}
              </p>
            </div>
            <div class="field">
              <label for="grout-package-price">Cena opakowania <small>opcjonalnie</small></label>
              <div class="input-wrap">
                <input
                  id="grout-package-price"
                  v-model="packagePrice"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="np. 35"
                  :aria-invalid="!!priceError"
                  :aria-describedby="priceError ? 'grout-package-price-error' : undefined"
                /><span>zł/opak.</span>
              </div>
              <p v-if="priceError" id="grout-package-price-error" class="field-error">
                {{ priceError }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="output-panel" aria-live="polite">
        <div class="panel-heading">
          <span class="heading-icon"><PackageCheck :size="20" aria-hidden="true" /></span>
          <div>
            <p class="eyebrow">02 / WYNIK</p>
            <h3>Plan fugi</h3>
          </div>
        </div>
        <template v-if="result">
          <div class="primary-result">
            <span>Do kupienia</span>
            <strong>{{ formatCount(result.packageCount) }} <small>opak.</small></strong>
            <p>{{ formatKg(result.purchasedKg) }} kg łącznie</p>
          </div>
          <dl class="result-rows">
            <div>
              <dt>Zużycie na 1 m²</dt>
              <dd>{{ formatKg(result.kgPerSquareMeter) }} kg</dd>
            </div>
            <div>
              <dt>Potrzeba bez zapasu</dt>
              <dd>{{ formatKg(result.neededKg) }} kg</dd>
            </div>
            <div>
              <dt>Potrzeba z zapasem {{ form.reserve }}%</dt>
              <dd>{{ formatKg(result.neededWithReserveKg) }} kg</dd>
            </div>
            <div>
              <dt>Orientacyjnie zostanie</dt>
              <dd>{{ formatKg(result.surplusKg) }} kg</dd>
            </div>
          </dl>
          <div v-if="result.estimatedCost !== null" class="cost-result">
            <span>Koszt pełnych opakowań</span>
            <strong>{{ formatMoney(result.estimatedCost) }}</strong>
          </div>
          <p v-else class="result-hint">Podaj cenę opakowania, aby zobaczyć koszt zakupu.</p>
        </template>
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>Popraw pola, aby zobaczyć potrzebną ilość fugi i pełne opakowania.</p>
        </div>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!result || !canShareInputs"
          class="share-action"
        />
        <p class="output-note">
          To szacunek regularnej siatki spoin. Nie obejmuje silikonu, dylatacji ani strat innych niż
          wpisany zapas. Porównaj wynik z kartą wybranego produktu.
        </p>
      </div>
    </div>

    <div class="after-result">
      <AddToDomShoppingList :items="shoppingItems" label="Dodaj fugę do Mojego remontu" />
      <RouterLink
        :to="{
          path: domPath('/liczba-plytek'),
          query: { area: form.area, tileLength: form.tileLength, tileWidth: form.tileWidth },
        }"
        class="back-to-tiles"
      >
        Wróć do liczby płytek <ArrowRight :size="16" aria-hidden="true" />
      </RouterLink>
    </div>

    <div class="method-note">
      <strong>Skąd ten wzór?</strong>
      <p>
        Stosujemy wzór oparty na objętości spoiny i gęstości gotowego produktu, opisany przez
        <a
          href="https://www.atlas.com.pl/produkt/atlas-fuga-ceramiczna-2/"
          target="_blank"
          rel="noopener noreferrer"
          >ATLAS</a
        >. Domyślne 1,65 kg/dm³ to przykład dla tej fugi, nie uniwersalna wartość. Wpisz dane
        swojego produktu; chropowatość płytek, nierówności i sposób pracy mogą zmienić zużycie.
      </p>
    </div>
  </section>
</template>

<style scoped>
.grout-calculator {
  overflow: hidden;
  border: 1px solid #dbe8e5;
  border-radius: 24px;
  background: #fffefa;
  box-shadow: 0 20px 50px #234c4112;
}
.grout-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px;
  gap: 1.5rem;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(115deg, #e9f3ed, #f4f5e9 55%, #f9eadd);
}
.eyebrow {
  color: #9a6b4c;
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
.grout-header h2,
.panel-heading h3,
.field-group h4 {
  font-family: var(--font-heading);
  letter-spacing: -0.04em;
}
.grout-header h2 {
  max-width: 640px;
  margin-top: 0.4rem;
  color: #234d3c;
  font-size: clamp(1.5rem, 2.7vw, 2.25rem);
  line-height: 1.16;
}
.grout-header > div > p:last-child {
  max-width: 720px;
  margin-top: 0.8rem;
  color: #627a69;
  font-size: 0.85rem;
  line-height: 1.65;
}
.tile-art {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 165px;
  aspect-ratio: 1;
  padding: 6px;
  border-radius: 14px;
  background: #8aafab;
  box-shadow: 12px 12px 0 #7b9c9233;
  transform: rotate(-8deg);
}
.tile-art span {
  border-radius: 3px;
  background: #f8f5e9;
}
.tile-art span:nth-child(3n + 2) {
  background: #efe8d4;
}
.tile-art span:nth-child(4) {
  background: #e6e4d2;
}
.workbench {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1rem;
  padding: 1.5rem;
}
.input-panel,
.output-panel {
  min-width: 0;
  padding: 1.5rem;
  border-radius: 17px;
}
.input-panel {
  background: #f7faf5;
  border: 1px solid #e0e9dd;
}
.output-panel {
  display: flex;
  flex-direction: column;
  background: #245642;
  color: #fff;
}
.panel-heading {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 12px;
  background: #e2eee2;
  color: #397052;
}
.panel-heading h3 {
  margin-top: 0.15rem;
  color: #294f39;
  font-size: 1.15rem;
}
.output-panel .heading-icon {
  background: #ffffff26;
  color: #edf8eb;
}
.output-panel .eyebrow {
  color: #c5e0ce;
}
.output-panel h3 {
  color: #fff;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  padding: 0.55rem 0.7rem;
  border: 1px solid #cddfd0;
  border-radius: 9px;
  background: #fff;
  color: #456f53;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}
.reset-button:hover {
  background: #ecf4e9;
}
.reset-button:focus-visible,
.back-to-tiles:focus-visible,
input:focus-visible {
  outline: 2px solid #5b8e6d;
  outline-offset: 2px;
}
.field-group {
  margin-top: 1.4rem;
  padding-top: 1.25rem;
  border-top: 1px solid #dbe7da;
}
.field-group h4 {
  color: #315b43;
  font-size: 0.98rem;
}
.field-group > p {
  margin-top: 0.3rem;
  color: #718574;
  font-size: 0.73rem;
  line-height: 1.5;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 0.9rem;
}
.field {
  min-width: 0;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #365c45;
  font-size: 0.73rem;
  font-weight: 800;
}
.field label small {
  color: #7a8d7f;
  font-weight: 500;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 45px;
  padding: 0.45rem 0.65rem;
  border: 1px solid #cbdbce;
  border-radius: 10px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #609271;
  box-shadow: 0 0 0 3px #6092712a;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c77a65;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #234e38;
  font: inherit;
  font-size: 0.96rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #748a79;
  font-size: 0.67rem;
  font-weight: 800;
}
.field-help,
.field-error {
  margin-top: 0.35rem;
  font-size: 0.69rem;
  line-height: 1.45;
}
.field-help {
  color: #748879;
}
.field-error {
  color: #a54d3e;
}
.primary-result {
  display: grid;
  gap: 0.1rem;
  margin-top: 1.6rem;
  padding: 1.2rem;
  border: 1px solid #ffffff39;
  border-radius: 13px;
  background: #ffffff14;
}
.primary-result span {
  color: #d8ebd8;
  font-size: 0.78rem;
  font-weight: 800;
}
.primary-result strong {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.05em;
}
.primary-result strong small {
  font-size: 0.45em;
}
.primary-result p {
  color: #c7ddce;
  font-size: 0.73rem;
}
.result-rows {
  display: grid;
  gap: 0.7rem;
  margin: 1.3rem 0 0;
}
.result-rows > div,
.cost-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
}
.result-rows dt,
.cost-result span {
  color: #d3e6d6;
  font-size: 0.73rem;
}
.result-rows dd {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}
.cost-result {
  margin-top: 1.25rem;
  padding: 0.9rem;
  border-radius: 10px;
  background: #ffffff1c;
}
.cost-result strong {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  text-align: right;
}
.result-hint,
.empty-result p,
.output-note {
  color: #c9dfd1;
  font-size: 0.74rem;
  line-height: 1.6;
}
.result-hint {
  margin-top: 1rem;
}
.empty-result {
  margin-top: 1.5rem;
}
.empty-result strong {
  font-family: var(--font-heading);
  font-size: 3rem;
}
.share-action {
  align-self: flex-start;
  margin-top: 1.3rem;
}
.output-note {
  margin-top: auto;
  padding-top: 1.5rem;
}
.after-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0 1.8rem 1.6rem;
}
.after-result :deep(.add-row) {
  margin-top: 0;
}
.back-to-tiles {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #2d6747;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
}
.back-to-tiles:hover {
  text-decoration: underline;
}
.method-note {
  padding: 1.15rem 1.8rem;
  border-top: 1px solid #e3e8da;
  background: #f7f6ee;
}
.method-note strong {
  color: #315a42;
  font-size: 0.78rem;
}
.method-note p {
  max-width: 900px;
  margin-top: 0.25rem;
  color: #687b6c;
  font-size: 0.72rem;
  line-height: 1.6;
}
.method-note a {
  color: #276342;
  font-weight: 800;
  text-underline-offset: 2px;
}
@media (max-width: 850px) {
  .workbench {
    grid-template-columns: 1fr;
  }
  .tile-art {
    width: 125px;
  }
}
@media (max-width: 600px) {
  .grout-header {
    grid-template-columns: 1fr;
    padding: 1.4rem;
  }
  .tile-art {
    display: none;
  }
  .workbench {
    padding: 0.9rem;
  }
  .input-panel,
  .output-panel {
    padding: 1.2rem;
  }
  .panel-heading {
    flex-wrap: wrap;
  }
  .reset-button {
    margin-left: 0;
  }
  .fields {
    grid-template-columns: 1fr;
  }
  .after-result {
    padding: 0.3rem 1.2rem 1.3rem;
  }
  .method-note {
    padding: 1.1rem 1.2rem;
  }
}
</style>

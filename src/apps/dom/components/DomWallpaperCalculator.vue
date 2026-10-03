<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'
import { Layers3, RotateCcw } from '@lucide/vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  choiceShareField,
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { parseDomNumber } from '../lib/calculations'
import { calculateWallpaper, type WallpaperInput } from '../lib/wallpaper'
import type { ShoppingDraft, ShoppingRoom } from '../stores/shoppingList'
import AddToDomShoppingList from './AddToDomShoppingList.vue'
import DomRoomPicker from './DomRoomPicker.vue'

type FieldId =
  | 'length'
  | 'width'
  | 'height'
  | 'wallWidth'
  | 'wallHeight'
  | 'rollWidth'
  | 'rollLength'
  | 'trim'
  | 'repeat'
  | 'reserve'
type WallpaperMode = 'room' | 'wall'

interface Field {
  id: FieldId
  label: string
  unit: string
  max: number
  positive?: boolean
  hint?: string
}

const defaults: Record<FieldId, string> = {
  length: '5',
  width: '4',
  height: '2,5',
  wallWidth: '5',
  wallHeight: '2,5',
  rollWidth: '53',
  rollLength: '10,05',
  trim: '10',
  repeat: '0',
  reserve: '10',
}
const roomFields: Field[] = [
  { id: 'length', label: 'Długość pokoju', unit: 'm', max: 1000, positive: true },
  { id: 'width', label: 'Szerokość pokoju', unit: 'm', max: 1000, positive: true },
  { id: 'height', label: 'Wysokość ścian', unit: 'm', max: 1000, positive: true },
]
const wallFields: Field[] = [
  { id: 'wallWidth', label: 'Szerokość wybranej ściany', unit: 'm', max: 1000, positive: true },
  { id: 'wallHeight', label: 'Wysokość wybranej ściany', unit: 'm', max: 1000, positive: true },
]
const rollFields: Field[] = [
  {
    id: 'rollWidth',
    label: 'Szerokość rolki',
    unit: 'cm',
    max: 500,
    positive: true,
    hint: 'Sprawdź szerokość na etykiecie tapety.',
  },
  { id: 'rollLength', label: 'Długość rolki', unit: 'm', max: 1000, positive: true },
  {
    id: 'trim',
    label: 'Zapas na przycięcie pasa',
    unit: 'cm',
    max: 100,
    hint: 'Łącznie u góry i na dole pasa.',
  },
  {
    id: 'repeat',
    label: 'Raport wzoru',
    unit: 'cm',
    max: 500,
    hint: 'Wpisz 0 dla tapety bez powtarzalnego wzoru.',
  },
]
const purchaseFields: Field[] = [
  {
    id: 'reserve',
    label: 'Dodatkowy zapas pasów',
    unit: '%',
    max: 100,
    hint: 'Na uszkodzenia i trudniejsze miejsca.',
  },
]
const fields = [...roomFields, ...wallFields, ...rollFields, ...purchaseFields]

const selectedMode = ref<WallpaperMode>('room')
const activeFields = computed(() => [
  ...(selectedMode.value === 'room' ? roomFields : wallFields),
  ...rollFields,
  ...purchaseFields,
])
const sections = computed(() => [
  {
    title: selectedMode.value === 'room' ? '01 / Pokój' : '01 / Jedna ściana',
    intro:
      selectedMode.value === 'room'
        ? 'Zmierz prostokątny pokój. Każdą z czterech ścian liczymy osobno.'
        : 'Zmierz tylko ścianę, którą chcesz wytapetować.',
    fields: selectedMode.value === 'room' ? roomFields : wallFields,
    includePrice: false,
  },
  {
    title: '02 / Tapeta i wzór',
    intro: 'Podaj parametry jednej rolki i rodzaj dopasowania wzoru.',
    fields: rollFields,
    includePrice: false,
  },
  {
    title: '03 / Zakup',
    intro: 'Dolicz zapas i opcjonalnie wpisz cenę rolki.',
    fields: purchaseFields,
    includePrice: true,
  },
])

const form = reactive<Record<FieldId, string>>({ ...defaults })
const price = ref('')
const selectedRoomId = ref('')

function errorFor(field: Field, raw = form[field.id]): string | null {
  const value = parseDomNumber(raw)
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz wartość większą od zera.'
  if (value > field.max) return `Wpisz nie więcej niż ${field.max} ${field.unit}.`
  return null
}

const values = computed<WallpaperInput | null>(() => {
  const parsed = {} as Record<FieldId, number>
  for (const field of activeFields.value) {
    if (errorFor(field)) return null
    parsed[field.id] = parseDomNumber(form[field.id])!
  }
  return {
    surface:
      selectedMode.value === 'room'
        ? {
            kind: 'room',
            room: { length: parsed.length, width: parsed.width, height: parsed.height },
          }
        : { kind: 'wall', widthM: parsed.wallWidth, heightM: parsed.wallHeight },
    rollWidthCm: parsed.rollWidth,
    rollLengthM: parsed.rollLength,
    trimCm: parsed.trim,
    repeatCm: parsed.repeat,
    reservePercent: parsed.reserve,
  }
})
const result = computed(() => (values.value ? calculateWallpaper(values.value) : null))

function parsePriceCents(raw: string): number | null | undefined {
  const normalized = raw
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
  if (normalized === '') return null
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return undefined
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : undefined
}
const priceCents = computed(() => parsePriceCents(price.value))
const totalCost = computed(() => {
  if (!result.value || priceCents.value == null) return null
  const cents = result.value.rolls * priceCents.value
  return Number.isSafeInteger(cents) ? cents / 100 : null
})
const priceError = computed(() =>
  priceCents.value === undefined ||
  (result.value !== null && typeof priceCents.value === 'number' && totalCost.value === null)
    ? 'Podaj cenę za rolkę z najwyżej dwoma miejscami po przecinku albo zostaw pole puste.'
    : null,
)
const shoppingItems = computed<ShoppingDraft[]>(() =>
  result.value && !priceError.value
    ? [{ kind: 'wallpaperRolls', quantity: result.value.rolls, cost: totalCost.value }]
    : [],
)

const { buildShareUrl, canShareInputs } = useShareableCalculator([
  choiceShareField('mode', selectedMode, ['room', 'wall']),
  ...fields.map((field): ShareField => {
    const shared = textShareField(
      field.id,
      toRef(form, field.id),
      (raw) => errorFor(field, raw) === null,
    )
    return {
      ...shared,
      // Inactive dimensions cannot invalidate the result or prevent sharing.
      read: () => (activeFields.value.includes(field) ? shared.read() : ''),
    }
  }),
  textShareField('price', price, (raw) => parsePriceCents(raw) !== undefined),
])

function buildCleanShareUrl() {
  const url = new URL(buildShareUrl())
  for (const field of selectedMode.value === 'room' ? wallFields : roomFields)
    url.searchParams.delete(field.id)
  return url.href
}

const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const pluralRules = new Intl.PluralRules('pl-PL')
const rollUnit = (value: number) => {
  const form = pluralRules.select(value)
  return form === 'one' ? 'rolka' : form === 'few' ? 'rolki' : 'rolek'
}
const stripUnit = (value: number) => {
  const form = pluralRules.select(value)
  return form === 'one' ? 'pas' : form === 'few' ? 'pasy' : 'pasów'
}
const formatLength = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)

function chooseRoom(room: ShoppingRoom | null) {
  if (!room?.dimensions) return
  // URL parameters are restored on mount; only an explicit selection replaces the inputs.
  form.length = String(room.dimensions.length)
  form.width = String(room.dimensions.width)
  form.height = String(room.dimensions.height)
  // A saved room has two wall widths; never guess which wall was chosen.
  form.wallHeight = String(room.dimensions.height)
}

function reset() {
  Object.assign(form, defaults)
  selectedMode.value = 'room'
  price.value = ''
  selectedRoomId.value = ''
}
</script>

<template>
  <DomRoomPicker v-model="selectedRoomId" @choose="chooseRoom" />
  <section class="wallpaper-calculator" aria-labelledby="wallpaper-title">
    <div class="calculator-header">
      <div class="heading-copy">
        <span class="heading-icon"><Layers3 :size="22" aria-hidden="true" /></span>
        <div>
          <p class="eyebrow">OD ŚCIANY DO ROLKI</p>
          <h2 id="wallpaper-title">Ile rolek tapety kupić?</h2>
        </div>
      </div>
      <button type="button" class="reset-button" @click="reset">
        <RotateCcw :size="16" aria-hidden="true" /> Przywróć przykład
      </button>
    </div>

    <div class="mode-selector">
      <div>
        <strong>Co chcesz wytapetować?</strong>
        <p>Wybierz cały pokój albo jedną ścianę, np. akcentową.</p>
      </div>
      <div class="mode-options" role="group" aria-label="Zakres tapetowania">
        <button
          type="button"
          :aria-pressed="selectedMode === 'room'"
          :class="{ 'is-active': selectedMode === 'room' }"
          @click="selectedMode = 'room'"
        >
          Cały pokój
        </button>
        <button
          type="button"
          :aria-pressed="selectedMode === 'wall'"
          :class="{ 'is-active': selectedMode === 'wall' }"
          @click="selectedMode = 'wall'"
        >
          Jedna ściana
        </button>
      </div>
      <p v-if="selectedMode === 'wall'" class="mode-note">
        Zapisany pokój może uzupełnić wysokość ściany. Jej szerokość wpisz samodzielnie.
      </p>
    </div>

    <div class="calculator-grid">
      <div class="input-panel">
        <div v-for="section in sections" :key="section.title" class="field-section">
          <h3>{{ section.title }}</h3>
          <p>{{ section.intro }}</p>
          <div class="fields">
            <div v-for="field in section.fields" :key="field.id" class="field">
              <label :for="`wallpaper-${field.id}`">{{ field.label }}</label>
              <div class="input-wrap">
                <input
                  :id="`wallpaper-${field.id}`"
                  v-model="form[field.id]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!errorFor(field)"
                  :aria-describedby="
                    field.hint || errorFor(field) ? `wallpaper-help-${field.id}` : undefined
                  "
                /><span>{{ field.unit }}</span>
              </div>
              <p
                v-if="field.hint || errorFor(field)"
                :id="`wallpaper-help-${field.id}`"
                class="field-help"
                :class="{ 'field-help--error': !!errorFor(field) }"
              >
                {{ errorFor(field) ?? field.hint }}
              </p>
            </div>
            <div v-if="section.includePrice" class="field">
              <label for="wallpaper-price">Cena jednej rolki <small>opcjonalnie</small></label>
              <div class="input-wrap">
                <input
                  id="wallpaper-price"
                  v-model="price"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="np. 89,90"
                  :aria-invalid="!!priceError"
                  :aria-describedby="priceError ? 'wallpaper-price-error' : undefined"
                /><span>zł/rol.</span>
              </div>
              <p v-if="priceError" id="wallpaper-price-error" class="field-help field-help--error">
                {{ priceError }}
              </p>
            </div>
          </div>
        </div>
        <p class="input-note">
          Wpisuj metry i centymetry zgodnie z opisem pól. Możesz użyć przecinka lub kropki
          dziesiętnej.
        </p>
      </div>

      <div class="output-panel" aria-live="polite">
        <div class="roll-graphic" aria-hidden="true"><span></span><i></i></div>
        <p class="eyebrow">TWÓJ PLAN ZAKUPU</p>
        <template v-if="result">
          <div class="primary-result">
            <span>Potrzebujesz</span>
            <strong
              >{{ formatCount(result.rolls) }} <small>{{ rollUnit(result.rolls) }}</small></strong
            >
          </div>
          <dl class="result-rows">
            <div>
              <dt>
                {{
                  selectedMode === 'room'
                    ? 'Powierzchnia ścian brutto'
                    : 'Powierzchnia ściany brutto'
                }}
              </dt>
              <dd>{{ formatLength(result.wallArea) }} m²</dd>
            </div>
            <div v-for="row in result.stripRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>
                {{ row.wallCount }} × {{ row.stripsPerWall }} {{ stripUnit(row.stripsPerWall) }}
              </dd>
            </div>
            <div>
              <dt>Pasy łącznie</dt>
              <dd>{{ formatCount(result.strips) }}</dd>
            </div>
            <div>
              <dt>Z dodatkowym zapasem</dt>
              <dd>{{ formatCount(result.stripsWithReserve) }}</dd>
            </div>
            <div>
              <dt>Długość ciętego pasa</dt>
              <dd>{{ formatLength(result.cutLengthM) }} m</dd>
            </div>
            <div>
              <dt>Pełne pasy z rolki</dt>
              <dd>{{ formatCount(result.stripsPerRoll) }}</dd>
            </div>
            <div>
              <dt>Pasy ponad plan</dt>
              <dd>{{ formatCount(result.spareStrips) }}</dd>
            </div>
          </dl>
          <p v-if="totalCost !== null" class="cost-result">
            Szacowany koszt tapety <strong>{{ formatMoney(totalCost) }}</strong>
          </p>
          <p v-else-if="!priceError" class="price-hint">
            Wpisz cenę rolki, aby oszacować koszt zakupu.
          </p>
        </template>
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>
            {{
              values
                ? 'Rolka jest zbyt krótka na jeden pełny pas z przycięciem i raportem wzoru.'
                : 'Popraw zaznaczone pola, aby zobaczyć wynik.'
            }}
          </p>
        </div>
        <ShareResultButton
          :get-url="buildCleanShareUrl"
          :disabled="!result || !canShareInputs || !!priceError"
          class="share-action"
        />
        <p class="output-note">
          Szacunek zakłada proste ściany bez skosów i pasy układane osobno na każdej ścianie.
          Otworów nie odejmujemy automatycznie — fragmenty przy drzwiach i oknach nie zawsze da się
          wykorzystać gdzie indziej.
        </p>
      </div>
    </div>

    <div class="purchase-footer">
      <div>
        <strong>Od obliczenia do zakupów</strong>
        <p>Pełne rolki możesz zapisać w Moim remoncie. Cenę uzupełnisz także później na liście.</p>
      </div>
      <AddToDomShoppingList
        :items="shoppingItems"
        :preferred-room-id="selectedRoomId"
        label="Dodaj tapetę do Mojego remontu"
      />
    </div>
    <div class="formula-strip">
      <span>JAK LICZYMY</span>
      <strong>pasy na wybranych ścianach → pełne pasy z rolki → pełne rolki</strong>
      <small>Raport wzoru: dopasowanie proste. Przy wzorze z przesunięciem sprawdź etykietę.</small>
    </div>
  </section>
</template>

<style scoped>
.wallpaper-calculator {
  overflow: hidden;
  border: 1px solid #dce5dc;
  border-radius: 24px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.65rem 2rem;
}
.heading-copy {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  flex: 0 0 45px;
  height: 45px;
  border-radius: 13px;
  background: #dcebe8;
  color: #3b7479;
}
.eyebrow {
  color: #ae7153;
  font-size: 0.7rem;
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
  font-size: clamp(1.35rem, 2.6vw, 1.8rem);
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 39px;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d6e0d3;
  border-radius: 10px;
  background: #fffefa;
  color: #557160;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.reset-button:hover {
  background: #eef4e9;
}
.mode-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.85rem 1.5rem;
  margin: 0 2rem 1.25rem;
  padding: 1rem 1.2rem;
  border: 1px solid #d9e6da;
  border-radius: 15px;
  background: #f0f7ef;
}
.mode-selector strong {
  color: #315b40;
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.mode-selector p {
  margin-top: 0.2rem;
  color: #607a65;
  font-size: 0.73rem;
  line-height: 1.5;
}
.mode-options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid #d1e0d0;
  border-radius: 12px;
  background: #fffefa;
}
.mode-options button {
  min-height: 39px;
  padding: 0.5rem 0.8rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #52715a;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.mode-options button:hover {
  background: #eaf3e9;
}
.mode-options button.is-active {
  background: #315b40;
  color: #fff;
}
.mode-options button:focus-visible {
  outline: 2px solid #315b40;
  outline-offset: 2px;
}
.mode-selector .mode-note {
  flex-basis: 100%;
  margin: 0;
}
.calculator-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 1rem;
  padding: 0 2rem 2rem;
}
.input-panel,
.output-panel {
  min-width: 0;
  padding: 1.5rem;
  border-radius: 18px;
}
.input-panel {
  border: 1px solid #e1e8da;
  background: #f8faf3;
}
.field-section + .field-section {
  margin-top: 1.5rem;
  padding-top: 1.4rem;
  border-top: 1px solid #dfe8db;
}
.field-section h3 {
  color: #315b40;
  font-size: 1.05rem;
}
.field-section > p {
  margin-top: 0.3rem;
  color: #748575;
  font-size: 0.75rem;
  line-height: 1.55;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 0.8rem;
  margin-top: 1rem;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
.field label small {
  color: #8b998b;
  font-size: 0.66rem;
  font-weight: 600;
}
.input-wrap {
  display: flex;
  align-items: center;
  min-height: 46px;
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
  font: inherit;
  font-size: 0.98rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #7c8c7d;
  font-size: 0.69rem;
  font-weight: 800;
}
.field-help {
  margin-top: 0.35rem;
  color: #748575;
  font-size: 0.68rem;
  line-height: 1.45;
}
.field-help--error {
  color: #a95242;
}
.input-note {
  margin-top: 1.3rem;
  color: #718675;
  font-size: 0.72rem;
  line-height: 1.55;
}
.output-panel {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #244f46, #1f3e40);
  color: #fff;
}
.output-panel .eyebrow {
  color: #c9e3d9;
}
.roll-graphic {
  position: relative;
  align-self: flex-end;
  width: 118px;
  height: 68px;
  margin-bottom: 0.4rem;
  transform: rotate(-13deg);
}
.roll-graphic span {
  position: absolute;
  inset: 10px 9px 10px 0;
  border-radius: 10px 35px 35px 10px;
  background: repeating-linear-gradient(45deg, #e9eee2 0 7px, #bddad1 7px 10px, #e9eee2 10px 22px);
  box-shadow: 0 8px 20px #071d2038;
}
.roll-graphic i {
  position: absolute;
  right: 0;
  top: 10px;
  width: 37px;
  height: 48px;
  border: 7px solid #e2ede6;
  border-radius: 50%;
  background: #496f69;
  box-shadow: inset 0 0 0 6px #b9d2c6;
}
.primary-result {
  display: grid;
  gap: 0.45rem;
  margin-top: 1.4rem;
}
.primary-result span {
  color: #c9e3d9;
  font-size: 0.82rem;
  font-weight: 800;
}
.primary-result strong {
  font-family: var(--font-heading);
  font-size: clamp(2.6rem, 5vw, 4.4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1.1;
}
.primary-result small {
  font-size: 0.47em;
  letter-spacing: 0;
}
.result-rows {
  display: grid;
  gap: 0.7rem;
  margin: 1.5rem 0 0;
  padding-top: 1.2rem;
  border-top: 1px solid #ffffff38;
}
.result-rows > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.65rem;
}
.result-rows dt {
  color: #c3ddd4;
  font-size: 0.73rem;
}
.result-rows dd {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}
.cost-result {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.9rem;
  border-radius: 10px;
  background: #ffffff1c;
  color: #d8e9df;
  font-size: 0.76rem;
}
.cost-result strong {
  color: #fff;
  font-family: var(--font-heading);
  font-size: 1.1rem;
}
.price-hint,
.empty-result p {
  margin-top: 1.2rem;
  color: #c6dcd0;
  font-size: 0.75rem;
  line-height: 1.55;
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
  margin-top: 1.4rem;
}
.output-note {
  margin-top: auto;
  padding-top: 2rem;
  color: #c5dacf;
  font-size: 0.72rem;
  line-height: 1.6;
}
.purchase-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.2rem 2rem;
  border-top: 1px solid #e3e9df;
}
.purchase-footer strong {
  color: #315b40;
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.purchase-footer p {
  max-width: 470px;
  margin-top: 0.25rem;
  color: #708373;
  font-size: 0.72rem;
  line-height: 1.55;
}
.purchase-footer :deep(.add-row) {
  margin-top: 0;
}
.formula-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid #e8ecdf;
  background: #f7f5eb;
}
.formula-strip span {
  color: #a16953;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.formula-strip strong {
  color: #2b5138;
  font-size: 0.77rem;
}
.formula-strip small {
  color: #748273;
  font-size: 0.7rem;
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
  .mode-selector {
    margin: 0 1.3rem 1.3rem;
  }
  .calculator-grid {
    padding: 0 1.3rem 1.3rem;
  }
  .input-panel,
  .output-panel {
    padding: 1.2rem;
  }
  .fields {
    grid-template-columns: 1fr;
  }
  .purchase-footer {
    padding: 1.2rem 1.3rem;
  }
  .formula-strip {
    padding: 1rem 1.3rem;
  }
}
</style>

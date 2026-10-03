<script setup lang="ts">
import { computed } from 'vue'
import { Ruler } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import { calculateSkirtingPlan } from '../lib/skirting'

const props = defineProps<{ perimeter: number | null }>()
const openings = defineModel<string>('openings', { required: true })
const boardLength = defineModel<string>('boardLength', { required: true })
const reserve = defineModel<string>('reserve', { required: true })
const boardPrice = defineModel<string>('boardPrice', { required: true })

const openingsError = computed(() => {
  const value = parseDomNumber(openings.value)
  if (value === null) return 'Wpisz łączną szerokość otworów, nie mniejszą od zera.'
  if (props.perimeter !== null && value >= props.perimeter)
    return 'Otwory muszą być węższe od całego obwodu.'
  return null
})
const boardLengthError = computed(() => {
  const value = parseDomNumber(boardLength.value)
  return value !== null && value > 0 ? null : 'Wpisz długość listwy większą od zera.'
})
const reserveError = computed(() =>
  parseDomNumber(reserve.value) !== null ? null : 'Wpisz zapas nie mniejszy od zera.',
)
const priceError = computed(() => {
  if (boardPrice.value.trim() === '') return null
  return parseDomNumber(boardPrice.value) !== null
    ? null
    : 'Wpisz cenę nie mniejszą od zera albo zostaw pole puste.'
})

const plan = computed(() => {
  if (
    props.perimeter === null ||
    openingsError.value ||
    boardLengthError.value ||
    reserveError.value ||
    priceError.value
  )
    return null

  return calculateSkirtingPlan({
    perimeter: props.perimeter,
    openings: parseDomNumber(openings.value)!,
    boardLength: parseDomNumber(boardLength.value)!,
    reserve: parseDomNumber(reserve.value)!,
    boardPrice: boardPrice.value.trim() === '' ? null : parseDomNumber(boardPrice.value),
  })
})

const formatLength = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const pluralRules = new Intl.PluralRules('pl-PL')
function boardUnit(count: number) {
  const form = pluralRules.select(count)
  return form === 'one' ? 'listwa' : form === 'few' ? 'listwy' : 'listew'
}
</script>

<template>
  <section class="skirting-plan" aria-labelledby="skirting-plan-title">
    <div class="plan-heading">
      <span class="heading-icon"><Ruler :size="21" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">CO DALEJ Z OBWODEM?</p>
        <h3 id="skirting-plan-title">Zaplanuj listwy przypodłogowe</h3>
      </div>
    </div>
    <p class="plan-intro">
      Podstawowy wynik to obwód pokoju. Odejmij miejsca bez listew, podaj długość jednej listwy i
      własny zapas, aby oszacować liczbę sztuk do kupienia.
    </p>

    <div class="plan-grid">
      <div class="plan-fields">
        <div class="field">
          <label for="skirting-openings">Łączna szerokość drzwi i innych otworów</label>
          <div class="input-wrap">
            <input
              id="skirting-openings"
              v-model="openings"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!openingsError"
              :aria-describedby="openingsError ? 'skirting-openings-error' : undefined"
            /><span>m</span>
          </div>
          <p v-if="openingsError" id="skirting-openings-error" class="field-error">
            {{ openingsError }}
          </p>
          <small>Wpisz 0, jeśli nie odejmujesz żadnego odcinka.</small>
        </div>
        <div class="field">
          <label for="skirting-board-length">Długość jednej listwy</label>
          <div class="input-wrap">
            <input
              id="skirting-board-length"
              v-model="boardLength"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!boardLengthError"
              :aria-describedby="boardLengthError ? 'skirting-length-error' : undefined"
            /><span>m/szt.</span>
          </div>
          <p v-if="boardLengthError" id="skirting-length-error" class="field-error">
            {{ boardLengthError }}
          </p>
          <small>2,4 m to przykład — sprawdź długość wybranego produktu.</small>
        </div>
        <div class="field">
          <label for="skirting-reserve">Zapas na docinki</label>
          <div class="input-wrap">
            <input
              id="skirting-reserve"
              v-model="reserve"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!reserveError"
              :aria-describedby="reserveError ? 'skirting-reserve-error' : undefined"
            /><span>%</span>
          </div>
          <p v-if="reserveError" id="skirting-reserve-error" class="field-error">
            {{ reserveError }}
          </p>
        </div>
        <div class="field">
          <label for="skirting-price">Cena jednej listwy <small>opcjonalnie</small></label>
          <div class="input-wrap">
            <input
              id="skirting-price"
              v-model="boardPrice"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="np. 24,99"
              :aria-invalid="!!priceError"
              :aria-describedby="priceError ? 'skirting-price-error' : undefined"
            /><span>zł/szt.</span>
          </div>
          <p v-if="priceError" id="skirting-price-error" class="field-error">{{ priceError }}</p>
        </div>
        <p class="field-note">
          W polach liczbowych możesz używać przecinka lub kropki dziesiętnej.
        </p>
      </div>

      <div class="plan-result" aria-live="polite">
        <template v-if="plan">
          <div class="primary-result">
            <span>Szacunkowo do kupienia</span>
            <strong
              >{{ formatCount(plan.boardCount) }}
              <small>{{ boardUnit(plan.boardCount) }}</small></strong
            >
          </div>
          <dl class="result-rows">
            <div>
              <dt>Obwód pokoju</dt>
              <dd>{{ formatLength(perimeter!) }} m</dd>
            </div>
            <div>
              <dt>Odejmowane otwory</dt>
              <dd>− {{ formatLength(parseDomNumber(openings)!) }} m</dd>
            </div>
            <div>
              <dt>Długość po odjęciu otworów</dt>
              <dd>{{ formatLength(plan.netLength) }} m</dd>
            </div>
            <div>
              <dt>Potrzeba z zapasem</dt>
              <dd>{{ formatLength(plan.requiredLength) }} m</dd>
            </div>
            <div>
              <dt>Kupujesz łącznie</dt>
              <dd>{{ formatLength(plan.purchasedLength) }} m</dd>
            </div>
            <div>
              <dt>Ponad potrzebę z zapasem</dt>
              <dd>{{ formatLength(plan.surplusLength) }} m</dd>
            </div>
          </dl>
          <div v-if="plan.estimatedCost !== null" class="price-result">
            <span>Szacowany koszt listew</span>
            <strong>{{ formatMoney(plan.estimatedCost) }}</strong>
          </div>
          <p v-else class="price-hint">Podaj cenę jednej listwy, aby zobaczyć koszt.</p>
        </template>
        <p v-else class="empty-result">
          Popraw wymiary pokoju lub pola planu, aby zobaczyć szacowaną liczbę listew.
        </p>
      </div>
    </div>
    <p class="plan-note">
      To szacunek z łącznej długości, a nie plan cięcia listwy na odcinki każdej ściany. Narożniki,
      miejsca łączeń i nieprzydatne resztki mogą zwiększyć rzeczywistą liczbę potrzebnych sztuk.
      Koszt nie obejmuje łączników, montażu ani transportu.
    </p>
  </section>
</template>

<style scoped>
.skirting-plan {
  margin-top: 1.25rem;
  padding: 2rem;
  border: 1px solid #e0e6d9;
  border-radius: 22px;
  background: linear-gradient(135deg, #fffefa, #f7f6ec);
}
.plan-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #e5efdf;
  color: #366b4a;
}
.eyebrow {
  color: #aa6a50;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
h3 {
  margin-top: 0.25rem;
  color: #294f38;
  font-family: var(--font-heading);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.plan-intro {
  max-width: 800px;
  margin-top: 1rem;
  color: #697e6e;
  font-size: 0.85rem;
  line-height: 1.7;
}
.plan-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 1rem;
  margin-top: 1.4rem;
}
.plan-fields,
.plan-result {
  min-width: 0;
  padding: 1.3rem;
  border: 1px solid #dfe7d9;
  border-radius: 16px;
  background: #fffefa;
}
.plan-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 0.8rem;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
.field label small,
.field > small {
  color: #7f9180;
  font-size: 0.68rem;
  font-weight: 600;
}
.field > small {
  display: block;
  margin-top: 0.35rem;
  line-height: 1.4;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 45px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #cfddcf;
  border-radius: 10px;
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
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #7c8c7d;
  font-size: 0.7rem;
  font-weight: 800;
}
.field-error {
  margin-top: 0.35rem;
  color: #a95242;
  font-size: 0.7rem;
  line-height: 1.45;
}
.field-note {
  grid-column: 1 / -1;
  color: #718675;
  font-size: 0.72rem;
  line-height: 1.55;
}
.plan-result {
  background: #f4f8ef;
}
.primary-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 13px;
  background: #2b5a40;
  color: #fff;
}
.primary-result span {
  color: #d8e8d7;
  font-size: 0.78rem;
  font-weight: 800;
}
.primary-result strong {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 3vw, 2rem);
  white-space: nowrap;
}
.primary-result small {
  font-size: 0.55em;
}
.result-rows {
  display: grid;
  gap: 0.7rem;
  margin: 1.2rem 0 0;
}
.result-rows > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}
.result-rows dt {
  color: #637d68;
  font-size: 0.75rem;
}
.result-rows dd {
  margin: 0;
  color: #2d573c;
  font-size: 0.8rem;
  font-weight: 800;
  text-align: right;
}
.price-result {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
  margin-top: 1.1rem;
  padding: 0.9rem;
  border-radius: 10px;
  background: #e0ecd8;
}
.price-result span {
  color: #2d573c;
  font-size: 0.75rem;
  font-weight: 800;
}
.price-result strong {
  color: #2b543b;
  font-family: var(--font-heading);
  font-size: 1rem;
  text-align: right;
}
.price-hint,
.empty-result,
.plan-note {
  color: #718675;
  font-size: 0.74rem;
  line-height: 1.6;
}
.price-hint {
  margin-top: 1.1rem;
}
.empty-result {
  padding: 1.1rem;
  border: 1px dashed #cbdcc8;
  border-radius: 11px;
}
.plan-note {
  margin-top: 1.2rem;
}
@media (max-width: 850px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .skirting-plan {
    padding: 1.3rem;
  }
  .plan-fields {
    grid-template-columns: 1fr;
  }
  .field-note {
    grid-column: auto;
  }
  .primary-result {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

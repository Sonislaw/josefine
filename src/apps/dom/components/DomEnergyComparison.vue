<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeftRight, Plus, RotateCcw } from '@lucide/vue'
import { useRoute } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  textShareField,
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import {
  calculateEnergyComparison,
  parseComparisonPower,
  parseComparisonPrice,
  parseDailyHours,
  parseDaysPerWeek,
} from '../lib/practical'

const props = defineProps<{
  basePower: string
  basePrice: string
  baseHours: string
  baseDays: string
}>()
const route = useRoute()
const enabled = ref(false)
const hasStarted = ref(false)
const nameA = ref('Urządzenie A')
const nameB = ref('Urządzenie B')
const powerA = ref('1000')
const powerB = ref('700')
const hours = ref('3')
const days = ref('7')
const price = ref('1,20')

const comparison = computed(() =>
  calculateEnergyComparison(
    parseComparisonPower(powerA.value),
    parseComparisonPower(powerB.value),
    parseComparisonPrice(price.value),
    parseDailyHours(hours.value),
    parseDaysPerWeek(days.value),
  ),
)
const labelA = computed(() => nameA.value.trim() || 'Urządzenie A')
const labelB = computed(() => nameB.value.trim() || 'Urządzenie B')
const validName = (raw: string) => raw.length <= 40 && !/[\u0000-\u001f\u007f]/.test(raw)

const compareFlag: ShareField = {
  key: 'compare',
  read: () => (enabled.value ? '1' : '0'),
  restore: (raw) => {
    if (raw !== '1' && raw !== '0') return
    enabled.value = raw === '1'
    if (enabled.value) hasStarted.value = true
  },
}
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  compareFlag,
  textShareField('compareNameA', nameA, validName),
  textShareField('compareNameB', nameB, validName),
  textShareField('comparePowerA', powerA, (raw) => parseComparisonPower(raw) !== null),
  textShareField('comparePowerB', powerB, (raw) => parseComparisonPower(raw) !== null),
  textShareField('compareHours', hours, (raw) => parseDailyHours(raw) !== null),
  textShareField('compareDays', days, (raw) => parseDaysPerWeek(raw) !== null),
  textShareField('comparePrice', price, (raw) => parseComparisonPrice(raw) !== null),
])

function hasValidSharedComparison() {
  const query = route.query
  const value = (key: string) => (typeof query[key] === 'string' ? query[key] : null)
  const validField = (key: string, parse: (raw: string) => number | null) => {
    const raw = value(key)
    return raw !== null && raw.length <= 100 && parse(raw) !== null
  }
  const validSharedName = (key: string) => {
    const raw = value(key)
    return raw !== null && validName(raw)
  }
  return (
    query.compare === '1' &&
    validSharedName('compareNameA') &&
    validSharedName('compareNameB') &&
    validField('comparePowerA', parseComparisonPower) &&
    validField('comparePowerB', parseComparisonPower) &&
    validField('compareHours', parseDailyHours) &&
    validField('compareDays', parseDaysPerWeek) &&
    validField('comparePrice', parseComparisonPrice)
  )
}

function resetInvalidSharedComparison() {
  if (hasValidSharedComparison()) return
  enabled.value = false
  if (route.query.compare === '1') hasStarted.value = false
}

// Restore all comparison fields as one coherent snapshot; an incomplete URL stays collapsed.
onMounted(resetInvalidSharedComparison)
watch(() => route.fullPath, resetInvalidSharedComparison)

function useCurrentInputs() {
  if (parseComparisonPower(props.basePower) !== null) powerA.value = props.basePower
  if (parseComparisonPrice(props.basePrice) !== null) price.value = props.basePrice
  if (parseDailyHours(props.baseHours) !== null) hours.value = props.baseHours
  if (parseDaysPerWeek(props.baseDays) !== null) days.value = props.baseDays
}

function showComparison() {
  if (!hasStarted.value) {
    useCurrentInputs()
    hasStarted.value = true
  }
  enabled.value = true
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatEnergy = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
const moreExpensive = (difference: number) =>
  difference > 0
    ? `${labelA.value} droższe o`
    : difference < 0
      ? `${labelB.value} droższe o`
      : 'Bez różnicy w koszcie'
</script>

<template>
  <section class="comparison" aria-labelledby="energy-comparison-title">
    <div class="comparison-header">
      <span class="header-icon"><ArrowLeftRight :size="21" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">DWA URZĄDZENIA, TE SAME WARUNKI</p>
        <h3 id="energy-comparison-title">Porównaj koszty używania</h3>
        <p>Sprawdź różnicę dla tej samej liczby godzin, dni w tygodniu i ceny kWh.</p>
      </div>
      <button v-if="!enabled" type="button" class="toggle-button" @click="showComparison">
        <Plus :size="17" aria-hidden="true" /> Porównaj urządzenia
      </button>
      <button v-else type="button" class="toggle-button" @click="enabled = false">
        Ukryj porównanie
      </button>
    </div>

    <div v-if="enabled" class="comparison-body">
      <div class="devices">
        <div class="device-card">
          <span class="device-mark">A</span>
          <label for="compare-name-a">Nazwa <small>opcjonalnie</small></label>
          <input
            id="compare-name-a"
            v-model="nameA"
            type="text"
            maxlength="40"
            autocomplete="off"
          />
          <label for="compare-power-a">Moc urządzenia A</label>
          <div class="input-wrap">
            <input
              id="compare-power-a"
              v-model="powerA"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="parseComparisonPower(powerA) === null"
            /><span>W</span>
          </div>
        </div>
        <div class="device-card device-card--b">
          <span class="device-mark">B</span>
          <label for="compare-name-b">Nazwa <small>opcjonalnie</small></label>
          <input
            id="compare-name-b"
            v-model="nameB"
            type="text"
            maxlength="40"
            autocomplete="off"
          />
          <label for="compare-power-b">Moc urządzenia B</label>
          <div class="input-wrap">
            <input
              id="compare-power-b"
              v-model="powerB"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="parseComparisonPower(powerB) === null"
            /><span>W</span>
          </div>
        </div>
      </div>

      <div class="shared-settings">
        <div class="settings-heading">
          <div>
            <strong>Wspólne założenia</strong>
            <p>Oba urządzenia pracują tyle samo czasu i mają tę samą stawkę energii.</p>
          </div>
          <button type="button" @click="useCurrentInputs">
            <RotateCcw :size="15" aria-hidden="true" /> Wstaw dane z kalkulatora
          </button>
        </div>
        <div class="settings-fields">
          <label for="compare-hours">
            <span>Godzin w dniu używania</span>
            <span class="input-wrap"
              ><input
                id="compare-hours"
                v-model="hours"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="parseDailyHours(hours) === null"
              /><small>h/dzień</small></span
            >
          </label>
          <label for="compare-days">
            <span>Dni w tygodniu</span>
            <span class="input-wrap"
              ><input
                id="compare-days"
                v-model="days"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :aria-invalid="parseDaysPerWeek(days) === null"
              /><small>1–7</small></span
            >
          </label>
          <label for="compare-price">
            <span>Cena energii</span>
            <span class="input-wrap"
              ><input
                id="compare-price"
                v-model="price"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                :aria-invalid="parseComparisonPrice(price) === null"
              /><small>zł/kWh</small></span
            >
          </label>
        </div>
      </div>

      <div class="results" aria-live="polite">
        <div class="results-heading">
          <p class="eyebrow">WYNIK PORÓWNANIA</p>
          <h4>Ten sam czas, dwa szacowane koszty</h4>
        </div>
        <div v-if="comparison" class="period-grid">
          <article
            v-for="(period, index) in comparison"
            :key="period.label"
            class="period-card"
            :class="{ 'period-card--year': index === 2 }"
          >
            <h5>{{ period.label }}</h5>
            <dl>
              <div>
                <dt>{{ labelA }}</dt>
                <dd>
                  {{ formatMoney(period.costA) }}
                  <small>{{ formatEnergy(period.energyA) }} kWh</small>
                </dd>
              </div>
              <div>
                <dt>{{ labelB }}</dt>
                <dd>
                  {{ formatMoney(period.costB) }}
                  <small>{{ formatEnergy(period.energyB) }} kWh</small>
                </dd>
              </div>
            </dl>
            <div class="difference">
              <span>{{ moreExpensive(period.difference) }}</span
              ><strong>{{ formatMoney(Math.abs(period.difference)) }}</strong>
            </div>
          </article>
        </div>
        <p v-else class="invalid-result">
          Sprawdź moce urządzeń, liczbę godzin (do 24), dni (1–7) i cenę energii, aby zobaczyć
          porównanie.
        </p>
        <ShareResultButton
          :get-url="buildShareUrl"
          :disabled="!comparison || !canShareInputs"
          class="share-action"
        />
        <p class="caveat">
          Porównanie zakłada stały pobór mocy i jednakowy czas pracy — nie oznacza, że urządzenia
          wykonują tę samą pracę. Termostaty i regulacja mocy mogą zmieniać rzeczywiste zużycie. Bez
          opłat stałych.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.comparison {
  margin-top: 1.25rem;
  overflow: hidden;
  border: 1px solid #e0e5d7;
  border-radius: 22px;
  background: #fffefa;
}
.comparison-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.8rem;
  background: linear-gradient(110deg, #f6f7ed, #f9eddf);
}
.header-icon {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  height: 44px;
  border-radius: 13px;
  background: #e7ecda;
  color: #59734e;
}
.comparison-header > div {
  flex: 1 1 260px;
}
.eyebrow {
  color: #a5694f;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h3,
h4,
h5 {
  font-family: var(--font-heading);
  letter-spacing: -0.04em;
}
h3 {
  margin-top: 0.3rem;
  color: #274b36;
  font-size: clamp(1.25rem, 2vw, 1.7rem);
}
.comparison-header p:last-child {
  margin-top: 0.45rem;
  color: #697d6e;
  font-size: 0.8rem;
  line-height: 1.55;
}
.toggle-button,
.settings-heading button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbdccc;
  border-radius: 10px;
  background: #fffefa;
  color: #356047;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.toggle-button:hover,
.settings-heading button:hover {
  background: #edf4e8;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #417454;
  outline-offset: 2px;
}
.comparison-body {
  display: grid;
  gap: 1.2rem;
  padding: 1.4rem 1.8rem 1.8rem;
}
.devices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}
.device-card {
  display: grid;
  align-content: start;
  gap: 0.45rem;
  min-width: 0;
  padding: 1.1rem;
  border: 1px solid #dce6d9;
  border-radius: 15px;
  background: #f6faf3;
}
.device-card--b {
  border-color: #eadccc;
  background: #fdf7f0;
}
.device-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-bottom: 0.3rem;
  border-radius: 9px;
  background: #315f45;
  color: #fff;
  font-weight: 800;
}
.device-card--b .device-mark {
  background: #ad7152;
}
.device-card label,
.settings-fields label > span:first-child {
  color: #385b43;
  font-size: 0.74rem;
  font-weight: 800;
}
.device-card label small {
  color: #7d8e80;
  font-weight: 600;
}
.device-card > input,
.input-wrap {
  width: 100%;
  min-height: 43px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #cddccc;
  border-radius: 9px;
  background: #fff;
  color: #213a30;
  font: inherit;
  font-size: 0.9rem;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  font-size: 0.95rem;
  font-weight: 800;
}
.input-wrap small,
.input-wrap > span {
  flex: 0 0 auto;
  color: #748575;
  font-size: 0.7rem;
  font-weight: 800;
}
.shared-settings {
  padding: 1.2rem;
  border: 1px solid #e2e8dc;
  border-radius: 15px;
  background: #fafaf5;
}
.settings-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.settings-heading strong {
  color: #2d593d;
  font-family: var(--font-heading);
  font-size: 0.93rem;
}
.settings-heading p {
  margin-top: 0.25rem;
  color: #728474;
  font-size: 0.72rem;
  line-height: 1.5;
}
.settings-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.1rem;
}
.settings-fields label {
  display: grid;
  align-content: start;
  gap: 0.4rem;
  min-width: 0;
}
.results {
  padding: 1.35rem;
  border-radius: 16px;
  background: #244f40;
  color: #fff;
}
.results-heading h4 {
  margin-top: 0.3rem;
  font-size: 1.2rem;
}
.results .eyebrow {
  color: #c6dfcf;
}
.period-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.1rem;
}
.period-card {
  min-width: 0;
  padding: 1rem;
  border: 1px solid #ffffff24;
  border-radius: 12px;
  background: #ffffff12;
}
.period-card--year {
  background: #ffffff21;
}
.period-card h5 {
  font-size: 0.95rem;
}
.period-card dl {
  display: grid;
  gap: 0.7rem;
  margin: 1rem 0 0;
}
.period-card dl > div {
  display: grid;
  gap: 0.2rem;
}
.period-card dt,
.difference span {
  color: #c7ddd0;
  font-size: 0.7rem;
  overflow-wrap: anywhere;
}
.period-card dd {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.period-card dd small {
  display: block;
  margin-top: 0.1rem;
  color: #b8d1c3;
  font-family: inherit;
  font-size: 0.66rem;
  font-weight: 500;
}
.difference {
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ffffff30;
}
.difference strong {
  font-family: var(--font-heading);
  font-size: 1.1rem;
}
.invalid-result {
  margin-top: 1rem;
  color: #d5e7d7;
  font-size: 0.78rem;
  line-height: 1.55;
}
.share-action {
  margin-top: 1rem;
}
.caveat {
  margin-top: 1rem;
  color: #c5dacf;
  font-size: 0.72rem;
  line-height: 1.6;
}
@media (max-width: 800px) {
  .period-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .comparison-header {
    padding: 1.25rem;
  }
  .comparison-body {
    padding: 1.25rem;
  }
  .devices,
  .settings-fields {
    grid-template-columns: 1fr;
  }
}
</style>

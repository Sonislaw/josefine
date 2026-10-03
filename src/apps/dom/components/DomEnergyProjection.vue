<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Zap } from '@lucide/vue'
import { calculateEnergyProjection, parseDailyHours, parseDaysPerWeek } from '../lib/practical'

const props = defineProps<{ power: number | null; price: number | null }>()
const dailyHours = defineModel<string>('dailyHours', { required: true })
const daysPerWeek = defineModel<string>('daysPerWeek', { required: true })

const projection = computed(() =>
  calculateEnergyProjection(
    props.power,
    props.price,
    parseDailyHours(dailyHours.value),
    parseDaysPerWeek(daysPerWeek.value),
  ),
)

const formatEnergy = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
</script>

<template>
  <section class="practical-panel" aria-labelledby="energy-projection-title">
    <div class="panel-title">
      <span class="panel-icon"><Zap :size="21" aria-hidden="true" /></span>
      <div>
        <p>JESZCZE PRAKTYCZNIEJ</p>
        <h3 id="energy-projection-title">Ile kosztuje regularne używanie?</h3>
      </div>
    </div>
    <p class="intro">
      Podstawowy wynik powyżej liczy łączny czas pracy. Tutaj sprawdzisz szacunek dla powtarzającego
      się używania tego samego urządzenia.
    </p>
    <div class="projection-grid">
      <div class="projection-inputs">
        <label for="energy-daily-hours">Godzin w dniu używania</label>
        <span class="input-wrap"
          ><input
            id="energy-daily-hours"
            v-model="dailyHours"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="parseDailyHours(dailyHours) === null"
          /><small>h / dzień</small></span
        >
        <label for="energy-days-per-week">Dni używania w tygodniu</label>
        <span class="input-wrap"
          ><input
            id="energy-days-per-week"
            v-model="daysPerWeek"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            :aria-invalid="parseDaysPerWeek(daysPerWeek) === null"
          /><small>1–7 dni</small></span
        >
        <small
          >Przyjmujemy stałą moc urządzenia i 365 dni w roku. Miesiąc to średnio 1/12 roku.</small
        >
      </div>
      <div v-if="projection" class="projection-results" aria-live="polite">
        <div>
          <span>Dzień używania</span><strong>{{ formatMoney(projection.costPerUseDay) }}</strong
          ><small>{{ formatEnergy(projection.energyPerUseDay) }} kWh</small>
        </div>
        <div>
          <span>Średni miesiąc</span><strong>{{ formatMoney(projection.monthlyCost) }}</strong
          ><small>{{ formatEnergy(projection.monthlyEnergy) }} kWh</small>
        </div>
        <div class="year-result">
          <span><CalendarDays :size="16" aria-hidden="true" /> Cały rok</span
          ><strong>{{ formatMoney(projection.annualCost) }}</strong
          ><small>{{ formatEnergy(projection.annualEnergy) }} kWh</small>
        </div>
      </div>
      <p v-else class="invalid-result">
        Wpisz poprawną liczbę godzin (więcej niż 0, najwyżej 24) oraz dni (od 1 do 7), aby zobaczyć
        prognozę.
      </p>
    </div>
    <p class="caveat">
      Urządzenia z termostatem lub regulowaną mocą nie pobierają energii stale z mocą podaną na
      tabliczce. Prognoza nie obejmuje opłat stałych.
    </p>
  </section>
</template>

<style scoped>
.practical-panel {
  margin-top: 1.25rem;
  padding: 2rem;
  border: 1px solid #e0e5d7;
  border-radius: 22px;
  background: linear-gradient(130deg, #fffefa, #f8f3e8);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.panel-icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #f6e5cf;
  color: #ad674b;
}
.panel-title p {
  color: #a5694f;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h3 {
  margin-top: 0.3rem;
  color: #274b36;
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.intro {
  max-width: 760px;
  margin-top: 1rem;
  color: #697d6e;
  font-size: 0.86rem;
  line-height: 1.7;
}
.projection-grid {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 1.4rem;
  margin-top: 1.5rem;
}
.projection-inputs {
  display: grid;
  grid-template-columns: 1fr;
  align-content: start;
  gap: 0.5rem;
}
.projection-inputs label {
  color: #3c6348;
  font-size: 0.77rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid #d0dfcf;
  border-radius: 10px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #5b966b;
  box-shadow: 0 0 0 3px #5b966b26;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #bc715b;
}
.input-wrap input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #254934;
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 800;
}
.input-wrap small {
  color: #758979;
  font-size: 0.72rem;
  white-space: nowrap;
}
.projection-inputs > small,
.caveat {
  color: #758678;
  font-size: 0.72rem;
  line-height: 1.6;
}
.projection-results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}
.projection-results > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 1.1rem;
  border: 1px solid #d7e5d4;
  border-radius: 15px;
  background: #eef5e9;
}
.projection-results .year-result {
  border-color: #2e6044;
  background: #28563e;
  color: #fff;
}
.projection-results span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #5e8067;
  font-size: 0.72rem;
  font-weight: 800;
}
.projection-results .year-result span,
.projection-results .year-result small {
  color: #d2e5d1;
}
.projection-results strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: clamp(1.15rem, 1.8vw, 1.6rem);
  line-height: 1.1;
}
.projection-results small {
  color: #748a76;
  font-size: 0.72rem;
}
.invalid-result {
  display: grid;
  place-items: center;
  padding: 1.5rem;
  border: 1px dashed #d5c6b3;
  border-radius: 15px;
  color: #9e5b4b;
  font-size: 0.81rem;
}
.caveat {
  margin-top: 1.1rem;
}
@media (max-width: 900px) {
  .projection-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .practical-panel {
    padding: 1.3rem;
  }
  .projection-results {
    grid-template-columns: 1fr;
  }
}
</style>

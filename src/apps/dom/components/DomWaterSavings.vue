<script setup lang="ts">
import { computed } from 'vue'
import { Droplets } from '@lucide/vue'
import { calculateWaterSavings, parseDailyWaterSavings } from '../lib/water-cost'

const litersPerDay = defineModel<string>('litersPerDay', { required: true })
const props = defineProps<{ unitRate: number | null }>()
const savings = computed(() =>
  calculateWaterSavings(parseDailyWaterSavings(litersPerDay.value), props.unitRate),
)
const number = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const money = (value: number) =>
  new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  )
</script>

<template>
  <section class="savings-panel" aria-labelledby="water-savings-title">
    <div class="heading">
      <span class="icon"><Droplets :size="22" aria-hidden="true" /></span>
      <div>
        <p>MAŁA ZMIANA, PROSTY SZACUNEK</p>
        <h3 id="water-savings-title">Ile da mniej zużytej wody?</h3>
      </div>
    </div>
    <p class="intro">
      Wpisz, ile litrów dziennie możesz oszczędzić. Pokażemy różnicę w zużyciu i w koszcie przez
      umowne 30 dni przy stawkach z kalkulatora powyżej.
    </p>
    <div class="savings-grid">
      <div class="field">
        <label for="water-savings-liters">Mniej litrów dziennie</label>
        <span class="input-wrap"
          ><input
            id="water-savings-liters"
            v-model="litersPerDay"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="parseDailyWaterSavings(litersPerDay) === null"
          /><small>l/dzień</small></span
        >
        <small v-if="parseDailyWaterSavings(litersPerDay) === null" class="error"
          >Wpisz liczbę od 0 do 100 000.</small
        >
      </div>
      <div class="result" aria-live="polite">
        <template v-if="savings">
          <span>Przez 30 dni mniej o</span>
          <strong>{{ number(savings.volume30Days) }} m³</strong>
          <span v-if="savings.cost30Days > 0"
            >czyli około <b>{{ money(savings.cost30Days) }} zł</b> mniej za zużycie</span
          >
          <span v-else>Brak wyliczonej oszczędności kosztu przy obecnych stawkach.</span>
        </template>
        <span v-else>Podaj poprawną liczbę litrów i stawki, aby zobaczyć symulację.</span>
      </div>
    </div>
    <p class="caveat">
      To scenariusz, nie prognoza rachunku: zakłada jednakową oszczędność każdego dnia. Nie obniża
      opłaty stałej ani innych pozycji na fakturze. Przy osobnych stawkach przyjmujemy jednakowy
      spadek ilości wody i ścieków.
    </p>
  </section>
</template>

<style scoped>
.savings-panel {
  margin-top: 1.25rem;
  padding: 2rem;
  border: 1px solid #dce9e2;
  border-radius: 22px;
  background: linear-gradient(125deg, #f8f5e8, #ebf6e9);
}
.heading {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.icon {
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #deeddf;
  color: #3a7e76;
}
.heading p {
  color: #a06d50;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h3 {
  margin-top: 0.3rem;
  color: #274b3d;
  font-family: var(--font-heading);
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.intro {
  max-width: 780px;
  margin-top: 1rem;
  color: #697d73;
  font-size: 0.86rem;
  line-height: 1.7;
}
.savings-grid {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 1.4rem;
  margin-top: 1.5rem;
}
.field label {
  display: block;
  margin-bottom: 0.5rem;
  color: #3c6351;
  font-size: 0.77rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 49px;
  padding: 0.6rem 0.85rem;
  border: 1px solid #cddfd4;
  border-radius: 10px;
  background: #fff;
}
.input-wrap:focus-within {
  border-color: #5b9683;
  box-shadow: 0 0 0 3px #5b968326;
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
  white-space: nowrap;
  color: #758979;
  font-size: 0.72rem;
}
.error {
  display: block;
  margin-top: 0.45rem;
  color: #a95242;
}
.result {
  display: grid;
  align-content: center;
  gap: 0.35rem;
  min-height: 105px;
  padding: 1.2rem 1.5rem;
  border: 1px solid #c9dfd5;
  border-radius: 16px;
  background: #e8f4ec;
  color: #315844;
  font-size: 0.82rem;
}
.result strong {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  line-height: 1.2;
}
.caveat {
  margin-top: 1rem;
  color: #758678;
  font-size: 0.72rem;
  line-height: 1.6;
}
@media (max-width: 800px) {
  .savings-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .savings-panel {
    padding: 1.3rem;
  }
}
</style>

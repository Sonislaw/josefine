<script setup lang="ts">
import { parseWaterRate } from '../lib/practical'
import { parseFixedCharge } from '../lib/water-cost'

type WaterPricingMode = 'combined' | 'split'

const mode = defineModel<WaterPricingMode>('mode', { required: true })
const waterRate = defineModel<string>('waterRate', { required: true })
const sewageRate = defineModel<string>('sewageRate', { required: true })
const fixedCharge = defineModel<string>('fixedCharge', { required: true })
</script>

<template>
  <div class="water-pricing" aria-labelledby="water-pricing-title">
    <div>
      <strong id="water-pricing-title">Jak podajesz stawkę?</strong>
      <p>Wybierz łączną cenę z rachunku albo pokaż wodę i ścieki osobno.</p>
    </div>
    <div class="pricing-options" role="group" aria-label="Sposób wyceny wody">
      <button
        type="button"
        :aria-pressed="mode === 'combined'"
        :class="{ active: mode === 'combined' }"
        @click="mode = 'combined'"
      >
        Jedna stawka
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'split'"
        :class="{ active: mode === 'split' }"
        @click="mode = 'split'"
      >
        Woda + ścieki
      </button>
    </div>
    <div v-if="mode === 'split'" class="rate-fields">
      <div class="rate-field">
        <label for="water-rate">Cena wody</label>
        <div class="input-wrap">
          <input
            id="water-rate"
            v-model="waterRate"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="parseWaterRate(waterRate) === null"
            :aria-describedby="parseWaterRate(waterRate) === null ? 'water-rate-error' : undefined"
          /><span>zł/m³</span>
        </div>
        <p v-if="parseWaterRate(waterRate) === null" id="water-rate-error" class="field-error">
          Wpisz stawkę od 0 do 100 000 zł/m³.
        </p>
      </div>
      <div class="rate-field">
        <label for="sewage-rate">Cena odprowadzania ścieków</label>
        <div class="input-wrap">
          <input
            id="sewage-rate"
            v-model="sewageRate"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="parseWaterRate(sewageRate) === null"
            :aria-describedby="
              parseWaterRate(sewageRate) === null ? 'sewage-rate-error' : undefined
            "
          /><span>zł/m³</span>
        </div>
        <p v-if="parseWaterRate(sewageRate) === null" id="sewage-rate-error" class="field-error">
          Wpisz stawkę od 0 do 100 000 zł/m³.
        </p>
      </div>
      <p class="rate-note">
        Dla obu pozycji przyjmujemy tę samą liczbę m³. Jeśli Twoje ścieki są rozliczane inaczej,
        sprawdź dane z rachunku.
      </p>
    </div>
    <div class="rate-field fixed-field">
      <label for="water-fixed-charge"
        >Opłata stała za ten rachunek <span>(opcjonalnie)</span></label
      >
      <div class="input-wrap">
        <input
          id="water-fixed-charge"
          v-model="fixedCharge"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0,00"
          :aria-invalid="parseFixedCharge(fixedCharge) === null"
          :aria-describedby="
            parseFixedCharge(fixedCharge) === null ? 'water-fixed-error' : 'water-fixed-help'
          "
        /><span>zł</span>
      </div>
      <p v-if="parseFixedCharge(fixedCharge) === null" id="water-fixed-error" class="field-error">
        Wpisz kwotę od 0 do 100 000 zł, z dokładnością do groszy.
      </p>
      <p v-else id="water-fixed-help">
        Przepisz sumę opłat stałych z rachunku za ten okres. Nie doliczamy jej do prognozy ani
        oszczędności.
      </p>
    </div>
  </div>
</template>

<style scoped>
.water-pricing {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.4rem;
  padding: 1rem;
  border: 1px solid #d9e7dc;
  border-radius: 14px;
  background: #eef6ee;
}
.water-pricing strong {
  color: #315b40;
  font-family: var(--font-heading);
  font-size: 0.88rem;
}
.water-pricing p {
  margin-top: 0.25rem;
  color: #647a68;
  font-size: 0.72rem;
  line-height: 1.5;
}
.pricing-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.pricing-options button {
  min-height: 40px;
  padding: 0.55rem 0.8rem;
  border: 1px solid #ccdccc;
  border-radius: 9px;
  background: #fffefa;
  color: #42684d;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.pricing-options button.active {
  border-color: #315f45;
  background: #315f45;
  color: #fff;
}
.pricing-options button:focus-visible,
.input-wrap input:focus-visible {
  outline: 2px solid #315f45;
  outline-offset: 2px;
}
.rate-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  padding-top: 0.8rem;
  border-top: 1px solid #d7e4d7;
}
.rate-field {
  min-width: 0;
}
.fixed-field {
  padding-top: 0.8rem;
  border-top: 1px solid #d7e4d7;
}
.fixed-field label span {
  color: #647a68;
  font-weight: 500;
}
.rate-field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.73rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 45px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #cfddcf;
  border-radius: 9px;
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
  font-size: 0.93rem;
  font-weight: 800;
}
.input-wrap span {
  flex: 0 0 auto;
  color: #708575;
  font-size: 0.68rem;
  font-weight: 800;
}
.water-pricing .field-error {
  color: #a95242;
}
.water-pricing .rate-note {
  grid-column: 1 / -1;
  margin: 0;
}
@media (max-width: 560px) {
  .rate-fields {
    grid-template-columns: 1fr;
  }
}
</style>

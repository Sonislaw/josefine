<script setup lang="ts">
import { computed } from 'vue'
import { PaintBucket, PackageCheck } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import {
  calculatePaintPurchase,
  isValidOptionalPaintCanPrice,
  parsePaintCanSize,
} from '../lib/paint-purchase'
import type { ShoppingDraft } from '../stores/shoppingList'
import AddToDomShoppingList from './AddToDomShoppingList.vue'

const props = defineProps<{ requiredLiters: number | null; idPrefix: string }>()
const canSize = defineModel<string>('canSize', { required: true })
const canPrice = defineModel<string>('canPrice', { required: true })

const sizeError = computed(() =>
  parsePaintCanSize(canSize.value) === null ? 'Podaj pojemność puszki większą od zera.' : null,
)
const priceError = computed(() =>
  isValidOptionalPaintCanPrice(canPrice.value)
    ? null
    : 'Wpisz cenę nie mniejszą od zera albo zostaw pole puste.',
)
const purchase = computed(() => {
  if (props.requiredLiters === null || sizeError.value || priceError.value) return null
  return calculatePaintPurchase(
    props.requiredLiters,
    parsePaintCanSize(canSize.value)!,
    canPrice.value.trim() === '' ? null : parseDomNumber(canPrice.value),
  )
})
const shoppingItems = computed<ShoppingDraft[]>(() => {
  if (!purchase.value) return []
  return [
    {
      kind: 'paintCans',
      quantity: purchase.value.canCount,
      packageSizeLiters: parsePaintCanSize(canSize.value)!,
      cost: purchase.value.estimatedCost,
    },
  ]
})

const presets = [1, 2.5, 5, 10] as const
const fieldId = (suffix: string) => `${props.idPrefix}-${suffix}`
const formatLiters = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
</script>

<template>
  <section class="paint-plan" :aria-labelledby="fieldId('title')">
    <div class="plan-heading">
      <span class="heading-icon"><PaintBucket :size="22" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">KROK DALEJ</p>
        <h3 :id="fieldId('title')">Ile puszek farby kupić?</h3>
      </div>
    </div>
    <p class="plan-intro">
      Wynik kalkulatora już uwzględnia 10% zapasu. Wybierz pojemność puszki wybranej farby —
      policzymy liczbę całych opakowań i orientacyjną nadwyżkę.
    </p>

    <div class="plan-grid">
      <div class="plan-fields">
        <label :for="fieldId('size')">Pojemność jednej puszki</label>
        <div class="preset-row" role="group" aria-label="Popularne pojemności puszek">
          <button
            v-for="size in presets"
            :key="size"
            type="button"
            :aria-pressed="parsePaintCanSize(canSize) === size"
            @click="canSize = String(size).replace('.', ',')"
          >
            {{ formatLiters(size) }} l
          </button>
        </div>
        <div class="input-wrap">
          <input
            :id="fieldId('size')"
            v-model="canSize"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="!!sizeError"
            :aria-describedby="sizeError ? fieldId('size-error') : undefined"
          />
          <span>l/puszka</span>
        </div>
        <p v-if="sizeError" :id="fieldId('size-error')" class="field-error">{{ sizeError }}</p>
        <p class="field-help">Możesz też wpisać inną pojemność z etykiety produktu.</p>

        <label :for="fieldId('price')" class="price-label"
          >Cena jednej puszki <small>opcjonalnie</small></label
        >
        <div class="input-wrap">
          <input
            :id="fieldId('price')"
            v-model="canPrice"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="np. 149"
            :aria-invalid="!!priceError"
            :aria-describedby="priceError ? fieldId('price-error') : undefined"
          />
          <span>zł/puszka</span>
        </div>
        <p v-if="priceError" :id="fieldId('price-error')" class="field-error">{{ priceError }}</p>
      </div>

      <div class="plan-result" aria-live="polite">
        <div class="result-label"><PackageCheck :size="18" aria-hidden="true" /> PLAN ZAKUPU</div>
        <template v-if="purchase">
          <div class="primary-result">
            <span>Do kupienia</span><strong>{{ purchase.canCount }} <small>pusz.</small></strong>
          </div>
          <dl class="result-rows">
            <div>
              <dt>Potrzeba z zapasem</dt>
              <dd>{{ formatLiters(requiredLiters!) }} l</dd>
            </div>
            <div>
              <dt>Kupujesz łącznie</dt>
              <dd>{{ formatLiters(purchase.purchasedLiters) }} l</dd>
            </div>
            <div>
              <dt>Orientacyjna nadwyżka</dt>
              <dd>{{ formatLiters(purchase.surplusLiters) }} l</dd>
            </div>
          </dl>
          <div v-if="purchase.estimatedCost !== null" class="cost-row">
            <span>Szacowany koszt farby</span
            ><strong>{{ formatMoney(purchase.estimatedCost) }}</strong>
          </div>
          <p v-else class="price-hint">Podaj cenę puszki, aby zobaczyć koszt zakupu.</p>
        </template>
        <p v-else class="empty-result">
          Popraw wynik kalkulatora lub dane puszki, aby zobaczyć plan zakupu.
        </p>
      </div>
    </div>

    <AddToDomShoppingList :items="shoppingItems" label="Dodaj farbę do Mojego remontu" />
    <p class="plan-note">
      Liczymy pełne puszki jednego rozmiaru, bez mieszania pojemności. Sprawdź rzeczywistą wydajność
      i dostępne opakowania wybranej farby. Osobne kolory lub produkty policz oddzielnie.
    </p>
  </section>
</template>

<style scoped>
.paint-plan {
  margin-top: 1.25rem;
  padding: 2rem;
  border: 1px solid #e8e3d8;
  border-radius: 22px;
  background: linear-gradient(125deg, #fffefa, #f8f1e8);
}
.plan-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.heading-icon {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  border-radius: 13px;
  background: #f2dfd2;
  color: #a8634c;
}
.eyebrow {
  color: #a9664a;
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
  font-size: 0.84rem;
  line-height: 1.7;
}
.plan-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
  margin-top: 1.4rem;
}
.plan-fields,
.plan-result {
  min-width: 0;
  padding: 1.3rem;
  border: 1px solid #e1e6da;
  border-radius: 16px;
  background: #fffefa;
}
.plan-fields label {
  display: block;
  margin-bottom: 0.5rem;
  color: #355b43;
  font-size: 0.78rem;
  font-weight: 800;
}
.plan-fields label small {
  color: #7d8e7f;
  font-size: 0.7rem;
  font-weight: 600;
}
.price-label {
  margin-top: 1.3rem;
}
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
}
.preset-row button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d5e0d1;
  border-radius: 9px;
  background: #f6f9f2;
  color: #436a4d;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.preset-row button[aria-pressed='true'] {
  border-color: #2c5b41;
  background: #2c5b41;
  color: #fff;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 46px;
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
  font-size: 0.72rem;
}
.field-help {
  margin-top: 0.4rem;
  color: #7b8a7b;
  font-size: 0.7rem;
  line-height: 1.5;
}
.plan-result {
  background: #f2f7ee;
}
.result-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #5b8065;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.primary-result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: 1rem;
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
.result-rows > div,
.cost-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}
.result-rows dt,
.cost-row span {
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
.cost-row {
  margin-top: 1.1rem;
  padding: 0.9rem;
  border-radius: 10px;
  background: #e0ecd8;
}
.cost-row strong {
  color: #2b543b;
  font-family: var(--font-heading);
  font-size: 0.95rem;
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
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed #cbdcc8;
  border-radius: 11px;
}
.plan-note {
  margin-top: 1.15rem;
}
@media (max-width: 850px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .paint-plan {
    padding: 1.3rem;
  }
  .primary-result {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

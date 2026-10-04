<script setup lang="ts">
import { computed } from 'vue'
import { Package } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import { calculateTilePurchase } from '../lib/tiles'
import AddToDomShoppingList from './AddToDomShoppingList.vue'
import type { ShoppingDraft } from '../stores/shoppingList'

const props = defineProps<{
  tilesNeeded: number | null
  area: number | null
  tileLength: number | null
  tileWidth: number | null
  preferredRoomId?: string
}>()
const includeBoxes = defineModel<boolean>('includeBoxes', { required: true })
const tilesPerBox = defineModel<string>('tilesPerBox', { required: true })
const boxPrice = defineModel<string>('boxPrice', { required: true })

const tilesPerBoxError = computed(() => {
  if (!includeBoxes.value) return null
  const value = parseDomNumber(tilesPerBox.value)
  return value !== null && Number.isSafeInteger(value) && value > 0
    ? null
    : 'Wpisz całkowitą liczbę płytek większą od zera.'
})
const boxPriceError = computed(() => {
  if (!includeBoxes.value || boxPrice.value.trim() === '') return null
  return parseDomNumber(boxPrice.value) !== null
    ? null
    : 'Wpisz cenę nie mniejszą od zera albo zostaw pole puste.'
})

const purchase = computed(() => {
  if (
    !includeBoxes.value ||
    props.tilesNeeded === null ||
    tilesPerBoxError.value ||
    boxPriceError.value
  )
    return null

  return calculateTilePurchase(
    props.tilesNeeded,
    parseDomNumber(tilesPerBox.value)!,
    boxPrice.value.trim() === '' ? null : parseDomNumber(boxPrice.value),
  )
})

const shoppingItems = computed<ShoppingDraft[]>(() => {
  // The purchase carries its floor scope so room labor is based on saved work, not carton count.
  const details = {
    tileSurface: 'floor' as const,
    ...(props.area !== null && props.area > 0 && props.area <= 4_000_000
      ? { tiledAreaM2: props.area }
      : {}),
    ...(props.tileLength !== null &&
    props.tileWidth !== null &&
    props.tileLength > 0 &&
    props.tileWidth > 0 &&
    props.tileLength <= 300 &&
    props.tileWidth <= 300
      ? { tileLengthCm: props.tileLength, tileWidthCm: props.tileWidth }
      : {}),
  }
  if (includeBoxes.value) {
    return purchase.value
      ? [
          {
            kind: 'tileBoxes',
            quantity: purchase.value.boxCount,
            cost: purchase.value.estimatedCost,
            piecesPerBox: parseDomNumber(tilesPerBox.value)!,
            ...details,
          },
        ]
      : []
  }
  return props.tilesNeeded !== null && props.tilesNeeded > 0
    ? [{ kind: 'tilePieces', quantity: props.tilesNeeded, cost: null, ...details }]
    : []
})

const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const boxPluralRules = new Intl.PluralRules('pl-PL')
function boxUnit(count: number) {
  const form = boxPluralRules.select(count)
  return form === 'one' ? 'karton' : form === 'few' ? 'kartony' : 'kartonów'
}
</script>

<template>
  <section class="tile-plan" aria-labelledby="tile-plan-title">
    <div class="plan-heading">
      <span class="heading-icon"><Package :size="21" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">PLAN ZAKUPU</p>
        <h3 id="tile-plan-title">Kupujesz płytki w kartonach?</h3>
      </div>
    </div>
    <p class="plan-intro">
      Podstawowy wynik powyżej pokazuje liczbę sztuk wraz z zapasem. Jeśli wybrany produkt jest
      sprzedawany tylko w pełnych kartonach, przelicz tę liczbę na opakowania.
    </p>

    <div class="plan-grid">
      <div class="plan-fields">
        <label class="box-toggle" for="tile-box-mode">
          <input id="tile-box-mode" v-model="includeBoxes" type="checkbox" />
          <span
            ><strong>Policz pełne kartony</strong
            ><small>Jeśli kupujesz płytki na sztuki, pozostań przy podstawowym wyniku.</small></span
          >
        </label>

        <div v-if="includeBoxes" class="box-fields">
          <div class="field">
            <label for="tiles-per-box">Liczba płytek w kartonie</label>
            <div class="input-wrap">
              <input
                id="tiles-per-box"
                v-model="tilesPerBox"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :aria-invalid="!!tilesPerBoxError"
                :aria-describedby="tilesPerBoxError ? 'tiles-per-box-error' : undefined"
              /><span>szt./karton</span>
            </div>
            <p v-if="tilesPerBoxError" id="tiles-per-box-error" class="field-error">
              {{ tilesPerBoxError }}
            </p>
          </div>
          <div class="field">
            <label for="tile-box-price">Cena kartonu <small>opcjonalnie</small></label>
            <div class="input-wrap">
              <input
                id="tile-box-price"
                v-model="boxPrice"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                placeholder="np. 129"
                :aria-invalid="!!boxPriceError"
                :aria-describedby="boxPriceError ? 'tile-box-price-error' : undefined"
              /><span>zł/karton</span>
            </div>
            <p v-if="boxPriceError" id="tile-box-price-error" class="field-error">
              {{ boxPriceError }}
            </p>
          </div>
          <p class="field-note">
            Liczbę sztuk i cenę kartonu sprawdź na opakowaniu lub karcie produktu. Cena za m² to
            inna wartość.
          </p>
        </div>
      </div>

      <div class="plan-result" aria-live="polite">
        <template v-if="purchase">
          <div class="primary-result">
            <span>Do kupienia</span>
            <strong
              >{{ formatCount(purchase.boxCount) }}
              <small>{{ boxUnit(purchase.boxCount) }}</small></strong
            >
          </div>
          <dl class="result-rows">
            <div>
              <dt>Potrzebujesz z zapasem</dt>
              <dd>{{ formatCount(tilesNeeded!) }} szt.</dd>
            </div>
            <div>
              <dt>Kupujesz w kartonach</dt>
              <dd>{{ formatCount(purchase.purchasedTiles) }} szt.</dd>
            </div>
            <div>
              <dt>Nadwyżka ponad zapas</dt>
              <dd>{{ formatCount(purchase.spareTiles) }} szt.</dd>
            </div>
          </dl>
          <div v-if="purchase.estimatedCost !== null" class="price-result">
            <span>Szacowany koszt płytek</span>
            <strong>{{ formatMoney(purchase.estimatedCost) }}</strong>
          </div>
          <p v-else class="price-hint">Dodaj cenę kartonu, aby zobaczyć koszt zakupu.</p>
        </template>
        <p v-else-if="includeBoxes" class="empty-result">
          Popraw liczbę sztuk w kalkulatorze lub pola kartonu, aby zobaczyć plan zakupu.
        </p>
        <p v-else class="empty-result">
          Włącz tryb kartonów, jeśli wybrany model nie jest sprzedawany na sztuki.
        </p>
      </div>
    </div>

    <AddToDomShoppingList :items="shoppingItems" :preferred-room-id="preferredRoomId" />
    <p class="plan-note">
      Liczbę kartonów zaokrąglamy w górę. Nadwyżka oznacza sztuki ponad wynik podstawowy, który już
      uwzględnia wpisany zapas na docinki. Koszt nie obejmuje kleju, fug, dostawy ani montażu.
    </p>
  </section>
</template>

<style scoped>
.tile-plan {
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
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
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
.box-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}
.box-toggle input {
  width: 18px;
  height: 18px;
  margin-top: 0.1rem;
  accent-color: #2e6044;
}
.box-toggle strong,
.box-toggle small {
  display: block;
}
.box-toggle strong {
  color: #315b40;
  font-size: 0.84rem;
}
.box-toggle small {
  margin-top: 0.25rem;
  color: #718675;
  font-size: 0.72rem;
  line-height: 1.5;
}
.box-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1.2rem;
  padding-top: 1.1rem;
  border-top: 1px solid #e4ebe0;
}
.field label {
  display: block;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
.field label small {
  color: #7f9180;
  font-size: 0.68rem;
  font-weight: 600;
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
  .tile-plan {
    padding: 1.3rem;
  }
  .box-fields {
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

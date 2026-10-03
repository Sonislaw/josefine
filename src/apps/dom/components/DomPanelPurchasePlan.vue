<script setup lang="ts">
import { computed } from 'vue'
import { Layers3, ShoppingBasket } from '@lucide/vue'
import { parseDomNumber } from '../lib/calculations'
import { calculatePanelPurchase } from '../lib/panels'

const props = defineProps<{
  area: number | null
  packCoverage: number | null
  waste: number | null
}>()

const packPrice = defineModel<string>('packPrice', { required: true })
const includeUnderlay = defineModel<boolean>('includeUnderlay', { required: true })
const underlayCoverage = defineModel<string>('underlayCoverage', { required: true })
const underlayPackPrice = defineModel<string>('underlayPackPrice', { required: true })

function priceError(raw: string): string | null {
  return raw.trim() === '' || parseDomNumber(raw) !== null
    ? null
    : 'Wpisz cenę nie mniejszą od zera albo zostaw pole puste.'
}

const coverageError = computed(() => {
  if (!includeUnderlay.value) return null
  const value = parseDomNumber(underlayCoverage.value)
  return value !== null && value > 0 ? null : 'Podaj powierzchnię większą od zera.'
})

const purchase = computed(() => {
  if (
    props.area === null ||
    props.packCoverage === null ||
    props.waste === null ||
    priceError(packPrice.value) ||
    (includeUnderlay.value && (coverageError.value || priceError(underlayPackPrice.value)))
  )
    return null

  return calculatePanelPurchase({
    area: props.area,
    packCoverage: props.packCoverage,
    waste: props.waste,
    packPrice: packPrice.value.trim() === '' ? null : parseDomNumber(packPrice.value),
    underlay: includeUnderlay.value
      ? {
          coverage: parseDomNumber(underlayCoverage.value)!,
          packPrice:
            underlayPackPrice.value.trim() === '' ? null : parseDomNumber(underlayPackPrice.value),
        }
      : null,
  })
})

const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
</script>

<template>
  <section class="purchase-plan" aria-labelledby="panel-purchase-title">
    <div class="plan-heading">
      <div class="plan-heading-icon"><ShoppingBasket :size="21" aria-hidden="true" /></div>
      <div>
        <p class="eyebrow">KROK DALEJ</p>
        <h3 id="panel-purchase-title">Od wyniku do planu zakupu</h3>
      </div>
    </div>
    <p class="plan-intro">
      Liczba paczek powyżej pozostaje podstawowym wynikiem. Jeśli znasz ceny i potrzebujesz osobnego
      podkładu, uzupełnij dane poniżej, aby oszacować zakupy.
    </p>

    <div class="plan-grid">
      <div class="plan-fields">
        <div class="field-group">
          <strong>Panele</strong>
          <p>Podaj cenę jednej paczki, nie cenę za metr kwadratowy.</p>
          <label for="panel-pack-price">Cena jednej paczki <small>opcjonalnie</small></label>
          <div class="input-wrap">
            <input
              id="panel-pack-price"
              v-model="packPrice"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!priceError(packPrice)"
              :aria-describedby="priceError(packPrice) ? 'panel-pack-price-error' : undefined"
              placeholder="np. 149"
            /><span>zł/paczka</span>
          </div>
          <p v-if="priceError(packPrice)" id="panel-pack-price-error" class="field-error">
            {{ priceError(packPrice) }}
          </p>
        </div>

        <div class="field-group underlay-group">
          <label class="underlay-toggle" for="panel-underlay">
            <input id="panel-underlay" v-model="includeUnderlay" type="checkbox" />
            <span
              ><strong>Potrzebuję osobnego podkładu</strong
              ><small
                >Nie zaznaczaj, jeśli wybrane panele mają już zintegrowany podkład.</small
              ></span
            >
          </label>
          <div v-if="includeUnderlay" class="underlay-fields">
            <div>
              <label for="underlay-coverage">Powierzchnia opakowania podkładu</label>
              <div class="input-wrap">
                <input
                  id="underlay-coverage"
                  v-model="underlayCoverage"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!coverageError"
                  :aria-describedby="coverageError ? 'underlay-coverage-error' : undefined"
                /><span>m²/opak.</span>
              </div>
              <p v-if="coverageError" id="underlay-coverage-error" class="field-error">
                {{ coverageError }}
              </p>
            </div>
            <div>
              <label for="underlay-pack-price">Cena opakowania <small>opcjonalnie</small></label>
              <div class="input-wrap">
                <input
                  id="underlay-pack-price"
                  v-model="underlayPackPrice"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="!!priceError(underlayPackPrice)"
                  :aria-describedby="
                    priceError(underlayPackPrice) ? 'underlay-price-error' : undefined
                  "
                  placeholder="np. 49"
                /><span>zł/opak.</span>
              </div>
              <p v-if="priceError(underlayPackPrice)" id="underlay-price-error" class="field-error">
                {{ priceError(underlayPackPrice) }}
              </p>
            </div>
          </div>
        </div>
        <p class="field-note">W cenach możesz używać przecinka lub kropki dziesiętnej.</p>
      </div>

      <div class="purchase-summary" aria-live="polite">
        <div class="summary-heading"><Layers3 :size="18" aria-hidden="true" /> PLAN MATERIAŁÓW</div>
        <template v-if="purchase">
          <div class="quantity-card">
            <span>Panele</span>
            <strong>{{ purchase.panels.packCount }} <small>paczek</small></strong>
          </div>
          <dl class="summary-rows">
            <div>
              <dt>Powierzchnia z zapasem</dt>
              <dd>{{ formatArea(purchase.panels.requiredArea) }} m²</dd>
            </div>
            <div>
              <dt>Kupujesz w paczkach</dt>
              <dd>{{ formatArea(purchase.panels.purchasedArea) }} m²</dd>
            </div>
            <div>
              <dt>Ponad potrzebę z zapasem</dt>
              <dd>{{ formatArea(purchase.panels.surplusArea) }} m²</dd>
            </div>
            <div v-if="includeUnderlay">
              <dt>Podkład</dt>
              <dd>
                {{ purchase.underlayCount }} opak. / {{ formatArea(purchase.underlayArea!) }} m²
              </dd>
            </div>
          </dl>
          <div
            v-if="purchase.panelCost !== null || purchase.underlayCost !== null"
            class="cost-breakdown"
          >
            <div v-if="purchase.panelCost !== null">
              <span>Panele</span><strong>{{ formatMoney(purchase.panelCost) }}</strong>
            </div>
            <div v-if="purchase.underlayCost !== null">
              <span>Podkład</span><strong>{{ formatMoney(purchase.underlayCost) }}</strong>
            </div>
            <div v-if="purchase.totalCost !== null" class="total-cost">
              <span>Szacowany koszt razem</span
              ><strong>{{ formatMoney(purchase.totalCost) }}</strong>
            </div>
            <p v-else>Podaj obie ceny, aby zobaczyć łączny koszt materiałów.</p>
          </div>
          <p v-else class="cost-placeholder">Podaj ceny, aby zobaczyć szacowany koszt.</p>
        </template>
        <p v-else class="invalid-result">
          Popraw wartości w kalkulatorze lub w planie zakupu, aby zobaczyć zestawienie.
        </p>
      </div>
    </div>
    <p class="plan-caveat">
      To orientacyjny plan materiałów, bez listew, montażu i transportu. Podkład liczymy z
      powierzchni podłogi bez zapasu na docinki paneli; sprawdź zalecenia producenta i zawartość
      opakowań.
    </p>
  </section>
</template>

<style scoped>
.purchase-plan {
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
.plan-heading-icon {
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
.purchase-summary {
  min-width: 0;
  padding: 1.3rem;
  border: 1px solid #dfe7d9;
  border-radius: 16px;
  background: #fffefa;
}
.field-group > strong {
  color: #2e573d;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.field-group > p {
  margin-top: 0.35rem;
  color: #718675;
  font-size: 0.73rem;
  line-height: 1.55;
}
.field-group > label:not(.underlay-toggle),
.underlay-fields label {
  display: block;
  margin-top: 1rem;
  margin-bottom: 0.4rem;
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
label small {
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
.underlay-group {
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid #e4ebe0;
}
.underlay-toggle {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}
.underlay-toggle input {
  width: 18px;
  height: 18px;
  margin-top: 0.1rem;
  accent-color: #2e6044;
}
.underlay-toggle strong,
.underlay-toggle small {
  display: block;
}
.underlay-toggle strong {
  color: #315b40;
  font-size: 0.79rem;
}
.underlay-toggle small {
  margin-top: 0.2rem;
  line-height: 1.45;
}
.underlay-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}
.field-error {
  margin-top: 0.35rem;
  color: #a95242;
  font-size: 0.7rem;
  line-height: 1.45;
}
.field-note,
.plan-caveat {
  margin-top: 1rem;
  color: #7a8b7c;
  font-size: 0.72rem;
  line-height: 1.6;
}
.purchase-summary {
  background: #f4f8ef;
}
.summary-heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #62826a;
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.quantity-card {
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
.quantity-card span {
  color: #d8e8d7;
  font-size: 0.78rem;
  font-weight: 800;
}
.quantity-card strong {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 3vw, 2rem);
  white-space: nowrap;
}
.quantity-card small {
  font-size: 0.55em;
}
.summary-rows {
  display: grid;
  gap: 0.7rem;
  margin: 1.2rem 0 0;
}
.summary-rows > div,
.cost-breakdown > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}
.summary-rows dt,
.cost-breakdown span {
  color: #637d68;
  font-size: 0.75rem;
}
.summary-rows dd {
  margin: 0;
  color: #2d573c;
  font-size: 0.8rem;
  font-weight: 800;
  text-align: right;
}
.cost-breakdown {
  display: grid;
  gap: 0.7rem;
  margin-top: 1.1rem;
  padding-top: 1rem;
  border-top: 1px solid #d7e5d4;
}
.cost-breakdown strong {
  color: #2b543b;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  text-align: right;
}
.cost-breakdown .total-cost {
  margin-top: 0.2rem;
  padding: 0.8rem;
  border-radius: 10px;
  background: #e0ecd8;
}
.cost-breakdown .total-cost span {
  color: #2d573c;
  font-weight: 800;
}
.cost-breakdown p,
.cost-placeholder,
.invalid-result {
  color: #718675;
  font-size: 0.74rem;
  line-height: 1.5;
}
.cost-placeholder {
  margin-top: 1.1rem;
}
.invalid-result {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px dashed #d5c6b3;
  border-radius: 11px;
  color: #a45e4c;
}
.plan-caveat {
  margin-top: 1.2rem;
}
@media (max-width: 850px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .purchase-plan {
    padding: 1.3rem;
  }
  .underlay-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .quantity-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

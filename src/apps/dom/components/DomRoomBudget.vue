<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Wallet, X } from '@lucide/vue'
import {
  parseOptionalLaborRate,
  roomLaborTasks,
  type RoomLaborKind,
  type RoomLaborRates,
  type RoomLaborSummary,
} from '../lib/room-budget'
import type { RoomMetrics } from '../lib/room-metrics'
import { useDomShoppingList, type ShoppingRoom } from '../stores/shoppingList'

const props = defineProps<{
  room: ShoppingRoom
  metrics: RoomMetrics | null
  labor: RoomLaborSummary
  materialTotal: number
  itemCount: number
  missingPrices: number
}>()
const emit = defineEmits<{ requestDimensions: [] }>()
const list = useDomShoppingList()
const editing = ref(false)
const error = ref('')
const draft = reactive<Record<RoomLaborKind, string>>({ painting: '', flooring: '', skirting: '' })

watch(
  () => props.metrics,
  (metrics) => {
    if (!metrics) editing.value = false
  },
)

const pricedItemCount = computed(() => props.itemCount - props.missingPrices)
const hasIncludedCost = computed(() => pricedItemCount.value > 0 || props.labor.lines.length > 0)
const includedTotal = computed(
  () => (Math.round(props.materialTotal * 100) + Math.round(props.labor.total * 100)) / 100,
)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatQuantity = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function openEditor() {
  for (const task of roomLaborTasks) {
    const rate = props.room.laborRates?.[task.id]
    draft[task.id] = rate === undefined ? '' : String(rate).replace('.', ',')
  }
  error.value = ''
  editing.value = true
}

function saveRates() {
  const rates: RoomLaborRates = {}
  for (const task of roomLaborTasks) {
    const rate = parseOptionalLaborRate(draft[task.id])
    if (rate === undefined) {
      error.value =
        'Wpisz poprawną stawkę od 0 do 1 000 000 zł, z maksymalnie dwoma miejscami po przecinku.'
      return
    }
    if (rate !== null) rates[task.id] = rate
  }
  if (!list.setRoomLaborRates(props.room.id, rates)) {
    error.value = 'Nie udało się zapisać stawek. Spróbuj ponownie.'
    return
  }
  error.value = ''
  editing.value = false
}
</script>

<template>
  <section class="room-budget" :aria-labelledby="`room-budget-${room.id}`">
    <div class="budget-heading">
      <div>
        <p class="budget-kicker"><Wallet :size="16" aria-hidden="true" /> PLAN KOSZTÓW</p>
        <h3 :id="`room-budget-${room.id}`">Budżet pokoju</h3>
      </div>
      <button v-if="metrics && !editing" type="button" class="edit-rates" @click="openEditor">
        {{ room.laborRates ? 'Zmień stawki' : 'Dodaj stawki robocizny' }}
      </button>
    </div>

    <p v-if="!metrics" class="budget-intro">
      Do oszacowania robocizny potrzebne są wymiary pokoju.
      <button type="button" @click="emit('requestDimensions')">Dodaj wymiary</button>
      <span v-if="room.laborRates">Wpisane wcześniej stawki pozostają zapisane.</span>
    </p>
    <p v-else-if="!room.laborRates && !editing" class="budget-intro">
      Jeśli znasz stawki wykonawcy, dodaj je osobno dla malowania, podłogi i listew.
    </p>

    <form v-if="editing" class="rates-form" @submit.prevent="saveRates">
      <p>
        Wpisz koszt pracy za jednostkę. Puste pola nie są uwzględniane; 0 zł oznacza pracę bez
        kosztu.
      </p>
      <div class="rate-fields">
        <label v-for="task in roomLaborTasks" :key="task.id" :for="`rate-${room.id}-${task.id}`">
          {{ task.label }}
          <span>
            <input
              :id="`rate-${room.id}-${task.id}`"
              v-model="draft[task.id]"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="np. 35,00"
              :aria-invalid="!!error && parseOptionalLaborRate(draft[task.id]) === undefined"
              :aria-describedby="error ? `rate-error-${room.id}` : undefined"
            />
            zł/{{ task.unit }}
          </span>
        </label>
      </div>
      <p v-if="error" :id="`rate-error-${room.id}`" class="rate-error" role="alert">{{ error }}</p>
      <div class="rate-actions">
        <button type="submit">Zapisz stawki</button>
        <button type="button" class="cancel-button" @click="editing = false">
          <X :size="15" aria-hidden="true" /> Anuluj
        </button>
      </div>
      <small>Wyczyść wszystkie pola i zapisz, aby usunąć stawki z tego pokoju.</small>
    </form>

    <div v-if="labor.lines.length" class="labor-lines" aria-label="Wyliczona robocizna">
      <div v-for="line in labor.lines" :key="line.id">
        <span
          >{{ line.label }} · {{ formatQuantity(line.quantity) }} {{ line.unit }} ×
          {{ formatMoney(line.rate) }}/{{ line.unit }}</span
        >
        <strong>{{ formatMoney(line.cost) }}</strong>
      </div>
    </div>

    <div class="budget-summary" aria-live="polite">
      <div>
        <span>Materiały z podaną ceną</span>
        <strong>{{ pricedItemCount ? formatMoney(materialTotal) : 'Brak cen' }}</strong>
      </div>
      <div>
        <span>Robocizna z podanymi stawkami</span>
        <strong>{{
          !metrics ? 'Brak wymiarów' : labor.lines.length ? formatMoney(labor.total) : 'Brak stawek'
        }}</strong>
      </div>
      <div class="budget-total">
        <span>Suma ujętych kosztów</span>
        <strong>{{ hasIncludedCost ? formatMoney(includedTotal) : 'Brak kosztów' }}</strong>
      </div>
    </div>
    <p v-if="missingPrices" class="budget-warning">
      {{ missingPrices }} {{ missingPrices === 1 ? 'zakup nie ma ceny' : 'zakupów nie ma ceny' }}.
      Nie uwzględniono ich w sumie — wynik jest niepełny.
    </p>
    <p class="budget-footnote">
      Liczymy tylko wpisane ceny i stawki. Malowanie dotyczy powierzchni ścian przed odjęciem okien
      i drzwi; nie doliczamy transportu ani innych prac.
    </p>
  </section>
</template>

<style scoped>
.room-budget {
  margin-top: 1.2rem;
  padding: clamp(1rem, 2.5vw, 1.35rem);
  border: 1px solid #e5ddc9;
  border-radius: 16px;
  background: linear-gradient(145deg, #fbf8ee, #f5f8f1);
}
.budget-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}
.budget-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #a16848;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
h3 {
  margin-top: 0.25rem;
  color: #2d523b;
  font-family: var(--font-heading);
  font-size: 1.15rem;
  letter-spacing: -0.035em;
}
.edit-rates,
.budget-intro button {
  border: 1px solid #bfd2b7;
  border-radius: 9px;
  background: #fffefa;
  color: #315d42;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.edit-rates {
  min-height: 38px;
  padding: 0.55rem 0.75rem;
}
.edit-rates:hover,
.budget-intro button:hover {
  background: #eaf2e6;
}
.budget-intro,
.rates-form > p,
.budget-footnote {
  margin-top: 0.65rem;
  color: #718173;
  font-size: 0.73rem;
  line-height: 1.6;
}
.budget-intro button {
  margin: 0 0.25rem;
  padding: 0.25rem 0.45rem;
}
.budget-intro span {
  display: block;
  margin-top: 0.3rem;
}
.rates-form {
  margin-top: 0.85rem;
  padding-top: 0.8rem;
  border-top: 1px solid #e5ddc9;
}
.rates-form > p {
  margin-top: 0;
}
.rate-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.8rem;
}
.rate-fields label {
  color: #355d43;
  font-size: 0.72rem;
  font-weight: 800;
}
.rate-fields label span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.35rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid #ccd8c8;
  border-radius: 8px;
  background: #fffefa;
  white-space: nowrap;
}
.rate-fields label span:focus-within {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.rate-fields label span:has(input[aria-invalid='true']) {
  border-color: #bc715b;
}
.rate-fields input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #284e38;
  font: inherit;
  font-size: 0.8rem;
}
.rates-form .rate-error {
  margin-top: 0.5rem;
  color: #a34f3c;
}
.rate-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.rate-actions button[type='submit'] {
  min-height: 36px;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 8px;
  background: #28573e;
  color: #fff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.rate-actions button[type='submit']:hover {
  background: #1d4530;
}
.cancel-button {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.4rem;
  border: 0;
  background: transparent;
  color: #617666;
  font-size: 0.73rem;
  font-weight: 800;
  cursor: pointer;
}
.rates-form small {
  display: block;
  margin-top: 0.55rem;
  color: #7b8878;
  font-size: 0.66rem;
}
.labor-lines {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.9rem;
}
.labor-lines > div,
.budget-summary > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}
.labor-lines > div {
  color: #647965;
  font-size: 0.72rem;
}
.labor-lines strong {
  color: #355e43;
  white-space: nowrap;
}
.budget-summary {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.95rem;
  padding-top: 0.85rem;
  border-top: 1px solid #dddcca;
}
.budget-summary > div {
  color: #607762;
  font-size: 0.77rem;
}
.budget-summary strong {
  color: #2d543d;
  text-align: right;
  white-space: nowrap;
}
.budget-summary .budget-total {
  margin-top: 0.2rem;
  color: #254e37;
  font-weight: 800;
}
.budget-total strong {
  font-family: var(--font-heading);
  font-size: 1.2rem;
}
.budget-warning {
  margin-top: 0.8rem;
  padding: 0.65rem;
  border-radius: 8px;
  background: #fff1e4;
  color: #915636;
  font-size: 0.72rem;
  line-height: 1.5;
}
@media (max-width: 650px) {
  .budget-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .rate-fields {
    grid-template-columns: 1fr;
  }
}
</style>

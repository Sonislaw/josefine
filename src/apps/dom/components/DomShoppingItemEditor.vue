<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { parseDomNumber } from '../lib/calculations'
import { shoppingKinds, useDomShoppingList, type ShoppingItem } from '../stores/shoppingList'

const props = defineProps<{ item: ShoppingItem }>()
const emit = defineEmits<{ close: [] }>()
const list = useDomShoppingList()
const quantityId = useId()
const priceId = useId()
const quantity = ref(String(props.item.quantity))
// Existing entries store a total, so derive the displayed unit price only for this edit form.
const initialUnitPriceCents =
  props.item.cost === null ? null : Math.round((props.item.cost / props.item.quantity) * 100)
const unitPrice = ref(
  initialUnitPriceCents === null ? '' : (initialUnitPriceCents / 100).toFixed(2).replace('.', ','),
)
const attempted = ref(false)
const saveError = ref('')

const parsedQuantity = computed(() => {
  const value = parseDomNumber(quantity.value)
  return value !== null && Number.isSafeInteger(value) && value > 0 ? value : null
})
const unitPriceCents = computed(() => {
  const normalized = unitPrice.value
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
  if (normalized === '') return null
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return undefined
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : undefined
})
const totalCents = computed(() => {
  if (parsedQuantity.value === null || unitPriceCents.value == null) return null
  const cents = parsedQuantity.value * unitPriceCents.value
  return Number.isSafeInteger(cents) ? cents : null
})
const totalTooLarge = computed(
  () =>
    parsedQuantity.value !== null &&
    typeof unitPriceCents.value === 'number' &&
    totalCents.value === null,
)
const unchanged = computed(
  () =>
    parsedQuantity.value === props.item.quantity && unitPriceCents.value === initialUnitPriceCents,
)
const previewCost = computed(() =>
  unchanged.value ? props.item.cost : totalCents.value === null ? null : totalCents.value / 100,
)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const previewLabel = computed(() => {
  if (parsedQuantity.value === null || unitPriceCents.value === undefined || totalTooLarge.value)
    return 'Uzupełnij poprawne dane'
  return previewCost.value === null ? 'Cena niepodana' : formatMoney(previewCost.value)
})

function save() {
  attempted.value = true
  saveError.value = ''
  if (parsedQuantity.value === null || unitPriceCents.value === undefined || totalTooLarge.value)
    return
  if (unchanged.value) {
    emit('close')
    return
  }
  if (!list.updateItemPurchase(props.item.id, parsedQuantity.value, unitPriceCents.value)) {
    saveError.value = 'Nie udało się zaktualizować pozycji. Odśwież listę i spróbuj ponownie.'
    return
  }
  emit('close')
}
</script>

<template>
  <form class="item-editor" @submit.prevent="save">
    <div class="edit-fields">
      <label :for="quantityId">
        Ilość ({{ shoppingKinds[item.kind].unit }})
        <input
          :id="quantityId"
          v-model="quantity"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          :aria-invalid="attempted && parsedQuantity === null"
        />
      </label>
      <label :for="priceId">
        Cena za 1 {{ shoppingKinds[item.kind].unit }} (zł)
        <input
          :id="priceId"
          v-model="unitPrice"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="Zostaw puste, jeśli nie znasz ceny"
          :aria-invalid="attempted && (unitPriceCents === undefined || totalTooLarge)"
        />
      </label>
    </div>
    <p class="edit-preview">
      Nowy koszt pozycji:
      <strong>{{ previewLabel }}</strong>
    </p>
    <p v-if="attempted && parsedQuantity === null" class="edit-error" role="alert">
      Ilość musi być liczbą całkowitą większą od zera.
    </p>
    <p v-if="attempted && unitPriceCents === undefined" class="edit-error" role="alert">
      Podaj cenę nie mniejszą od zera, z najwyżej dwoma miejscami po przecinku, albo zostaw pole
      puste.
    </p>
    <p v-if="attempted && totalTooLarge" class="edit-error" role="alert">
      Łączna kwota jest zbyt duża.
    </p>
    <p v-if="saveError" class="edit-error" role="alert">{{ saveError }}</p>
    <div class="edit-actions">
      <button type="submit" class="save-button">Zapisz zmianę</button>
      <button type="button" class="cancel-button" @click="emit('close')">Anuluj</button>
    </div>
    <p class="edit-note">Korygujesz plan zakupu; obliczenie w kalkulatorze pozostaje bez zmian.</p>
  </form>
</template>

<style scoped>
.item-editor {
  flex: 0 0 calc(100% - 3.35rem);
  min-width: 0;
  margin-left: 3.35rem;
  padding: 1rem;
  border: 1px solid #d6e5d1;
  border-radius: 12px;
  background: #f5f9f1;
}
.edit-fields {
  display: grid;
  grid-template-columns: minmax(100px, 0.7fr) minmax(180px, 1.3fr);
  gap: 0.7rem;
}
.edit-fields label {
  display: grid;
  align-content: start;
  gap: 0.35rem;
  color: #315c43;
  font-size: 0.73rem;
  font-weight: 800;
}
.edit-fields input {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #c9d8c5;
  border-radius: 9px;
  background: #fffefa;
  color: #294b36;
  font: inherit;
  font-size: 0.82rem;
}
.edit-fields input:focus-visible {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.edit-fields input[aria-invalid='true'] {
  border-color: #c97561;
}
.edit-preview {
  margin-top: 0.8rem;
  color: #58735f;
  font-size: 0.75rem;
}
.edit-preview strong {
  color: #28573e;
}
.edit-error {
  margin-top: 0.45rem;
  color: #a34f3c;
  font-size: 0.72rem;
}
.edit-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.85rem;
}
.edit-actions button {
  min-height: 38px;
  padding: 0.55rem 0.8rem;
  border-radius: 9px;
  font: inherit;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.save-button {
  border: 1px solid #28573e;
  background: #28573e;
  color: #fff;
}
.save-button:hover {
  background: #1d4530;
}
.cancel-button {
  border: 1px solid #c9d8c5;
  background: #fffefa;
  color: #315c43;
}
.cancel-button:hover {
  background: #eaf2e6;
}
.edit-note {
  margin-top: 0.75rem;
  color: #718675;
  font-size: 0.7rem;
  line-height: 1.5;
}
@media (max-width: 600px) {
  .item-editor {
    flex-basis: 100%;
    margin-left: 0;
  }
  .edit-fields {
    grid-template-columns: 1fr;
  }
}
</style>

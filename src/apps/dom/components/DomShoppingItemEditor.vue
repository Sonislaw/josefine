<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { parseDomNumber } from '../lib/calculations'
import { calculateRoomMetrics } from '../lib/room-metrics'
import {
  shoppingKinds,
  useDomShoppingList,
  type ShoppingItem,
  type TileCoveragePatch,
} from '../stores/shoppingList'

const props = defineProps<{ item: ShoppingItem }>()
const emit = defineEmits<{ close: [] }>()
const list = useDomShoppingList()
const quantityId = useId()
const priceId = useId()
const surfaceId = useId()
const areaId = useId()
const quantity = ref(String(props.item.quantity))
const isTile = props.item.kind === 'tilePieces' || props.item.kind === 'tileBoxes'
const tileSurface = ref<'floor' | 'walls' | ''>(isTile ? (props.item.tileSurface ?? '') : '')
const tiledArea = ref(isTile && props.item.tiledAreaM2 ? String(props.item.tiledAreaM2) : '')
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
const purchaseUnchanged = computed(
  () =>
    parsedQuantity.value === props.item.quantity && unitPriceCents.value === initialUnitPriceCents,
)
const parsedTiledArea = computed(() => {
  if (!tiledArea.value.trim()) return null
  const value = parseDomNumber(tiledArea.value)
  return value !== null && value > 0 && value <= 4_000_000 ? value : undefined
})
const coverageChanged = computed(
  () =>
    isTile &&
    (tileSurface.value !== (props.item.tileSurface ?? '') ||
      parsedTiledArea.value !== (props.item.tiledAreaM2 ?? null)),
)
const roomMetrics = computed(() => {
  const room = list.rooms.find((entry) => entry.id === props.item.roomId)
  return room?.dimensions ? calculateRoomMetrics(room.dimensions) : null
})
const roomSurfaceLimit = computed(() =>
  tileSurface.value === 'floor'
    ? roomMetrics.value?.floor
    : tileSurface.value === 'walls'
      ? roomMetrics.value?.walls
      : null,
)
const coverageError = computed(() => {
  if (!isTile) return null
  if (parsedTiledArea.value === undefined)
    return 'Podaj metraż większy od 0 i nie większy niż 4 000 000 m² albo zostaw pole puste.'
  if (parsedTiledArea.value !== null && !tileSurface.value)
    return 'Wybierz podłogę albo ściany dla zapisanego metrażu.'
  if (
    coverageChanged.value &&
    parsedTiledArea.value !== null &&
    roomSurfaceLimit.value !== null &&
    roomSurfaceLimit.value !== undefined &&
    parsedTiledArea.value > roomSurfaceLimit.value + 0.000001
  )
    return `Metraż jednej pozycji nie może przekraczać całej powierzchni ${tileSurface.value === 'floor' ? 'podłogi' : 'ścian'} tego pokoju (${formatArea(roomSurfaceLimit.value)} m²).`
  return null
})
const coverageWarning = computed(() => {
  if (
    !isTile ||
    parsedTiledArea.value === null ||
    parsedTiledArea.value === undefined ||
    roomSurfaceLimit.value === null ||
    roomSurfaceLimit.value === undefined
  )
    return null
  const otherArea = list.items.reduce((sum, entry) => {
    if (
      entry.id === props.item.id ||
      entry.roomId !== props.item.roomId ||
      (entry.kind !== 'tilePieces' && entry.kind !== 'tileBoxes') ||
      entry.tileSurface !== tileSurface.value
    )
      return sum
    return sum + (entry.tiledAreaM2 ?? 0)
  }, 0)
  return otherArea + parsedTiledArea.value > roomSurfaceLimit.value + 0.000001
    ? `Łączny metraż zapisanych płytek (${formatArea(otherArea + parsedTiledArea.value)} m²) przekracza powierzchnię ${tileSurface.value === 'floor' ? 'podłogi' : 'ścian'} pokoju. Sprawdź, czy nie ma dwóch zapisów tej samej pracy.`
    : null
})
const unchanged = computed(() => purchaseUnchanged.value && !coverageChanged.value)
const previewCost = computed(() =>
  purchaseUnchanged.value
    ? props.item.cost
    : totalCents.value === null
      ? null
      : totalCents.value / 100,
)
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)
const previewLabel = computed(() => {
  if (parsedQuantity.value === null || unitPriceCents.value === undefined || totalTooLarge.value)
    return 'Uzupełnij poprawne dane'
  return previewCost.value === null ? 'Cena niepodana' : formatMoney(previewCost.value)
})

function save() {
  attempted.value = true
  saveError.value = ''
  if (
    parsedQuantity.value === null ||
    unitPriceCents.value === undefined ||
    totalTooLarge.value ||
    coverageError.value
  )
    return
  if (unchanged.value) {
    emit('close')
    return
  }
  const coverage: TileCoveragePatch | undefined = isTile
    ? {
        tileSurface: tileSurface.value || null,
        tiledAreaM2: parsedTiledArea.value ?? null,
      }
    : undefined
  if (
    !list.updateItemPurchase(props.item.id, parsedQuantity.value, unitPriceCents.value, coverage)
  ) {
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
    <div v-if="isTile" class="coverage-fields">
      <label :for="surfaceId">
        Gdzie układasz płytki?
        <select :id="surfaceId" v-model="tileSurface" :aria-invalid="attempted && !!coverageError">
          <option value="">Nie określono</option>
          <option value="floor">Podłoga</option>
          <option value="walls">Ściany</option>
        </select>
      </label>
      <label :for="areaId">
        Powierzchnia układania (m²)
        <input
          :id="areaId"
          v-model="tiledArea"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="np. 12,5"
          :aria-invalid="attempted && !!coverageError"
        />
      </label>
    </div>
    <p v-if="isTile" class="edit-note">
      Wpisz rzeczywisty metraż pod płytki, bez zapasu na docinki. To podstawa robocizny, niezależna
      od liczby kupionych sztuk lub kartonów. Pusty metraż nie będzie liczony w robociźnie.
    </p>
    <p v-if="attempted && coverageError" class="edit-error" role="alert">{{ coverageError }}</p>
    <p v-if="coverageWarning" class="edit-warning">{{ coverageWarning }}</p>
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
.coverage-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid #d6e5d1;
}
.edit-fields label,
.coverage-fields label {
  display: grid;
  align-content: start;
  gap: 0.35rem;
  color: #315c43;
  font-size: 0.73rem;
  font-weight: 800;
}
.edit-fields input,
.coverage-fields input,
.coverage-fields select {
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
.edit-fields input:focus-visible,
.coverage-fields input:focus-visible,
.coverage-fields select:focus-visible {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.edit-fields input[aria-invalid='true'],
.coverage-fields input[aria-invalid='true'],
.coverage-fields select[aria-invalid='true'] {
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
.edit-warning {
  margin-top: 0.5rem;
  color: #926133;
  font-size: 0.73rem;
  line-height: 1.5;
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
  .edit-fields,
  .coverage-fields {
    grid-template-columns: 1fr;
  }
}
</style>

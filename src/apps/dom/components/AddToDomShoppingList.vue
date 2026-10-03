<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Check, Plus } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { ShoppingDraft } from '../stores/shoppingList'
import { useDomShoppingList } from '../stores/shoppingList'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{ items: ShoppingDraft[]; label?: string }>()
const list = useDomShoppingList()
const { rooms } = storeToRefs(list)
const added = ref(false)
const persisted = ref(true)
const selectedRoomId = ref('')
const roomPickerId = useId()

watch(
  () => props.items,
  () => {
    added.value = false
  },
  { deep: true },
)
watch(selectedRoomId, () => {
  added.value = false
})
watch(
  rooms,
  () => {
    if (selectedRoomId.value && !rooms.value.some((room) => room.id === selectedRoomId.value)) {
      selectedRoomId.value = ''
    }
  },
  { deep: true },
)

function add() {
  if (added.value) return
  // Snapshot the displayed result; later calculator edits do not alter saved purchases.
  persisted.value = list.addItems(props.items, selectedRoomId.value || null)
  added.value = true
}
</script>

<template>
  <div v-if="items.length" class="add-row">
    <div v-if="rooms.length" class="room-picker">
      <label :for="roomPickerId">Do pomieszczenia</label>
      <select :id="roomPickerId" v-model="selectedRoomId">
        <option value="">Bez pomieszczenia</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
      </select>
    </div>
    <button type="button" class="add-button" :disabled="added" @click="add">
      <Check v-if="added" :size="17" aria-hidden="true" />
      <Plus v-else :size="17" aria-hidden="true" />
      {{
        added
          ? persisted
            ? 'Dodano do listy'
            : 'Dodano tylko na tę kartę'
          : (label ?? 'Dodaj do Mojego remontu')
      }}
    </button>
    <RouterLink v-if="added" :to="domPath('/moj-remont')">Zobacz listę</RouterLink>
    <span v-if="added && !persisted" class="save-warning"
      >Przeglądarka blokuje zapis. Lista może zniknąć po odświeżeniu.</span
    >
    <span v-if="added" class="sr-only" role="status">{{
      persisted
        ? 'Pozycja została zapisana na liście zakupów.'
        : 'Pozycja została dodana, ale przeglądarka blokuje trwały zapis.'
    }}</span>
  </div>
</template>

<style scoped>
.add-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  margin-top: 1.2rem;
}
.room-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.room-picker label {
  color: #42664c;
  font-size: 0.75rem;
  font-weight: 800;
}
.room-picker select {
  max-width: min(100%, 230px);
  min-height: 42px;
  padding: 0.5rem 0.7rem;
  border: 1px solid #cfddcf;
  border-radius: 10px;
  background: #fffefa;
  color: #284f39;
  font: inherit;
  font-size: 0.78rem;
}
.room-picker select:focus-visible {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.add-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 43px;
  padding: 0.65rem 0.9rem;
  border: 0;
  border-radius: 10px;
  background: #28573e;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}
.add-button:hover {
  background: #1e4531;
}
.add-button:disabled {
  cursor: default;
  background: #56836a;
}
.add-row a {
  color: #28573e;
  font-size: 0.8rem;
  font-weight: 800;
  text-underline-offset: 3px;
}
.save-warning {
  color: #9a543c;
  font-size: 0.75rem;
}
</style>

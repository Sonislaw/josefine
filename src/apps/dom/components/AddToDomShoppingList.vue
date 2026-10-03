<script setup lang="ts">
import { ref, watch } from 'vue'
import { Check, Plus } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { ShoppingDraft } from '../stores/shoppingList'
import { useDomShoppingList } from '../stores/shoppingList'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{ items: ShoppingDraft[]; label?: string }>()
const list = useDomShoppingList()
const added = ref(false)
const persisted = ref(true)

watch(
  () => props.items,
  () => {
    added.value = false
  },
  { deep: true },
)

function add() {
  if (added.value) return
  // Snapshot the displayed result; later calculator edits do not alter saved purchases.
  persisted.value = list.addItems(props.items)
  added.value = true
}
</script>

<template>
  <div v-if="items.length" class="add-row">
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

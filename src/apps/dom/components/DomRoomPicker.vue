<script setup lang="ts">
import { computed, onMounted, useId, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRoute } from 'vue-router'
import { calculateRoomMetrics } from '../lib/room-metrics'
import { domPath } from '../seo/useDomSeo'
import { useDomShoppingList, type ShoppingRoom } from '../stores/shoppingList'

const roomId = defineModel<string>({ required: true })
const emit = defineEmits<{ choose: [room: ShoppingRoom | null] }>()
const list = useDomShoppingList()
const { rooms } = storeToRefs(list)
const route = useRoute()
const selectId = useId()

const selectedRoom = computed(() => rooms.value.find((room) => room.id === roomId.value) ?? null)
const metrics = computed(() =>
  selectedRoom.value?.dimensions ? calculateRoomMetrics(selectedRoom.value.dimensions) : null,
)
const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)

function syncRoomFromUrl() {
  const candidate = route.query.roomId
  // The room ID is local to this browser. A shared URL may not have that room.
  roomId.value =
    typeof candidate === 'string' && rooms.value.some((room) => room.id === candidate)
      ? candidate
      : ''
  // URL fields are restored separately; selecting from the URL must not overwrite them.
}

onMounted(() => {
  list.hydrate()
  syncRoomFromUrl()
})
watch(() => route.query.roomId, syncRoomFromUrl)
watch(rooms, () => {
  if (roomId.value && !rooms.value.some((room) => room.id === roomId.value)) roomId.value = ''
})

function choose(event: Event) {
  roomId.value = (event.target as HTMLSelectElement).value
  emit('choose', selectedRoom.value)
}
</script>

<template>
  <div class="room-context">
    <div class="room-copy">
      <strong>Masz pokój w Moim remoncie?</strong>
      <p v-if="rooms.length">
        Wybierz go, aby użyć zapisanych wymiarów i przypisać zakupy do tego pomieszczenia.
      </p>
      <p v-else>
        <RouterLink :to="domPath('/moj-remont')">Dodaj pomieszczenie w Moim remoncie</RouterLink>,
        by później szybko wykorzystać jego wymiary.
      </p>
    </div>
    <div v-if="rooms.length" class="room-control">
      <label :for="selectId">Zapisane pomieszczenie</label>
      <select :id="selectId" :value="roomId" @change="choose">
        <option value="">Bez pomieszczenia</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
      </select>
      <small v-if="metrics">
        {{ format(metrics.floor) }} m² podłogi · {{ format(metrics.perimeter) }} m obwodu
      </small>
      <small v-else-if="selectedRoom">Brak wymiarów — zakupy nadal trafią do tego pokoju.</small>
    </div>
  </div>
</template>

<style scoped>
.room-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-bottom: 1.2rem;
  padding: 1.1rem 1.35rem;
  border: 1px solid #d8e4d2;
  border-radius: 18px;
  background: linear-gradient(110deg, #f0f7eb, #fffefa);
}
.room-copy {
  flex: 1 1 260px;
}
.room-copy strong {
  color: #28573e;
  font-size: 0.9rem;
}
.room-copy p {
  margin-top: 0.3rem;
  color: #657d6a;
  font-size: 0.76rem;
  line-height: 1.5;
}
.room-copy a {
  color: #28573e;
  font-weight: 800;
  text-underline-offset: 3px;
}
.room-control {
  display: grid;
  gap: 0.35rem;
  flex: 0 1 250px;
  min-width: min(100%, 210px);
}
.room-control label {
  color: #365e44;
  font-size: 0.72rem;
  font-weight: 800;
}
.room-control select {
  width: 100%;
  min-height: 42px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #bfd3bd;
  border-radius: 10px;
  background: #fffefa;
  color: #284f39;
  font: inherit;
  font-size: 0.8rem;
}
.room-control select:focus-visible {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.room-control small {
  color: #69816e;
  font-size: 0.68rem;
}
</style>

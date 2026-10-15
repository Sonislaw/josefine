<script setup lang="ts">
import { BUILDINGS, KEYS, type BuildingKind, type Resources } from './engine'
import ResourceList from './ResourceList.vue'
import TileArt from './TileArt.vue'
defineProps<{
  buildings: BuildingKind[]
  selected: BuildingKind | null
  resources: Resources
  disabled: boolean
}>()
const emit = defineEmits<{ choose: [BuildingKind] }>()
</script>
<template>
  <div class="building-offer">
    <button
      v-for="kind in buildings"
      :key="kind"
      type="button"
      :data-building-card="kind"
      :aria-pressed="selected === kind"
      :disabled="disabled"
      :class="{
        chosen: selected === kind,
        expensive: KEYS.some((r) => resources[r] < BUILDINGS[kind].cost[r]),
      }"
      @click="emit('choose', kind)"
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <TileArt :building="{ x: 0, y: 0, kind, level: 1 }" /></svg
      ><span
        ><strong>{{ BUILDINGS[kind].name }}</strong
        ><small><ResourceList :resources="BUILDINGS[kind].cost" /></small
      ></span>
    </button>
  </div>
  <p v-if="selected" class="offer-description">
    {{ BUILDINGS[selected].description }} <span>Wybierz pustą łąkę na mapie.</span>
  </p>
</template>
<style scoped>
.building-offer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.building-offer button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  border: 1px solid #566149;
  border-radius: 13px;
  background: #f0ead7;
  color: #294a39;
  text-align: center;
  padding: 8px;
  cursor: pointer;
  font: inherit;
}
.building-offer button.chosen {
  outline: 3px solid #e8c66e;
  outline-offset: 1px;
  background: #fff3c9;
}
.building-offer svg {
  width: 36px;
  flex-shrink: 0;
}
.building-offer button > span {
  min-width: 0;
  width: 100%;
  overflow-wrap: anywhere;
}
.building-offer strong {
  display: block;
  font-size: 13px;
}
.building-offer small {
  display: block;
  font-size: 11px;
  margin-top: 4px;
  color: #63705a;
}
.building-offer button.expensive small {
  color: #96452e;
}
.building-offer button:disabled {
  opacity: 0.6;
  cursor: default;
}
.offer-description {
  font-size: 12px;
  line-height: 1.7;
  color: #d2dcb9;
  margin: 12px 0 0;
}
.offer-description span {
  color: #f4d78d;
}
button:focus-visible {
  outline: 3px solid #ffe193;
  outline-offset: 2px;
}
</style>

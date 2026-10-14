<script setup lang="ts">
import { computed } from 'vue'
import { BUILDINGS, actionCost, actionError, type Building, type Kingdom } from './engine'
import { militaryBuilding } from './military'
import { RANKS } from './progression'
import { resourceList } from './format'
const props = defineProps<{
  state: Kingdom
  building: Building
  disabled: boolean
  planned: boolean
}>()
const emit = defineEmits<{ upgrade: []; close: [] }>()
const action = computed(() => ({
  type: 'upgrade' as const,
  x: props.building.x,
  y: props.building.y,
}))
const cost = computed(() => actionCost(props.state, action.value))
const error = computed(() => actionError(props.state, action.value))
const requiredRank = computed(
  () =>
    RANKS[Math.min(3, props.building.level + (militaryBuilding(props.building.kind) ? 1 : 0))]!
      .name,
)
</script>
<template>
  <section
    class="building-popover"
    aria-label="Ulepszanie budynku"
    @keydown.esc.stop.prevent="emit('close')"
  >
    <header>
      <div>
        <strong>{{ building.kind === 'hall' ? 'Ratusz' : BUILDINGS[building.kind].name }}</strong>
        <span>Poziom {{ building.level }} / 3</span>
      </div>
      <button
        class="close-popover"
        type="button"
        aria-label="Zamknij dymek budynku"
        @click="emit('close')"
      >
        ×
      </button>
    </header>
    <p v-if="building.damaged" class="upgrade-error">
      Najpierw napraw budynek — przycisk naprawy znajdziesz pod mapą.
    </p>
    <p v-else-if="building.level >= 3">Najwyższy poziom. Ten budynek nie wymaga już ulepszania.</p>
    <template v-else>
      <p>
        Koszt: <strong>{{ resourceList(cost) }}</strong>
      </p>
      <p>Wymagana ranga: {{ requiredRank }}.</p>
      <p v-if="error" class="upgrade-error" role="status">{{ error }}</p>
      <p v-else-if="planned" class="upgrade-planned" role="status">
        Zaplanowano ulepszenie. Sprawdź prognozę i zatwierdź turę.
      </p>
      <button
        type="button"
        class="upgrade-button"
        :disabled="disabled"
        :aria-pressed="planned"
        @click="emit('upgrade')"
      >
        Ulepsz do {{ building.level + 1 }}
      </button>
    </template>
  </section>
</template>
<style scoped>
.building-popover {
  padding: 10px 12px;
  border: 1px solid #a5b687;
  border-radius: 13px;
  background: #f6eed8;
  color: #294635;
  box-shadow: 0 8px 22px #081d1570;
  font-size: 11px;
  line-height: 1.45;
  cursor: auto;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
header strong {
  display: block;
  font-size: 14px;
}
header span {
  display: block;
  color: #607357;
  font-size: 11px;
}
p {
  margin: 6px 0;
}
button {
  font: inherit;
  min-height: 44px;
  border: 1px solid #748862;
  border-radius: 8px;
  background: #294637;
  color: #f6ebcc;
  cursor: pointer;
}
.close-popover {
  flex-shrink: 0;
  width: 44px;
  padding: 0;
  font-size: 22px;
  background: transparent;
  border-color: transparent;
  color: #294635;
}
.upgrade-button {
  width: 100%;
  margin-top: 4px;
  font-weight: 700;
}
.upgrade-button[aria-pressed='true'] {
  background: #526a3e;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible {
  outline: 3px solid #936a28;
  outline-offset: 2px;
}
.upgrade-error {
  color: #8e4430;
}
.upgrade-planned {
  color: #3c6539;
}
</style>

<script setup lang="ts">
import { KEYS, RESOURCE_NAMES, type Resources } from './engine'
defineProps<{ resources: Resources; delta?: Resources }>()
const icons = { wood: '♧', stone: '◆', food: '♨', gold: '●' }
</script>
<template>
  <div class="kingdom-resources">
    <div v-for="r in KEYS" :key="r" class="resource">
      <span class="resource-icon" :class="r">{{ icons[r] }}</span>
      <div>
        <span class="resource-name">{{ RESOURCE_NAMES[r] }}</span
        ><strong :data-resource="r">{{ resources[r].toLocaleString('pl-PL') }}</strong>
      </div>
      <span v-if="delta" class="delta" :class="{ negative: delta[r] < 0 }"
        >{{ delta[r] >= 0 ? '+' : '' }}{{ delta[r] }}</span
      >
    </div>
  </div>
</template>
<style scoped>
.kingdom-resources {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.resource {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #3d5645;
  background: #203b30;
  border-radius: 16px;
  padding: 16px;
  min-width: 0;
}
.resource-icon {
  font-size: 25px;
  color: #b4d287;
}
.stone {
  color: #b6c9c2;
}
.food {
  color: #e9b47c;
}
.gold {
  color: #eace83;
}
.resource-name {
  display: block;
  color: #b7c6ac;
  font-size: 11px;
  letter-spacing: 0.04em;
}
.resource strong {
  font-size: 23px;
  display: block;
  color: #fff2cf;
  font-variant-numeric: tabular-nums;
}
.delta {
  margin-left: auto;
  font-size: 12px;
  color: #c5e594;
}
.delta.negative {
  color: #ffbc98;
}
@media (max-width: 700px) {
  .kingdom-resources {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }
  .resource {
    padding: 10px 12px;
  }
  .resource strong {
    font-size: 20px;
  }
}
</style>

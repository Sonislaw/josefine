<script setup lang="ts">
import { KEYS, RESOURCE_NAMES, type Resources } from './engine'
defineProps<{ resources: Resources; delta?: Resources; limits?: Resources }>()
const icons = { wood: '♧', stone: '◆', food: '♨', gold: '●' }
</script>
<template>
  <div class="kingdom-resources" role="region" aria-label="Zapasy osady">
    <div v-for="r in KEYS" :key="r" class="resource">
      <span class="resource-label">
        <span class="resource-icon" :class="r" aria-hidden="true">{{ icons[r] }}</span>
        <span class="resource-name">{{ RESOURCE_NAMES[r] }}</span>
      </span>
      <div class="resource-amount">
        <strong :data-resource="r" :class="{ 'large-value': resources[r] >= 100000 }">{{
          resources[r].toLocaleString('pl-PL')
        }}</strong>
        <span v-if="delta" class="delta" :class="{ negative: delta[r] < 0 }"
          >{{ delta[r] >= 0 ? '+' : '' }}{{ delta[r] }}</span
        >
      </div>
      <small v-if="limits" class="stock-limit">Limit {{ limits[r] }}</small>
    </div>
  </div>
</template>
<style scoped>
.stock-limit {
  display: block;
  font-size: 10px;
  line-height: 1.2;
  color: #b7c6ac;
}
.kingdom-resources {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.resource {
  display: grid;
  align-content: start;
  gap: 3px;
  border: 1px solid #3d5645;
  background: #203b30;
  border-radius: 10px;
  padding: 8px 12px;
  min-width: 0;
}
.resource-label {
  display: flex;
  align-items: center;
  gap: 5px;
}
.resource-amount {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}
.resource-icon {
  font-size: 13px;
  line-height: 1;
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
  color: #b7c6ac;
  font-size: 11px;
  line-height: 1.2;
}
.resource strong {
  font-size: 20px;
  line-height: 1.2;
  min-width: 0;
  display: block;
  color: #fff2cf;
  font-variant-numeric: tabular-nums;
}
.delta {
  font-size: 11px;
  line-height: 1.2;
  color: #c5e594;
}
.delta.negative {
  color: #ffbc98;
}
@media (max-width: 700px) {
  .kingdom-resources {
    gap: 4px;
  }
  .resource {
    padding: 6px;
  }
  .resource-label {
    gap: 3px;
  }
  .resource-name {
    font-size: 10px;
  }
  .resource-icon {
    font-size: 11px;
  }
  .resource strong {
    font-size: 17px;
  }
  .resource strong.large-value {
    font-size: 12px;
    line-height: 1.7;
  }
}
</style>

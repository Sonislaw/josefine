<script setup lang="ts">
import { computed } from 'vue'
import { KEYS, type Resources } from './engine'
import ResourceAmount from './ResourceAmount.vue'
const props = withDefaults(defineProps<{ resources: Partial<Resources>; empty?: string }>(), {
  empty: 'Bez kosztu',
})
const items = computed(() => KEYS.filter((k) => props.resources[k]))
</script>
<template>
  <span class="resource-list">
    <ResourceAmount
      v-for="resource in items"
      :key="resource"
      :resource="resource"
      :amount="resources[resource]!"
    />
    <template v-if="!items.length">{{ empty }}</template>
  </span>
</template>
<style scoped>
.resource-list {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 8px;
  vertical-align: middle;
  max-width: 100%;
}
</style>

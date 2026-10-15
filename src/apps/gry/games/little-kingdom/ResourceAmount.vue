<script setup lang="ts">
import { computed } from 'vue'
import type { Resource } from './engine'
import { resourceAmount } from './format'
import ResourceIcon from './ResourceIcon.vue'
const props = defineProps<{ resource: Resource; amount: number; signed?: boolean }>()
const prefix = computed(() => (props.signed && props.amount >= 0 ? '+' : ''))
const description = computed(() => prefix.value + resourceAmount(props.resource, props.amount))
</script>
<template>
  <span class="resource-quantity" :title="description">
    <ResourceIcon :resource="resource" />
    <span aria-hidden="true">{{ prefix }}{{ amount.toLocaleString('pl-PL') }}</span>
    <span class="resource-a11y">{{ description }}</span>
  </span>
</template>
<style scoped>
.resource-quantity {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}
.resource-a11y {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>

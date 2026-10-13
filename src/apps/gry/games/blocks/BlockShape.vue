<script setup lang="ts">
import { computed } from 'vue'
import { shapeSize, type Shape } from './engine'
const props = withDefaults(defineProps<{ shape: Shape; unit?: number }>(), { unit: 20 })
const size = computed(() => shapeSize(props.shape))
</script>
<template>
  <svg
    aria-hidden="true"
    :viewBox="`0 0 ${size.width * 20} ${size.height * 20}`"
    :width="size.width * unit"
    :height="size.height * unit"
    class="block-shape"
  >
    <rect
      v-for="([x, y], i) in shape.cells"
      :key="i"
      :x="x * 20 + 1"
      :y="y * 20 + 1"
      width="17"
      height="17"
      rx="3"
      :fill="`var(--block-${shape.color})`"
      stroke="#ffffff55"
      stroke-width="1"
    />
  </svg>
</template>

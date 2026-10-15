<script setup lang="ts">
import type { Resource } from './engine'
defineProps<{ resource: Resource }>()
</script>
<template>
  <svg
    class="kingdom-resource-icon"
    :data-resource-icon="resource"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <g v-if="resource === 'wood'" stroke="#725131" stroke-width="1.2">
      <path d="m4 12 12-6 4 4-12 6Zm0 5 12-6 4 4-12 6Z" fill="#b68853" />
      <ellipse cx="6" cy="14" rx="3.5" ry="2.5" transform="rotate(28 6 14)" fill="#f0d59c" />
      <ellipse cx="6" cy="19" rx="3.5" ry="2.5" transform="rotate(28 6 19)" fill="#f0d59c" />
      <path d="m11 11 6-3m-6 8 6-3M5 13l2 2m-2 3 2 2" fill="none" />
    </g>
    <g v-else-if="resource === 'stone'" stroke="#506b64" stroke-width="1.2">
      <path d="m3 16 4-9 8-4 6 9-2 8H8Z" fill="#a9beb4" />
      <path d="m7 7 8-4-3 11-9 2Z" fill="#e0e6d5" />
      <path d="m12 14 9-2-2 8H8Z" fill="#819b91" />
      <path d="m12 14-4 6m4-6 3-11" fill="none" />
    </g>
    <g v-else-if="resource === 'food'" stroke="#806139" stroke-width="1.1">
      <path d="m8 3 4 2 4-2-1 6q7 8 3 12H6q-4-4 3-12Z" fill="#e4c28b" />
      <path d="M8 9h8m-7 2h6" stroke="#65814c" stroke-width="1.7" />
      <path d="M12 19v-6m0 3-3-2m3 4 3-2" fill="none" />
      <path d="M11 5h3" fill="none" />
    </g>
    <g v-else stroke="#8d692e" stroke-width="1.2">
      <circle cx="12" cy="12" r="9" fill="#efc85e" />
      <circle cx="12" cy="12" r="6.2" fill="#f7df8c" />
      <path d="m12 7 3 5-3 5-3-5Z" fill="#d4a13d" />
      <path d="m6 7 2-2" stroke="#fff0b7" stroke-width="1.6" />
    </g>
  </svg>
</template>
<style scoped>
.kingdom-resource-icon {
  display: inline-block;
  width: 1.3em;
  height: 1.3em;
  min-width: 14px;
  min-height: 14px;
  flex-shrink: 0;
  vertical-align: -0.25em;
}
</style>

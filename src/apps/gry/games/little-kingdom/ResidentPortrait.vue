<script setup lang="ts">
import { computed } from 'vue'
import { REQUEST_IDS, type RequestId } from './requests'
const props = defineProps<{ id: RequestId }>()
const index = computed(() => REQUEST_IDS.indexOf(props.id))
const coat = computed(
  () => ['#708659', '#4f7364', '#a5724f', '#8c7056', '#5b8190', '#907f50'][index.value % 6],
)
const skin = computed(() => ['#e6b98b', '#ba8b62', '#d2a173'][index.value % 3])
</script>
<template>
  <svg viewBox="0 0 64 64" aria-hidden="true" class="resident-portrait">
    <rect x="1" y="1" width="62" height="62" rx="18" fill="#dedbc0" stroke="#b5b886" />
    <path d="M8 60v-7c0-12 10-18 24-18s24 6 24 18v7" :fill="coat" />
    <path d="M26 36v9l6 6 6-6v-9" :fill="skin" />
    <ellipse cx="32" cy="27" rx="15" ry="18" :fill="skin" />
    <path
      d="M17 27c-2-17 6-22 16-22s17 9 15 24l-5-13-8 4-12-7z"
      :fill="index % 3 === 0 ? '#976f42' : index % 3 === 1 ? '#494d3b' : '#7c5340'"
    />
    <g fill="#394c3e">
      <circle cx="26" cy="28" r="1.5" />
      <circle cx="38" cy="28" r="1.5" />
    </g>
    <path
      d="M29 36q3 3 6 0"
      fill="none"
      stroke="#895b43"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      v-if="index % 4 === 0"
      d="M11 18h42l-5-6H16zM22 12V4h20v8"
      fill="#bfa068"
      stroke="#897344"
    />
    <path v-else-if="index % 4 === 1" d="M14 17q2-16 18-16t18 16z" :fill="coat" />
    <path v-else-if="index % 4 === 2" d="M16 17q-2-14 16-14t16 14h-8l-7-7-7 7z" fill="#eee7c9" />
    <g v-else fill="none" stroke="#75684e" stroke-width="1.5">
      <circle cx="25" cy="28" r="5" />
      <circle cx="39" cy="28" r="5" />
      <path d="M30 27h4" />
    </g>
    <path d="M23 46l9 6 9-6M32 52v10" fill="none" stroke="#e1deb0" stroke-width="2" />
    <circle cx="49" cy="51" r="6" fill="#e9d28a" />
    <path d="M46 51l2 2 4-5" stroke="#566747" stroke-width="1.5" fill="none" />
  </svg>
</template>

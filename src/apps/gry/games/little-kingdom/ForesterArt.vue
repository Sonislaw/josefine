<script setup lang="ts">
defineProps<{ level: number; winter: boolean }>()
</script>
<template>
  <g data-forester-art="true" stroke="#4e6140" stroke-width="1" stroke-linejoin="round">
    <ellipse cx="32" cy="53" rx="28" ry="8" fill="#36553b" opacity=".2" stroke="none" />
    <path d="M8 29h34v25H8z" fill="#bd9863" />
    <path d="M9 35h32m-32 6h32m-32 6h32" stroke="#8a6b43" />
    <path d="M12 26V14h6v7" fill="#a79472" />
    <path d="M4 30 23 10l22 20Z" :fill="winter ? '#d9e4cc' : '#466b46'" />
    <path d="m7 27 16-15 18 15" stroke="#9cb675" stroke-width="2.5" fill="none" />
    <path d="M12 34h9v10h-9z" fill="#f1d387" /><path d="M16.5 34v10m-4-5h9" />
    <path d="M27 54V37h9v17" fill="#53633c" /><circle cx="33" cy="46" r="1" fill="#f3d78f" />
    <path d="M41 43h19v14H41z" fill="#a07b48" /><path d="M44 46h13m-13 5h13" stroke="#d3ba7f" />
    <path d="M46 48v-9m8 9V36" stroke="#658145" stroke-width="1.5" />
    <path
      d="M46 43q-7-1-6-6 7-1 6 6m0-3q1-7 6-5 0 5-6 5M54 42q-6 0-6-5 6-1 6 5m0-3q0-7 5-7 2 5-5 7"
      fill="#8daf5d"
    />
    <path d="M4 42v14m-2-9h6m-6 7h6" stroke="#b5bc88" stroke-width="2" />
    <path d="m36 26 5-8m-5 1 6 5" stroke="#e4d9ad" stroke-width="2" />
    <g v-if="level > 1"
      ><path d="M4 7h13v7H4z" fill="#af8d5b" /><path d="m2 7 8-5 9 5Z" fill="#668154"
    /></g>
    <g v-if="level > 2"
      ><path d="M45 31V18l8-7 8 7v13Z" fill="#b2d5b0" fill-opacity=".85" /><path
        d="M45 18h16m-8-7v20m-8-7h16"
        fill="none"
    /></g>
  </g>
</template>

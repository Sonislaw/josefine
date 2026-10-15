<script setup lang="ts">
defineProps<{ stage: 1 | 2; winter: boolean }>()
</script>
<template>
  <g :data-forest-stage="stage" stroke-linecap="round" stroke-linejoin="round">
    <g
      v-for="(p, i) in [
        [16, 36],
        [43, 29],
        [36, 53],
      ]"
      :key="i"
      :transform="`translate(${p[0]} ${p[1]})`"
    >
      <ellipse rx="11" ry="4" :fill="winter ? '#a3b4a0' : '#5e7041'" opacity=".35" />
      <g v-if="stage === 1" stroke="#547040" stroke-width="1.4">
        <path d="M0 1v-9" /><path
          d="M0-4q-10-1-8-7 8 0 8 7m0-3q0-9 8-10 3 7-8 10"
          :fill="winter ? '#b0c898' : '#b4d47e'"
        />
      </g>
      <g v-else>
        <path d="M-2 1v-24h4V1" fill="#876840" />
        <path
          d="M0-31-10-17h5l-9 12h28L5-17h5Z"
          :fill="winter ? '#bdd4b8' : '#6b9b52'"
          stroke="#466f42"
          stroke-width="1"
        />
        <path
          d="m0-29-6 10h5l-7 10"
          fill="none"
          :stroke="winter ? '#edf1dc' : '#a8c77a'"
          stroke-width="2"
        />
      </g>
    </g>
  </g>
</template>

<script setup lang="ts">defineProps<{ module: string; tool: string; description: string }>()</script>
<template><article><p class="eyebrow">Moduł: {{ module }}</p><h1>{{ tool }}</h1><p>{{ description }}</p><p class="notice">To jest placeholder dla przyszłego narzędzia.</p></article></template>
<style scoped>.eyebrow { color: #666; } .notice { margin-top: 2rem; padding: 1rem; background: #f5f5f5; }</style>

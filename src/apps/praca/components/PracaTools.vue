<script setup lang="ts">
import { pracaModule } from '../manifest'
import ToolCard from '@/shared/components/ToolCard.vue'
</script>

<template><div class="tools"><ToolCard v-for="tool in pracaModule.tools" :key="tool.to" v-bind="tool" /></div></template>
<style scoped>.tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }</style>

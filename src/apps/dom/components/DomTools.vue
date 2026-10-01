<script setup lang="ts">
import ToolCard from '@/shared/components/ToolCard.vue'
import { domModule } from '../manifest'
</script>

<template><div class="tools"><ToolCard v-for="tool in domModule.tools" :key="tool.id" v-bind="tool" /></div></template>

<style scoped>.tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }</style>

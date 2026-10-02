<script setup lang="ts">
import ToolCard from '@/shared/components/ToolCard.vue'
import { pieniadzeModule } from '../manifest'
</script>
<template>
  <div class="tools">
    <ToolCard
      v-for="tool in pieniadzeModule.tools"
      :key="tool.id"
      :title="tool.title"
      :description="tool.description"
      :to="tool.to"
    />
  </div>
</template>
<style scoped>
.tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
</style>

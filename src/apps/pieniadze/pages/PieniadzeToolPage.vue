<script setup lang="ts">
import PieniadzeCalculator from '../components/PieniadzeCalculator.vue'
import type { PieniadzeToolId } from '../manifest'
defineProps<{ toolId: PieniadzeToolId }>()
</script>
<template><PieniadzeCalculator :tool-id="toolId"/></template>

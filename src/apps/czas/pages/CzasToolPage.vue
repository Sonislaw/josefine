<script setup lang="ts">import CzasCalculator from '../components/CzasCalculator.vue'; import type { CzasToolId } from '../manifest'; defineProps<{ toolId: CzasToolId }>()</script>
<template><CzasCalculator :tool-id="toolId"/></template>

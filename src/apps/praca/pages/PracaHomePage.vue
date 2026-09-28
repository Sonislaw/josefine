<script setup lang="ts">
import PracaTools from '../components/PracaTools.vue'
import { pracaModule } from '../manifest'
</script>
<template><section><p>Moduł</p><h1>{{ pracaModule.name }}</h1><p>{{ pracaModule.description }}</p><PracaTools /></section></template>

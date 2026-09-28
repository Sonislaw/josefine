<script setup lang="ts">
import CaravaningTools from '../components/CaravaningTools.vue'
import { caravaningModule } from '../manifest'
</script>
<template><section><p>Moduł</p><h1>{{ caravaningModule.name }}</h1><p>{{ caravaningModule.description }}</p><CaravaningTools /></section></template>

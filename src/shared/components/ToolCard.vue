<script setup lang="ts">defineProps<{ title: string; description: string; to: string }>()</script>
<template><!-- Presentational only: metadata is supplied by a module. --><RouterLink class="tool-card" :to="to"><h3>{{ title }}</h3><p>{{ description }}</p></RouterLink></template>
<style scoped>.tool-card { display: block; padding: 1rem; color: inherit; text-decoration: none; border: 1px solid #ddd; border-radius: .5rem; } .tool-card:hover { border-color: #777; } h3 { margin: 0 0 .5rem; } p { margin: 0; color: #555; }</style>

<script setup lang="ts">
import { useGoogleAnalytics } from '@/shared/analytics/GoogleAnalytics'

// App is mounted for every route tree, so the tag is shared by all current and future modules.
useGoogleAnalytics()
</script>

<template>
  <!-- The layout is selected by the route tree, keeping App independent of individual modules. -->
  <RouterView />
</template>

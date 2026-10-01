<script setup lang="ts">
import { useGoogleAnalytics } from '@/shared/analytics/GoogleAnalytics'
import CookieNotice from '@/shared/components/CookieNotice.vue'

// App is mounted for every route tree, so the tag is shared by all current and future modules.
useGoogleAnalytics()
</script>

<template>
  <!-- The layout is selected by the route tree, keeping App independent of individual modules. -->
  <RouterView />
  <!-- One notice for every module; it does not control the analytics tag. -->
  <CookieNotice />
</template>

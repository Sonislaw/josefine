<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useGoogleAnalytics } from '@/shared/analytics/GoogleAnalytics'
import CookieNotice from '@/shared/components/CookieNotice.vue'
import { siteIcons } from '@/config/siteIcons'

const route = useRoute()
const icons = computed(() => {
  const moduleId = route.meta.moduleId
  return typeof moduleId === 'string' && moduleId in siteIcons
    ? siteIcons[moduleId as keyof typeof siteIcons]
    : siteIcons.platform
})

// A single reactive head entry covers SSG, client-side navigation and localhost module paths.
useHead(() => ({
  link: [
    { rel: 'icon', href: icons.value.favicon, type: icons.value.type },
    { rel: 'apple-touch-icon', href: icons.value.appleTouchIcon },
  ],
}))

// App is mounted for every route tree, so the tag is shared by all current and future modules.
useGoogleAnalytics()
</script>

<template>
  <!-- The layout is selected by the route tree, keeping App independent of individual modules. -->
  <RouterView />
  <!-- One notice for every module; it does not control the analytics tag. -->
  <CookieNotice />
</template>

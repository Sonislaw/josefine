<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { jednostkiPath, jednostkiSiteName, jednostkiSiteUrl, useJednostkiSeo } from '../seo/useJednostkiSeo'

useJednostkiSeo('privacy', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Polityka prywatności',
  url: `${jednostkiSiteUrl}/polityka-prywatnosci`,
  isPartOf: { '@type': 'WebSite', name: jednostkiSiteName, url: jednostkiSiteUrl },
})
</script>

<template><PrivacyPolicyContent :application-name="jednostkiSiteName" :site-url="jednostkiSiteUrl" :home-to="jednostkiPath('/')" /></template>

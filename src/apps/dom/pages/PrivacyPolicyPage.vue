<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { domPath, domSiteName, domSiteUrl, useDomSeo } from '../seo/useDomSeo'

useDomSeo('privacy', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Polityka prywatności',
  url: `${domSiteUrl}/polityka-prywatnosci`,
  isPartOf: { '@type': 'WebSite', name: domSiteName, url: domSiteUrl },
})
</script>

<template><PrivacyPolicyContent :application-name="domSiteName" :site-url="domSiteUrl" :home-to="domPath('/')" /></template>

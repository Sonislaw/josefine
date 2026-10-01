<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { motoryzacjaPath, motoryzacjaSiteName, motoryzacjaSiteUrl, useMotoryzacjaSeo } from '../seo/useMotoryzacjaSeo'

useMotoryzacjaSeo('privacy', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Polityka prywatności',
  url: `${motoryzacjaSiteUrl}/polityka-prywatnosci`,
  isPartOf: { '@type': 'WebSite', name: motoryzacjaSiteName, url: motoryzacjaSiteUrl },
})
</script>

<template><PrivacyPolicyContent :application-name="motoryzacjaSiteName" :site-url="motoryzacjaSiteUrl" :home-to="motoryzacjaPath('/')" /></template>

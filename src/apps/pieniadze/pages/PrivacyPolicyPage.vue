<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { pieniadzePath, pieniadzeSiteName, pieniadzeSiteUrl, usePieniadzeSeo } from '../seo/usePieniadzeSeo'
usePieniadzeSeo('privacy', { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Polityka prywatności', url: `${pieniadzeSiteUrl}/polityka-prywatnosci`, isPartOf: { '@type': 'WebSite', name: pieniadzeSiteName, url: pieniadzeSiteUrl } })
</script>
<template><PrivacyPolicyContent :application-name="pieniadzeSiteName" :site-url="pieniadzeSiteUrl" :home-to="pieniadzePath('/')"/></template>

<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { czasPath, czasSiteUrl, useCzasSeo } from '../seo/useCzasSeo'
useCzasSeo('privacy', { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Polityka prywatności', url: `${czasSiteUrl}/polityka-prywatnosci`, isPartOf: { '@type': 'WebSite', name: 'Czas — kalkulatory dat i godzin', url: czasSiteUrl } })
</script>
<template><PrivacyPolicyContent application-name="Czas — kalkulatory dat i godzin" :site-url="czasSiteUrl" :home-to="czasPath('/')"/></template>

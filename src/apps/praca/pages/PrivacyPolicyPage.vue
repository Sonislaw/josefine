<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { pracaPath, pracaSiteName, pracaSiteUrl, usePracaSeo } from '../seo/usePracaSeo'
usePracaSeo('privacy', { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Polityka prywatności', url: `${pracaSiteUrl}/polityka-prywatnosci`, isPartOf: { '@type': 'WebSite', name: pracaSiteName, url: pracaSiteUrl } })
</script>
<template><PrivacyPolicyContent :application-name="pracaSiteName" :site-url="pracaSiteUrl" :home-to="pracaPath('/')"/></template>

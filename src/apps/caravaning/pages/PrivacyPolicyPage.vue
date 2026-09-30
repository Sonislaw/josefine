<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { getModulePath } from '@/config/domains'
import { siteName, siteUrl, useCaravaningSeo } from '../seo/useCaravaningSeo'
useCaravaningSeo('privacy', { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Polityka prywatności', url: `${siteUrl}/polityka-prywatnosci`, isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl } })
</script>
<template><PrivacyPolicyContent :application-name="siteName" :site-url="siteUrl" :home-to="getModulePath('caravaning', '/')"/></template>

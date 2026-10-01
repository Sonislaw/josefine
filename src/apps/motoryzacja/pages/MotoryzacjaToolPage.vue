<script setup lang="ts">
import { ArrowLeft, ArrowUpRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import MotoryzacjaCalculator from '../components/MotoryzacjaCalculator.vue'
import { motoryzacjaTools, type MotoryzacjaToolId } from '../manifest'
import { motoryzacjaSeoContent } from '../seo/content'
import { motoryzacjaPath, motoryzacjaSiteName, motoryzacjaSiteUrl, useMotoryzacjaSeo } from '../seo/useMotoryzacjaSeo'

const props = defineProps<{ toolId: MotoryzacjaToolId }>()
const tool = motoryzacjaTools.find((item) => item.id === props.toolId)!
const content = motoryzacjaSeoContent[props.toolId]
const relatedTools = motoryzacjaTools.filter((item) => item.id !== props.toolId).slice(0, 3)

useMotoryzacjaSeo(props.toolId, {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'SoftwareApplication', name: `Kalkulator ${tool.title}`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'pl-PL', url: `${motoryzacjaSiteUrl}/${tool.id}`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' }, publisher: { '@type': 'Organization', name: motoryzacjaSiteName, url: motoryzacjaSiteUrl } },
    { '@type': 'FAQPage', mainEntity: content.faqs.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ],
})
</script>

<template>
  <div class="tool-page"><nav class="breadcrumb" aria-label="Ścieżka nawigacji"><RouterLink :to="motoryzacjaPath('/')"><ArrowLeft :size="16" aria-hidden="true" /> Wszystkie kalkulatory</RouterLink><span aria-hidden="true">/</span><span>{{ tool.category }}</span></nav><header class="page-header"><div><span class="category-pill">{{ tool.category }} <span aria-hidden="true">·</span> Motoryzacja</span><h1>{{ tool.title }}</h1><p>{{ tool.description }} Wpisz wartości, a wynik zobaczysz od razu wraz ze wzorem obliczenia.</p></div><div class="header-symbol" aria-hidden="true">{{ tool.symbol }}</div></header><MotoryzacjaCalculator :tool-id="toolId" /><section class="explanation"><div class="explanation-lead"><p class="section-kicker">JAK LICZYMY</p><h2>{{ tool.title }} — praktyczny przewodnik</h2></div><div class="explanation-text"><p>{{ content.intro }}</p><p>{{ content.how }}</p></div></section><FaqSection :items="content.faqs" :title="`Pytania o ${tool.title}`" /><section class="related"><div class="related-heading"><div><p class="section-kicker">NASTĘPNY ODCINEK</p><h2>Inne narzędzia dla kierowców</h2></div><RouterLink :to="motoryzacjaPath('/')">Wszystkie kalkulatory <ArrowUpRight :size="17" aria-hidden="true" /></RouterLink></div><div class="related-grid"><RouterLink v-for="item in relatedTools" :key="item.id" :to="motoryzacjaPath(`/${item.id}`)"><span>{{ item.category }}</span><strong>{{ item.title }}</strong><ArrowUpRight :size="19" aria-hidden="true" /></RouterLink></div></section></div>
</template>

<style scoped>
.tool-page { width: min(100% - 2.5rem, 1280px); margin-inline: auto; padding-top: 2.3rem; }
.breadcrumb, .breadcrumb a { display: inline-flex; align-items: center; gap: .5rem; color: #718a7e; font-size: .82rem; font-weight: 800; text-decoration: none; }
.breadcrumb a:hover { color: #c67c59; }
.breadcrumb > span:nth-child(2) { color: #b4c8bb; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding-block: 2.7rem 3rem; }
.category-pill { display: inline-block; padding: .48rem .82rem; border-radius: 999px; background: #e1f0dd; color: #4d7b60; font-size: .72rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.category-pill span { margin-inline: .25rem; }
h1, h2 { font-family: var(--font-heading); letter-spacing: -.05em; }
.page-header h1 { margin-top: 1.1rem; font-size: clamp(2.5rem, 4.5vw, 4.4rem); font-weight: 800; line-height: 1.1; }
.page-header p { max-width: 710px; margin-top: 1rem; color: #6a8578; font-size: 1rem; line-height: 1.75; }
.header-symbol { display: grid; place-items: center; flex: 0 0 auto; min-width: 195px; min-height: 127px; padding: 1rem; border: 1px solid #cfe3d7; border-radius: 26px; background: linear-gradient(135deg, #dcefc8, #e0eff0); color: #507f6b; font-family: var(--font-heading); font-size: 2.25rem; font-weight: 800; letter-spacing: -.06em; transform: rotate(5deg); }
.explanation { display: grid; grid-template-columns: .88fr 1.12fr; gap: 2rem; margin-top: 2rem; padding: 2.2rem; border: 1px solid #e0e9df; border-radius: 21px; background: #fcfefb; }
.section-kicker { color: #bc7958; font-size: .72rem; font-weight: 800; letter-spacing: .15em; }
.explanation h2 { margin-top: .65rem; font-size: clamp(1.6rem, 2.6vw, 2.2rem); font-weight: 800; line-height: 1.2; }
.explanation-text { display: grid; align-content: center; gap: 1rem; color: #617b6d; font-size: .9rem; line-height: 1.8; }
.related { margin-top: 4rem; }
.related-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.related-heading h2 { margin-top: .5rem; font-size: 1.75rem; font-weight: 800; }
.related-heading a { display: inline-flex; align-items: center; gap: .4rem; color: #36705c; font-size: .81rem; font-weight: 800; text-decoration: none; }
.related-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1.2rem; }
.related-grid a { position: relative; min-height: 143px; display: flex; flex-direction: column; gap: .65rem; padding: 1.2rem; border: 1px solid #dfe9e0; border-radius: 16px; background: #fcfefb; color: #1f4043; text-decoration: none; }
.related-grid a:hover { border-color: #9cbfa6; box-shadow: 0 8px 24px #14313d12; }
.related-grid span { color: #8aa094; font-size: .7rem; font-weight: 800; text-transform: uppercase; }
.related-grid strong { max-width: 82%; font-family: var(--font-heading); font-size: 1rem; }
.related-grid svg { position: absolute; right: 1.2rem; bottom: 1.2rem; color: #4d9276; }
@media (max-width: 800px) { .explanation { grid-template-columns: 1fr; } .header-symbol { min-width: 130px; min-height: 100px; font-size: 1.5rem; } }
@media (max-width: 620px) { .page-header { padding-block: 2rem; } .header-symbol { display: none; } .explanation { padding: 1.5rem; } .related-grid { grid-template-columns: 1fr; } .related-heading { align-items: start; } }
</style>

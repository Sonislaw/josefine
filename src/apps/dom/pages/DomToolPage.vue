<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { ArrowLeft, ArrowUpRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import DomCalculator from '../components/DomCalculator.vue'
import { domTools, type DomToolId } from '../manifest'
import { domSeoContent } from '../seo/content'
import { domPath, domSiteName, domSiteUrl, useDomSeo } from '../seo/useDomSeo'

const props = defineProps<{ toolId: DomToolId }>()
// The richer paint mode is only fetched for the paint page, not every Dom calculator.
const DomPaintCalculator = defineAsyncComponent(
  () => import('../components/DomPaintCalculator.vue'),
)
const DomWallpaperCalculator = defineAsyncComponent(
  () => import('../components/DomWallpaperCalculator.vue'),
)
const DomGroutCalculator = defineAsyncComponent(
  () => import('../components/DomGroutCalculator.vue'),
)
const tool = domTools.find((item) => item.id === props.toolId)!
const content = domSeoContent[props.toolId]
const relatedTools = domTools
  .filter((item) => item.id !== props.toolId)
  .sort((a, b) => Number(b.category === tool.category) - Number(a.category === tool.category))
  .slice(0, 3)

useDomSeo(props.toolId, {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: `Kalkulator ${tool.title}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: `${domSiteUrl}/${tool.id}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      publisher: { '@type': 'Organization', name: domSiteName, url: domSiteUrl },
    },
    {
      '@type': 'FAQPage',
      mainEntity: content.faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
})
</script>

<template>
  <div class="tool-page">
    <nav class="breadcrumb" aria-label="Ścieżka nawigacji">
      <RouterLink :to="domPath('/')"
        ><ArrowLeft :size="16" aria-hidden="true" /> Wszystkie kalkulatory</RouterLink
      ><span aria-hidden="true">/</span><span>{{ tool.category }}</span>
    </nav>
    <header class="page-header">
      <div>
        <span class="category-pill">{{ tool.category }} <span aria-hidden="true">·</span> Dom</span>
        <h1>{{ tool.title }}</h1>
        <p>
          {{ tool.description }} Wprowadź dane, a kalkulator pokaże wynik oraz sposób obliczenia.
        </p>
      </div>
      <div class="header-symbol" aria-hidden="true">{{ tool.symbol }}</div>
    </header>
    <DomPaintCalculator v-if="toolId === 'ilosc-farby'" /><DomWallpaperCalculator
      v-else-if="toolId === 'liczba-rolek-tapety'"
    /><DomGroutCalculator v-else-if="toolId === 'kalkulator-fugi'" /><DomCalculator
      v-else
      :tool-id="toolId"
    />
    <section class="explanation">
      <div class="explanation-lead">
        <p class="section-kicker">PRAKTYCZNE WYJAŚNIENIE</p>
        <h2>{{ tool.title }} — jak to działa?</h2>
      </div>
      <div class="explanation-text">
        <p>{{ content.intro }}</p>
        <p>{{ content.how }}</p>
      </div>
    </section>
    <FaqSection :items="content.faqs" :title="`Pytania o ${tool.title}`" />
    <section class="related">
      <div class="related-heading">
        <div>
          <p class="section-kicker">SPRAWDŹ RÓWNIEŻ</p>
          <h2>Inne domowe narzędzia</h2>
        </div>
        <RouterLink :to="domPath('/')"
          >Wszystkie kalkulatory <ArrowUpRight :size="17" aria-hidden="true"
        /></RouterLink>
      </div>
      <div class="related-grid">
        <RouterLink v-for="item in relatedTools" :key="item.id" :to="domPath(`/${item.id}`)"
          ><span>{{ item.category }}</span
          ><strong>{{ item.title }}</strong
          ><ArrowUpRight :size="19" aria-hidden="true"
        /></RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
  padding-top: 2.3rem;
}
.breadcrumb,
.breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #718474;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
}
.breadcrumb a:hover {
  color: #b3674e;
}
.breadcrumb > span:nth-child(2) {
  color: #b7c3b6;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding-block: 2.8rem 3rem;
}
.category-pill {
  display: inline-block;
  padding: 0.48rem 0.82rem;
  border-radius: 999px;
  background: #e2ebdc;
  color: #407050;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.category-pill span {
  margin-inline: 0.25rem;
}
h1,
h2 {
  font-family: var(--font-heading);
  letter-spacing: -0.05em;
}
.page-header h1 {
  margin-top: 1.1rem;
  font-size: clamp(2.5rem, 4.4vw, 4.4rem);
  font-weight: 800;
  line-height: 1.1;
}
.page-header p {
  max-width: 690px;
  margin-top: 1rem;
  color: #697e6d;
  font-size: 1rem;
  line-height: 1.75;
}
.header-symbol {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  min-width: 178px;
  min-height: 132px;
  padding: 1rem;
  border: 1px solid #d9e4d1;
  border-radius: 27px;
  background: linear-gradient(135deg, #e4efdc, #f6ead6);
  color: #527f58;
  font-family: var(--font-heading);
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.07em;
  transform: rotate(5deg);
}
.explanation {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
  margin-top: 2rem;
  padding: 2.2rem;
  border: 1px solid #e2e8dc;
  border-radius: 21px;
  background: #fffefa;
}
.section-kicker {
  color: #b16b50;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
.explanation h2 {
  margin-top: 0.65rem;
  font-size: clamp(1.6rem, 2.6vw, 2.2rem);
  font-weight: 800;
  line-height: 1.2;
}
.explanation-text {
  display: grid;
  align-content: center;
  gap: 1rem;
  color: #63776a;
  font-size: 0.9rem;
  line-height: 1.8;
}
.related {
  margin-top: 4rem;
}
.related-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.related-heading h2 {
  margin-top: 0.5rem;
  font-size: 1.75rem;
  font-weight: 800;
}
.related-heading a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #386c4a;
  font-size: 0.81rem;
  font-weight: 800;
  text-decoration: none;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.2rem;
}
.related-grid a {
  position: relative;
  min-height: 144px;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1.2rem;
  border: 1px solid #e0e7dc;
  border-radius: 16px;
  background: #fffefa;
  color: #234534;
  text-decoration: none;
}
.related-grid a:hover {
  border-color: #9ab69c;
  box-shadow: 0 8px 24px #32574312;
}
.related-grid span {
  color: #8b9b8a;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.related-grid strong {
  max-width: 82%;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.related-grid svg {
  position: absolute;
  right: 1.2rem;
  bottom: 1.2rem;
  color: #4b8059;
}
@media (max-width: 800px) {
  .explanation {
    grid-template-columns: 1fr;
  }
  .header-symbol {
    min-width: 130px;
    min-height: 105px;
    font-size: 1.8rem;
  }
}
@media (max-width: 620px) {
  .page-header {
    padding-block: 2rem;
  }
  .header-symbol {
    display: none;
  }
  .explanation {
    padding: 1.5rem;
  }
  .related-grid {
    grid-template-columns: 1fr;
  }
  .related-heading {
    align-items: start;
  }
}
</style>

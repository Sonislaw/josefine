<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { pieniadzeTools, type PieniadzeToolId } from '../manifest'
import {
  pieniadzePath,
  pieniadzeSiteName,
  pieniadzeSiteUrl,
  usePieniadzeSeo,
} from '../seo/usePieniadzeSeo'
import FaqSection from '@/shared/components/FaqSection.vue'
import { toolSeoContent } from '../seo/content'
const props = defineProps<{ toolId: PieniadzeToolId }>()
const tool = computed(() => pieniadzeTools.find((item) => item.id === props.toolId)!)
const amount = ref(100),
  value = ref(23),
  rate = ref(23),
  unit = ref('kg')
const format = (number: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(
    Number.isFinite(number) ? number : 0,
  )
const money = (number: number) => `${format(number)} zł`
const result = computed(() => {
  const a = Math.max(0, amount.value),
    b = Math.max(0, value.value),
    r = Math.max(0, rate.value)
  switch (props.toolId) {
    case 'brutto-netto': {
      const net = a / (1 + r / 100)
      return [
        ['Kwota netto', money(net)],
        ['VAT', money(a - net)],
        ['Kwota brutto', money(a)],
      ]
    }
    case 'netto-brutto': {
      const gross = a * (1 + r / 100)
      return [
        ['Kwota netto', money(a)],
        ['VAT', money(gross - a)],
        ['Kwota brutto', money(gross)],
      ]
    }
    case 'procent-z-liczby':
      return [[`${format(r)}% z ${format(a)}`, format((a * r) / 100)]]
    case 'zmiana-procentowa': {
      const change = a === 0 ? 0 : ((b - a) / a) * 100
      return [
        ['Zmiana kwotowa', money(b - a)],
        ['Zmiana procentowa', `${change >= 0 ? '+' : ''}${format(change)}%`],
      ]
    }
    case 'rabat': {
      const discount = (a * r) / 100
      return [
        ['Wysokość rabatu', money(discount)],
        ['Cena po rabacie', money(a - discount)],
      ]
    }
    case 'podwyzka': {
      const raise = (a * r) / 100
      return [
        ['Wysokość podwyżki', money(raise)],
        ['Kwota po podwyżce', money(a + raise)],
      ]
    }
    case 'marza': {
      const profit = b - a
      return [
        ['Zysk', money(profit)],
        ['Marża', `${format(b === 0 ? 0 : (profit / b) * 100)}%`],
        ['Cena sprzedaży', money(b)],
      ]
    }
    case 'narzut': {
      const profit = b - a
      return [
        ['Zysk', money(profit)],
        ['Narzut', `${format(a === 0 ? 0 : (profit / a) * 100)}%`],
        ['Cena sprzedaży', money(b)],
      ]
    }
    case 'cena-jednostkowa':
      return [
        [`Cena za 1 ${unit.value}`, money(b === 0 ? 0 : a / b)],
        ['Ilość', `${format(b)} ${unit.value}`],
      ]
    case 'podzial-rachunku':
      return [
        ['Rachunek łącznie', money(a)],
        ['Kwota na osobę', money(b === 0 ? 0 : a / b)],
        ['Liczba osób', format(b)],
      ]
    case 'napiwek': {
      const tip = (a * r) / 100
      return [
        ['Napiwek', money(tip)],
        ['Rachunek z napiwkiem', money(a + tip)],
      ]
    }
  }
  throw new Error(`Nieznany kalkulator: ${props.toolId}`)
})
const labels = computed(
  () =>
    ({
      'brutto-netto': ['Kwota brutto', 'Stawka VAT (%)'],
      'netto-brutto': ['Kwota netto', 'Stawka VAT (%)'],
      'procent-z-liczby': ['Liczba', 'Procent (%)'],
      'zmiana-procentowa': ['Kwota początkowa', 'Kwota końcowa'],
      rabat: ['Cena przed rabatem', 'Rabat (%)'],
      podwyzka: ['Kwota przed podwyżką', 'Podwyżka (%)'],
      marza: ['Koszt zakupu', 'Cena sprzedaży'],
      narzut: ['Koszt zakupu', 'Cena sprzedaży'],
      'cena-jednostkowa': ['Cena opakowania', 'Ilość'],
      'podzial-rachunku': ['Łączna kwota rachunku', 'Liczba osób'],
      napiwek: ['Kwota rachunku', 'Napiwek (%)'],
    })[props.toolId],
)
const usesRate = computed(() =>
  ['brutto-netto', 'netto-brutto', 'procent-z-liczby', 'rabat', 'podwyzka', 'napiwek'].includes(
    props.toolId,
  ),
)
const secondInput = computed({
  get: () => (usesRate.value ? rate.value : value.value),
  set: (input: number) => {
    if (usesRate.value) rate.value = input
    else value.value = input
  },
})
const seoContent = computed(() => toolSeoContent[props.toolId])
const faq = computed(() => seoContent.value.faqs)
const relatedTools = computed(() =>
  pieniadzeTools.filter((item) => item.id !== props.toolId).slice(0, 3),
)
const reset = () => {
  amount.value = 100
  value.value = 23
  rate.value = 23
  unit.value = 'kg'
}
usePieniadzeSeo(props.toolId, {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: `Kalkulator ${tool.value.title}`,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: `${pieniadzeSiteUrl}/${props.toolId}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      publisher: { '@type': 'Organization', name: pieniadzeSiteName, url: pieniadzeSiteUrl },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.value.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
})
</script>
<template>
  <div class="tool-page mx-auto max-w-7xl px-5 py-8 sm:py-12 lg:px-8">
    <RouterLink
      :to="pieniadzePath('/')"
      class="inline-flex items-center gap-2 text-sm font-medium text-[#64748b]"
      ><ArrowLeft class="size-4" /> Wszystkie kalkulatory</RouterLink
    >
    <header class="tool-intro">
      <div class="intro-copy">
        <p class="intro-kicker">{{ tool.category }} · PIENIĄDZE</p>
        <h1>{{ tool.title }}</h1>
        <p>
          {{ tool.description }} Uzupełnij pola poniżej, aby zobaczyć wynik i zrozumieć sposób
          obliczenia.
        </p>
      </div>
      <span class="intro-symbol" aria-hidden="true">{{ tool.symbol }}</span>
    </header>
    <div class="mt-9 grid items-start gap-6 lg:grid-cols-2">
      <section class="form-panel rounded-2xl border border-[#dce5f0] bg-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Dane do obliczeń</h2>
          <button
            class="grid size-10 place-items-center rounded-lg border border-[#dce5f0]"
            aria-label="Przywróć wartości"
            @click="reset"
          >
            <RotateCcw class="size-4" />
          </button>
        </div>
        <div class="mt-6 space-y-5">
          <label class="block"
            ><span class="text-sm font-semibold">{{ labels[0] }}</span
            ><input
              v-model.number="amount"
              type="number"
              min="0"
              step="0.01"
              class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] px-4" /></label
          ><label class="block"
            ><span class="text-sm font-semibold">{{ labels[1] }}</span
            ><input
              v-model.number="secondInput"
              type="number"
              min="0"
              step="0.01"
              class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] px-4" /></label
          ><label v-if="toolId === 'cena-jednostkowa'" class="block"
            ><span class="text-sm font-semibold">Jednostka</span
            ><select
              v-model="unit"
              class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] bg-white px-3"
            >
              <option>kg</option>
              <option>l</option>
              <option>m</option>
              <option>szt.</option>
            </select></label
          >
        </div>
      </section>
      <section class="result-panel rounded-2xl bg-[#173b67] p-6 text-white" aria-live="polite">
        <p class="result-kicker">TWÓJ WYNIK</p>
        <div class="mt-6 space-y-4">
          <div
            v-for="row in result"
            :key="row[0]"
            class="flex items-baseline justify-between gap-4 border-b border-white/15 pb-4"
          >
            <span class="text-sm text-white/70">{{ row[0] }}</span
            ><strong class="text-xl">{{ row[1] }}</strong>
          </div>
        </div>
        <p class="mt-6 text-xs leading-5 text-white/60">
          Wynik ma charakter informacyjny. Podane wartości i stawki wymagają weryfikacji dla
          konkretnej transakcji.
        </p>
      </section>
    </div>
    <section class="explanation">
      <div>
        <p class="intro-kicker">PRAKTYCZNE WYJAŚNIENIE</p>
        <h2>{{ tool.title }} — jak to działa?</h2>
      </div>
      <div>
        <p>{{ seoContent.intro }}</p>
        <p>{{ seoContent.howItWorks }}</p>
      </div>
    </section>
    <FaqSection :items="faq" :title="`Pytania o kalkulator ${tool.title}`" />
    <section class="related">
      <div class="related-heading">
        <div>
          <p class="intro-kicker">SPRAWDŹ RÓWNIEŻ</p>
          <h2>Inne obliczenia</h2>
        </div>
        <RouterLink :to="pieniadzePath('/')">Wszystkie kalkulatory</RouterLink>
      </div>
      <div class="related-grid">
        <RouterLink v-for="item in relatedTools" :key="item.id" :to="pieniadzePath(`/${item.id}`)"
          ><span>{{ item.category }}</span
          ><strong>{{ item.title }}</strong></RouterLink
        >
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-intro {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin-top: 1.6rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid #d8e5f1;
  border-radius: 25px;
  background:
    radial-gradient(circle at 86% 20%, #dcecf6, transparent 38%),
    linear-gradient(120deg, #eaf3f8, #fff8e7);
}
.tool-intro::after {
  position: absolute;
  right: 10%;
  bottom: -105px;
  width: 245px;
  height: 245px;
  border: 1px solid #bdcee0;
  border-radius: 50%;
  content: '';
}
.intro-copy {
  position: relative;
  z-index: 1;
}
.intro-kicker {
  color: #5d83a4;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.tool-intro h1 {
  margin-top: 0.7rem;
  color: #173b67;
  font-family: var(--font-heading);
  font-size: clamp(2.3rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.1;
}
.tool-intro .intro-copy > p:last-child {
  max-width: 680px;
  margin-top: 1rem;
  color: #647c90;
  line-height: 1.75;
}
.intro-symbol {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  min-width: 165px;
  min-height: 125px;
  padding: 1rem;
  border: 1px solid #c7dbea;
  border-radius: 25px;
  background: #fffdf3;
  color: #3c739d;
  box-shadow: 0 16px 30px #173b6719;
  font-family: var(--font-heading);
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  transform: rotate(6deg);
}
.form-panel {
  box-shadow: 0 16px 38px #173b6710;
}
.form-panel input,
.form-panel select {
  background: #fff;
  outline: none;
}
.form-panel input:focus-visible,
.form-panel select:focus-visible {
  border-color: #4b86b6;
  box-shadow: 0 0 0 3px #4b86b625;
}
.result-panel {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 85% 0, #356aa0, #173b67 58%, #102d51);
  box-shadow: 0 16px 34px #173b6728;
}
.result-panel::after {
  position: absolute;
  right: -46px;
  bottom: -100px;
  width: 230px;
  height: 230px;
  border: 1px solid #ffffff35;
  border-radius: 50%;
  content: '';
  pointer-events: none;
}
.result-kicker {
  color: #d7e9f9;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
.explanation {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
  margin-top: 2rem;
  padding: 2rem;
  border: 1px solid #dce7f0;
  border-radius: 22px;
  background: #fff;
}
.explanation h2,
.related h2 {
  margin-top: 0.6rem;
  color: #173b67;
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.explanation > div:last-child {
  display: grid;
  gap: 1rem;
  align-content: center;
  color: #657b8d;
  font-size: 0.9rem;
  line-height: 1.8;
}
.related {
  margin-top: 3rem;
}
.related-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.related-heading a {
  color: #245d8e;
  font-size: 0.82rem;
  font-weight: 800;
}
.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.2rem;
}
.related-grid a {
  display: grid;
  align-content: space-between;
  min-height: 128px;
  padding: 1.2rem;
  border: 1px solid #dce7f0;
  border-radius: 16px;
  background: #fff;
  color: #214d70;
  text-decoration: none;
}
.related-grid a:hover {
  border-color: #9bbdd8;
}
.related-grid span {
  color: #8198a9;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}
.related-grid strong {
  font-family: var(--font-heading);
}
@media (max-width: 700px) {
  .intro-symbol {
    min-width: 100px;
    min-height: 100px;
    font-size: 1.6rem;
  }
  .explanation {
    grid-template-columns: 1fr;
  }
  .related-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 500px) {
  .intro-symbol {
    display: none;
  }
  .tool-intro {
    padding: 1.5rem;
  }
}
</style>

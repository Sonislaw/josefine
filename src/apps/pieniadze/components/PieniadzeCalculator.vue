<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { pieniadzeTools, type PieniadzeToolId } from '../manifest'
import { pieniadzePath, pieniadzeSiteName, pieniadzeSiteUrl, usePieniadzeSeo } from '../seo/usePieniadzeSeo'
import FaqSection from '@/shared/components/FaqSection.vue'
import { toolSeoContent } from '../seo/content'
const props = defineProps<{ toolId: PieniadzeToolId }>()
const tool = computed(() => pieniadzeTools.find((item) => item.id === props.toolId)!)
const amount = ref(100), value = ref(23), rate = ref(23), unit = ref('kg')
const format = (number: number) => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(Number.isFinite(number) ? number : 0)
const money = (number: number) => `${format(number)} zł`
const result = computed(() => {
  const a = Math.max(0, amount.value), b = Math.max(0, value.value), r = Math.max(0, rate.value)
  switch (props.toolId) {
    case 'brutto-netto': { const net = a / (1 + r / 100); return [['Kwota netto', money(net)], ['VAT', money(a - net)], ['Kwota brutto', money(a)]] }
    case 'netto-brutto': { const gross = a * (1 + r / 100); return [['Kwota netto', money(a)], ['VAT', money(gross - a)], ['Kwota brutto', money(gross)]] }
    case 'procent-z-liczby': return [[`${format(r)}% z ${format(a)}`, format(a * r / 100)]]
    case 'zmiana-procentowa': { const change = a === 0 ? 0 : (b - a) / a * 100; return [['Zmiana kwotowa', money(b - a)], ['Zmiana procentowa', `${change >= 0 ? '+' : ''}${format(change)}%`]] }
    case 'rabat': { const discount = a * r / 100; return [['Wysokość rabatu', money(discount)], ['Cena po rabacie', money(a - discount)]] }
    case 'podwyzka': { const raise = a * r / 100; return [['Wysokość podwyżki', money(raise)], ['Kwota po podwyżce', money(a + raise)]] }
    case 'marza': { const profit = b - a; return [['Zysk', money(profit)], ['Marża', `${format(b === 0 ? 0 : profit / b * 100)}%`], ['Cena sprzedaży', money(b)]] }
    case 'narzut': { const profit = b - a; return [['Zysk', money(profit)], ['Narzut', `${format(a === 0 ? 0 : profit / a * 100)}%`], ['Cena sprzedaży', money(b)]] }
    case 'cena-jednostkowa': return [[`Cena za 1 ${unit.value}`, money(b === 0 ? 0 : a / b)], ['Ilość', `${format(b)} ${unit.value}`]]
    case 'podzial-rachunku': return [['Rachunek łącznie', money(a)], ['Kwota na osobę', money(b === 0 ? 0 : a / b)], ['Liczba osób', format(b)]]
    case 'napiwek': { const tip = a * r / 100; return [['Napiwek', money(tip)], ['Rachunek z napiwkiem', money(a + tip)]] }
  }
})
const labels = computed(() => ({
  'brutto-netto': ['Kwota brutto', 'Stawka VAT (%)'], 'netto-brutto': ['Kwota netto', 'Stawka VAT (%)'], 'procent-z-liczby': ['Liczba', 'Procent (%)'], 'zmiana-procentowa': ['Kwota początkowa', 'Kwota końcowa'], rabat: ['Cena przed rabatem', 'Rabat (%)'], podwyzka: ['Kwota przed podwyżką', 'Podwyżka (%)'], marza: ['Koszt zakupu', 'Cena sprzedaży'], narzut: ['Koszt zakupu', 'Cena sprzedaży'], 'cena-jednostkowa': ['Cena opakowania', 'Ilość'], 'podzial-rachunku': ['Łączna kwota rachunku', 'Liczba osób'], napiwek: ['Kwota rachunku', 'Napiwek (%)'],
}[props.toolId]))
const usesRate = computed(() => ['brutto-netto', 'netto-brutto', 'procent-z-liczby', 'rabat', 'podwyzka', 'napiwek'].includes(props.toolId))
const secondInput = computed({ get: () => usesRate.value ? rate.value : value.value, set: (input: number) => { if (usesRate.value) rate.value = input; else value.value = input } })
const seoContent = computed(() => toolSeoContent[props.toolId])
const faq = computed(() => seoContent.value.faqs)
const reset = () => { amount.value = 100; value.value = 23; rate.value = 23; unit.value = 'kg' }
usePieniadzeSeo(props.toolId, { '@context': 'https://schema.org', '@graph': [{ '@type': 'SoftwareApplication', name: `Kalkulator ${tool.value.title}`, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'pl-PL', url: `${pieniadzeSiteUrl}/${props.toolId}`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' }, publisher: { '@type': 'Organization', name: pieniadzeSiteName, url: pieniadzeSiteUrl } }, { '@type': 'FAQPage', mainEntity: faq.value.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }] })
</script>
<template><div class="mx-auto max-w-7xl px-5 py-8 sm:py-12 lg:px-8"><RouterLink :to="pieniadzePath('/')" class="inline-flex items-center gap-2 text-sm font-medium text-[#64748b]"><ArrowLeft class="size-4"/> Wszystkie kalkulatory</RouterLink><div class="mt-7 max-w-3xl"><p class="text-sm font-bold uppercase tracking-[.16em] text-[#24578f]">Pieniądze</p><h1 class="mt-2 text-3xl font-bold sm:text-4xl">Kalkulator: {{ tool.title }}</h1><p class="mt-3 leading-7 text-[#64748b]">{{ tool.description }}</p></div><div class="mt-9 grid items-start gap-6 lg:grid-cols-2"><section class="rounded-2xl border border-[#dce5f0] bg-white p-6"><div class="flex items-center justify-between"><h2 class="text-xl font-bold">Dane do obliczeń</h2><button class="grid size-10 place-items-center rounded-lg border border-[#dce5f0]" aria-label="Przywróć wartości" @click="reset"><RotateCcw class="size-4"/></button></div><div class="mt-6 space-y-5"><label class="block"><span class="text-sm font-semibold">{{ labels[0] }}</span><input v-model.number="amount" type="number" min="0" step="0.01" class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] px-4"/></label><label class="block"><span class="text-sm font-semibold">{{ labels[1] }}</span><input v-model.number="secondInput" type="number" min="0" step="0.01" class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] px-4"/></label><label v-if="toolId === 'cena-jednostkowa'" class="block"><span class="text-sm font-semibold">Jednostka</span><select v-model="unit" class="mt-2 h-12 w-full rounded-lg border border-[#cbd8e6] bg-white px-3"><option>kg</option><option>l</option><option>m</option><option>szt.</option></select></label></div></section><section class="rounded-2xl bg-[#173b67] p-6 text-white"><p class="text-sm text-blue-100">Wynik</p><div class="mt-6 space-y-4"><div v-for="row in result" :key="row[0]" class="flex items-baseline justify-between gap-4 border-b border-white/15 pb-4"><span class="text-sm text-white/70">{{ row[0] }}</span><strong class="text-xl">{{ row[1] }}</strong></div></div><p class="mt-6 text-xs leading-5 text-white/60">Wynik ma charakter informacyjny. Podane wartości i stawki wymagają weryfikacji dla konkretnej transakcji.</p></section></div><section class="mt-10 rounded-2xl border border-[#dce5f0] bg-white p-6"><h2 class="text-2xl font-bold">{{ tool.title }} — jak działa?</h2><p class="mt-4 leading-7 text-[#475569]">{{ seoContent.intro }}</p><p class="mt-4 leading-7 text-[#475569]">{{ seoContent.howItWorks }}</p></section><FaqSection :items="faq" :title="`Pytania o kalkulator ${tool.title}`"/></div></template>

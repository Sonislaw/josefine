<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { czasTools, type CzasToolId } from '../manifest'
import { czasPath, czasSiteUrl, useCzasSeo } from '../seo/useCzasSeo'
import FaqSection from '@/shared/components/FaqSection.vue'
import { czasSeoContent } from '../seo/content'
const props = defineProps<{ toolId: CzasToolId }>()
const today = new Date().toISOString().slice(0, 10)
const dateA = ref(today), dateB = ref(today), number = ref(7), timeA = ref('09:00'), timeB = ref('17:00')
const tool = computed(() => czasTools.find((item) => item.id === props.toolId)!)
const parse = (date: string) => new Date(`${date}T00:00:00`)
const dateFormat = (date: Date) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
const dayDiff = (a: string, b: string) => Math.round(Math.abs(parse(b).getTime() - parse(a).getTime()) / 86_400_000)
const workMinutes = computed(() => { const [ah = 0, am = 0] = timeA.value.split(':').map(Number), [bh = 0, bm = 0] = timeB.value.split(':').map(Number); let result = bh * 60 + bm - ah * 60 - am; if (result < 0) result += 1440; return result })
const result = computed(() => {
  if (props.toolId === 'roznica-miedzy-datami') return [['Liczba dni', String(dayDiff(dateA.value, dateB.value))]]
  if (props.toolId === 'data-za-liczbe-dni') { const date = parse(dateA.value); date.setDate(date.getDate() + number.value); return [['Data', dateFormat(date)], ['Dodano dni', String(number.value)]] }
  if (props.toolId === 'wiek') { const birth = parse(dateA.value), now = parse(today); let years = now.getFullYear() - birth.getFullYear(); if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--; return [['Wiek', `${Math.max(0, years)} lat`], ['Dni od urodzenia', String(dayDiff(dateA.value, today))]] }
  if (props.toolId === 'czas-pracy') return [['Czas pracy', `${Math.floor(workMinutes.value / 60)} godz. ${workMinutes.value % 60} min`], ['Łącznie minut', String(workMinutes.value)]]
  if (props.toolId === 'godziny-na-minuty') return [['Minuty', String(number.value * 60)], ['Godziny', String(number.value)]]
  if (props.toolId === 'minuty-na-godziny') return [['Godziny', String(Math.floor(number.value / 60))], ['Pozostałe minuty', String(number.value % 60)]]
  return [['Dni do wydarzenia', String(dayDiff(today, dateA.value))], ['Data wydarzenia', dateFormat(parse(dateA.value))]]
})
const info = computed(() => ({
  'roznica-miedzy-datami': ['Data początkowa', 'Data końcowa'], 'data-za-liczbe-dni': ['Data początkowa', 'Liczba dni'], wiek: ['Data urodzenia'], 'czas-pracy': ['Godzina rozpoczęcia', 'Godzina zakończenia'], 'godziny-na-minuty': ['Liczba godzin'], 'minuty-na-godziny': ['Liczba minut'], 'odliczanie-do-daty': ['Data wydarzenia'],
}[props.toolId]))
const seoContent = computed(() => czasSeoContent[props.toolId])
const faq = computed(() => seoContent.value.faqs)
const reset = () => { dateA.value = today; dateB.value = today; number.value = 7; timeA.value = '09:00'; timeB.value = '17:00' }
useCzasSeo(props.toolId, { '@context': 'https://schema.org', '@graph': [{ '@type': 'SoftwareApplication', name: `Kalkulator ${tool.value.title}`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'pl-PL', url: `${czasSiteUrl}/${props.toolId}`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' } }, { '@type': 'FAQPage', mainEntity: faq.value.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }] })
</script>
<template><div class="mx-auto max-w-7xl px-5 py-8 sm:py-12 lg:px-8"><RouterLink :to="czasPath('/')" class="inline-flex items-center gap-2 text-sm text-[#6b6682]"><ArrowLeft class="size-4"/> Wszystkie kalkulatory</RouterLink><div class="mt-7 max-w-3xl"><p class="text-sm font-bold uppercase tracking-[.16em] text-[#6555a5]">Czas</p><h1 class="mt-2 text-3xl font-bold sm:text-4xl">Kalkulator: {{ tool.title }}</h1><p class="mt-3 leading-7 text-[#6b6682]">{{ tool.description }}</p></div><div class="mt-9 grid gap-6 lg:grid-cols-2"><section class="rounded-2xl border border-[#e3dff2] bg-white p-6"><div class="flex items-center justify-between"><h2 class="text-xl font-bold">Dane do obliczeń</h2><button class="grid size-10 place-items-center rounded-lg border border-[#e3dff2]" @click="reset"><RotateCcw class="size-4"/></button></div><div class="mt-6 space-y-5"><label v-if="info[0]" class="block"><span class="text-sm font-semibold">{{ info[0] }}</span><input v-if="toolId === 'czas-pracy'" v-model="timeA" type="time" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/><input v-else-if="toolId === 'godziny-na-minuty' || toolId === 'minuty-na-godziny' || toolId === 'data-za-liczbe-dni'" v-model.number="number" type="number" min="0" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/><input v-else v-model="dateA" type="date" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/></label><label v-if="info[1]" class="block"><span class="text-sm font-semibold">{{ info[1] }}</span><input v-if="toolId === 'czas-pracy'" v-model="timeB" type="time" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/><input v-else-if="toolId === 'data-za-liczbe-dni'" v-model.number="number" type="number" min="0" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/><input v-else v-model="dateB" type="date" class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"/></label></div></section><section class="rounded-2xl bg-[#4b3d92] p-6 text-white"><p class="text-sm text-violet-100">Wynik</p><div class="mt-6 space-y-4"><div v-for="row in result" :key="row[0]" class="flex justify-between gap-4 border-b border-white/15 pb-4"><span class="text-sm text-white/70">{{ row[0] }}</span><strong class="text-xl">{{ row[1] }}</strong></div></div></section></div><section class="mt-10 rounded-2xl border border-[#e3dff2] bg-white p-6"><h2 class="text-2xl font-bold">{{ tool.title }} — jak działa?</h2><p class="mt-4 leading-7 text-[#58526c]">{{ seoContent.intro }}</p><p class="mt-4 leading-7 text-[#58526c]">{{ seoContent.how }}</p></section><FaqSection :items="faq" :title="`Pytania o ${tool.title}`"/></div></template>

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
const dateA = ref(today),
  dateB = ref(today),
  number = ref(7),
  timeA = ref('09:00'),
  timeB = ref('17:00')
const tool = computed(() => czasTools.find((item) => item.id === props.toolId)!)
const parse = (date: string) => new Date(`${date}T00:00:00`)
const dateFormat = (date: Date) =>
  new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
const dayDiff = (a: string, b: string) =>
  Math.round(Math.abs(parse(b).getTime() - parse(a).getTime()) / 86_400_000)
const workMinutes = computed(() => {
  const [ah = 0, am = 0] = timeA.value.split(':').map(Number),
    [bh = 0, bm = 0] = timeB.value.split(':').map(Number)
  let result = bh * 60 + bm - ah * 60 - am
  if (result < 0) result += 1440
  return result
})
const result = computed(() => {
  if (props.toolId === 'roznica-miedzy-datami')
    return [['Liczba dni', String(dayDiff(dateA.value, dateB.value))]]
  if (props.toolId === 'data-za-liczbe-dni') {
    const date = parse(dateA.value)
    date.setDate(date.getDate() + number.value)
    return [
      ['Data', dateFormat(date)],
      ['Dodano dni', String(number.value)],
    ]
  }
  if (props.toolId === 'wiek') {
    const birth = parse(dateA.value),
      now = parse(today)
    let years = now.getFullYear() - birth.getFullYear()
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--
    return [
      ['Wiek', `${Math.max(0, years)} lat`],
      ['Dni od urodzenia', String(dayDiff(dateA.value, today))],
    ]
  }
  if (props.toolId === 'czas-pracy')
    return [
      ['Czas pracy', `${Math.floor(workMinutes.value / 60)} godz. ${workMinutes.value % 60} min`],
      ['Łącznie minut', String(workMinutes.value)],
    ]
  if (props.toolId === 'godziny-na-minuty')
    return [
      ['Minuty', String(number.value * 60)],
      ['Godziny', String(number.value)],
    ]
  if (props.toolId === 'minuty-na-godziny')
    return [
      ['Godziny', String(Math.floor(number.value / 60))],
      ['Pozostałe minuty', String(number.value % 60)],
    ]
  return [
    ['Dni do wydarzenia', String(dayDiff(today, dateA.value))],
    ['Data wydarzenia', dateFormat(parse(dateA.value))],
  ]
})
const info = computed(
  () =>
    ({
      'roznica-miedzy-datami': ['Data początkowa', 'Data końcowa'],
      'data-za-liczbe-dni': ['Data początkowa', 'Liczba dni'],
      wiek: ['Data urodzenia'],
      'czas-pracy': ['Godzina rozpoczęcia', 'Godzina zakończenia'],
      'godziny-na-minuty': ['Liczba godzin'],
      'minuty-na-godziny': ['Liczba minut'],
      'odliczanie-do-daty': ['Data wydarzenia'],
    })[props.toolId],
)
const seoContent = computed(() => czasSeoContent[props.toolId])
const faq = computed(() => seoContent.value.faqs)
const relatedTools = computed(() =>
  czasTools.filter((item) => item.id !== props.toolId).slice(0, 3),
)
const reset = () => {
  dateA.value = today
  dateB.value = today
  number.value = 7
  timeA.value = '09:00'
  timeB.value = '17:00'
}
useCzasSeo(props.toolId, {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: `Kalkulator ${tool.value.title}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: `${czasSiteUrl}/${props.toolId}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
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
    <RouterLink :to="czasPath('/')" class="inline-flex items-center gap-2 text-sm text-[#6b6682]"
      ><ArrowLeft class="size-4" /> Wszystkie kalkulatory</RouterLink
    >
    <header class="tool-intro">
      <div class="intro-copy">
        <p class="intro-kicker">{{ tool.category }} · CZAS</p>
        <h1>{{ tool.title }}</h1>
        <p>
          {{ tool.description }} Wpisz własne dane, aby od razu zobaczyć wynik i sposób obliczenia.
        </p>
      </div>
      <span class="intro-symbol" aria-hidden="true">{{ tool.symbol }}</span>
    </header>
    <div class="mt-9 grid gap-6 lg:grid-cols-2">
      <section class="form-panel rounded-2xl border border-[#e3dff2] bg-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Dane do obliczeń</h2>
          <button
            class="grid size-10 place-items-center rounded-lg border border-[#e3dff2]"
            type="button"
            aria-label="Przywróć wartości początkowe"
            @click="reset"
          >
            <RotateCcw class="size-4" />
          </button>
        </div>
        <div class="mt-6 space-y-5">
          <label v-if="info[0]" class="block"
            ><span class="text-sm font-semibold">{{ info[0] }}</span
            ><input
              v-if="toolId === 'czas-pracy'"
              v-model="timeA"
              type="time"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4" /><input
              v-else-if="
                toolId === 'godziny-na-minuty' ||
                toolId === 'minuty-na-godziny' ||
                toolId === 'data-za-liczbe-dni'
              "
              v-model.number="number"
              type="number"
              min="0"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4" /><input
              v-else
              v-model="dateA"
              type="date"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4" /></label
          ><label v-if="info[1]" class="block"
            ><span class="text-sm font-semibold">{{ info[1] }}</span
            ><input
              v-if="toolId === 'czas-pracy'"
              v-model="timeB"
              type="time"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4" /><input
              v-else-if="toolId === 'data-za-liczbe-dni'"
              v-model.number="number"
              type="number"
              min="0"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4" /><input
              v-else
              v-model="dateB"
              type="date"
              class="mt-2 h-12 w-full rounded-lg border border-[#d5cfea] px-4"
          /></label>
        </div>
      </section>
      <section class="result-panel rounded-2xl bg-[#4b3d92] p-6 text-white" aria-live="polite">
        <p class="result-kicker">TWÓJ WYNIK</p>
        <div class="mt-6 space-y-4">
          <div
            v-for="row in result"
            :key="row[0]"
            class="flex justify-between gap-4 border-b border-white/15 pb-4"
          >
            <span class="text-sm text-white/70">{{ row[0] }}</span
            ><strong class="text-xl">{{ row[1] }}</strong>
          </div>
        </div>
      </section>
    </div>
    <section class="explanation">
      <div>
        <p class="intro-kicker">WARTO WIEDZIEĆ</p>
        <h2>{{ tool.title }} — jak to działa?</h2>
      </div>
      <div>
        <p>{{ seoContent.intro }}</p>
        <p>{{ seoContent.how }}</p>
      </div>
    </section>
    <FaqSection :items="faq" :title="`Pytania o ${tool.title}`" />
    <section class="related">
      <div class="related-heading">
        <div>
          <p class="intro-kicker">SPRAWDŹ RÓWNIEŻ</p>
          <h2>Inne narzędzia czasu</h2>
        </div>
        <RouterLink :to="czasPath('/')">Wszystkie kalkulatory</RouterLink>
      </div>
      <div class="related-grid">
        <RouterLink v-for="item in relatedTools" :key="item.id" :to="czasPath(`/${item.id}`)"
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
  border: 1px solid #ddd6ef;
  border-radius: 25px;
  background:
    radial-gradient(circle at 86% 20%, #e6dcf6, transparent 38%),
    linear-gradient(120deg, #f0ebfa, #faf7f1);
}
.tool-intro::after {
  position: absolute;
  right: 10%;
  bottom: -105px;
  width: 245px;
  height: 245px;
  border: 1px solid #c7bce4;
  border-radius: 50%;
  content: '';
}
.intro-copy {
  position: relative;
  z-index: 1;
}
.intro-kicker {
  color: #826da8;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.tool-intro h1 {
  margin-top: 0.7rem;
  color: #312b61;
  font-family: var(--font-heading);
  font-size: clamp(2.3rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.1;
}
.tool-intro .intro-copy > p:last-child {
  max-width: 680px;
  margin-top: 1rem;
  color: #6b6580;
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
  border: 1px solid #d3c6eb;
  border-radius: 25px;
  background: #fffdf6;
  color: #6d5aa3;
  box-shadow: 0 16px 30px #4b3d9219;
  font-family: var(--font-heading);
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  transform: rotate(6deg);
}
.form-panel {
  box-shadow: 0 16px 38px #352c6810;
}
.form-panel input {
  background: #fff;
  outline: none;
}
.form-panel input:focus-visible {
  border-color: #7661b4;
  box-shadow: 0 0 0 3px #7661b425;
}
.result-panel {
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at 85% 0, #6b5aa9, #4b3d92 56%, #373073);
  box-shadow: 0 16px 34px #352c6828;
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
  color: #dfd3ff;
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
  border: 1px solid #e5dff0;
  border-radius: 22px;
  background: #fff;
}
.explanation h2,
.related h2 {
  margin-top: 0.6rem;
  color: #332d61;
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.explanation > div:last-child {
  display: grid;
  gap: 1rem;
  align-content: center;
  color: #6c6580;
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
  color: #6555a5;
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
  border: 1px solid #e4def1;
  border-radius: 16px;
  background: #fff;
  color: #342d65;
  text-decoration: none;
}
.related-grid a:hover {
  border-color: #a99bce;
}
.related-grid span {
  color: #9588ae;
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

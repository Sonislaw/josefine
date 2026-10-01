<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRightLeft, ArrowUpRight, RotateCcw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import FaqSection from '@/shared/components/FaqSection.vue'
import { conversions, convert, formatResult, parsePolishNumber } from '../lib/conversions'
import { jednostkiTools, type JednostkiToolId } from '../manifest'
import { jednostkiSeoContent } from '../seo/content'
import { jednostkiPath, jednostkiSiteName, jednostkiSiteUrl, useJednostkiSeo } from '../seo/useJednostkiSeo'

const props = defineProps<{ toolId: JednostkiToolId }>()
const tool = jednostkiTools.find((item) => item.id === props.toolId)!
const configuration = conversions[props.toolId]
const content = jednostkiSeoContent[props.toolId]

const rawValue = ref(configuration.defaultValue)
const fromUnit = ref(configuration.units[0]!.id)
const toUnit = ref(configuration.units[1]!.id)
const fromLabel = computed(() => configuration.units.find((unit) => unit.id === fromUnit.value)!)
const toLabel = computed(() => configuration.units.find((unit) => unit.id === toUnit.value)!)
const inputValue = computed(() => parsePolishNumber(rawValue.value))
const isNegativeInvalid = computed(() => props.toolId !== 'celsjusz-fahrenheit' && inputValue.value !== null && inputValue.value < 0)
const result = computed(() => {
  if (inputValue.value === null || isNegativeInvalid.value) return null
  const value = convert(props.toolId, inputValue.value, fromUnit.value, toUnit.value)
  return Number.isFinite(value) ? value : null
})
const resultText = computed(() => result.value === null ? '—' : formatResult(result.value))
const referenceValues = props.toolId === 'celsjusz-fahrenheit' ? [0, 20, 37, 100] : [1, 5, 10, 100]
const referenceRows = computed(() => referenceValues.map((value) => ({
  input: formatResult(value),
  output: formatResult(convert(props.toolId, value, fromUnit.value, toUnit.value)),
})))
const relatedTools = jednostkiTools.filter((item) => item.id !== props.toolId).slice(0, 3)

function swapUnits() {
  // Carry the currently displayed quantity to the opposite side when changing direction.
  const nextValue = result.value
  const previousFrom = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = previousFrom
  if (nextValue !== null) rawValue.value = String(Number(nextValue.toPrecision(12)))
}

function reset() {
  rawValue.value = configuration.defaultValue
  fromUnit.value = configuration.units[0]!.id
  toUnit.value = configuration.units[1]!.id
}

useJednostkiSeo(props.toolId, {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: `Przelicznik ${tool.title}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: 'pl-PL',
      url: `${jednostkiSiteUrl}/${tool.id}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
      publisher: { '@type': 'Organization', name: jednostkiSiteName, url: jednostkiSiteUrl },
    },
    { '@type': 'FAQPage', mainEntity: content.faqs.map(({ question, answer }) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
  ],
})
</script>

<template>
  <div class="tool-page">
    <nav class="breadcrumb" aria-label="Ścieżka nawigacji"><RouterLink :to="jednostkiPath('/')"><ArrowLeft :size="16" aria-hidden="true" /> Wszystkie przeliczniki</RouterLink><span aria-hidden="true">/</span><span>{{ tool.category }}</span></nav>

    <header class="tool-header"><div><span class="category-pill">{{ tool.category }} <span aria-hidden="true">·</span> Przelicznik online</span><h1>{{ tool.title }}</h1><p>{{ tool.description }} Wpisz wartość i wybierz kierunek — wynik zobaczysz od razu.</p></div><div class="header-symbol" aria-hidden="true">{{ tool.symbol }}</div></header>

    <section class="converter" aria-labelledby="converter-title">
      <div class="converter-heading"><div><p class="section-kicker">KALKULATOR</p><h2 id="converter-title">Wpisz i przelicz</h2></div><button type="button" class="reset-button" aria-label="Przywróć wartości początkowe" @click="reset"><RotateCcw :size="17" aria-hidden="true" /> <span>Wyczyść</span></button></div>
      <div class="converter-grid">
        <div class="input-panel"><label for="unit-input">Wartość do przeliczenia</label><div class="number-field"><input id="unit-input" v-model="rawValue" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="input-hint" /><span aria-hidden="true">{{ fromLabel.symbol }}</span></div><p id="input-hint" class="hint">Możesz wpisać liczbę z przecinkiem lub kropką.</p><label for="from-unit" class="select-label">Z jednostki</label><select id="from-unit" v-model="fromUnit"><option v-for="unit in configuration.units" :key="unit.id" :value="unit.id">{{ unit.label }} ({{ unit.symbol }})</option></select></div>
        <button type="button" class="swap-button" aria-label="Zamień kierunek przeliczania" @click="swapUnits"><ArrowRightLeft :size="23" aria-hidden="true" /></button>
        <div class="result-panel" aria-live="polite"><p class="result-label">Wynik</p><div class="result-number"><strong>{{ resultText }}</strong><span>{{ toLabel.symbol }}</span></div><p v-if="result === null" class="result-message">{{ isNegativeInvalid ? 'Wpisz wartość nieujemną.' : 'Wpisz poprawną liczbę.' }}</p><p v-else class="result-hint">{{ formatResult(inputValue!) }} {{ fromLabel.symbol }} = {{ resultText }} {{ toLabel.symbol }}</p><label for="to-unit" class="select-label">Na jednostkę</label><select id="to-unit" v-model="toUnit"><option v-for="unit in configuration.units" :key="unit.id" :value="unit.id">{{ unit.label }} ({{ unit.symbol }})</option></select></div>
      </div>
      <div class="formula-strip"><span>WZÓR / PRZELICZNIK</span><strong>{{ configuration.formula }}</strong><small>{{ configuration.example }}</small></div>
    </section>

    <div class="information-grid">
      <section class="explainer"><p class="section-kicker">WARTO WIEDZIEĆ</p><h2>{{ tool.title }} — jak to działa?</h2><p>{{ content.intro }}</p><p>{{ content.how }}</p></section>
      <section class="reference" aria-labelledby="reference-title"><p class="section-kicker">SZYBKA ŚCIĄGA</p><h2 id="reference-title">Przykładowe wartości</h2><table><thead><tr><th scope="col">{{ fromLabel.symbol }}</th><th scope="col">{{ toLabel.symbol }}</th></tr></thead><tbody><tr v-for="row in referenceRows" :key="row.input"><td>{{ row.input }} {{ fromLabel.symbol }}</td><td>{{ row.output }} {{ toLabel.symbol }}</td></tr></tbody></table><p>Wartości w tabeli są zaokrąglone dla czytelności.</p></section>
    </div>

    <FaqSection :items="content.faqs" :title="`Pytania o ${tool.title}`" />

    <section class="related"><div class="related-heading"><div><p class="section-kicker">ODKRYJ WIĘCEJ</p><h2>Inne przeliczniki</h2></div><RouterLink :to="jednostkiPath('/')">Zobacz wszystkie <ArrowUpRight :size="18" /></RouterLink></div><div class="related-grid"><RouterLink v-for="item in relatedTools" :key="item.id" :to="jednostkiPath(`/${item.id}`)"><span>{{ item.category }}</span><strong>{{ item.title }}</strong><ArrowUpRight :size="20" aria-hidden="true" /></RouterLink></div></section>
  </div>
</template>

<style scoped>
.tool-page { width: min(100% - 2.5rem, 1280px); margin-inline: auto; padding-top: 2.4rem; }
.breadcrumb, .breadcrumb a { display: inline-flex; align-items: center; gap: .55rem; color: #697693; font-size: .84rem; font-weight: 700; text-decoration: none; }
.breadcrumb a:hover { color: #4f61bf; }
.breadcrumb > span:nth-child(2) { color: #a9b1c5; }
.tool-header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding-block: 2.5rem 3.2rem; }
.category-pill { display: inline-block; padding: .48rem .82rem; border-radius: 999px; background: #e4e9fb; color: #435caf; font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.category-pill span { margin-inline: .25rem; }
h1, h2 { font-family: var(--font-heading); letter-spacing: -.045em; }
.tool-header h1 { margin-top: 1.15rem; font-size: clamp(2.4rem, 4.5vw, 4.4rem); font-weight: 800; line-height: 1.1; }
.tool-header p { max-width: 660px; margin-top: 1rem; color: #64718b; font-size: 1.02rem; line-height: 1.7; }
.header-symbol { display: grid; place-items: center; min-width: 200px; min-height: 130px; padding: 1rem; border: 1px solid #dae0f1; border-radius: 25px; background: linear-gradient(135deg, #e9ecfd, #d7e0fc); color: #5469bd; font-family: var(--font-heading); font-size: 2rem; font-weight: 800; letter-spacing: -.07em; transform: rotate(5deg); }
.converter { overflow: hidden; border: 1px solid #e0e6f1; border-radius: 25px; background: white; box-shadow: 0 20px 50px #182a5610; }
.converter-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 2rem 2rem 1.4rem; }
.section-kicker { color: #697bc6; font-size: .73rem; font-weight: 800; letter-spacing: .17em; }
.converter-heading h2 { margin-top: .5rem; font-size: 1.65rem; font-weight: 800; }
.reset-button { display: inline-flex; align-items: center; gap: .5rem; padding: .6rem .75rem; border: 1px solid #dbe1ed; border-radius: 10px; background: #fff; color: #60708d; font-size: .78rem; font-weight: 700; cursor: pointer; }
.reset-button:hover { background: #f4f6fc; color: #223866; }
.converter-grid { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 1.2rem; padding: 0 2rem 2rem; }
.input-panel, .result-panel { min-width: 0; min-height: 265px; padding: 1.6rem; border-radius: 18px; }
.input-panel { border: 1px solid #dfe5f0; background: #fafbfe; }
.input-panel label, .result-panel label { display: block; font-size: .82rem; font-weight: 800; }
.number-field { display: flex; align-items: baseline; gap: .5rem; margin-top: .9rem; padding-bottom: .6rem; border-bottom: 2px solid #94a5d9; }
.number-field:focus-within { border-color: #586fe1; }
.number-field input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #172447; font-family: var(--font-heading); font-size: clamp(2rem, 3vw, 2.8rem); font-weight: 800; letter-spacing: -.05em; }
.number-field span { color: #8490ab; font-size: 1rem; font-weight: 800; }
.hint, .result-hint, .result-message { min-height: 1.4rem; margin-top: .45rem; color: #7a879f; font-size: .77rem; }
.select-label { margin-top: 1.4rem; }
select { width: 100%; margin-top: .55rem; padding: .75rem .8rem; border: 1px solid #d7deeb; border-radius: 10px; background: white; color: #203259; font-size: .84rem; font-weight: 700; }
.swap-button { display: grid; place-items: center; width: 47px; height: 47px; border: 1px solid #d6def0; border-radius: 50%; background: white; color: #465cba; box-shadow: 0 5px 12px #14295815; cursor: pointer; transition: transform .2s; }
.swap-button:hover { transform: rotate(180deg); }
.result-panel { background: #172e62; color: white; }
.result-label { color: #becbf7; font-size: .82rem; font-weight: 800; }
.result-number { display: flex; align-items: baseline; gap: .6rem; min-height: 4.5rem; margin-top: .65rem; overflow-wrap: anywhere; }
.result-number strong { font-family: var(--font-heading); font-size: clamp(2rem, 3vw, 2.7rem); font-weight: 800; letter-spacing: -.06em; }
.result-number span { color: #bfc9f0; font-size: 1rem; font-weight: 700; }
.result-hint, .result-message { color: #d8e0fc; }
.result-panel select { border-color: #788bc7; background: #243f7d; color: white; }
.result-panel select option { color: #172447; background: white; }
.formula-strip { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem 1.5rem; padding: 1.1rem 2rem; border-top: 1px solid #e6eaf3; background: #f5f7fc; }
.formula-strip span { color: #7785a1; font-size: .67rem; font-weight: 800; letter-spacing: .12em; }
.formula-strip strong { font-size: .84rem; }
.formula-strip small { margin-left: auto; color: #6f7e99; font-size: .76rem; }
.information-grid { display: grid; grid-template-columns: 1.3fr .7fr; gap: 1.5rem; margin-top: 2rem; }
.explainer, .reference { padding: 2rem; border: 1px solid #e1e6f0; border-radius: 21px; background: white; }
.explainer h2, .reference h2 { margin-top: .65rem; font-size: 1.55rem; font-weight: 800; }
.explainer > p:not(.section-kicker) { margin-top: 1rem; color: #5f6d87; font-size: .93rem; line-height: 1.8; }
.reference table { width: 100%; margin-top: 1rem; border-collapse: collapse; font-size: .85rem; text-align: left; }
.reference th, .reference td { padding: .65rem 0; border-bottom: 1px solid #edf0f5; }
.reference th { color: #7785a0; font-size: .74rem; }
.reference td:last-child { color: #364fa9; font-weight: 800; }
.reference > p:last-child { margin-top: .8rem; color: #8a94aa; font-size: .72rem; }
.related { margin-top: 4rem; }
.related-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.related-heading h2 { margin-top: .5rem; font-size: 1.8rem; font-weight: 800; }
.related-heading a { display: inline-flex; align-items: center; gap: .4rem; color: #4a5fb0; font-size: .83rem; font-weight: 800; text-decoration: none; }
.related-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1.2rem; }
.related-grid a { position: relative; min-height: 145px; display: flex; flex-direction: column; gap: .7rem; padding: 1.2rem; border: 1px solid #dfe5f0; border-radius: 15px; background: white; color: inherit; text-decoration: none; }
.related-grid a:hover { border-color: #9aa8de; box-shadow: 0 8px 24px #14295812; }
.related-grid span { color: #7785a0; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
.related-grid strong { max-width: 80%; font-family: var(--font-heading); font-size: 1rem; }
.related-grid svg { position: absolute; right: 1.2rem; bottom: 1.2rem; color: #536ac2; }
@media (max-width: 950px) { .information-grid { grid-template-columns: 1fr; } .header-symbol { min-width: 150px; min-height: 110px; font-size: 1.4rem; } }
@media (max-width: 700px) { .tool-header { padding-block: 2rem; } .header-symbol { display: none; } .converter-heading { padding: 1.5rem 1.2rem 1rem; } .converter-grid { grid-template-columns: 1fr; gap: .9rem; padding: 0 1.2rem 1.2rem; } .input-panel, .result-panel { min-height: 0; padding: 1.3rem; } .swap-button { justify-self: center; transform: rotate(90deg); } .swap-button:hover { transform: rotate(270deg); } .formula-strip { padding: 1rem 1.2rem; } .formula-strip small { margin-left: 0; } .related-grid { grid-template-columns: 1fr; } .related-heading { align-items: start; } }
@media (max-width: 480px) { .breadcrumb { flex-wrap: wrap; } .reset-button span { display: none; } .explainer, .reference { padding: 1.4rem; } }
@media (prefers-reduced-motion: reduce) { .swap-button { transition: none; } }
</style>

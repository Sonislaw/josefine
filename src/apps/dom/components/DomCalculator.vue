<script setup lang="ts">
import { computed, reactive, toRef } from 'vue'
import { RotateCcw, Sparkles } from '@lucide/vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import { textShareField, useShareableCalculator } from '@/shared/composables/useShareableCalculator'
import { calculateDom, domCalculators, formatDomResult, parseDomNumber, type InputField } from '../lib/calculations'
import type { DomToolId } from '../manifest'

const props = defineProps<{ toolId: DomToolId }>()
const definition = domCalculators[props.toolId]
const form = reactive<Record<string, string>>(Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue])))
const { buildShareUrl, canShareInputs } = useShareableCalculator(
  definition.fields.map((field) =>
    textShareField(field.id, toRef(form, field.id), (raw) => parseDomNumber(raw) !== null),
  ),
)

function errorFor(field: InputField): string | null {
  const value = parseDomNumber(form[field.id] ?? '')
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz liczbę większą od zera.'
  if (field.integer && !Number.isInteger(value)) return 'Wpisz liczbę całkowitą.'
  return null
}

const results = computed(() => {
  const values: Record<string, number> = {}
  for (const field of definition.fields) {
    if (errorFor(field)) return null
    values[field.id] = parseDomNumber(form[field.id]!)!
  }
  const rows = calculateDom(props.toolId, values)
  return rows.every((row) => Number.isFinite(row.value)) ? rows : null
})

function reset() {
  for (const field of definition.fields) form[field.id] = field.defaultValue
}
</script>

<template>
  <section class="calculator" aria-labelledby="calculator-title">
    <div class="calculator-header"><div><p class="section-kicker"><Sparkles :size="14" aria-hidden="true" /> KALKULATOR</p><h2 id="calculator-title">Twoje dane, Twój wynik</h2></div><button type="button" class="reset-button" @click="reset"><RotateCcw :size="16" aria-hidden="true" /> <span>Przywróć przykład</span></button></div>
    <div class="calculator-grid"><div class="input-panel"><div class="panel-heading"><span class="panel-index">01</span><div><strong>Wprowadź wartości</strong><p>Obliczenia aktualizują się automatycznie.</p></div></div><div class="fields"><div v-for="field in definition.fields" :key="field.id" class="field"><label :for="`dom-${field.id}`">{{ field.label }}</label><div class="input-wrap"><input :id="`dom-${field.id}`" v-model="form[field.id]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" :aria-invalid="!!errorFor(field)" :aria-describedby="field.hint || errorFor(field) ? `dom-help-${field.id}` : undefined" /><span aria-hidden="true">{{ field.unit }}</span></div><p v-if="field.hint || errorFor(field)" :id="`dom-help-${field.id}`" class="field-help" :class="{ 'field-help--error': !!errorFor(field) }">{{ errorFor(field) ?? field.hint }}</p></div></div><p class="input-note">Możesz użyć przecinka lub kropki dziesiętnej.</p></div><div class="output-panel" aria-live="polite"><div class="panel-heading"><span class="panel-index">02</span><div><strong>Sprawdź wynik</strong><p>Przeliczone na podstawie wpisanych danych.</p></div></div><template v-if="results"><div class="primary-result"><span>{{ results[0]!.label }}</span><strong>{{ formatDomResult(results[0]!) }} <small>{{ results[0]!.unit }}</small></strong></div><div v-if="results.length > 1" class="secondary-results"><div v-for="row in results.slice(1)" :key="row.label"><span>{{ row.label }}</span><strong>{{ formatDomResult(row) }} {{ row.unit }}</strong></div></div></template><div v-else class="empty-result"><strong>—</strong><p>Popraw zaznaczone pola, aby zobaczyć wynik.</p></div><ShareResultButton :get-url="buildShareUrl" :disabled="!results || !canShareInputs" class="share-action" /><p class="output-note">{{ definition.note }}</p></div></div>
    <div class="formula-strip"><span>WZÓR</span><strong>{{ definition.formula }}</strong><small>{{ definition.example }}</small></div>
  </section>
</template>

<style scoped>
.calculator { overflow: hidden; border: 1px solid #e1e7db; border-radius: 24px; background: #fffefa; box-shadow: 0 18px 48px #32574312; }
.calculator-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.8rem 2rem 1.35rem; }
.section-kicker { display: inline-flex; align-items: center; gap: .4rem; color: #b66d50; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.calculator-header h2 { margin-top: .35rem; font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; letter-spacing: -.04em; }
.reset-button { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem .8rem; border: 1px solid #d6e0d3; border-radius: 10px; background: #fffefa; color: #557160; font-size: .77rem; font-weight: 800; cursor: pointer; }
.reset-button:hover { background: #eef4e9; }
.calculator-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 1rem; padding: 0 2rem 2rem; }
.input-panel, .output-panel { min-width: 0; padding: 1.6rem; border-radius: 18px; }
.input-panel { border: 1px solid #e1e8da; background: #f8faf3; }
.output-panel { display: flex; flex-direction: column; background: #275340; color: white; }
.panel-heading { display: flex; align-items: start; gap: .9rem; }
.panel-index { display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; background: #e4efdc; color: #4a7855; font-family: var(--font-heading); font-size: .82rem; font-weight: 800; }
.panel-heading strong { display: block; font-family: var(--font-heading); font-size: .95rem; }
.panel-heading p { margin-top: .25rem; color: #748575; font-size: .75rem; line-height: 1.45; }
.output-panel .panel-index { background: #45735a; color: #f1f8df; }
.output-panel .panel-heading p { color: #c7dbc7; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; margin-top: 2rem; }
.field label { display: block; margin-bottom: .55rem; color: #355b43; font-size: .78rem; font-weight: 800; }
.input-wrap { display: flex; align-items: center; gap: .5rem; min-height: 53px; padding: .55rem .8rem; border: 1px solid #cfddcf; border-radius: 10px; background: #fffefa; }
.input-wrap:focus-within { border-color: #5e9670; box-shadow: 0 0 0 3px #5e96702d; }
.input-wrap:has(input[aria-invalid="true"]) { border-color: #c97561; }
.input-wrap input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; color: #213a30; font-family: var(--font-heading); font-size: 1.12rem; font-weight: 800; }
.input-wrap span { max-width: 85px; color: #7c8c7d; font-size: .7rem; font-weight: 800; text-align: right; }
.field-help { margin-top: .4rem; color: #748575; font-size: .7rem; line-height: 1.45; }
.field-help--error { color: #a95242; }
.input-note { margin-top: 1.6rem; color: #7d8c7e; font-size: .73rem; }
.primary-result { display: grid; gap: .7rem; margin-top: 2.8rem; }
.primary-result > span { color: #d0e4d0; font-size: .83rem; font-weight: 700; }
.primary-result strong { overflow-wrap: anywhere; font-family: var(--font-heading); font-size: clamp(2.5rem, 4vw, 4.2rem); font-weight: 800; letter-spacing: -.065em; line-height: 1.1; }
.primary-result small { font-size: clamp(1.2rem, 2vw, 1.7rem); letter-spacing: 0; }
.secondary-results { display: grid; gap: .7rem; margin-top: 1.6rem; padding-top: 1.3rem; border-top: 1px solid #ffffff39; }
.secondary-results > div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.secondary-results span { color: #d0e4d0; font-size: .76rem; }
.secondary-results strong { font-family: var(--font-heading); font-size: 1rem; white-space: nowrap; }
.empty-result { margin-top: 2rem; }
.empty-result strong { font-family: var(--font-heading); font-size: 3rem; }
.empty-result p { color: #d0e4d0; font-size: .8rem; }
.share-action { align-self: flex-start; margin-top: 1.5rem; }
.output-note { margin-top: auto; padding-top: 2.5rem; color: #cfdfce; font-size: .75rem; line-height: 1.65; }
.formula-strip { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 1.3rem; padding: 1.1rem 2rem; border-top: 1px solid #e8ecdf; background: #f7f5eb; }
.formula-strip span { color: #a16953; font-size: .7rem; font-weight: 800; letter-spacing: .12em; }
.formula-strip strong { font-size: .83rem; }
.formula-strip small { margin-left: auto; color: #748273; font-size: .75rem; }
@media (max-width: 800px) { .calculator-grid { grid-template-columns: 1fr; } .output-note { padding-top: 2rem; } }
@media (max-width: 540px) { .calculator-header { padding: 1.4rem 1.2rem 1rem; } .calculator-header h2 { font-size: 1.3rem; } .reset-button span { display: none; } .calculator-grid { padding: 0 1.2rem 1.2rem; } .input-panel, .output-panel { padding: 1.25rem; } .fields { grid-template-columns: 1fr; } .formula-strip { padding: 1rem 1.2rem; } .formula-strip small { margin-left: 0; } }
</style>

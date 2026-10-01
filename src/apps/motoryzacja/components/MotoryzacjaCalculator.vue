<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RotateCcw } from '@lucide/vue'
import { calculateMotoryzacja, formatMotoryzacjaResult, motoryzacjaCalculators, parseMotoryzacjaNumber, type InputField } from '../lib/calculations'
import type { MotoryzacjaToolId } from '../manifest'

const props = defineProps<{ toolId: MotoryzacjaToolId }>()
const definition = motoryzacjaCalculators[props.toolId]
const form = reactive<Record<string, string>>(Object.fromEntries(definition.fields.map((field) => [field.id, field.defaultValue])))

function errorFor(field: InputField): string | null {
  const value = parseMotoryzacjaNumber(form[field.id] ?? '')
  if (value === null) return 'Wpisz poprawną liczbę.'
  if (field.positive && value <= 0) return 'Wpisz liczbę większą od zera.'
  if (field.integer && !Number.isInteger(value)) return 'Wpisz pełną liczbę godzin lub minut.'
  if (field.max !== undefined && value > field.max) return `Wpisz wartość nie większą niż ${field.max}.`
  return null
}

const generalError = computed(() => {
  if (props.toolId !== 'predkosc-srednia') return null
  const hours = parseMotoryzacjaNumber(form.hours ?? '')
  const minutes = parseMotoryzacjaNumber(form.minutes ?? '')
  return hours === 0 && minutes === 0 ? 'Czas jazdy musi być dłuższy od zera.' : null
})

const results = computed(() => {
  const values: Record<string, number> = {}
  for (const field of definition.fields) {
    if (errorFor(field)) return null
    values[field.id] = parseMotoryzacjaNumber(form[field.id]!)!
  }
  if (generalError.value) return null
  const rows = calculateMotoryzacja(props.toolId, values)
  return rows.every((row) => Number.isFinite(row.value)) ? rows : null
})

function reset() {
  for (const field of definition.fields) form[field.id] = field.defaultValue
}
</script>

<template>
  <section class="calculator" aria-labelledby="calculator-title"><div class="calculator-header"><div><p class="section-kicker">KALKULATOR / NA ŻYWO</p><h2 id="calculator-title">Wpisz dane z trasy</h2></div><button type="button" class="reset-button" @click="reset"><RotateCcw :size="16" aria-hidden="true" /><span>Przywróć przykład</span></button></div><div class="calculator-grid"><div class="input-panel"><div class="panel-heading"><span class="panel-index">01</span><div><strong>Twoje wartości</strong><p>Użyj danych z przejazdu lub planowanej trasy.</p></div></div><div class="fields"><div v-for="field in definition.fields" :key="field.id" class="field"><label :for="`moto-${field.id}`">{{ field.label }}</label><div class="input-wrap"><input :id="`moto-${field.id}`" v-model="form[field.id]" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" :aria-invalid="!!errorFor(field)" :aria-describedby="field.hint || errorFor(field) ? `moto-help-${field.id}` : undefined" /><span aria-hidden="true">{{ field.unit }}</span></div><p v-if="field.hint || errorFor(field)" :id="`moto-help-${field.id}`" class="field-help" :class="{ 'field-help--error': !!errorFor(field) }">{{ errorFor(field) ?? field.hint }}</p></div></div><p v-if="generalError" class="general-error" role="alert">{{ generalError }}</p><p class="input-note">Możesz wpisać liczby z przecinkiem lub kropką.</p></div><div class="output-panel" aria-live="polite"><div class="panel-heading"><span class="panel-index">02</span><div><strong>Wynik podróży</strong><p>Aktualizuje się podczas wpisywania.</p></div></div><template v-if="results"><div class="primary-result"><span>{{ results[0]!.label }}</span><strong>{{ formatMotoryzacjaResult(results[0]!) }} <small>{{ results[0]!.unit }}</small></strong></div><div v-if="results.length > 1" class="secondary-results"><div v-for="row in results.slice(1)" :key="row.label"><span>{{ row.label }}</span><strong>{{ formatMotoryzacjaResult(row) }} {{ row.unit }}</strong></div></div></template><div v-else class="empty-result"><strong>—</strong><p>Popraw zaznaczone pola, aby zobaczyć wynik.</p></div><p class="output-note">{{ definition.note }}</p></div></div><div class="formula-strip"><span>WZÓR</span><strong>{{ definition.formula }}</strong><small>{{ definition.example }}</small></div></section>
</template>

<style scoped>
.calculator { overflow: hidden; border: 1px solid #dfe9e1; border-radius: 24px; background: #fcfefb; box-shadow: 0 20px 48px #14313d12; }
.calculator-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.85rem 2rem 1.3rem; }
.section-kicker { color: #c7815d; font-size: .71rem; font-weight: 800; letter-spacing: .16em; }
.calculator-header h2 { margin-top: .38rem; font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; letter-spacing: -.045em; }
.reset-button { display: inline-flex; align-items: center; gap: .5rem; padding: .64rem .8rem; border: 1px solid #d3e1d8; border-radius: 10px; background: #fff; color: #58756a; font-size: .76rem; font-weight: 800; cursor: pointer; }
.reset-button:hover { background: #eef7ed; }
.calculator-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 1rem; padding: 0 2rem 2rem; }
.input-panel, .output-panel { min-width: 0; padding: 1.65rem; border-radius: 18px; }
.input-panel { border: 1px solid #dfe9e2; background: #f7faf6; }
.output-panel { position: relative; display: flex; flex-direction: column; overflow: hidden; background: #163945; color: #fff; }
.output-panel::after { position: absolute; right: -95px; bottom: -120px; width: 260px; height: 260px; border: 28px solid #bce58315; border-radius: 50%; content: ''; pointer-events: none; }
.panel-heading { position: relative; z-index: 1; display: flex; align-items: start; gap: .9rem; }
.panel-index { display: grid; place-items: center; flex: 0 0 auto; width: 35px; height: 35px; border-radius: 10px; background: #e2f1dc; color: #3f735a; font-family: var(--font-heading); font-size: .8rem; font-weight: 800; }
.panel-heading strong { display: block; font-family: var(--font-heading); font-size: .94rem; }
.panel-heading p { margin-top: .25rem; color: #7f998c; font-size: .73rem; line-height: 1.45; }
.output-panel .panel-index { background: #3b6570; color: #d4f291; }
.output-panel .panel-heading p { color: #b8d1c9; }
.fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; margin-top: 2.1rem; }
.field label { display: block; margin-bottom: .55rem; color: #355d54; font-size: .78rem; font-weight: 800; }
.input-wrap { display: flex; align-items: center; gap: .5rem; min-height: 54px; padding: .55rem .8rem; border: 1px solid #ccdeda; border-radius: 10px; background: #fff; }
.input-wrap:focus-within { border-color: #58a393; box-shadow: 0 0 0 3px #58a3932b; }
.input-wrap:has(input[aria-invalid="true"]) { border-color: #c87864; }
.input-wrap input { width: 100%; min-width: 0; border: 0; outline: none; background: transparent; color: #18333b; font-family: var(--font-heading); font-size: 1.13rem; font-weight: 800; }
.input-wrap span { max-width: 85px; color: #849a8f; font-size: .7rem; font-weight: 800; text-align: right; }
.field-help { margin-top: .38rem; color: #788f83; font-size: .69rem; line-height: 1.45; }
.field-help--error, .general-error { color: #ac5846; }
.general-error { margin-top: 1.3rem; font-size: .75rem; font-weight: 800; }
.input-note { margin-top: 1.6rem; color: #81958a; font-size: .72rem; }
.primary-result { position: relative; z-index: 1; display: grid; gap: .7rem; margin-top: 2.75rem; }
.primary-result > span { color: #c6dfd3; font-size: .82rem; font-weight: 700; }
.primary-result strong { overflow-wrap: anywhere; font-family: var(--font-heading); font-size: clamp(2.35rem, 3.5vw, 3.8rem); font-weight: 800; letter-spacing: -.065em; line-height: 1.13; }
.primary-result small { color: #d0ef90; font-size: clamp(1rem, 1.7vw, 1.45rem); letter-spacing: 0; }
.secondary-results { position: relative; z-index: 1; display: grid; gap: .75rem; margin-top: 1.5rem; padding-top: 1.3rem; border-top: 1px solid #ffffff31; }
.secondary-results > div { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.secondary-results span { color: #bed7ce; font-size: .75rem; }
.secondary-results strong { font-family: var(--font-heading); font-size: .98rem; text-align: right; }
.empty-result { position: relative; z-index: 1; margin-top: 2rem; }
.empty-result strong { font-family: var(--font-heading); font-size: 3rem; }
.empty-result p { color: #bed7ce; font-size: .8rem; }
.output-note { position: relative; z-index: 1; margin-top: auto; padding-top: 2.5rem; color: #c6ddd3; font-size: .74rem; line-height: 1.65; }
.formula-strip { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 1.3rem; padding: 1.1rem 2rem; border-top: 1px solid #e5ece5; background: #eff5ed; }
.formula-strip span { color: #9c745d; font-size: .69rem; font-weight: 800; letter-spacing: .12em; }
.formula-strip strong { font-size: .83rem; }
.formula-strip small { margin-left: auto; color: #768d80; font-size: .75rem; }
@media (max-width: 800px) { .calculator-grid { grid-template-columns: 1fr; } .output-note { padding-top: 2rem; } }
@media (max-width: 540px) { .calculator-header { padding: 1.4rem 1.2rem 1rem; } .calculator-header h2 { font-size: 1.3rem; } .reset-button span { display: none; } .calculator-grid { padding: 0 1.2rem 1.2rem; } .input-panel, .output-panel { padding: 1.25rem; } .fields { grid-template-columns: 1fr; } .formula-strip { padding: 1rem 1.2rem; } .formula-strip small { margin-left: 0; } }
</style>

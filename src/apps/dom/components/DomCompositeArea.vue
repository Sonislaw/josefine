<script setup lang="ts">
import { computed } from 'vue'
import { Layers3, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  calculateCompositeArea,
  MAX_AREA_FRAGMENTS,
  parseAreaDimension,
  type AreaFragment,
} from '../lib/composite-area'

const props = defineProps<{
  baseLength: string
  baseWidth: string
  getShareUrl: () => string
  canShare: boolean
}>()
const enabled = defineModel<boolean>('enabled', { required: true })
const fragments = defineModel<AreaFragment[]>('fragments', { required: true })

const canStart = computed(
  () =>
    fragments.value.length > 0 ||
    (parseAreaDimension(props.baseLength) !== null && parseAreaDimension(props.baseWidth) !== null),
)
const result = computed(() => calculateCompositeArea(fragments.value))
const inputsValid = computed(
  () =>
    fragments.value.length > 0 &&
    fragments.value.every(
      (part) => parseAreaDimension(part.length) !== null && parseAreaDimension(part.width) !== null,
    ),
)

function chooseMode(advanced: boolean) {
  if (advanced && !enabled.value && fragments.value.length === 0) {
    if (!canStart.value) return
    // Pierwszy fragment przejmuje pomiar z prostego kalkulatora, bez ponownego wpisywania.
    fragments.value = [
      { id: 1, operation: 'add', length: props.baseLength, width: props.baseWidth },
    ]
  }
  enabled.value = advanced
}

function addFragment() {
  if (fragments.value.length >= MAX_AREA_FRAGMENTS) return
  const id = Math.max(0, ...fragments.value.map((part) => part.id)) + 1
  fragments.value = [...fragments.value, { id, operation: 'add', length: '1', width: '1' }]
}

function removeFragment(id: number) {
  if (fragments.value.length <= 1) return
  fragments.value = fragments.value.filter((part) => part.id !== id)
}

function resetFragments() {
  fragments.value = [{ id: 1, operation: 'add', length: '5', width: '4' }]
}

function fragmentArea(part: AreaFragment): number | null {
  const length = parseAreaDimension(part.length)
  const width = parseAreaDimension(part.width)
  return length !== null && width !== null ? length * width : null
}

const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 6 }).format(value)
</script>

<template>
  <section class="area-modes" aria-labelledby="area-mode-title">
    <div class="mode-heading">
      <span class="mode-icon"><Layers3 :size="20" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">DOPASUJ DO SWOJEGO POMIESZCZENIA</p>
        <h2 id="area-mode-title">Jeden prostokąt czy kilka fragmentów?</h2>
      </div>
    </div>
    <div class="mode-buttons" role="group" aria-label="Sposób liczenia powierzchni">
      <button
        type="button"
        :class="{ active: !enabled }"
        :aria-pressed="!enabled"
        @click="chooseMode(false)"
      >
        Prosty prostokąt
      </button>
      <button
        type="button"
        :class="{ active: enabled }"
        :aria-pressed="enabled"
        :disabled="!canStart"
        @click="chooseMode(true)"
      >
        Kilka fragmentów
      </button>
    </div>
    <p v-if="!canStart && !enabled" class="mode-help">
      Najpierw wpisz poprawną długość i szerokość prostokąta, aby rozpocząć tryb fragmentów.
    </p>
  </section>

  <section v-if="enabled" class="composite-area" aria-labelledby="composite-area-title">
    <div class="calculator-header">
      <div>
        <p class="eyebrow">POMIAR KROK PO KROKU</p>
        <h2 id="composite-area-title">Złóż powierzchnię z prostokątów</h2>
        <p>
          Dodaj części pokoju, a wnękę zajętą przez komin lub inny element odejmij. Mierz bez
          nakładających się fragmentów.
        </p>
      </div>
      <button type="button" class="reset-button" @click="resetFragments">
        <RotateCcw :size="16" aria-hidden="true" /> Przywróć przykład
      </button>
    </div>

    <div class="calculator-grid">
      <div class="fragments-panel">
        <div
          v-for="(part, index) in fragments"
          :key="part.id"
          class="fragment-card"
          :class="{ subtract: part.operation === 'subtract' }"
        >
          <div class="fragment-heading">
            <strong>Fragment {{ index + 1 }}</strong>
            <button
              type="button"
              class="remove-button"
              :disabled="fragments.length <= 1"
              :aria-label="`Usuń fragment ${index + 1}`"
              @click="removeFragment(part.id)"
            >
              <Trash2 :size="16" aria-hidden="true" />
            </button>
          </div>
          <div class="fragment-fields">
            <div class="field operation-field">
              <label :for="`area-operation-${part.id}`">Działanie</label>
              <select :id="`area-operation-${part.id}`" v-model="part.operation">
                <option value="add">Dodaj powierzchnię</option>
                <option value="subtract">Odejmij powierzchnię</option>
              </select>
            </div>
            <div class="field">
              <label :for="`area-length-${part.id}`">Długość</label>
              <div class="input-wrap">
                <input
                  :id="`area-length-${part.id}`"
                  v-model="part.length"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="parseAreaDimension(part.length) === null"
                  :aria-describedby="
                    parseAreaDimension(part.length) === null ? `area-help-${part.id}` : undefined
                  "
                /><span>m</span>
              </div>
            </div>
            <div class="field">
              <label :for="`area-width-${part.id}`">Szerokość</label>
              <div class="input-wrap">
                <input
                  :id="`area-width-${part.id}`"
                  v-model="part.width"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="parseAreaDimension(part.width) === null"
                  :aria-describedby="
                    parseAreaDimension(part.width) === null ? `area-help-${part.id}` : undefined
                  "
                /><span>m</span>
              </div>
            </div>
          </div>
          <p
            v-if="
              parseAreaDimension(part.length) === null || parseAreaDimension(part.width) === null
            "
            :id="`area-help-${part.id}`"
            class="field-error"
          >
            Każdy wymiar musi być większy od zera i nie może przekraczać 1000 m.
          </p>
          <p class="fragment-total">
            {{ part.operation === 'subtract' ? '−' : '+' }}
            {{ fragmentArea(part) === null ? '—' : formatArea(fragmentArea(part)!) }} m²
          </p>
        </div>
        <button
          type="button"
          class="add-button"
          :disabled="fragments.length >= MAX_AREA_FRAGMENTS"
          @click="addFragment"
        >
          <Plus :size="17" aria-hidden="true" /> Dodaj kolejny fragment
        </button>
        <p class="limit-note">
          Maksymalnie {{ MAX_AREA_FRAGMENTS }} fragmentów. Możesz użyć przecinka lub kropki
          dziesiętnej.
        </p>
      </div>

      <div class="result-panel" aria-live="polite">
        <p class="eyebrow">ŁĄCZNA POWIERZCHNIA</p>
        <template v-if="result">
          <div class="primary-result">
            <span>Po dodaniu i odjęciu fragmentów</span
            ><strong>{{ formatArea(result.total) }} <small>m²</small></strong>
          </div>
          <dl class="result-rows">
            <div>
              <dt>Dodane fragmenty</dt>
              <dd>{{ formatArea(result.addedArea) }} m²</dd>
            </div>
            <div>
              <dt>Odjęte fragmenty</dt>
              <dd>− {{ formatArea(result.subtractedArea) }} m²</dd>
            </div>
          </dl>
        </template>
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>
            {{
              inputsValid
                ? 'Suma powierzchni musi być większa od zera. Dodaj większy fragment lub zmniejsz odjęcie.'
                : 'Popraw wymiary fragmentów, aby zobaczyć sumę.'
            }}
          </p>
        </div>
        <ShareResultButton
          :get-url="getShareUrl"
          :disabled="!result || !canShare"
          class="share-action"
        />
        <p class="result-note">
          Wynik przeniesiesz poniżej do paneli lub płytek. Z samej powierzchni nie obliczymy obwodu
          pomieszczenia ani liczby listew.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.area-modes {
  margin-bottom: 1.25rem;
  padding: 1.5rem 2rem;
  border: 1px solid #dce7d8;
  border-radius: 20px;
  background: linear-gradient(120deg, #f7f9f2, #fbf3e8);
}
.mode-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.mode-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #dfeedd;
  color: #356748;
}
.eyebrow {
  color: #ac6b50;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h2 {
  margin-top: 0.25rem;
  color: #294f38;
  font-family: var(--font-heading);
  font-size: clamp(1.3rem, 2.2vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.mode-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1.2rem;
}
.mode-buttons button {
  padding: 0.7rem 1rem;
  border: 1px solid #d5e2d1;
  border-radius: 10px;
  background: #fffefa;
  color: #3e644a;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.mode-buttons button.active {
  border-color: #2d6044;
  background: #2d6044;
  color: #fff;
}
.mode-buttons button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mode-help {
  margin-top: 0.7rem;
  color: #a05d48;
  font-size: 0.72rem;
}
.composite-area {
  overflow: hidden;
  border: 1px solid #e0e7dc;
  border-radius: 24px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.calculator-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.7rem 2rem;
}
.calculator-header p:last-child {
  max-width: 730px;
  margin-top: 0.5rem;
  color: #6f8373;
  font-size: 0.78rem;
  line-height: 1.6;
}
.reset-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex: 0 0 auto;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d6e0d3;
  border-radius: 10px;
  background: #fffefa;
  color: #557160;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}
.reset-button:hover {
  background: #eef4e9;
}
.calculator-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1rem;
  padding: 0 2rem 2rem;
}
.fragments-panel {
  display: grid;
  align-content: start;
  gap: 0.8rem;
  min-width: 0;
  padding: 1.2rem;
  border: 1px solid #e1e8da;
  border-radius: 18px;
  background: #f8faf3;
}
.fragment-card {
  padding: 1rem;
  border: 1px solid #d7e5d2;
  border-radius: 13px;
  background: #fffefa;
}
.fragment-card.subtract {
  border-color: #e9d5c5;
  background: #fffaf5;
}
.fragment-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.fragment-heading strong {
  color: #315b40;
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.fragment-card.subtract .fragment-heading strong {
  color: #a1644e;
}
.remove-button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e2e9de;
  border-radius: 8px;
  background: #fff;
  color: #8b9d8a;
  cursor: pointer;
}
.remove-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.remove-button:not(:disabled):hover {
  color: #a25442;
  border-color: #e5beb1;
}
.fragment-fields {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 0.6rem;
  margin-top: 0.7rem;
}
.field label {
  display: block;
  margin-bottom: 0.35rem;
  color: #496a51;
  font-size: 0.69rem;
  font-weight: 800;
}
.field select,
.input-wrap {
  width: 100%;
  min-height: 43px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #cfddcf;
  border-radius: 9px;
  background: #fff;
  color: #294b36;
}
.field select {
  font-size: 0.75rem;
  font-weight: 700;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.input-wrap:focus-within,
.field select:focus-visible {
  border-color: #5e9670;
  box-shadow: 0 0 0 3px #5e96702d;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c97561;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #213a30;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
}
.input-wrap span {
  color: #7c8c7d;
  font-size: 0.72rem;
  font-weight: 800;
}
.field-error {
  margin-top: 0.5rem;
  color: #a95242;
  font-size: 0.7rem;
}
.fragment-total {
  margin-top: 0.65rem;
  color: #376c4b;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 800;
  text-align: right;
}
.fragment-card.subtract .fragment-total {
  color: #a1644e;
}
.add-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem;
  border: 1px dashed #83ab87;
  border-radius: 10px;
  background: #eef5e9;
  color: #2d6342;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.add-button:hover {
  background: #e3f0df;
}
.add-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.limit-note {
  color: #7c8e7d;
  font-size: 0.7rem;
  line-height: 1.5;
}
.result-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.5rem;
  border-radius: 18px;
  background: #275340;
  color: #fff;
}
.result-panel .eyebrow {
  color: #d5e7ce;
}
.primary-result {
  display: grid;
  gap: 0.6rem;
  margin-top: 2rem;
}
.primary-result span,
.result-rows dt {
  color: #d0e4d0;
  font-size: 0.77rem;
}
.primary-result strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1.1;
}
.primary-result small {
  font-size: 0.55em;
}
.result-rows {
  display: grid;
  gap: 0.7rem;
  margin: 1.4rem 0 0;
  padding-top: 1.1rem;
  border-top: 1px solid #ffffff39;
}
.result-rows > div {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
}
.result-rows dd {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 800;
}
.empty-result {
  margin-top: 2rem;
}
.empty-result strong {
  font-family: var(--font-heading);
  font-size: 3rem;
}
.empty-result p {
  max-width: 320px;
  color: #d0e4d0;
  font-size: 0.8rem;
  line-height: 1.5;
}
.share-action {
  align-self: flex-start;
  margin-top: 1.5rem;
}
.result-note {
  margin-top: auto;
  padding-top: 1.7rem;
  color: #cfdfce;
  font-size: 0.73rem;
  line-height: 1.6;
}
@media (max-width: 850px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .area-modes {
    padding: 1.2rem;
  }
  .mode-buttons button {
    flex: 1 1 auto;
  }
  .calculator-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 1.3rem;
  }
  .calculator-grid {
    padding: 0 1.2rem 1.2rem;
  }
  .fragments-panel,
  .result-panel {
    padding: 1.1rem;
  }
  .fragment-fields {
    grid-template-columns: 1fr 1fr;
  }
  .operation-field {
    grid-column: 1 / -1;
  }
}
</style>

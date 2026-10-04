<script setup lang="ts">
import { Layers3 } from '@lucide/vue'
import type { RoomCoverageAudit, RoomCoverageRow } from '../lib/room-coverage'

const props = defineProps<{ roomId: string; audit: RoomCoverageAudit }>()
const formatMeasure = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function segmentWidth(row: RoomCoverageRow, index: number): string {
  if (row.available === null || row.available <= 0) return '0%'
  const before = row.parts.slice(0, index).reduce((sum, part) => sum + part.value, 0)
  return `${(Math.max(0, Math.min(row.parts[index]!.value, row.available - before)) / row.available) * 100}%`
}

const hasExcess = () => props.audit.rows.some((row) => row.excess > 0)
</script>

<template>
  <section class="coverage-audit" :aria-labelledby="`coverage-${roomId}`">
    <header class="audit-header">
      <span class="audit-icon"><Layers3 :size="21" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">KONTROLA ZAKRESU</p>
        <h3 :id="`coverage-${roomId}`">Co zaplanowano w pokoju?</h3>
        <p>Zestawiamy zapisane zakresy z wymiarami pokoju. To kontrola metrażu, nie nowy koszt.</p>
      </div>
    </header>

    <div class="coverage-grid">
      <article
        v-for="row in audit.rows"
        :key="row.id"
        class="coverage-card"
        :class="{ 'coverage-card--excess': row.excess > 0 }"
      >
        <div class="card-title">
          <h4>{{ row.label }}</h4>
          <span>{{
            row.available === null ? 'Brak wymiarów' : `${formatMeasure(row.available)} ${row.unit}`
          }}</span>
        </div>
        <div class="card-numbers">
          <span>Zapisano</span>
          <strong>{{ formatMeasure(row.planned) }} {{ row.unit }}</strong>
        </div>
        <div v-if="row.available !== null" class="coverage-track" aria-hidden="true">
          <span
            v-for="(part, index) in row.parts"
            :key="part.label"
            :class="`segment--${index}`"
            :style="{ width: segmentWidth(row, index) }"
          />
        </div>
        <div class="coverage-parts">
          <span v-for="part in row.parts" :key="part.label">
            {{ part.label }}: {{ formatMeasure(part.value) }} {{ row.unit }}
          </span>
        </div>
        <p v-if="row.excess > 0" class="card-alert">
          O {{ formatMeasure(row.excess) }} {{ row.unit }} więcej niż wynika z wymiarów — sprawdź
          nakładające się lub zdublowane zapisy.
        </p>
        <p v-else-if="row.unallocated !== null" class="card-remainder">
          Nierozpisane: {{ formatMeasure(row.unallocated) }} {{ row.unit }}
        </p>
        <p v-else class="card-remainder">Dodaj wymiary pokoju, aby porównać zakresy.</p>
      </article>
    </div>

    <p v-if="audit.missingMeasurements.length" class="audit-warning">
      Zakupy bez zakresu prac:
      <span v-for="(entry, index) in audit.missingMeasurements" :key="entry.label">
        {{ index ? ' · ' : '' }}{{ entry.label }} ({{ entry.count }}) </span
      >. Uzupełnij metraż lub długość w edycji zakupów, jeśli chcesz uwzględnić ich robociznę.
    </p>
    <p class="audit-note" :class="{ 'audit-note--alert': hasExcess() }">
      Nierozpisana część nie oznacza automatycznie brakującego zakupu: ściany mogą mieć okna i
      drzwi, sufit może nie być malowany, a przy drzwiach nie montuje się listew. Nawet zgodna suma
      nie wyklucza nakładania się prac — sprawdź, czy opisują różne strefy. Niczego nie doliczamy do
      budżetu bez Twojego zapisu.
    </p>
  </section>
</template>

<style scoped>
.coverage-audit {
  margin-top: 1.25rem;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  border: 1px solid #d9e3d5;
  border-radius: 17px;
  background: linear-gradient(135deg, #f6f8f1, #f7f1e8);
}
.audit-header {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}
.audit-icon {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 12px;
  background: #e5eedd;
  color: #3b6850;
}
.eyebrow {
  color: #a36c4b;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.audit-header h3 {
  margin-top: 0.2rem;
  color: #2a533d;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}
.audit-header p:last-child,
.audit-note {
  margin-top: 0.3rem;
  color: #6d806f;
  font-size: 0.74rem;
  line-height: 1.55;
}
.coverage-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}
.coverage-card {
  min-width: 0;
  padding: 0.9rem;
  border: 1px solid #dce6d7;
  border-radius: 12px;
  background: #fffefa;
}
.coverage-card--excess {
  border-color: #e5b69d;
  background: #fffaf5;
}
.card-title,
.card-numbers {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}
.card-title h4 {
  color: #31563f;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.card-title span,
.card-numbers span,
.coverage-parts,
.card-remainder {
  color: #728374;
  font-size: 0.72rem;
}
.card-numbers {
  margin-top: 0.55rem;
}
.card-numbers strong {
  color: #2d5940;
  font-size: 0.96rem;
}
.coverage-track {
  display: flex;
  overflow: hidden;
  height: 9px;
  margin-top: 0.7rem;
  border-radius: 100px;
  background: #e8ece3;
}
.coverage-track span {
  display: block;
  background: #579b6b;
}
.coverage-track .segment--1 {
  background: #cc9673;
}
.coverage-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.8rem;
  margin-top: 0.55rem;
}
.card-remainder,
.card-alert {
  margin-top: 0.6rem;
  line-height: 1.5;
}
.card-alert {
  color: #a0503b;
  font-size: 0.72rem;
  font-weight: 700;
}
.audit-warning {
  margin-top: 0.75rem;
  padding: 0.7rem 0.8rem;
  border-radius: 9px;
  background: #fff0e3;
  color: #8b5134;
  font-size: 0.72rem;
  line-height: 1.55;
}
.audit-note {
  margin-top: 0.75rem;
}
.audit-note--alert {
  color: #8b5134;
}
@media (max-width: 650px) {
  .coverage-grid {
    grid-template-columns: 1fr;
  }
}
</style>

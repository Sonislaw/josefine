<script setup lang="ts">
import { ArrowUpRight, Layers3 } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { TilingBudgetSummary } from '../lib/tiling-budget'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{ summary: TilingBudgetSummary; roomId: string }>()
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatArea = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function laborLine(id: 'tilingFloor' | 'tilingWalls') {
  return props.summary.laborLines.find((line) => line.id === id)
}
</script>

<template>
  <section class="tiling-budget" :aria-labelledby="`tiling-budget-${roomId}`">
    <header class="tiling-header">
      <span class="tiling-icon"><Layers3 :size="23" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">PŁYTKI / KLEJ / FUGA / MONTAŻ</p>
        <h3 :id="`tiling-budget-${roomId}`">Prace glazurnicze w jednym miejscu</h3>
      </div>
    </header>

    <div class="material-grid" aria-label="Materiały glazurnicze">
      <article v-for="line in summary.materials" :key="line.id" class="material-card">
        <div class="material-heading">
          <h4>{{ line.label }}</h4>
          <RouterLink
            v-if="!line.itemCount"
            :to="{ path: domPath(line.path), query: { roomId } }"
            :aria-label="`Dodaj: ${line.label}`"
          >
            Dodaj
            <ArrowUpRight :size="14" aria-hidden="true" />
          </RouterLink>
        </div>
        <p v-if="line.itemCount" class="quantity">{{ line.quantityLabel }}</p>
        <p v-else class="quantity muted">
          Nie dodano
          {{ line.id === 'tiles' ? 'płytek' : line.id === 'adhesive' ? 'kleju' : 'fugi' }}.
        </p>
        <strong>{{
          !line.itemCount ? '—' : line.pricedCount ? formatMoney(line.knownCost) : 'Brak ceny'
        }}</strong>
        <small v-if="line.missingPriceCount">
          Bez ceny: {{ line.missingPriceCount }}
          {{ line.missingPriceCount === 1 ? 'pozycja' : 'pozycji' }}
        </small>
      </article>
    </div>

    <div
      v-if="summary.floorArea || summary.wallArea || summary.missingAreaCount"
      class="labor-block"
    >
      <div class="labor-heading">
        <h4>Układanie płytek</h4>
        <span>Stawki ustawisz w budżecie pokoju poniżej</span>
      </div>
      <div v-if="summary.floorArea" class="labor-row">
        <span>Podłoga · {{ formatArea(summary.floorArea) }} m²</span>
        <strong>{{
          laborLine('tilingFloor') ? formatMoney(laborLine('tilingFloor')!.cost) : 'Brak stawki'
        }}</strong>
      </div>
      <div v-if="summary.wallArea" class="labor-row">
        <span>Ściany · {{ formatArea(summary.wallArea) }} m²</span>
        <strong>{{
          laborLine('tilingWalls') ? formatMoney(laborLine('tilingWalls')!.cost) : 'Brak stawki'
        }}</strong>
      </div>
      <p v-if="!summary.floorArea && !summary.wallArea" class="labor-empty">
        Uzupełnij metraż zapisanych płytek, aby policzyć robociznę.
      </p>
    </div>

    <div class="tiling-total">
      <span>Suma ujętych kosztów glazury</span>
      <strong>{{
        summary.hasKnownCost ? formatMoney(summary.knownTotal) : 'Brak cen i stawek'
      }}</strong>
    </div>
    <div
      v-if="
        summary.missingPriceCount ||
        summary.missingAreaCount ||
        summary.missingLaborRateFloor ||
        summary.missingLaborRateWalls ||
        summary.exceedsFloor ||
        summary.exceedsWalls
      "
      class="tiling-warnings"
    >
      <p v-if="summary.missingPriceCount">
        {{ summary.missingPriceCount }}
        {{ summary.missingPriceCount === 1 ? 'zakup nie ma ceny' : 'zakupów nie ma ceny' }} — suma
        jest niepełna.
      </p>
      <p v-if="summary.missingAreaCount">
        {{ summary.missingAreaCount }}
        {{
          summary.missingAreaCount === 1
            ? 'pozycja płytek nie ma metrażu'
            : 'pozycji płytek nie ma metrażu'
        }}. Otwórz edycję pozycji i wpisz powierzchnię oraz miejsce układania.
      </p>
      <p v-if="summary.missingLaborRateFloor || summary.missingLaborRateWalls">
        Brakuje stawki za układanie płytek
        {{
          summary.missingLaborRateFloor && summary.missingLaborRateWalls
            ? 'na podłodze i ścianach'
            : summary.missingLaborRateFloor
              ? 'na podłodze'
              : 'na ścianach'
        }}. Dodaj ją w budżecie pokoju poniżej.
      </p>
      <p v-if="summary.exceedsFloor || summary.exceedsWalls">
        Łączny metraż płytek przekracza powierzchnię
        {{
          summary.exceedsFloor && summary.exceedsWalls
            ? 'podłogi i ścian'
            : summary.exceedsFloor
              ? 'podłogi'
              : 'ścian'
        }}
        pokoju. Sprawdź, czy nie zapisano tej samej pracy dwa razy.
      </p>
    </div>
    <p class="tiling-note">
      Brak kleju lub fugi nie oznacza automatycznie błędu — dodaj je, jeśli są potrzebne. Pokazujemy
      wszystkie zapisane zakupy pokoju, niezależnie od filtra „Kupione”. Nie uwzględniamy dostawy,
      przygotowania podłoża ani innych prac.
    </p>
  </section>
</template>

<style scoped>
.tiling-budget {
  margin-top: 1.25rem;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  border: 1px solid #d6e4d2;
  border-radius: 17px;
  background: linear-gradient(135deg, #f1f7ec, #fff9ef);
}
.tiling-header {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}
.tiling-icon {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  height: 44px;
  border-radius: 12px;
  background: #dce9d5;
  color: #315f45;
}
.eyebrow {
  color: #a16649;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.tiling-header h3 {
  margin-top: 0.22rem;
  color: #2a533d;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}
.material-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1.1rem;
}
.material-card {
  min-width: 0;
  padding: 0.9rem;
  border: 1px solid #dbe5d5;
  border-radius: 11px;
  background: #fffefa;
}
.material-heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}
.material-heading h4,
.labor-heading h4 {
  color: #31563f;
  font-family: var(--font-heading);
  font-size: 1rem;
}
.material-heading a {
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  color: #426d4e;
  font-size: 0.7rem;
  font-weight: 800;
  text-underline-offset: 2px;
}
.quantity {
  min-height: 1.1rem;
  margin-top: 0.55rem;
  color: #637866;
  font-size: 0.74rem;
}
.quantity.muted {
  color: #869586;
}
.material-card > strong {
  display: block;
  margin-top: 0.65rem;
  color: #294e38;
  font-size: 0.96rem;
}
.material-card small {
  display: block;
  margin-top: 0.3rem;
  color: #a3603f;
  font-size: 0.68rem;
}
.labor-block {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #d8e3d3;
  border-radius: 11px;
  background: #f8fbf5;
}
.labor-heading {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
}
.labor-heading span,
.labor-empty {
  color: #758977;
  font-size: 0.69rem;
}
.labor-row {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  padding-block: 0.4rem;
  color: #58715e;
  font-size: 0.76rem;
}
.labor-row + .labor-row {
  border-top: 1px solid #e1e9de;
}
.labor-row strong {
  color: #2e5941;
  text-align: right;
}
.tiling-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 10px;
  background: #29543f;
  color: #f4fbf2;
}
.tiling-total span {
  font-size: 0.77rem;
  font-weight: 800;
}
.tiling-total strong {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  text-align: right;
}
.tiling-warnings {
  display: grid;
  gap: 0.25rem;
  margin-top: 0.8rem;
  padding: 0.65rem 0.75rem;
  border-radius: 9px;
  background: #fff0e3;
  color: #8b5134;
  font-size: 0.71rem;
  line-height: 1.5;
}
.tiling-note {
  margin-top: 0.8rem;
  color: #708373;
  font-size: 0.7rem;
  line-height: 1.55;
}
@media (max-width: 650px) {
  .material-grid {
    grid-template-columns: 1fr;
  }
  .material-card {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.25rem 0.7rem;
  }
  .material-heading,
  .material-card .quantity {
    grid-column: 1 / -1;
  }
  .material-card > strong {
    margin-top: 0.25rem;
  }
  .material-card small {
    text-align: right;
  }
  .tiling-total {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.3rem;
  }
}
</style>

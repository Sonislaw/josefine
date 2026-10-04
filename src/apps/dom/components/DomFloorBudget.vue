<script setup lang="ts">
import { ArrowUpRight, PanelsTopLeft } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { FloorBudgetSummary } from '../lib/floor-budget'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{ summary: FloorBudgetSummary; roomId: string }>()
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatMeasure = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function laborLine(id: 'flooring' | 'skirting') {
  return props.summary.laborLines.find((line) => line.id === id)
}
</script>

<template>
  <section class="floor-budget" :aria-labelledby="`floor-budget-${roomId}`">
    <header class="floor-header">
      <span class="floor-icon"><PanelsTopLeft :size="23" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">PANELE / PODKŁAD / LISTWY / MONTAŻ</p>
        <h3 :id="`floor-budget-${roomId}`">Podłoga w jednym miejscu</h3>
        <p>To rozbicie kosztów już ujętych w budżecie pokoju — niczego nie doliczamy ponownie.</p>
      </div>
    </header>

    <div class="material-grid" aria-label="Materiały podłogowe">
      <article v-for="line in summary.materials" :key="line.id" class="material-card">
        <div class="material-heading">
          <h4>{{ line.label }}</h4>
          <RouterLink
            :to="{ path: domPath(line.path), query: { roomId } }"
            :aria-label="`${line.itemCount ? 'Otwórz kalkulator' : 'Dodaj'}: ${line.label}`"
          >
            {{ line.itemCount ? 'Otwórz' : 'Dodaj' }}
            <ArrowUpRight :size="14" aria-hidden="true" />
          </RouterLink>
        </div>
        <p v-if="line.itemCount" class="quantity">{{ line.quantityLabel }}</p>
        <p v-else class="quantity muted">
          Nie dodano
          {{ line.id === 'panels' ? 'paneli' : line.id === 'underlay' ? 'podkładu' : 'listew' }}.
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

    <div v-if="summary.hasPanels || summary.hasSkirting" class="labor-block">
      <div class="labor-heading">
        <h4>Robocizna</h4>
        <span>Własne stawki ustawisz w budżecie pokoju poniżej</span>
      </div>
      <div v-if="summary.hasPanels" class="labor-row">
        <span
          >Układanie paneli ·
          {{
            summary.plannedPanelArea > 0
              ? `${formatMeasure(summary.plannedPanelArea)} m²`
              : 'brak metrażu'
          }}</span
        >
        <strong>{{
          laborLine('flooring')
            ? formatMoney(laborLine('flooring')!.cost)
            : summary.plannedPanelArea === 0
              ? 'Brak metrażu'
              : 'Brak stawki'
        }}</strong>
      </div>
      <div v-if="summary.hasSkirting" class="labor-row">
        <span
          >Montaż listew ·
          {{
            summary.roomPerimeter === null
              ? 'brak wymiarów'
              : `${formatMeasure(summary.roomPerimeter)} m obwodu`
          }}</span
        >
        <strong>{{
          laborLine('skirting')
            ? formatMoney(laborLine('skirting')!.cost)
            : summary.roomPerimeter === null
              ? 'Brak wymiarów'
              : 'Brak stawki'
        }}</strong>
      </div>
    </div>

    <div class="floor-total">
      <span>Suma ujętych kosztów podłogi</span>
      <strong>{{
        summary.hasKnownCost ? formatMoney(summary.knownTotal) : 'Brak cen i stawek'
      }}</strong>
    </div>
    <div
      v-if="
        summary.missingPriceCount ||
        summary.missingPanelAreaCount ||
        summary.missingDimensions ||
        summary.missingFloorRate ||
        summary.missingSkirtingRate ||
        summary.floorFullyTiled ||
        summary.exceedsUntiledArea ||
        (summary.hasPanels && summary.unknownTileAreaCount)
      "
      class="floor-warnings"
    >
      <p v-if="summary.missingPriceCount">
        {{ summary.missingPriceCount }}
        {{ summary.missingPriceCount === 1 ? 'zakup nie ma ceny' : 'zakupów nie ma ceny' }} — suma
        jest niepełna.
      </p>
      <p v-if="summary.missingPanelAreaCount">
        {{ summary.missingPanelAreaCount }}
        {{
          summary.missingPanelAreaCount === 1 ? 'pozycja paneli nie ma' : 'pozycji paneli nie ma'
        }}
        metrażu układania. Uzupełnij go w edycji zakupu; bez niego montaż tej części podłogi nie
        jest liczony.
      </p>
      <p v-if="summary.missingDimensions">
        Brakuje wymiarów pokoju do wyliczenia montażu listew. Dodaj je wyżej.
      </p>
      <p v-if="summary.missingFloorRate || summary.missingSkirtingRate">
        Brakuje stawki za
        {{
          summary.missingFloorRate && summary.missingSkirtingRate
            ? 'układanie paneli i montaż listew'
            : summary.missingFloorRate
              ? 'układanie paneli'
              : 'montaż listew'
        }}. Dodaj ją w budżecie pokoju poniżej.
      </p>
      <p v-if="summary.floorFullyTiled">
        Zapisane płytki zajmują całą podłogę tego pokoju. Sprawdź zakres prac, jeśli planujesz tu
        również panele.
      </p>
      <p v-if="summary.exceedsUntiledArea">
        Zapisany metraż paneli przekracza wolną powierzchnię podłogi po odjęciu zapisanych płytek.
        Sprawdź, czy ta sama strefa nie została zapisana dwukrotnie.
      </p>
      <p v-if="summary.hasPanels && summary.unknownTileAreaCount">
        {{ summary.unknownTileAreaCount }}
        {{ summary.unknownTileAreaCount === 1 ? 'pozycja płytek nie ma' : 'pozycji płytek nie ma' }}
        metrażu. Jeśli płytki są na podłodze, sprawdź, czy zapisany metraż paneli nie obejmuje
        również tej strefy.
      </p>
    </div>
    <p class="floor-note">
      Podkład i listwy dodaj tylko wtedy, gdy są potrzebne. Montaż paneli liczymy od metrażu
      zapisanego przy ich zakupach, bez zapasu na docinki. Nie wyliczamy go z liczby paczek ani z
      całej pozostałej powierzchni pokoju. Montaż listew liczymy od pełnego obwodu, bez odejmowania
      drzwi. Uwzględniamy wszystkie zapisane zakupy pokoju, niezależnie od filtra „Kupione”.
    </p>
  </section>
</template>

<style scoped>
.floor-budget {
  margin-top: 1.25rem;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  border: 1px solid #d8e2d4;
  border-radius: 17px;
  background: linear-gradient(135deg, #f7f3e9, #edf5ed);
}
.floor-header {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}
.floor-icon {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  height: 44px;
  border-radius: 12px;
  background: #e4eadb;
  color: #3a6650;
}
.eyebrow {
  color: #a16649;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.floor-header h3 {
  margin-top: 0.22rem;
  color: #2a533d;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}
.floor-header p:last-child {
  margin-top: 0.3rem;
  color: #687c6b;
  font-size: 0.74rem;
  line-height: 1.55;
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
.labor-heading span {
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
.floor-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 10px;
  background: #395a49;
  color: #f4fbf2;
}
.floor-total span {
  font-size: 0.77rem;
  font-weight: 800;
}
.floor-total strong {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  text-align: right;
}
.floor-warnings {
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
.floor-note {
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
  .floor-total {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.3rem;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { capacity, season, year, SEASONS, type Kingdom, type Resources } from './engine'
import { upkeep } from './military'
import { RANKS } from './progression'
import ResourceAmount from './ResourceAmount.vue'
import ResourceList from './ResourceList.vue'
const props = defineProps<{ state: Kingdom; production: Resources }>()
const seasonIndex = computed(() => season(props.state.turn))
const armyFood = computed(() => upkeep(props.state.affairs.army))
const foodBalance = computed(() => props.production.food - props.state.population - armyFood.value)
</script>
<template>
  <div class="settlement-status" role="group" aria-label="Stan osady">
    <div class="status-main">
      <span class="season-badge" :class="{ winter: seasonIndex === 3 }">
        <span aria-hidden="true">{{ ['❀', '☀', '❧', '❄'][seasonIndex] }}</span>
        {{ SEASONS[seasonIndex] }}
      </span>
      <span class="status-calendar"
        >Rok {{ year(state.turn) }}
        <span class="muted"
          >/ Tura <b data-testid="kingdom-turn">{{ state.turn + 1 }}</b></span
        ></span
      >
      <span class="rank-badge" data-testid="kingdom-rank"
        ><span aria-hidden="true">♜</span> {{ RANKS[state.rank]!.name }}</span
      >
      <span class="population"
        ><span aria-hidden="true">♙</span> {{ state.population }} / {{ capacity(state) }}
        <span class="muted">mieszkańców</span></span
      >
    </div>
    <div class="economy-line">
      <span>Produkcja / turę: <ResourceList :resources="production" empty="Brak produkcji" /></span>
      <span
        >Wyżywienie: <ResourceAmount resource="food" :amount="state.population" /> + wojsko
        <ResourceAmount resource="food" :amount="armyFood" /> · Bilans żywności:
        <b :class="{ deficit: foodBalance < 0 }"
          >{{ foodBalance >= 0 ? '+' : '' }}{{ foodBalance }}</b
        ></span
      >
    </div>
  </div>
</template>
<style scoped>
.settlement-status {
  border-top: 1px solid #3d5645;
  padding: 7px 3px 1px;
  color: #f4e9c6;
  font-variant-numeric: tabular-nums;
}
.status-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 12px;
  font-size: 12px;
  line-height: 1.4;
}
.season-badge,
.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #69814d;
  border-radius: 20px;
  padding: 3px 8px;
  background: #425937;
  color: #e1e9ac;
  white-space: nowrap;
}
.season-badge.winter {
  background: #36585c;
  border-color: #7daba4;
  color: #d3e7e0;
}
.rank-badge {
  border-color: #8c7d4b;
  background: #3b4c32;
  color: #f5dda3;
}
.status-calendar,
.population {
  white-space: nowrap;
}
.population {
  margin-left: auto;
}
.muted,
.economy-line {
  color: #b4c5a9;
}
.economy-line {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 12px;
  font-size: 11px;
  line-height: 1.65;
  margin-top: 5px;
}
.deficit {
  color: #ffbc94;
}
@media (max-width: 600px) {
  .status-main {
    font-size: 10px;
    gap: 4px 8px;
  }
  .season-badge,
  .rank-badge {
    padding: 2px 6px;
  }
  .economy-line {
    font-size: 10px;
    gap: 1px 6px;
    margin-top: 4px;
  }
}
</style>

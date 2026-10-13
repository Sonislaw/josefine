<script setup lang="ts">
import { computed } from 'vue'
import type { Kingdom } from './engine'
import { RANKS, rankProgress } from './progression'
import { resourceList } from './format'
import HallArt from './HallArt.vue'
const props = defineProps<{ state: Kingdom }>()
const next = computed(() => RANKS[props.state.rank + 1])
const progress = computed(() => rankProgress(props.state))
</script>
<template>
  <details class="progression-panel">
    <summary>
      Rozwój osady
      <span>{{ RANKS[state.rank]!.name }} → {{ next?.name ?? 'Ścieżka ukończona' }}</span>
    </summary>
    <div class="rank-target">
      <svg viewBox="0 0 64 64" aria-hidden="true"><HallArt :rank="state.rank" /></svg>
      <div v-if="next">
        <h2>Następny krok: {{ next.name }}</h2>
        <p>
          Jednorazowy prezent: <strong>{{ resourceList(next.gift) }}</strong
          >.
        </p>
        <p>Spełnij wszystkie wymagania jednocześnie. Awans nastąpi po zatwierdzeniu tury.</p>
      </div>
      <div v-else>
        <h2>Twoje Małe królestwo!</h2>
        <p>
          Ścieżka rozwoju ukończona. Odkrywaj dalsze ziemie i buduj bez limitu lat — to nie koniec
          rozgrywki.
        </p>
      </div>
    </div>
    <ul v-if="next" class="rank-requirements">
      <li v-for="p in progress" :key="p.id" :data-rank-requirement="p.id">
        <div>
          <strong>{{ p.label }}: {{ p.value }} / {{ p.required }}</strong
          ><span>{{ p.complete ? '✓ Spełnione' : 'Do spełnienia' }}</span>
        </div>
        <progress :value="Math.min(p.value, p.required)" :max="p.required" :aria-label="p.label" />
        <p v-if="!p.complete">{{ p.hint }}</p>
      </li>
    </ul>
    <p class="rank-note">
      Ranga pozostaje na zawsze. Prezent trafia do zapasów po wyżywieniu i zmianie populacji; nie
      zwiększa stałej produkcji ratusza.
    </p>
    <ol v-if="state.promotions.length" class="rank-history" aria-label="Historia awansów">
      <li v-for="p in state.promotions" :key="p.rank">
        ✓ {{ RANKS[p.rank]!.name }} <span>· po turze {{ p.turn }}</span>
      </li>
    </ol>
  </details>
</template>
<style scoped>
.progression-panel {
  margin: 0 0 18px;
  border: 1px solid #657449;
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(110deg, #2e4634, #203b2e);
  color: #f5ebcf;
}
summary {
  cursor: pointer;
  font-size: 14px;
  min-height: 28px;
  padding: 6px 0;
}
summary span {
  margin-left: 12px;
  color: #c6d6aa;
  font-size: 12px;
}
summary:focus-visible {
  outline: 3px solid #e9d184;
  outline-offset: 4px;
  border-radius: 4px;
}
.rank-target {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}
.rank-target svg {
  width: 70px;
  flex-shrink: 0;
}
.rank-target div {
  min-width: 0;
}
h2 {
  font:
    400 23px Georgia,
    serif;
  margin: 0 0 8px;
}
p {
  font-size: 12px;
  line-height: 1.8;
  color: #c4d2b8;
  margin: 5px 0;
}
.rank-requirements {
  list-style: none;
  padding: 0;
  margin: 18px 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.rank-requirements li {
  background: #172f26;
  border: 1px solid #536448;
  padding: 12px;
  border-radius: 12px;
}
.rank-requirements li > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 7px;
  font-size: 12px;
}
.rank-requirements span {
  color: #c8dca8;
  font-size: 11px;
}
progress {
  width: 100%;
  height: 7px;
  display: block;
  margin: 10px 0;
  border: 0;
  border-radius: 8px;
  background: #42583e;
  accent-color: #b6cc87;
}
progress::-webkit-progress-bar {
  background: #42583e;
  border-radius: 8px;
}
progress::-webkit-progress-value {
  background: #b6cc87;
  border-radius: 8px;
}
progress::-moz-progress-bar {
  background: #b6cc87;
  border-radius: 8px;
}
.rank-history {
  list-style: none;
  padding: 12px 0 0;
  border-top: 1px solid #61714d;
  font-size: 12px;
  line-height: 2;
}
.rank-history span {
  color: #bccdaa;
}
@media (max-width: 600px) {
  .rank-requirements {
    grid-template-columns: minmax(0, 1fr);
  }
  summary span {
    display: block;
    margin: 6px 0 0 16px;
  }
  .rank-target {
    align-items: flex-start;
  }
  .rank-target svg {
    width: 48px;
  }
  h2 {
    font-size: 20px;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DISCOVERIES, discoveryStatus, type Discovery } from './discoveries'
import DiscoveryArt from './DiscoveryArt.vue'
const props = defineProps<{ discoveries: Record<string, Discovery> }>()
defineEmits<{ locate: [Discovery] }>()
const filter = ref<'available' | 'all'>('available'),
  limit = ref(10)
const all = computed(() =>
  Object.values(props.discoveries).sort(
    (a, b) => b.discoveredTurn - a.discoveredTurn || a.y - b.y || a.x - b.x,
  ),
)
const used = computed(() => all.value.filter((d) => d.status === 'used').length)
const filtered = computed(() =>
  all.value.filter((d) => filter.value === 'all' || d.status === 'available'),
)
watch(filter, () => {
  limit.value = 10
})
watch(
  () => all.value.length,
  (n, old) => {
    if (n < old) limit.value = 10
  },
)
</script>
<template>
  <details class="discovery-journal">
    <summary>
      ✧ Dziennik odkryć <span>Znalezione: {{ all.length }} · Wykorzystane: {{ used }}</span>
    </summary>
    <div class="journal-filters" aria-label="Filtr odkryć">
      <button type="button" :aria-pressed="filter === 'available'" @click="filter = 'available'">
        Do zbadania
      </button>
      <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">
        Wszystkie
      </button>
    </div>
    <p v-if="!all.length">
      Każdy nowo odkryty sektor kryje jedno wyjątkowe miejsce. Wybierz kierunek w sekcji „Nowe
      ziemie”.
    </p>
    <p v-else-if="!filtered.length">
      Wszystkie odkryte miejsca zostały już wykorzystane. Kolejne czekają za granicą osady.
    </p>
    <ul v-else>
      <li
        v-for="d in filtered.slice(0, limit)"
        :key="`${d.x},${d.y}`"
        :data-discovery-entry="`${d.x},${d.y}`"
      >
        <svg viewBox="0 0 64 64" aria-hidden="true"><DiscoveryArt :discovery="d" /></svg>
        <div>
          <strong>{{ DISCOVERIES[d.kind].name }}</strong
          ><small
            >{{ discoveryStatus(d) }} · Odkrycie: tura {{ d.discoveredTurn
            }}<template v-if="d.usedTurn"> · Wykorzystanie: tura {{ d.usedTurn }}</template></small
          >
        </div>
        <button
          type="button"
          :aria-label="`Pokaż na mapie: ${DISCOVERIES[d.kind].name}, ${d.x}, ${d.y}`"
          @click="$emit('locate', d)"
        >
          Pokaż na mapie ↗
        </button>
      </li>
    </ul>
    <button v-if="filtered.length > limit" type="button" class="journal-more" @click="limit += 10">
      Pokaż więcej ({{ filtered.length - limit }})
    </button>
  </details>
</template>
<style scoped>
.discovery-journal {
  margin-top: 16px;
  border: 1px solid #b9ce9c35;
  border-radius: 18px;
  background: #b9ce9c08;
  padding: 18px;
  color: #f5ebcf;
}
summary {
  cursor: pointer;
  font-weight: 750;
  line-height: 1.6;
}
summary span {
  display: block;
  color: #b7c6b6;
  font-size: 0.8rem;
  font-weight: 400;
  margin-top: 4px;
}
.journal-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 16px 0;
}
button {
  border: 1px solid #b9ce9c45;
  border-radius: 10px;
  background: #203930;
  color: #f5ebcf;
  padding: 10px 12px;
  min-height: 44px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}
button[aria-pressed='true'] {
  background: #d8e7b3;
  color: #203c2d;
}
button:focus-visible,
summary:focus-visible {
  outline: 3px solid #f0c985;
  outline-offset: 4px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid #b9ce9c25;
}
svg {
  width: 52px;
}
small {
  display: block;
  font-size: 0.75rem;
  color: #b7c6b6;
  line-height: 1.6;
  margin-top: 4px;
}
strong {
  font-size: 0.9rem;
}
p {
  color: #b7c6b6;
  font-size: 0.85rem;
  line-height: 1.7;
}
.journal-more {
  width: 100%;
  margin-top: 12px;
}
@media (max-width: 520px) {
  li {
    grid-template-columns: 44px minmax(0, 1fr);
  }
  svg {
    width: 44px;
  }
  li button {
    grid-column: 2;
    justify-self: start;
  }
}
</style>

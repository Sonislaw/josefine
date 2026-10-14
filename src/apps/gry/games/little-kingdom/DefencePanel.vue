<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Kingdom, Action, Point } from './engine'
import { UNITS, WAR, armySize, upkeep, type Unit } from './military'
import { SETTLEMENTS, RELATIONS } from './neighbours'
import { resourceList } from './format'
import MilitaryArt from './MilitaryArt.vue'
const props = defineProps<{ state: Kingdom; disabled: boolean }>()
const emit = defineEmits<{ choose: [Action]; locate: [Point] }>()
const units: Unit[] = ['spearman', 'archer']
const spearmen = ref(0),
  archers = ref(0)
const hasBarracks = computed(() =>
  Object.values(props.state.buildings).some((b) => b.kind === 'barracks'),
)
</script>
<template>
  <div class="frontier-panels">
    <details class="defence-panel">
      <summary>
        Obrona osady <span>{{ armySize(state.affairs.army) }} / {{ WAR.capacity }} jednostek</span>
      </summary>
      <p v-if="state.rank < 1">Koszary i wieża odblokują się po osiągnięciu rangi Wioska.</p>
      <template v-else>
        <p>
          Utrzymanie: {{ upkeep(state.affairs.army) }} żywności / turę, po wyżywieniu mieszkańców.
          Najemnicy nie zajmują domów.
        </p>
        <p v-if="!hasBarracks">
          Postaw koszary z zakładki „Obrona” w ofercie budynków, aby rekrutować.
        </p>
        <div class="unit-grid">
          <article v-for="unit in units" :key="unit">
            <svg viewBox="0 0 64 64"><MilitaryArt :kind="unit" /></svg>
            <strong>{{ UNITS[unit].name }} · {{ state.affairs.army[unit] }}</strong>
            <p>Siła {{ UNITS[unit].strength }} · {{ resourceList(UNITS[unit].cost) }}</p>
            <button
              type="button"
              :disabled="disabled || !hasBarracks || armySize(state.affairs.army) >= WAR.capacity"
              @click="emit('choose', { type: 'recruit', unit })"
            >
              Rekrutuj: {{ UNITS[unit].name }}
            </button>
            <button
              type="button"
              :disabled="disabled || !state.affairs.army[unit]"
              @click="emit('choose', { type: 'dismiss', unit })"
            >
              Rozwiąż: {{ UNITS[unit].name }}
            </button>
          </article>
        </div>
        <small
          >Każda decyzja zajmuje turę i wymaga zatwierdzenia. Brak żywności dla armii powoduje
          odejście jednej jednostki; najpierw włócznika.</small
        >
      </template>
    </details>
    <details class="defence-panel">
      <summary>
        Sąsiednie osady <span>{{ state.affairs.settlements.length }} / 3 kontakty</span>
      </summary>
      <p v-if="!state.affairs.settlements.length">
        Po awansie do Wioski odkrywaj nowe sektory, aby poznać sąsiadów.
      </p>
      <article v-for="s in state.affairs.settlements" :key="s.id" class="neighbour">
        <div class="neighbour-title">
          <svg viewBox="0 0 64 64">
            <MilitaryArt kind="settlement" :hostile="s.relation === 'hostile'" />
          </svg>
          <div>
            <h3>{{ SETTLEMENTS[s.id]!.name }}</h3>
            <strong>{{ RELATIONS[s.relation] }}</strong>
          </div>
        </div>
        <p>{{ SETTLEMENTS[s.id]!.description }}</p>
        <button type="button" @click="emit('locate', s)">Pokaż na mapie ↗</button>
        <template v-if="s.id < 2 && !s.giftTaken">
          <p>
            Koszt: {{ resourceList(SETTLEMENTS[s.id]!.cost) }}. Otrzymasz:
            {{ resourceList(SETTLEMENTS[s.id]!.reward) }}.
          </p>
          <button
            type="button"
            :disabled="disabled"
            @click="emit('choose', { type: 'diplomacy', id: s.id })"
          >
            {{ s.id === 0 ? 'Odbierz dar powitalny' : 'Wyślij dar' }}
          </button>
        </template>
        <p v-else-if="s.id < 2">Wymiana zakończona. Sąsiedzi pozostają przyjaźni.</p>
        <template v-if="s.relation === 'hostile'">
          <p v-if="state.affairs.raid">
            Najazd za {{ state.affairs.raid.dueTurn - state.turn }} tur. Wróg: 3 włóczników i 2
            łuczników.
          </p>
          <p v-else>
            Ochrona: {{ Math.max(0, state.affairs.protectedUntil - state.turn) }} tur do możliwej
            zapowiedzi najazdu.
          </p>
          <button type="button" :disabled="disabled" @click="emit('choose', { type: 'truce' })">
            Opłać rozejm · 12 monet
          </button>
          <details class="expedition">
            <summary>Wyprawa przeciw garnizonowi</summary>
            <p>
              Wróg: 4 włóczników i 2 łuczników (siła 22). Wybierz oddział; wróci w tej samej turze.
              Zwycięstwo kończy najazdy i daje 12 kamienia oraz 15 monet.
            </p>
            <label
              >Włócznicy
              <input
                v-model.number="spearmen"
                type="number"
                min="0"
                :max="state.affairs.army.spearman"
                step="1"
            /></label>
            <label
              >Łucznicy
              <input
                v-model.number="archers"
                type="number"
                min="0"
                :max="state.affairs.army.archer"
                step="1"
            /></label>
            <p v-if="state.affairs.raid">
              Podczas zapowiedzianego najazdu wyprawa jest niedostępna.
            </p>
            <button
              type="button"
              :disabled="disabled || !!state.affairs.raid"
              @click="
                emit('choose', {
                  type: 'expedition',
                  army: { spearman: spearmen, archer: archers },
                })
              "
            >
              Przygotuj wyprawę
            </button>
          </details>
        </template>
        <p v-if="s.relation === 'subdued'">
          Pokój został zawarty. Ta osada nie wyśle kolejnych najazdów.
        </p>
      </article>
    </details>
  </div>
</template>
<style scoped>
.frontier-panels {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}
.defence-panel {
  border: 1px solid #a4b294;
  border-radius: 18px;
  padding: 16px;
  background: #f3f0e3;
  color: #294a39;
  min-width: 0;
}
.defence-panel summary {
  cursor: pointer;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-weight: 700;
}
.defence-panel summary span {
  font-size: 0.8rem;
  font-weight: 400;
}
.defence-panel p {
  margin: 10px 0;
  font-size: 0.9rem;
  line-height: 1.6;
}
.unit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0;
}
.unit-grid article,
.neighbour {
  padding: 14px;
  border: 1px solid #bbc5a9;
  background: #fffcf3;
  border-radius: 14px;
  min-width: 0;
}
.unit-grid svg,
.neighbour svg {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}
.unit-grid strong {
  display: block;
}
.neighbour {
  margin-top: 12px;
}
.neighbour-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.neighbour h3 {
  margin: 0;
  font-size: 1.1rem;
}
.neighbour-title strong {
  font-size: 0.8rem;
}
.defence-panel button {
  min-height: 44px;
  border: 1px solid #94a487;
  border-radius: 10px;
  padding: 8px 12px;
  margin: 4px 4px 4px 0;
  background: #e4ead6;
  color: #294a39;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  max-width: 100%;
  white-space: normal;
}
.defence-panel button:disabled {
  opacity: 0.5;
  cursor: default;
}
.defence-panel :focus-visible {
  outline: 3px solid #916528;
  outline-offset: 3px;
}
.expedition {
  margin-top: 12px;
  border-top: 1px solid #bdc4ac;
}
.expedition label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
}
.expedition input {
  width: 90px;
  min-height: 44px;
  background: white;
  border: 1px solid #7c9077;
  border-radius: 8px;
  padding: 8px;
  color: #294a39;
}
@media (max-width: 480px) {
  .unit-grid {
    grid-template-columns: 1fr;
  }
}
</style>

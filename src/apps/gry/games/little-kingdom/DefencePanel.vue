<script setup lang="ts">
import { computed, ref } from 'vue'
import { type Kingdom, type Action, type Point } from './engine'
import { UNITS, UNIT_IDS, armySize, upkeep, upkeepGold, armyCapacity } from './military'
import { settlementDefinition, RELATIONS } from './neighbours'
import EnemyCastlePanel from './EnemyCastlePanel.vue'
import { resourceList } from './format'
import MilitaryArt from './MilitaryArt.vue'
const props = defineProps<{ state: Kingdom; disabled: boolean }>()
const emit = defineEmits<{ choose: [Action]; locate: [Point] }>()
const visibleContacts = ref(5)
const shownSettlements = computed(() =>
  props.state.affairs.settlements.slice(0, visibleContacts.value),
)
const barracks = computed(() =>
  Object.values(props.state.buildings).find((b) => b.kind === 'barracks'),
)
const limit = computed(() => armyCapacity(barracks.value?.level ?? 0))
</script>
<template>
  <div class="frontier-panels">
    <details class="defence-panel">
      <summary>
        Obrona osady <span>{{ armySize(state.affairs.army) }} / {{ limit }} jednostek</span>
      </summary>
      <p v-if="state.rank < 1">Koszary i wieża odblokują się po osiągnięciu rangi Wioska.</p>
      <template v-else>
        <p>
          Utrzymanie: {{ upkeep(state.affairs.army) }} żywności i
          {{ upkeepGold(state.affairs.army) }} monet / turę, po wyżywieniu mieszkańców. Najemnicy
          nie zajmują domów.
        </p>
        <p v-if="!barracks">Postaw koszary z zakładki „Obrona”, aby rekrutować.</p>
        <p v-else>
          Koszary: poziom {{ barracks.level }}. Poziom 2 wymaga Miasteczka, poziom 3 Małego
          królestwa. Ulepsz budynek na mapie; limit wzrośnie do 9 i 12.
        </p>
        <div class="unit-grid">
          <article v-for="unit in UNIT_IDS" :key="unit">
            <svg viewBox="0 0 64 64"><MilitaryArt :kind="unit" /></svg>
            <strong>{{ UNITS[unit].name }} · {{ state.affairs.army[unit] }}</strong>
            <p>Siła {{ UNITS[unit].strength }} · {{ resourceList(UNITS[unit].cost) }}</p>
            <p v-if="unit === 'shieldbearer'">
              Każdych trzech tarczowników zmniejsza straty oddziału o jedną jednostkę.
            </p>
            <button
              type="button"
              :disabled="disabled || !barracks || armySize(state.affairs.army) >= limit"
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
          >Każda decyzja wymaga zatwierdzenia tury. Brak pełnej racji lub żołdu powoduje odejście
          jednej jednostki: najpierw włócznik, potem łucznik, na końcu tarczownik.</small
        >
      </template>
    </details>
    <details class="defence-panel">
      <summary>
        Sąsiednie osady <span>{{ state.affairs.settlements.length }} kontaktów</span>
      </summary>
      <p v-if="!state.affairs.settlements.length">
        Po awansie do Wioski odkrywaj nowe sektory, aby poznać sąsiadów.
      </p>
      <article v-for="s in shownSettlements" :key="s.id" class="neighbour">
        <div class="neighbour-title">
          <svg viewBox="0 0 64 64">
            <MilitaryArt
              :kind="s.relation === 'ruins' ? 'ruins' : 'settlement'"
              :hostile="s.relation === 'hostile'"
            />
          </svg>
          <div>
            <h3>{{ settlementDefinition(s.id).name }}</h3>
            <strong>{{ RELATIONS[s.relation] }}</strong>
          </div>
        </div>
        <p>
          {{
            s.id >= 2
              ? 'Każdy zamek ma własną armię, skarbiec i wytrzymałość. Wyprawy grabią zapasy i mogą zamienić go w zgliszcza.'
              : settlementDefinition(s.id).description
          }}
        </p>
        <button type="button" @click="emit('locate', s)">Pokaż na mapie ↗</button>
        <template v-if="s.id < 2 && !s.giftTaken">
          <p>
            Koszt: {{ resourceList(settlementDefinition(s.id).cost) }}. Otrzymasz:
            {{ resourceList(settlementDefinition(s.id).reward) }}.
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
        <EnemyCastlePanel
          v-if="s.id >= 2"
          :state="state"
          :settlement="s"
          :disabled="disabled"
          @choose="emit('choose', $event)"
        />
      </article>
      <button
        v-if="visibleContacts < state.affairs.settlements.length"
        type="button"
        @click="visibleContacts += 5"
      >
        Pokaż więcej osad
      </button>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
@media (max-width: 700px) {
  .unit-grid {
    grid-template-columns: 1fr;
  }
}
</style>

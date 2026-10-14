<script setup lang="ts">
import { computed, ref } from 'vue'
import { actionError, type Kingdom, type Action, type Point } from './engine'
import {
  UNITS,
  UNIT_IDS,
  WAR,
  TACTICS,
  armySize,
  upkeep,
  armyCapacity,
  type Army,
} from './military'
import { enemyTactic, enemyTarget } from './campaign'
import { SETTLEMENTS, RELATIONS } from './neighbours'
import { resourceList } from './format'
import MilitaryArt from './MilitaryArt.vue'
const props = defineProps<{ state: Kingdom; disabled: boolean }>()
const emit = defineEmits<{ choose: [Action]; locate: [Point] }>()
const troops = ref<Army>({ spearman: 0, archer: 0, shieldbearer: 0 })
const barracks = computed(() =>
  Object.values(props.state.buildings).find((b) => b.kind === 'barracks'),
)
const enemy = computed(() => props.state.affairs.enemy)
const limit = computed(() => armyCapacity(barracks.value?.level ?? 0))
const missions = [
  {
    type: 'intercept' as const,
    title: 'Przechwyć najazd',
    description:
      'Jedna próba na najazd, do przedostatniej tury ostrzeżenia. Walka poza osadą, bez wieży. Zwycięstwo odwołuje najazd; porażka zachowuje termin.',
  },
  {
    type: 'expedition' as const,
    title: 'Wyprawa na garnizon',
    description:
      'Osłab garnizon i zdobywaj przewagę. Raz na 6 tur, bez najazdu w drodze. Brak łupów i dodatkowego okresu ochronnego.',
  },
  {
    type: 'forcePeace' as const,
    title: 'Wymuś pokój',
    description:
      'Wymaga 2 punktów przewagi i braku najazdu. Zwycięstwo daje 36 tur pokoju oraz raz na kampanię 12 kamienia i 15 monet.',
  },
]
const missionError = (type: 'intercept' | 'expedition' | 'forcePeace') =>
  actionError(props.state, { type, army: troops.value })
const armyText = (a: Army) => UNIT_IDS.map((u) => UNITS[u].name + ': ' + a[u]).join(' · ')
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
          Utrzymanie: {{ upkeep(state.affairs.army) }} żywności / turę, po wyżywieniu mieszkańców.
          Najemnicy nie zajmują domów.
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
              Każdych dwóch tarczowników zmniejsza straty oddziału o jedną jednostkę.
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
          >Każda decyzja wymaga zatwierdzenia tury. Brak pełnej racji powoduje odejście jednej
          jednostki: najpierw włócznik, potem łucznik, na końcu tarczownik.</small
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
        <p>
          {{
            s.id === 2
              ? 'Armia wroga ponosi straty, odbudowuje się i zmienia taktykę. Walcz o przewagę lub opłać rozejm.'
              : SETTLEMENTS[s.id]!.description
          }}
        </p>
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
        <template v-if="s.id === 2 && enemy">
          <div class="campaign-stats">
            <strong>Kampania {{ enemy.campaign }} · Przewaga {{ enemy.advantage }} / 2</strong>
            <p data-testid="enemy-garrison">Garnizon: {{ armyText(enemy.garrison) }}</p>
            <p>
              Taktyka garnizonu: {{ TACTICS[enemyTactic(enemy)].name }}. Zmiana co 4 tury konfliktu.
            </p>
            <p>
              Odbudowa za {{ WAR.recovery - enemy.recovery }} tur: najwyżej jedna brakująca
              jednostka. Cel łącznie: {{ armyText(enemyTarget(state.rank)) }}.
            </p>
          </div>
          <p v-if="enemy.peaceUntil !== null" data-testid="campaign-peace">
            Pokój: jeszcze {{ enemy.peaceUntil - state.turn }} tur. Wróg uzupełnia garnizon, ale nie
            wysyła najazdów. Po pokoju przewaga się zeruje i może nadejść nowe ostrzeżenie.
          </p>
          <template v-else>
            <p v-if="state.affairs.raid" data-testid="enemy-raid">
              Najazd za {{ state.affairs.raid.dueTurn - state.turn }} tur:
              {{ armyText(state.affairs.raid.army) }}. Taktyka:
              {{
                state.affairs.raid.tactic === 'none'
                  ? 'bez premii'
                  : TACTICS[state.affairs.raid.tactic].name
              }}.
            </p>
            <p v-else>
              Ochrona: {{ Math.max(0, state.affairs.protectedUntil - state.turn) }} tur. Najazd
              wymaga co najmniej 3 żołnierzy.
            </p>
            <p>
              Wygrana obrona lub wyprawa: +1 przewagi; porażka: −1. Dwa punkty pozwalają zakończyć
              kampanię.
            </p>
            <button type="button" :disabled="disabled" @click="emit('choose', { type: 'truce' })">
              Opłać rozejm · 12 monet
            </button>
            <button
              type="button"
              :disabled="disabled || enemy.advantage < 2"
              @click="emit('choose', { type: 'negotiate' })"
            >
              Wynegocjuj pokój · 20 monet + 12 żywności
            </button>
            <details class="expedition">
              <summary>Wyprawy wojenne</summary>
              <p>
                Wybierz oddział. Bitwa i powrót zajmą jedną turę. Reszta armii zostaje w osadzie.
              </p>
              <label v-for="unit in UNIT_IDS" :key="unit"
                >{{ UNITS[unit].name
                }}<input
                  v-model.number="troops[unit]"
                  type="number"
                  min="0"
                  :max="state.affairs.army[unit]"
                  step="1"
              /></label>
              <p v-if="enemy.expeditionAvailableTurn > state.turn + 1">
                Kolejna wyprawa na garnizon: za
                {{ enemy.expeditionAvailableTurn - state.turn - 1 }} tur.
              </p>
              <article v-for="mission in missions" :key="mission.type" class="mission">
                <strong>{{ mission.title }}</strong>
                <p>{{ mission.description }}</p>
                <small v-if="missionError(mission.type)">{{ missionError(mission.type) }}</small>
                <button
                  type="button"
                  :disabled="disabled || !!missionError(mission.type)"
                  @click="emit('choose', { type: mission.type, army: { ...troops } })"
                >
                  {{ mission.title }}
                </button>
              </article>
            </details>
          </template>
        </template>
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
@media (max-width: 700px) {
  .unit-grid {
    grid-template-columns: 1fr;
  }
}
.campaign-stats {
  padding: 12px;
  border: 1px solid #b4bea2;
  border-radius: 10px;
  background: #edf0df;
  margin-top: 12px;
  overflow-wrap: anywhere;
}
.mission {
  margin: 12px 0;
  padding: 12px;
  border: 1px solid #bdc4ac;
  border-radius: 10px;
}
.mission small {
  display: block;
  color: #864527;
  line-height: 1.5;
}
</style>

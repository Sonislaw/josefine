<script setup lang="ts">
import { computed, ref } from 'vue'
import { actionError, type Action, type Kingdom } from './engine'
import type { Settlement } from './neighbours'
import { CASTLES } from './castles'
import { enemyDefence, enemyTactic, enemyTarget } from './campaign'
import { TACTICS, UNIT_IDS, UNITS, WAR, type Army } from './military'
import ResourceList from './ResourceList.vue'
const props = defineProps<{ state: Kingdom; settlement: Settlement; disabled: boolean }>()
const emit = defineEmits<{ choose: [Action] }>()
// Each castle owns its expedition selection; another panel cannot retarget an existing preview.
const troops = ref<Army>({ spearman: 0, archer: 0, shieldbearer: 0 })
const enemy = computed(() => props.state.affairs.enemies[props.settlement.id]!)
const raid = computed(() =>
  props.state.affairs.raid?.enemyId === props.settlement.id ? props.state.affairs.raid : null,
)
const armyText = (a: Army) => UNIT_IDS.map((u) => UNITS[u].name + ': ' + a[u]).join(' · ')
const missions = [
  {
    type: 'intercept' as const,
    title: 'Przechwyć najazd',
    description:
      'Jedna próba przed ostatnią turą ostrzeżenia. Bez wieży; zwycięstwo odwołuje ten najazd.',
  },
  {
    type: 'expedition' as const,
    title: 'Wyprawa na garnizon',
    description: `Co ${CASTLES.expeditionCooldown} tury. Zwycięstwo grabi dostępne zapasy i odbiera ${CASTLES.damage} punktów procentowych wytrzymałości zamku, albo ${CASTLES.decisiveDamage} przy dwukrotnej przewadze. Bez dodatkowej ochrony.`,
  },
  {
    type: 'forcePeace' as const,
    title: 'Wymuś pokój',
    description:
      'Wymaga 2 punktów przewagi. Zwycięstwo daje 36 tur pokoju oraz jednorazowy prezent 12 kamienia i 15 monet w tej kampanii; nie niszczy zamku.',
  },
]
const missionError = (type: 'intercept' | 'expedition' | 'forcePeace') =>
  actionError(props.state, { type, enemyId: props.settlement.id, army: troops.value })
</script>
<template>
  <section class="enemy-castle" :data-castle-id="settlement.id">
    <div class="castle-condition" :class="{ destroyed: enemy.health === 0 }">
      <strong
        >Wytrzymałość zamku: <span data-testid="castle-health">{{ enemy.health }}%</span></strong
      >
      <progress
        :value="enemy.health"
        :max="CASTLES.health"
        :aria-label="`Wytrzymałość zamku ${settlement.id}`"
      />
      <p v-if="enemy.health">
        Bez kolejnego ataku odbudowuje {{ CASTLES.repair }} punkty procentowe na turę. Seria
        zwycięstw może spalić zamek na zawsze.
      </p>
      <p v-else>
        Zamek spłonął w turze {{ enemy.destroyedTurn }}. Zgliszcza pozostają na mapie. Nie ma
        odbudowy, wojska ani kolejnych najazdów z tego miejsca.
      </p>
    </div>
    <template v-if="enemy.health">
      <div class="campaign-stats">
        <strong>Kampania {{ enemy.campaign }} · Przewaga {{ enemy.advantage }} / 2</strong>
        <p data-testid="enemy-garrison">Garnizon: {{ armyText(enemy.garrison) }}</p>
        <p>
          Taktyka garnizonu: {{ TACTICS[enemyTactic(enemy)].name }}. Obrona garnizonu: +{{
            enemyDefence(state.rank)
          }}
          siły; poza osadą nie działa.
        </p>
        <p>
          Odbudowa za {{ Math.max(1, WAR.recovery - enemy.recovery) }} tur: najwyżej jedna
          jednostka. Cel łącznie: {{ armyText(enemyTarget(state.rank)) }}.
        </p>
        <p>
          Skarbiec: <ResourceList :resources="enemy.treasury" />. Zwycięska wyprawa zabierze do
          <ResourceList :resources="CASTLES.plunder" />; przy zniszczeniu również pozostały
          skarbiec. Zapasy odnawiają się powoli, co {{ CASTLES.replenishTurns }} tur.
        </p>
      </div>
      <p v-if="enemy.peaceUntil !== null" data-testid="campaign-peace">
        Pokój: jeszcze {{ enemy.peaceUntil - state.turn }} tur. Zamek i garnizon odbudowują się; ten
        sąsiad nie wysyła najazdów. Pozostali wrogowie mają własne relacje.
      </p>
      <template v-else>
        <p v-if="raid" data-testid="enemy-raid">
          Najazd za {{ raid.dueTurn - state.turn }} tur: {{ armyText(raid.army) }}. Taktyka:
          {{ raid.tactic === 'none' ? 'bez premii' : TACTICS[raid.tactic].name }}.
        </p>
        <p v-else>
          Ochrona przed tym zamkiem: {{ Math.max(0, enemy.protectedUntil - state.turn) }} tur.
          Najazd wymaga co najmniej 3 żołnierzy.
        </p>
        <p>
          Wygrana obrona lub wyprawa: +1 przewagi; porażka: −1. Dwa punkty pozwalają zakończyć
          kampanię pokojem, zamiast niszczyć zamek.
        </p>
        <button
          type="button"
          :disabled="disabled"
          @click="emit('choose', { type: 'truce', enemyId: settlement.id })"
        >
          Opłać rozejm · <ResourceList :resources="WAR.truce" />
        </button>
        <button
          type="button"
          :disabled="disabled || enemy.advantage < 2"
          @click="emit('choose', { type: 'negotiate', enemyId: settlement.id })"
        >
          Wynegocjuj pokój · <ResourceList :resources="WAR.negotiate" />
        </button>
        <details class="expedition">
          <summary>Wyprawy wojenne</summary>
          <p>
            Wybierz oddział do tego zamku. Bitwa i powrót zajmą jedną turę. Reszta armii zostaje w
            osadzie.
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
              @click="
                emit('choose', { type: mission.type, enemyId: settlement.id, army: { ...troops } })
              "
            >
              {{ mission.title }}
            </button>
          </article>
        </details>
      </template>
    </template>
  </section>
</template>
<style scoped>
.enemy-castle {
  min-width: 0;
}
.castle-condition,
.campaign-stats {
  padding: 12px;
  border: 1px solid #b1bd9a;
  border-radius: 10px;
  background: #ebefdc;
  margin-top: 12px;
}
.castle-condition.destroyed {
  background: #e9e2d7;
  border-color: #a39177;
}
progress {
  display: block;
  width: 100%;
  height: 10px;
  margin-top: 10px;
  accent-color: #99602f;
}
p {
  line-height: 1.7;
}
button,
input {
  font: inherit;
  border: 1px solid #7c956b;
  border-radius: 8px;
  padding: 10px;
  min-height: 44px;
  max-width: 100%;
}
button {
  cursor: pointer;
  background: #e2e9d4;
  color: #254334;
  margin-bottom: 6px;
  width: 100%;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
input:focus-visible,
summary:focus-visible {
  outline: 3px solid #946729;
  outline-offset: 3px;
}
.expedition {
  margin-top: 10px;
  border-top: 1px solid #aebc9f;
  padding-top: 12px;
}
summary {
  cursor: pointer;
  font-weight: 700;
}
label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
}
input {
  width: 85px;
  background: #fffaf0;
  color: #254334;
  min-width: 0;
}
.mission {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #aebc9f;
}
small {
  display: block;
  color: #8b4636;
  margin-bottom: 8px;
}
</style>

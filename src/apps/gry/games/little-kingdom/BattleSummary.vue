<script setup lang="ts">
import type { BattleReport } from './battle'
import MilitaryArt from './MilitaryArt.vue'
import { TACTICS } from './military'
import { resourceList } from './format'
defineProps<{ report: BattleReport; preview?: boolean }>()
</script>
<template>
  <section
    class="battle-summary"
    :class="{ defeat: !report.victory }"
    :aria-label="preview ? 'Prognoza bitwy' : 'Raport bitwy'"
  >
    <strong
      >{{ preview ? 'Prognoza' : 'Raport' }}: {{ report.victory ? 'zwycięstwo' : 'porażka' }} ·
      {{
        {
          defence: 'Obrona osady',
          expedition: 'Wyprawa na garnizon',
          intercept: 'Przechwycenie najazdu',
          forcePeace: 'Wymuszenie pokoju',
        }[report.kind]
      }}</strong
    >
    <div class="armies">
      <div>
        <svg viewBox="0 0 64 64"><MilitaryArt kind="spearman" /></svg
        ><b>Twoi: {{ report.strength }}</b
        ><span
          >{{ report.army.spearman }} włóczników · {{ report.army.archer }} łuczników ·
          {{ report.army.shieldbearer }} tarczowników</span
        >
      </div>
      <div>
        <svg viewBox="0 0 64 64"><MilitaryArt kind="archer" hostile /></svg
        ><b>Wróg: {{ report.enemyStrength }}</b
        ><span
          >{{ report.enemy.spearman }} włóczników · {{ report.enemy.archer }} łuczników ·
          {{ report.enemy.shieldbearer }} tarczowników</span
        >
      </div>
    </div>
    <p>
      {{ TACTICS[report.tactic].name }}. Wróg:
      {{
        report.enemyTactic === 'none' ? 'bez premii taktycznej' : TACTICS[report.enemyTactic].name
      }}. Remis wygrywa obrońca.
    </p>
    <p>
      Twoje straty: {{ report.losses.spearman }} włóczników, {{ report.losses.archer }} łuczników,
      {{ report.losses.shieldbearer }} tarczowników. Mieszkańcy: −{{ report.populationLost }}.
    </p>
    <p>
      Straty wroga: {{ report.enemyLosses.spearman }} włóczników,
      {{ report.enemyLosses.archer }} łuczników, {{ report.enemyLosses.shieldbearer }} tarczowników.
    </p>
    <p v-if="report.outcome">{{ report.outcome }}</p>
    <p v-if="report.damaged">
      Uszkodzony budynek: {{ report.damaged.x }}, {{ report.damaged.y }}. Produkcja i premie
      wyłączone do naprawy.
    </p>
    <p v-if="Object.values(report.plunder).some(Boolean)">
      Grabież: {{ resourceList(report.plunder) }}.
    </p>
    <p v-if="Object.values(report.loot).some(Boolean)">
      Łupy po wyżywieniu: {{ resourceList(report.loot) }}. Pokój trwa 36 tur.
    </p>
  </section>
</template>
<style scoped>
.battle-summary {
  padding: 16px;
  border: 1px solid #8eaa83;
  border-radius: 16px;
  background: #edf1df;
  color: #294a39;
  overflow-wrap: anywhere;
}
.battle-summary.defeat {
  background: #fff0df;
  border-color: #bd775a;
}
.battle-summary p {
  font-size: 0.88rem;
  margin: 8px 0;
}
.armies {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.armies > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.armies svg {
  width: 56px;
  height: 56px;
}
.armies span {
  font-size: 0.8rem;
}
</style>

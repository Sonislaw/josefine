<script setup lang="ts">
import GameDialog from '../../components/GameDialog.vue'
import { HEROES, PASSIVES, WEAPONS, timeText } from './config'
import { choiceText } from './upgrades'
import { useLighthouse } from './useLighthouse'
import type { HeroId, Passive, Weapon } from './model'
const {
  canvas,
  frameRoot,
  overlay,
  ready,
  error,
  storageAvailable,
  preferences,
  selectedHero,
  help,
  equipment,
  confirmRestart,
  announcement,
  hud,
  start,
  pause,
  resume,
  pick,
  toggleSound,
  openHelp,
  openEquipment,
  askRestart,
  toMenu,
} = useLighthouse()
const heroes = Object.keys(HEROES) as HeroId[]
const weapons = Object.keys(WEAPONS) as Weapon[]
const passives = Object.keys(PASSIVES) as Passive[]
</script>
<template>
  <div class="lighthouse-game">
    <header class="lighthouse-heading">
      <div>
        <p class="lh-kicker">ZGRANA / PRZETRWAJ DO ŚWITU</p>
        <h1>Ostatnia <em>latarnia.</em></h1>
        <p>Dziesięć minut do spotkania z mrokiem. Jedno światło, którego nie oddasz.</p>
      </div>
      <button type="button" class="lh-button" @click="openHelp">Jak grać?</button>
    </header>
    <div class="lh-layout">
      <div ref="frameRoot" class="lh-play">
        <div class="lh-arena" :data-mode="hud.mode">
          <canvas
            ref="canvas"
            tabindex="0"
            aria-label="Arena Ostatniej latarni. Ruch: WASD, strzałki lub przeciąganie palcem. Ataki automatyczne. P lub Escape: pauza."
            >Do gry potrzebujesz JavaScript i obsługi Canvas 2D.</canvas
          >
          <div v-if="hud.mode !== 'menu'" class="lh-hud" aria-label="Stan wyprawy">
            <div class="lh-health">
              <span
                >ŻYCIE
                <b data-testid="lighthouse-hp">{{ Math.ceil(hud.hp) }} / {{ hud.maxHp }}</b></span
              ><progress aria-label="Zdrowie bohatera" :value="hud.hp" :max="hud.maxHp" />
            </div>
            <div class="lh-time">
              <strong data-testid="lighthouse-time">{{ timeText(hud.elapsed) }}</strong
              ><span>{{ hud.elapsed < 600 ? 'BOSS O 10:00' : 'OSTATNIE STARCIE' }}</span>
            </div>
            <div class="lh-xp">
              <span
                >POZIOM {{ hud.level }} <b>{{ hud.xp }} / {{ hud.required }}</b></span
              ><progress aria-label="Doświadczenie" :value="hud.xp" :max="hud.required" />
            </div>
          </div>
          <div v-if="hud.boss && hud.mode === 'playing'" class="lh-boss">
            <span>STRAŻNIK OTCHŁANI</span
            ><progress aria-label="Zdrowie bossa" :value="hud.boss.hp" :max="hud.boss.maxHp" />
          </div>
          <div
            v-if="hud.mode !== 'playing'"
            ref="overlay"
            class="lh-overlay"
            :class="{ 'lh-menu': hud.mode === 'menu' }"
          >
            <template v-if="hud.mode === 'menu'"
              ><p class="lh-kicker">ŚWIATŁO JESZCZE NIE ZGASŁO</p>
              <h2>Wybierz swojego<br /><em>strażnika.</em></h2>
              <p class="lh-intro">
                Poruszaj się. Zbieraj iskry. Łącz moce.<br />Broń sama odnajdzie drogę do
                przeciwnika.
              </p>
              <div class="lh-heroes">
                <button
                  v-for="id in heroes"
                  :key="id"
                  type="button"
                  :data-hero="id"
                  :disabled="!ready || !preferences.unlocked.includes(id)"
                  :aria-pressed="selectedHero === id"
                  :class="{ selected: selectedHero === id }"
                  @click="selectedHero = id"
                >
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r="35" :fill="HEROES[id].color" opacity=".1" />
                    <path
                      d="M18 65q0-46 22-51 22 5 22 51L40 55z"
                      fill="#29434b"
                      :stroke="HEROES[id].color"
                      stroke-width="2"
                    />
                    <circle cx="40" cy="31" r="10" :fill="HEROES[id].color" />
                    <path d="M34 30h12" stroke="#1b3039" stroke-width="4" />
                    <path d="M56 42l7 22" :stroke="HEROES[id].color" stroke-width="3" /></svg
                  ><strong>{{ HEROES[id].name }}</strong
                  ><span
                    >{{ HEROES[id].hp }} życia ·
                    {{
                      id === 'storm'
                        ? 'ruch +15%'
                        : id === 'iron'
                          ? 'ruch −10%'
                          : 'ruch standardowy'
                    }}</span
                  ><small>{{
                    preferences.unlocked.includes(id)
                      ? WEAPONS[HEROES[id].weapon].name
                      : '🔒 ' + HEROES[id].unlock
                  }}</small>
                </button>
              </div>
              <button
                type="button"
                class="lh-primary lh-start"
                :disabled="!ready || !!error"
                @click="start"
              >
                Zapal światło. Zaczynamy →
              </button>
              <p class="lh-small">Jedna wyprawa · bez konta · sterowanie jedną ręką</p></template
            >
            <template v-else-if="hud.mode === 'paused'"
              ><p class="lh-kicker">NOC MOŻE POCZEKAĆ</p>
              <h2>Chwila <em>oddechu.</em></h2>
              <p>{{ announcement || 'Świat i przeciwnicy są zatrzymani.' }}</p>
              <button type="button" class="lh-primary" @click="resume">Wracam do światła →</button
              ><button type="button" class="lh-button" @click="askRestart">
                Zakończ wyprawę
              </button></template
            >
            <template v-else-if="hud.mode === 'upgrade'"
              ><p class="lh-kicker">POZIOM {{ hud.level }} / WYBIERZ JEDNĄ MOC</p>
              <h2>Światło rośnie<br /><em>w siłę.</em></h2>
              <p>Wybieraj spokojnie — wyprawa jest zatrzymana.</p>
              <div class="lh-upgrades">
                <button
                  v-for="(choice, i) in hud.choices"
                  :key="i"
                  type="button"
                  :data-choice="i"
                  @click="pick(choice)"
                >
                  <span>{{
                    choice.type === 'evolve'
                      ? '✧ EWOLUCJA'
                      : choice.type === 'heal'
                        ? '✚ ODDECH'
                        : '↑ ROZWÓJ'
                  }}</span
                  ><strong>{{ choiceText(hud, choice).title }}</strong
                  ><small>{{ choiceText(hud, choice).detail }}</small>
                </button>
              </div></template
            >
            <template v-else
              ><p class="lh-kicker">
                {{ hud.mode === 'victory' ? 'NAD WYSPĄ WSTAJE ŚWIT' : 'NOC WYGRAŁA TĘ RUNDĘ' }}
              </p>
              <h2>
                {{ hud.mode === 'victory' ? 'Światło' : 'Jeszcze jedna' }}<br /><em>{{
                  hud.mode === 'victory' ? 'przetrwało.' : 'wyprawa?'
                }}</em>
              </h2>
              <p>
                {{
                  hud.mode === 'victory'
                    ? 'Strażnik Otchłani pokonany. Ta noc należy do Ciebie.'
                    : 'Spróbuj innego połączenia mocy. Nie stój w miejscu i zbieraj iskry doświadczenia.'
                }}
              </p>
              <div class="lh-result">
                <div>
                  <strong>{{ timeText(hud.elapsed) }}</strong
                  ><span>CZAS</span>
                </div>
                <div>
                  <strong>{{ hud.kills }}</strong
                  ><span>POKONANI</span>
                </div>
                <div>
                  <strong>{{ hud.level }}</strong
                  ><span>POZIOM</span>
                </div>
              </div>
              <p v-if="hud.unlocked.length" class="lh-unlocks">
                Osiągnięcia wyprawy: {{ hud.unlocked.map((id) => HEROES[id].name).join(' · ') }}
              </p>
              <div class="lh-final-equipment">
                <span v-for="w in weapons.filter((w) => hud.weapons[w])" :key="w"
                  >{{ hud.evolved.includes(w) ? WEAPONS[w].evolution : WEAPONS[w].name }} ·
                  {{ hud.weapons[w] }}</span
                ><span v-for="p in passives.filter((p) => hud.passives[p])" :key="p"
                  >{{ PASSIVES[p].name }} · {{ hud.passives[p] }}</span
                >
              </div>
              <button type="button" class="lh-primary" @click="start">Jeszcze raz →</button
              ><button type="button" class="lh-button" @click="toMenu">
                Wybierz bohatera
              </button></template
            >
          </div>
        </div>
        <p v-if="error" role="alert" class="lh-storage">{{ error }}</p>
        <div class="lh-controls">
          <button
            type="button"
            class="lh-button"
            :disabled="hud.mode !== 'playing' && hud.mode !== 'paused'"
            @click="hud.mode === 'paused' ? resume() : pause()"
          >
            {{ hud.mode === 'paused' ? '▶ Wznów' : 'Ⅱ Pauza' }}</button
          ><button type="button" class="lh-button" @click="openEquipment">✧ Moce</button
          ><button
            type="button"
            class="lh-button"
            :disabled="!ready"
            :aria-pressed="preferences.sound"
            @click="toggleSound"
          >
            {{ preferences.sound ? '♪ Dźwięk wł.' : '♪ Dźwięk wył.' }}
          </button>
        </div>
        <p class="lh-storage">
          {{
            storageAvailable
              ? '↳ Rekordy i odblokowania zapisujemy w tej przeglądarce. Trwająca wyprawa nie jest zapisywana.'
              : 'Pamięć przeglądarki jest niedostępna. Możesz grać, ale rekordy i odblokowania mogą zniknąć po odświeżeniu.'
          }}
        </p>
        <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
      </div>
      <aside class="lh-sidebar">
        <div class="lh-record">
          <p class="lh-kicker">TWOJE NAJDŁUŻSZE CZUWANIE</p>
          <strong>{{ timeText(preferences.bestTime) }}</strong
          ><span>Pokonani w najlepszej wyprawie: {{ preferences.bestKills }}</span
          ><span>Zwycięskie wyprawy: {{ preferences.victories }}</span>
        </div>
        <div class="lh-tips">
          <p class="lh-kicker">TRZY KROKI DO ŚWITU</p>
          <article>
            <span>01</span>
            <div>
              <h3>Zostaw sobie drogę.</h3>
              <p>
                Nie daj się zamknąć pod brzegiem wyspy. Strzelasz automatycznie, więc skup się na
                ruchu.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Wracaj po iskry.</h3>
              <p>
                Pokonani zostawiają doświadczenie. Zbliż się do iskier, aby je przyciągnąć i zdobyć
                kolejne moce.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Buduj połączenia.</h3>
              <p>
                Broń na poziomie 4 i pasywna moc na poziomie 2 otwierają drogę do ewolucji.
                Receptury znajdziesz pod „Moce”.
              </p>
            </div>
          </article>
        </div>
      </aside>
    </div>
    <section class="lh-guide">
      <p class="lh-kicker">NIE MUSISZ BYĆ SZYBSZY OD BŁYSKAWICY</p>
      <h2>Musisz wiedzieć,<br /><em>kiedy zmienić kierunek.</em></h2>
      <div>
        <p>
          Ostatnia latarnia to gra survival z automatycznymi atakami. W każdej wyprawie wybierasz
          trzy bronie i trzy rodzaje mocy pasywnych. Ognisty pocisk, lodowa aura czy wirujące
          ostrza? Nie zmieścisz wszystkiego — stwórz zestaw, który pasuje do Twojego sposobu gry.
        </p>
        <p>
          Po trzech i sześciu minutach na wyspę wchodzą elitarni przeciwnicy. Po dziesięciu pojawia
          się Strażnik Otchłani. Obserwuj zapowiedzi szarży i kręgów, zachowuj miejsce na unik i
          walcz, aż jego pasek zdrowia zniknie.
        </p>
      </div>
    </section>
    <section class="lh-faq">
      <h2>Zanim zapalisz światło</h2>
      <details>
        <summary>Jak grać na telefonie?</summary>
        <p>
          Przytrzymaj palec na arenie i odsuń go w kierunku ruchu. Pojawi się wirtualny joystick.
          Puszczenie palca zatrzymuje bohatera. Broń atakuje sama; ulepszenia wybierasz podczas
          zatrzymanej gry.
        </p>
      </details>
      <details>
        <summary>Czy trzeba bronić budynku latarni?</summary>
        <p>
          Nie. Latarnia pomaga orientować się na mapie i tworzy klimat gry. Pilnujesz zdrowia
          bohatera. Nie musisz naprawiać budynku ani osłaniać dodatkowego paska wytrzymałości.
        </p>
      </details>
      <details>
        <summary>Jak ewoluować broń?</summary>
        <p>
          Rozwiń broń do poziomu 4 i powiązaną moc do poziomu 2. Ogień łączy się z siłą, błyskawica
          z tempem ataków, mróz z zasięgiem, a ostrza z szybkością ruchu. Przy awansie może pojawić
          się karta ewolucji, która zastępuje broń bez zajmowania kolejnego miejsca.
        </p>
      </details>
      <details>
        <summary>Co zapisuje się po zakończeniu gry?</summary>
        <p>
          Lokalnie zachowujemy rekordy, liczbę zwycięstw, odblokowanych bohaterów i ustawienie
          dźwięku. Wędrowczynię Burzy odblokujesz po 3 minutach przetrwania, a Żelaznego Wartownika
          po pokonaniu bossa. Nie ma płatnych ulepszeń ani stałych bonusów do siły.
        </p>
      </details>
      <details>
        <summary>Czy mogę przerwać wyprawę?</summary>
        <p>
          Tak, użyj pauzy. Zmiana karty także zatrzymuje grę; powrót nie wznawia jej automatycznie.
          Zamknięcie lub odświeżenie strony kończy bieżącą wyprawę — nie zapisujemy jej stanu.
          Rekordy i odblokowania nie są synchronizowane między urządzeniami.
        </p>
      </details>
    </section>
    <GameDialog v-if="help" title="Przetrwaj do świtu" @close="help = false"
      ><p>
        Poruszaj się WASD, strzałkami lub wirtualnym joystickiem. Ataki są automatyczne. Zbieraj
        pozostawione przez wrogów iskry, aby awansować.
      </p>
      <ul>
        <li>Maksymalnie 3 bronie i 3 rodzaje mocy pasywnych. Awans zatrzymuje grę.</li>
        <li>Elity: 3. i 6. minuta. Boss: 10. minuta. Zwyciężasz, pokonując bossa.</li>
        <li>Przed szarżą bossa pojawia się pas ostrzegawczy. Przed falą — przerywany krąg.</li>
        <li>P lub Escape: pauza. Utrata fokusu zatrzymuje grę. Wznawiasz ją przyciskiem.</li>
        <li>Latarnia nie otrzymuje obrażeń; liczy się zdrowie bohatera.</li>
      </ul>
      <button type="button" class="lh-primary" @click="help = false">Rozumiem</button></GameDialog
    >
    <GameDialog v-if="equipment" title="Moce i ewolucje" @close="equipment = false"
      ><p>
        Wyprawa pozostaje zatrzymana, dopóki jej nie wznowisz. Zajęte miejsca:
        {{ Object.keys(hud.weapons).length }}/3 broni, {{ Object.keys(hud.passives).length }}/3
        mocy.
      </p>
      <article v-for="w in weapons" :key="w" class="lh-recipe">
        <h3>
          {{ hud.evolved.includes(w) ? WEAPONS[w].evolution : WEAPONS[w].name }}
          <small>{{ hud.weapons[w] ? '· poziom ' + hud.weapons[w] : '· nieposiadana' }}</small>
        </h3>
        <p>
          {{ WEAPONS[w].name }} 4 + {{ PASSIVES[WEAPONS[w].passive].name }} 2 →
          {{ WEAPONS[w].evolution }}
        </p>
        <span>{{
          hud.evolved.includes(w)
            ? '✧ Ewolucja aktywna'
            : 'Moc powiązana: poziom ' + (hud.passives[WEAPONS[w].passive] ?? 0)
        }}</span>
      </article>
      <p v-for="p in passives.filter((p) => hud.passives[p])" :key="p">
        {{ PASSIVES[p].name }} {{ hud.passives[p] }} — {{ PASSIVES[p].description }}
      </p>
      <button type="button" class="lh-primary" @click="equipment = false">
        Zamknij podgląd
      </button></GameDialog
    >
    <GameDialog v-if="confirmRestart" title="Zakończyć tę wyprawę?" @close="confirmRestart = false"
      ><p>Utracisz bieżące wyposażenie. Zdobyte odblokowania pozostaną zapisane.</p>
      <button type="button" class="lh-primary" @click="toMenu">Tak, wybierz bohatera</button
      ><button type="button" class="lh-button" @click="confirmRestart = false">
        Zostaję przy tej wyprawie
      </button></GameDialog
    >
  </div>
</template>
<style scoped>
.lighthouse-game {
  --lh-ink: #0a1924;
  --lh-light: #ffe0a9;
  --lh-muted: #a7bbc2;
  color: #edf0e6;
  max-width: 1320px;
  margin: auto;
  padding: 36px 24px 70px;
  font-family: system-ui, sans-serif;
}
.lighthouse-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}
.lh-kicker {
  font-size: 10px;
  letter-spacing: 0.18em;
  font-weight: 700;
  color: #dbc18b;
  margin: 0 0 15px;
}
h1 {
  font-family: Georgia, serif;
  font-size: clamp(42px, 5.5vw, 74px);
  font-weight: 400;
  letter-spacing: -0.045em;
  line-height: 1.08;
  margin: 0 0 14px;
}
em {
  color: var(--lh-light);
  font-weight: 400;
}
.lighthouse-heading > div > p:last-child {
  font-size: 14px;
  color: var(--lh-muted);
  line-height: 1.8;
  margin: 0;
}
.lh-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 24px;
  align-items: start;
}
.lh-play {
  min-width: 0;
  scroll-margin-top: 10px;
}
.lh-arena {
  position: relative;
  min-height: 480px;
  border: 1px solid #41606c;
  border-radius: 22px;
  overflow: hidden;
  background: #102936;
}
.lh-arena[data-mode='playing'] {
  height: 600px;
}
.lh-arena canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
  outline-offset: -4px;
}
.lh-arena canvas:focus-visible {
  outline: 2px solid #e2ce92;
}
.lh-overlay {
  position: relative;
  min-height: 480px;
  background: linear-gradient(150deg, #081923f2, #0e2533e6);
  padding: 90px 32px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 17px;
}
.lh-overlay.lh-menu {
  padding-top: 35px;
}
.lh-overlay h2 {
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(34px, 4vw, 49px);
  line-height: 1.08;
  letter-spacing: -0.035em;
  margin: 0;
}
.lh-overlay p {
  font-size: 13px;
  color: #bbced0;
  line-height: 1.8;
  margin: 0;
  max-width: 520px;
}
.lh-overlay .lh-kicker {
  color: #dfc283;
  font-size: 10px;
}
.lh-heroes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
  width: 100%;
  margin: 7px 0;
}
.lh-heroes button {
  font: inherit;
  border: 1px solid #365665;
  border-radius: 14px;
  background: #162c39;
  color: #e2e8dc;
  padding: 13px 9px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.lh-heroes button.selected {
  border-color: #e9c885;
  background: #293941;
  box-shadow: inset 0 0 0 1px #e9c88544;
}
.lh-heroes button:disabled {
  opacity: 0.58;
  cursor: default;
}
.lh-heroes svg {
  width: 68px;
  height: 68px;
}
.lh-heroes strong {
  font-size: 13px;
  line-height: 1.4;
}
.lh-heroes span,
.lh-heroes small {
  font-size: 10px;
  line-height: 1.6;
  color: #b7c8ca;
}
.lh-button,
.lh-primary {
  font: inherit;
  cursor: pointer;
  border-radius: 10px;
  min-height: 46px;
  padding: 11px 16px;
  font-size: 12px;
}
.lh-button {
  background: #142b38;
  color: #c5d8d8;
  border: 1px solid #375664;
}
.lh-primary {
  background: #f3ce8b;
  color: #263232;
  border: 1px solid #ffe1a5;
  font-weight: 750;
  font-size: 14px;
  padding: 15px 24px;
}
.lh-button:disabled,
.lh-primary:disabled {
  opacity: 0.45;
  cursor: default;
}
button:focus-visible,
summary:focus-visible {
  outline: 3px solid #f6d58e;
  outline-offset: 3px;
}
.lh-hud {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  pointer-events: none;
}
.lh-hud span {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 9px;
  letter-spacing: 0.04em;
  color: #d1ded6;
}
.lh-hud b {
  color: #fff0cf;
  font-size: 10px;
}
.lh-hud progress {
  width: 100%;
  height: 6px;
  display: block;
  margin-top: 7px;
  accent-color: #ecb77c;
}
.lh-hud progress::-webkit-progress-bar,
.lh-boss progress::-webkit-progress-bar {
  background: #263d45;
  border-radius: 10px;
}
.lh-health progress::-webkit-progress-value {
  background: #ebb27d;
  border-radius: 10px;
}
.lh-xp progress::-webkit-progress-value {
  background: #9bddd0;
  border-radius: 10px;
}
.lh-time {
  text-align: center;
  color: #ffe5b0;
}
.lh-time strong {
  font-size: 22px;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.lh-time span {
  font-size: 7px;
  justify-content: center;
  margin-top: 6px;
  letter-spacing: 0.12em;
}
.lh-boss {
  position: absolute;
  top: 70px;
  left: 15%;
  right: 15%;
  text-align: center;
  pointer-events: none;
  color: #efbfd4;
}
.lh-boss span {
  font-size: 9px;
  letter-spacing: 0.16em;
}
.lh-boss progress {
  display: block;
  width: 100%;
  height: 7px;
  accent-color: #d594b5;
  margin-top: 5px;
}
.lh-boss progress::-webkit-progress-value {
  background: #d594b5;
  border-radius: 8px;
}
.lh-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.lh-controls button {
  padding: 11px 6px;
}
.lh-storage {
  font-size: 11px;
  color: #9fb3b8;
  line-height: 1.8;
  margin: 13px 0 0;
}
.lh-record {
  background: linear-gradient(140deg, #233b43, #152a37);
  border: 1px solid #45606a;
  border-radius: 20px;
  padding: 23px;
}
.lh-record > strong {
  display: block;
  font-family: Georgia, serif;
  font-size: 48px;
  font-weight: 400;
  color: #ffe0a3;
  margin-bottom: 14px;
}
.lh-record > span {
  display: block;
  font-size: 11px;
  color: #c0ceca;
  line-height: 1.9;
}
.lh-tips {
  border: 1px solid #2e4751;
  border-radius: 20px;
  padding: 23px;
  margin-top: 20px;
  background: #10242e;
}
.lh-tips article {
  display: flex;
  gap: 13px;
  margin-top: 25px;
}
.lh-tips article > span {
  font-family: Georgia, serif;
  font-size: 23px;
  color: #d7bf8e;
}
.lh-tips h3 {
  font-size: 14px;
  margin: 0 0 7px;
  color: #e9e6d4;
}
.lh-tips p {
  font-size: 12px;
  line-height: 1.85;
  color: #a9bdc1;
  margin: 0;
}
.lh-upgrades {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  margin-top: 8px;
}
.lh-upgrades button {
  font: inherit;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid #6a7c74;
  border-radius: 14px;
  background: linear-gradient(145deg, #30484b, #1c323e);
  color: #ece7d0;
  padding: 20px 15px;
  min-height: 210px;
}
.lh-upgrades button > span {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #e6c28a;
}
.lh-upgrades strong {
  font-size: 17px;
  line-height: 1.35;
}
.lh-upgrades small {
  font-size: 11px;
  line-height: 1.8;
  color: #c1d2cd;
}
.lh-result {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin: 10px 0;
}
.lh-result strong {
  font-size: 30px;
  color: #f6d799;
  display: block;
}
.lh-result span {
  font-size: 9px;
  color: #a4bdc3;
  letter-spacing: 0.1em;
}
.lh-final-equipment {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: center;
}
.lh-final-equipment span {
  border: 1px solid #53645c;
  border-radius: 20px;
  padding: 6px 11px;
  font-size: 10px;
  color: #d5d8bc;
}
.lh-unlocks {
  color: #e2d996 !important;
}
.lh-guide {
  margin-top: 65px;
  border-top: 1px solid #334950;
  padding-top: 40px;
}
.lh-guide h2 {
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(30px, 3.6vw, 45px);
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 26px;
}
.lh-guide > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
.lh-guide p:not(.lh-kicker) {
  font-size: 13px;
  line-height: 1.9;
  color: #a8bdc1;
  margin: 0;
}
.lh-faq {
  margin-top: 50px;
}
.lh-faq h2 {
  font-family: Georgia, serif;
  font-size: 29px;
  font-weight: 400;
}
.lh-faq details {
  padding: 18px 0;
  border-bottom: 1px solid #334950;
}
.lh-faq summary {
  font-size: 14px;
  cursor: pointer;
  color: #e2e3d5;
}
.lh-faq p {
  font-size: 13px;
  color: #b1c1c5;
  line-height: 1.9;
  max-width: 850px;
  margin-top: 14px;
}
.lh-recipe {
  border-block: 1px solid #45634f;
  padding: 12px 0;
}
.lh-recipe h3 {
  font-size: 16px;
}
.lh-recipe h3 small {
  font-size: 11px;
}
.lh-recipe p,
.lh-recipe span {
  font-size: 12px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
@media (max-width: 1050px) {
  .lh-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .lh-sidebar {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 15px;
  }
  .lh-tips {
    margin-top: 0;
  }
  .lh-arena[data-mode='playing'] {
    height: 560px;
  }
}
@media (max-width: 600px) {
  .lighthouse-game {
    padding: 25px 12px 55px;
  }
  .lighthouse-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .lh-arena {
    border-radius: 16px;
    min-height: 350px;
  }
  .lh-arena[data-mode='playing'] {
    height: clamp(330px, calc(100svh - 155px), 620px);
  }
  .lh-overlay {
    padding: 85px 18px 25px;
    min-height: 380px;
    gap: 15px;
  }
  .lh-overlay.lh-menu {
    padding-top: 26px;
  }
  .lh-heroes {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .lh-heroes button {
    display: grid;
    grid-template-columns: 48px 1fr;
    text-align: left;
    gap: 3px 12px;
    padding: 10px 13px;
  }
  .lh-heroes svg {
    width: 48px;
    height: 48px;
    grid-row: span 3;
  }
  .lh-heroes strong {
    font-size: 13px;
  }
  .lh-heroes span,
  .lh-heroes small {
    font-size: 10px;
  }
  .lh-start {
    width: 100%;
  }
  .lh-hud {
    left: 10px;
    right: 10px;
    gap: 9px;
  }
  .lh-time strong {
    font-size: 20px;
  }
  .lh-sidebar {
    grid-template-columns: 1fr;
  }
  .lh-upgrades {
    grid-template-columns: 1fr;
  }
  .lh-upgrades button {
    min-height: 0;
    padding: 16px;
    gap: 9px;
  }
  .lh-upgrades strong {
    font-size: 16px;
  }
  .lh-upgrades small {
    font-size: 12px;
  }
  .lh-result {
    gap: 22px;
  }
  .lh-guide > div {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .lh-overlay h2 {
    font-size: 36px;
  }
  .lh-overlay .lh-small {
    font-size: 10px;
  }
  .lh-controls .lh-button {
    font-size: 11px;
  }
}
</style>

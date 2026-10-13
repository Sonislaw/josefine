<script setup lang="ts">
import { computed } from 'vue'
import GameDialog from '../../components/GameDialog.vue'
import BlockShape from './BlockShape.vue'
import { useBlocks } from './useBlocks'
const {
  root,
  board,
  round,
  ready,
  started,
  best,
  sound,
  storageAvailable,
  restored,
  selected,
  cursor,
  target,
  ghost,
  help,
  restart,
  announcement,
  feedback,
  cleared,
  blocked,
  chosen,
  tray,
  possible,
  preview,
  valid,
  start,
  requestRestart,
  slotClick,
  cellClick,
  hoverCell,
  boardKey,
  cellFocus,
  pointerDown,
  pointerMove,
  pointerUp,
  pointerCancel,
  toggleSound,
  openHelp,
} = useBlocks()
const previewSet = computed(() => new Set(preview.value))
const clearSet = computed(() => new Set(cleared.value))
const number = (value: number) => value.toLocaleString('pl-PL')
</script>

<template>
  <div ref="root" class="blocks-game">
    <header class="blocks-heading">
      <div>
        <p class="blocks-kicker">ZGRANA / CHWILA DLA GŁOWY</p>
        <h1>Klocki<span>. Jeszcze jeden ruch.</span></h1>
        <p class="blocks-tagline">Bez pośpiechu. Zrób miejsce na coś dobrego.</p>
      </div>
      <button
        class="blocks-sound"
        type="button"
        :aria-pressed="sound"
        :disabled="!ready"
        @click="toggleSound"
      >
        ♪ <span>Dźwięk {{ sound ? 'wł.' : 'wył.' }}</span>
      </button>
    </header>
    <div class="blocks-layout">
      <section class="blocks-play" aria-label="Gra Klocki">
        <div class="blocks-stats">
          <div>
            <span>TWÓJ WYNIK</span
            ><strong data-testid="blocks-score">{{ number(round.score) }}</strong>
          </div>
          <div>
            <span>REKORD</span><strong>{{ number(best) }}</strong>
          </div>
          <div :class="{ 'streak-on': round.streak > 0 }">
            <span>SERIA</span><strong>{{ round.streak ? `×${round.streak}` : '—' }}</strong>
          </div>
        </div>
        <div class="blocks-frame">
          <div
            ref="board"
            class="blocks-board"
            role="group"
            aria-label="Plansza 8 na 8. Wybierz kształt, potem pole. Strzałki przesuwają podgląd, Enter układa."
            @keydown="boardKey"
            @pointerleave="!ghost && (target = null)"
          >
            <button
              v-for="(color, index) in round.board"
              :key="index"
              type="button"
              :data-cell="index"
              class="board-cell"
              :class="[
                {
                  'cell-filled': color > 0,
                  'cell-preview': previewSet.has(index),
                  'cell-invalid': previewSet.has(index) && !valid,
                  'cell-clear': clearSet.has(index),
                  'cell-anchor': target && target.row * 8 + target.col === index,
                },
                `block-color-${color}`,
              ]"
              :style="
                previewSet.has(index) && valid
                  ? { '--preview-color': `var(--block-${chosen?.color})` }
                  : undefined
              "
              :aria-label="`${String.fromCharCode(65 + (index % 8))}${Math.floor(index / 8) + 1}, ${color ? 'zajęte' : 'wolne'}`"
              :tabindex="cursor === index ? 0 : -1"
              :disabled="blocked"
              @focus="cellFocus(index)"
              @pointerenter="hoverCell(index)"
              @click="cellClick(index)"
            />
          </div>
          <div
            v-if="!started || round.status === 'gameover'"
            class="blocks-screen"
            role="region"
            :aria-label="started ? 'Koniec rundy' : 'Rozpocznij grę'"
          >
            <span class="blocks-emblem" aria-hidden="true">▦</span>
            <p class="blocks-kicker">
              {{ started ? 'JESZCZE JEDNA PRÓBA?' : 'MAŁE KLOCKI. DUŻA SATYSFAKCJA.' }}
            </p>
            <h2>{{ started ? `${number(round.score)} punktów` : 'Ułóż. Połącz. Odetchnij.' }}</h2>
            <p>
              {{
                started
                  ? 'Żaden z pozostałych kształtów się nie mieści. Nowa plansza, nowe możliwości.'
                  : 'Układaj kształty. Zapełniaj wiersze i kolumny, aby odzyskać miejsce. Czas jest po Twojej stronie.'
              }}
            </p>
            <button
              v-if="!started"
              type="button"
              class="blocks-primary blocks-start"
              :disabled="!ready"
              @click="start"
            >
              Zaczynamy →
            </button>
            <button v-else type="button" class="blocks-primary blocks-again" @click="start">
              Jeszcze raz ↗
            </button>
            <small>{{
              started
                ? `Linie: ${round.lines} · Ruchy: ${round.moves}`
                : 'Jeden palec · Bez zegara · Zapis rundy'
            }}</small>
          </div>
        </div>
        <div class="blocks-feedback" :class="{ 'feedback-clear': round.streak > 0 }">
          {{ feedback }}
        </div>
        <div class="blocks-tray" role="group" aria-label="Trzy kształty do ułożenia">
          <button
            v-for="(shape, slot) in tray"
            :key="slot"
            type="button"
            :data-slot="slot"
            class="shape-slot"
            :class="{
              selected: selected === slot,
              used: !shape,
              'no-fit': started && shape && !possible[slot],
            }"
            :disabled="blocked || !shape"
            :aria-pressed="selected === slot"
            :aria-label="
              shape
                ? `Kształt ${slot + 1}: ${shape.name}${started && !possible[slot] ? ', na razie brak miejsca' : ''}`
                : `Kształt ${slot + 1}: wykorzystany`
            "
            @click="slotClick(slot, $event)"
            @pointerdown="pointerDown(slot, $event)"
            @pointermove="pointerMove"
            @pointerup="pointerUp"
            @pointercancel="pointerCancel"
            @lostpointercapture="pointerCancel"
          >
            <template v-if="shape"
              ><BlockShape :shape="shape" /><small>{{
                started && !possible[slot]
                  ? 'Brak miejsca'
                  : selected === slot
                    ? 'Wybrany'
                    : `Kształt ${slot + 1}`
              }}</small></template
            >
            <template v-else><span aria-hidden="true">✓</span><small>Ułożony</small></template>
          </button>
        </div>
        <p class="blocks-gesture">Przeciągnij nad planszę lub wybierz kształt i dotknij pola.</p>
        <div class="blocks-actions">
          <button type="button" :disabled="!ready" @click="requestRestart">↻ Nowa runda</button
          ><button type="button" @click="openHelp">Jak grać?</button>
        </div>
        <p class="blocks-save" :class="{ warning: !storageAvailable }">
          {{
            !storageAvailable
              ? 'Nie możemy zapisać gry w tej przeglądarce. Runda działa, ale może zniknąć po odświeżeniu.'
              : restored
                ? '↳ Wczytaliśmy Twoją rundę. Możesz spokojnie grać dalej.'
                : '↳ Runda i rekord zapisują się automatycznie na tym urządzeniu.'
          }}
        </p>
      </section>
      <aside class="blocks-aside">
        <section class="blocks-note">
          <span class="note-symbol" aria-hidden="true">↳</span>
          <p class="blocks-kicker">JESZCZE SIĘ ZMIEŚCI</p>
          <h2>Nie musisz się spieszyć.<br /><em>Wystarczy dobry ruch.</em></h2>
          <p>
            Jedno puste pole potrafi zmienić wszystko. Obejrzyj trzy kształty, zanim położysz
            pierwszy.
          </p>
          <div class="note-mosaic" aria-hidden="true">
            <i v-for="n in 16" :key="n" :class="`mosaic-${n % 4}`" />
          </div>
        </section>
        <section class="blocks-rules">
          <h2>Twój plan na planszę</h2>
          <ol>
            <li>
              <strong>Wybierz jeden z trzech</strong>Kolejną paczkę dostaniesz po ułożeniu całej
              obecnej.
            </li>
            <li>
              <strong>Zamknij linię</strong>Pełne wiersze i kolumny znikają. Klocki nie opadają.
            </li>
            <li>
              <strong>Zrób miejsce na więcej</strong>Duże kształty potrzebują przestrzeni. Nie
              zostawiaj samych wąskich szczelin.
            </li>
          </ol>
        </section>
        <section class="blocks-bonus">
          <p class="blocks-kicker">WIĘCEJ SATYSFAKCJI</p>
          <h2>Jednym ruchem — kilka linii.</h2>
          <p>
            Dostajesz punkt za każde zajęte pole i bonus za linie. Kasuj je w kolejnych ruchach, aby
            budować serię. Ruch bez skasowania linii kończy serię.
          </p>
          <span
            >Linie w tej rundzie <b>{{ round.lines }}</b></span
          >
        </section>
      </aside>
    </div>
    <section class="blocks-faq">
      <h2>Mała przerwa? Plansza poczeka.</h2>
      <details>
        <summary>Czy mogę wrócić do gry później?</summary>
        <p>
          Tak. Po każdym ruchu zapisujemy planszę, pozostałe kształty i wynik w tej przeglądarce.
          Odśwież stronę lub wróć na tym samym urządzeniu. Tryb prywatny i czyszczenie danych mogą
          usunąć zapis.
        </p>
      </details>
      <details>
        <summary>Jak działa punktacja?</summary>
        <p>
          Każde pole ułożonego kształtu daje 1 punkt. Bonus to 10 × liczba skasowanych linii² ×
          seria. Pierwszy ruch z jedną linią to 10 punktów bonusu, dwie linie naraz — 40. Następny
          ruch z kasowaniem podnosi serię do ×2. Skrzyżowany wiersz i kolumna liczą się jako dwie
          linie.
        </p>
      </details>
      <details>
        <summary>Czy kształty można obracać?</summary>
        <p>
          Nie — układasz je tak, jak widzisz pod planszą. Nowe paczki mają różne warianty kształtów.
          Runda kończy się wtedy, gdy żaden z pozostałych kształtów nie mieści się w wolnych polach.
        </p>
      </details>
    </section>
    <div
      v-if="ghost && chosen"
      class="blocks-ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      <BlockShape :shape="chosen" :unit="ghost.unit" />
    </div>
    <p class="blocks-sr" role="status" aria-live="polite">{{ announcement }}</p>
    <GameDialog v-if="help" title="Jeden dobry ruch na raz" @close="help = false"
      ><p>
        Przeciągnij kształt na planszę. Na telefonie podgląd jest nad palcem — puść, gdy pola
        podświetlą się poprawnie. Czerwony podgląd oznacza brak miejsca.
      </p>
      <p>
        Możesz też dotknąć kształtu, a potem wskazać lewy górny narożnik jego podglądu. Klawiatura:
        wybierz kształt Enterem, przesuń podgląd strzałkami i zatwierdź Enterem lub spacją. Escape
        usuwa wybór.
      </p>
      <p>
        Pełne wiersze i kolumny znikają jednocześnie. Nie ma limitu czasu, obracania kształtów ani
        cofania ruchów. Runda zapisuje się po każdym poprawnym ruchu.
      </p>
      <button class="blocks-primary" type="button" @click="help = false">
        Wracam do klocków
      </button></GameDialog
    >
    <GameDialog v-if="restart" title="Zacząć od pustej planszy?" @close="restart = false"
      ><p>Obecna runda zostanie zastąpiona. Twój rekord zostanie zachowany.</p>
      <div class="restart-actions">
        <button type="button" class="blocks-primary" @click="start">Tak, nowa runda</button
        ><button type="button" class="blocks-secondary" @click="restart = false">
          Zostaję przy tej
        </button>
      </div></GameDialog
    >
  </div>
</template>

<style scoped>
.blocks-game {
  --block-1: #bee58a;
  --block-2: #85cdd0;
  --block-3: #efb46e;
  --block-4: #b5a0e6;
  --block-5: #ef9791;
  --block-6: #85b5e9;
  background: #101f24;
  color: #edf2e6;
  padding: 32px max(20px, calc((100% - 1120px) / 2)) 54px;
  font:
    14px/1.6 'DM Sans',
    system-ui,
    sans-serif;
}
.blocks-game * {
  box-sizing: border-box;
}
.blocks-game h1,
.blocks-game h2,
.blocks-game p {
  margin: 0;
}
.blocks-game button {
  font: inherit;
  cursor: pointer;
}
.blocks-game button:disabled {
  cursor: default;
}
.blocks-game :focus-visible {
  outline: 3px solid #e7fca8;
  outline-offset: 3px;
}
.blocks-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.blocks-kicker {
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.15em;
  color: #bfd798;
}
.blocks-heading h1 {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1.2;
  margin: 10px 0;
}
.blocks-heading h1 span {
  color: #bee58a;
}
.blocks-tagline {
  color: #a6bec2;
}
.blocks-sound,
.blocks-actions button,
.blocks-secondary {
  color: #dbe9df;
  background: #20353c;
  border: 1px solid #3f575c;
  border-radius: 12px;
  padding: 10px 14px;
  min-height: 44px;
}
.blocks-sound {
  flex-shrink: 0;
}
.blocks-layout {
  display: grid;
  grid-template-columns: minmax(0, 540px) minmax(240px, 1fr);
  gap: 56px;
  align-items: start;
}
.blocks-play {
  width: min(100%, calc(100svh - 260px));
  min-width: min(260px, 100%);
  margin-inline: auto;
  scroll-margin-top: 12px;
}
.blocks-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px 12px;
}
.blocks-stats span {
  display: block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
  color: #9ab3b6;
}
.blocks-stats strong {
  font-size: 28px;
  font-weight: 650;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.streak-on strong {
  color: #efb46e;
}
.blocks-frame {
  position: relative;
  border-radius: 20px;
  padding: 10px;
  background: #0c181d;
  border: 1px solid #3f5659;
  box-shadow: 0 22px 60px #0003;
}
.blocks-board {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 4px;
  aspect-ratio: 1;
}
.board-cell {
  position: relative;
  min-width: 0;
  border-radius: 6px;
  border: 1px solid #30454c;
  background: #21353e;
  padding: 0;
  transition: background-color 0.1s;
}
.block-color-1 {
  --tile: var(--block-1);
}
.block-color-2 {
  --tile: var(--block-2);
}
.block-color-3 {
  --tile: var(--block-3);
}
.block-color-4 {
  --tile: var(--block-4);
}
.block-color-5 {
  --tile: var(--block-5);
}
.block-color-6 {
  --tile: var(--block-6);
}
.cell-filled {
  background: var(--tile);
  border-color: #ffffff66;
  box-shadow:
    inset 0 3px 0 #ffffff40,
    inset 0 -3px 0 #0002;
}
.cell-preview {
  background: color-mix(in srgb, var(--preview-color, #bee58a) 55%, #21353e);
  border: 2px dashed #e8ffbd;
}
.cell-invalid {
  background: #874850;
  border: 2px dashed #ffafaa;
}
.cell-anchor:after {
  content: '';
  position: absolute;
  inset: 25%;
  border: 1px solid #ffffffa0;
  border-radius: 50%;
}
.cell-clear {
  animation: clear-line 0.22s ease-out;
  background: #f1fbd5;
}
@keyframes clear-line {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  60% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.3);
    opacity: 0;
  }
}
.blocks-screen {
  position: absolute;
  inset: 0;
  border-radius: 19px;
  background: #10232bf0;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 24px;
}
.blocks-emblem {
  font-size: 55px;
  color: #bee58a;
  line-height: 1;
  margin-bottom: 18px;
}
.blocks-screen h2 {
  font-size: clamp(22px, 3vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.035em;
  margin: 12px 0;
  font-weight: 700;
}
.blocks-screen > p:not(.blocks-kicker) {
  max-width: 330px;
  font-size: 13px;
  color: #bdcfd0;
}
.blocks-primary {
  background: #c9e993;
  border: 1px solid #e0f5b9;
  color: #173327;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 750 !important;
  min-height: 46px;
}
.blocks-primary:hover {
  background: #d8f7a5;
}
.blocks-primary:disabled {
  opacity: 0.55;
}
.blocks-screen .blocks-primary {
  margin: 20px 0 12px;
}
.blocks-screen small {
  color: #9db7bd;
  font-size: 10px;
}
.blocks-feedback {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  text-align: center;
  color: #becfd0;
  padding: 5px 0;
}
.feedback-clear {
  color: #efc380;
}
.blocks-tray {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.shape-slot {
  min-height: 108px;
  border: 1px solid #385059;
  border-radius: 14px;
  background: #1b3038;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.shape-slot.selected {
  border-color: #d7efac;
  box-shadow: 0 0 0 2px #d7efac;
  background: #2b413f;
}
.shape-slot small {
  color: #acbfc3;
  font-size: 10px;
}
.shape-slot.no-fit small {
  color: #f4b3a0;
}
.shape-slot.used {
  border-style: dashed;
  opacity: 0.55;
}
.shape-slot.used > span {
  color: #9ecca2;
  font-size: 25px;
}
.blocks-gesture {
  text-align: center;
  font-size: 11px;
  color: #9eb8bc;
  margin: 12px 0 !important;
}
.blocks-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}
.blocks-save {
  font-size: 11px;
  color: #9eb8bc;
  margin-top: 14px !important;
}
.blocks-save.warning {
  color: #f6bc88;
}
.blocks-note {
  position: relative;
  padding: 28px;
  background: #c9e6a4;
  color: #193b32;
  border-radius: 22px;
  overflow: hidden;
}
.blocks-note .blocks-kicker {
  color: #3b6252;
}
.blocks-note h2 {
  font-size: 29px;
  letter-spacing: -0.045em;
  line-height: 1.2;
  margin: 22px 0 15px;
}
.blocks-note em {
  font-style: normal;
  color: #55754f;
}
.blocks-note > p:not(.blocks-kicker) {
  position: relative;
  z-index: 1;
  max-width: 250px;
}
.note-symbol {
  float: right;
  font-size: 40px;
  line-height: 1;
}
.note-mosaic {
  display: grid;
  grid-template-columns: repeat(4, 24px);
  gap: 4px;
  transform: rotate(-12deg);
  margin: 24px 0 0 auto;
  width: max-content;
}
.note-mosaic i {
  aspect-ratio: 1;
  border-radius: 5px;
  background: #476e5530;
}
.note-mosaic .mosaic-1,
.note-mosaic .mosaic-2 {
  background: #456d54;
}
.blocks-rules {
  padding: 28px 0;
}
.blocks-rules h2,
.blocks-bonus h2 {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.blocks-rules ol {
  padding-left: 20px;
  margin: 18px 0 0;
  color: #a9c0c4;
}
.blocks-rules li {
  padding-left: 8px;
  margin: 17px 0;
}
.blocks-rules li::marker {
  color: #c9e6a4;
}
.blocks-rules strong {
  display: block;
  color: #e5eee4;
  margin-bottom: 3px;
}
.blocks-bonus {
  border: 1px solid #3b535b;
  border-radius: 18px;
  padding: 24px;
  background: #192e35;
}
.blocks-bonus h2 {
  margin: 12px 0;
}
.blocks-bonus > p:not(.blocks-kicker) {
  color: #acc2c5;
}
.blocks-bonus > span {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #3b535b;
  padding-top: 16px;
  margin-top: 18px;
  color: #bdd1c8;
}
.blocks-bonus b {
  color: #c9e993;
}
.blocks-faq {
  border-top: 1px solid #3b535b;
  margin-top: 48px;
  padding-top: 28px;
}
.blocks-faq h2 {
  font-size: 25px;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
}
.blocks-faq details {
  border-bottom: 1px solid #304950;
  padding: 16px 0;
}
.blocks-faq summary {
  cursor: pointer;
  color: #d5e9d4;
  min-height: 28px;
}
.blocks-faq details p {
  color: #afc3c6;
  margin-top: 12px;
  max-width: 750px;
}
.blocks-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 60;
  opacity: 0.8;
  filter: drop-shadow(0 6px 8px #0009);
}
.blocks-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.restart-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
@media (max-width: 800px) {
  .blocks-game {
    padding: 22px 16px 40px;
  }
  .blocks-layout {
    grid-template-columns: minmax(0, 480px);
    justify-content: center;
    gap: 28px;
  }
  .blocks-heading h1 {
    font-size: 29px;
  }
  .blocks-heading h1 span {
    display: block;
    font-size: 22px;
  }
  .blocks-aside {
    display: grid;
    gap: 20px;
  }
  .blocks-note {
    display: none;
  }
  .blocks-rules {
    padding: 10px 0;
  }
}
@media (max-width: 500px) {
  .blocks-game {
    padding: 12px 12px 34px;
  }
  .blocks-heading {
    align-items: start;
    position: relative;
    margin-bottom: 12px;
    gap: 8px;
  }
  .blocks-heading .blocks-kicker {
    font-size: 8px;
    padding-right: 34px;
  }
  .blocks-heading h1 {
    font-size: 25px;
    margin: 5px 0 0;
  }
  .blocks-heading h1 span {
    display: inline;
    font-size: 19px;
  }
  .blocks-tagline {
    display: none;
  }
  .blocks-sound {
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
  }
  .blocks-sound span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .blocks-stats {
    padding-bottom: 8px;
  }
  .blocks-stats strong {
    font-size: 23px;
  }
  .blocks-play {
    width: min(100%, calc(100svh - 260px));
    min-width: 260px;
    margin: auto;
  }
  .blocks-frame {
    padding: 7px;
    border-radius: 15px;
  }
  .board-cell {
    border-radius: 4px;
  }
  .blocks-screen {
    border-radius: 14px;
    padding: 16px;
  }
  .blocks-emblem {
    font-size: 32px;
    margin-bottom: 8px;
  }
  .blocks-screen .blocks-kicker {
    font-size: 8px;
  }
  .blocks-screen h2 {
    font-size: 23px;
    margin: 8px 0;
  }
  .blocks-screen > p:not(.blocks-kicker) {
    font-size: 12px;
  }
  .blocks-screen .blocks-primary {
    margin: 12px 0 8px;
  }
  .shape-slot {
    min-height: 92px;
    padding: 7px 2px;
    gap: 5px;
  }
  .blocks-tray {
    gap: 8px;
  }
  .blocks-feedback {
    font-size: 11px;
  }
  .blocks-gesture {
    margin: 8px 0 !important;
  }
  .blocks-faq {
    margin-top: 30px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .board-cell {
    transition: none;
  }
  .cell-clear {
    animation: none;
  }
}
</style>

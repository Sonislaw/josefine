<script setup lang="ts">
import { computed } from 'vue'
import GameDialog from '../../components/GameDialog.vue'
import { coordinate, powers } from './engine'
import { powerInfo } from './powers'
import { useArena } from './useArena'

defineProps<{ standalone?: boolean }>()
const {
  session,
  state,
  selected,
  powerMode,
  opponent,
  difficulty,
  thinking,
  sound,
  showHelp,
  showOutcome,
  restartMode,
  piece,
  mandatory,
  skillMoves,
  targets,
  lastMove,
  level,
  rank,
  status,
  locked,
  aiError,
  clickSquare,
  togglePower,
  requestRestart,
  reset,
  changeOpponent,
  squareLabel,
  startComputer,
  toggleSound,
} = useArena()
const selectedInfo = computed(() => (piece.value?.power ? powerInfo[piece.value.power] : null))
const pieceCount = (side: number) => state.value.board.filter((p) => p?.side === side).length
const powerCount = (power: string) =>
  state.value.board.filter((p) => p?.side === 0 && p.power === power && !p.used).length
const powerLabel = computed(() =>
  piece.value?.used
    ? 'Moc wykorzystana'
    : mandatory.value
      ? 'Najpierw obowiązkowe bicie'
      : powerMode.value
        ? 'Wróć do zwykłego ruchu'
        : skillMoves.value.length
          ? 'Aktywuj moc ↗'
          : 'Moc niedostępna',
)
const outcomeTitle = computed(() =>
  session.value.outcome?.winner === null
    ? 'Remis. Dobra rozgrywka!'
    : session.value.outcome?.winner === 0
      ? 'Jasna drużyna wygrywa!'
      : 'Ciemna drużyna wygrywa!',
)
const activeModal = computed(() =>
  showHelp.value ? 'help' : restartMode.value ? 'restart' : showOutcome.value ? 'outcome' : null,
)
function closeModal() {
  if (activeModal.value === 'help') showHelp.value = false
  else if (activeModal.value === 'restart') restartMode.value = null
  else showOutcome.value = false
}
</script>

<template>
  <div class="arena">
    <div class="arena-top">
      <span>◈ ZGRANA <span class="muted">/ LAB</span></span
      ><span class="arena-motto">KLASYCZNA STRATEGIA. NOWE ZASADY GRY.</span
      ><button type="button" class="text-button" @click="showHelp = true">Jak grać ↗</button>
    </div>
    <header class="arena-intro">
      <div>
        <p class="eyebrow">TAKTYCZNA GRA DLA 1–2 GRACZY</p>
        <h1>Warcaby.<br /><span>Arena Mocy</span></h1>
        <p class="intro-copy">Każdy pionek ma asa w rękawie. Twój ruch.</p>
      </div>
      <div class="xp-card">
        <span class="xp-emblem" aria-hidden="true">✧</span>
        <div>
          <span class="eyebrow">TWÓJ POZIOM {{ level }}</span
          ><strong>{{ rank }}</strong
          ><progress
            :value="session.xp % 100"
            max="100"
            aria-label="Postęp do kolejnego poziomu"
          /><small>{{ session.xp % 100 }} / 100 PD · Łącznie {{ session.xp }} PD</small>
        </div>
      </div>
    </header>

    <div class="arena-columns">
      <aside class="settings-column">
        <section class="arena-panel">
          <p class="eyebrow">01 / ROZGRYWKA</p>
          <h2>Wybierz swoją arenę</h2>
          <div class="mode-switch" role="group" aria-label="Tryb gry">
            <button
              type="button"
              :aria-pressed="state.mode === 'arena'"
              @click="state.mode !== 'arena' && requestRestart('arena')"
            >
              ✧ Arena Mocy</button
            ><button
              type="button"
              :aria-pressed="state.mode === 'classic'"
              @click="state.mode !== 'classic' && requestRestart('classic')"
            >
              Klasyczne
            </button>
          </div>
          <p class="settings-description">
            {{
              state.mode === 'arena'
                ? '12 pionków. 4 rodzaje mocy. Wykorzystaj każdą tylko raz.'
                : 'Warcaby amerykańskie: obowiązkowe bicie, krótki król, pionki biją do przodu.'
            }}
          </p>
          <label for="arena-opponent">Z KIM GRASZ?</label
          ><select
            id="arena-opponent"
            :value="opponent"
            @change="
              changeOpponent(($event.target as HTMLSelectElement).value as 'computer' | 'local')
            "
          >
            <option value="computer">Z komputerem</option>
            <option value="local">We dwoje · na tym urządzeniu</option>
          </select>
          <label for="arena-difficulty">POZIOM KOMPUTERA</label
          ><select
            id="arena-difficulty"
            v-model.number="difficulty"
            :disabled="opponent === 'local'"
          >
            <option :value="1">Rekrut · łatwy</option>
            <option :value="2">Taktyk · normalny</option>
            <option :value="3">Strateg · trudny</option>
          </select>
          <button class="primary-button full-button" type="button" @click="requestRestart()">
            Nowa rozgrywka <span>↗</span>
          </button>
        </section>
        <section class="arena-panel mission">
          <p class="eyebrow">MISJA NA TĘ PARTIĘ <span>+30 PD</span></p>
          <h3>{{ state.mode === 'arena' ? 'Nieoczywisty ruch' : 'Łowca okazji' }}</h3>
          <p>
            {{
              state.mode === 'arena'
                ? 'Użyj 3 mocy jasnej drużyny.'
                : 'Zbij 3 pionki jasną drużyną.'
            }}
          </p>
          <div class="mission-progress" :aria-label="`Postęp misji: ${session.mission} z 3`">
            <span v-for="n in 3" :key="n" :class="{ complete: session.mission >= n }"></span>
          </div>
          <small>{{
            session.missionAwarded
              ? '✓ Misja wykonana · +30 PD'
              : `${session.mission} / 3 · dasz radę!`
          }}</small>
        </section>
        <div class="arena-tip">
          <span aria-hidden="true">✳</span>
          <h3>Mały ruch.<br />Wielka różnica.</h3>
          <p>Bicie jest obowiązkowe. Gdy możesz zbić pionek, moce czekają na swoją kolej.</p>
        </div>
      </aside>

      <section class="board-column" aria-label="Plansza do warcabów">
        <div class="player-line" :class="{ current: state.side === 1 && !session.outcome }">
          <span class="player-avatar dark-avatar" aria-hidden="true">◉</span>
          <div>
            <strong>{{ opponent === 'computer' ? 'Komputer' : 'Gracz 2' }}</strong
            ><small>Ciemna drużyna · {{ pieceCount(1) }} pionków</small>
          </div>
          <span v-if="state.side === 1 && !session.outcome" class="turn-tag">{{
            thinking ? 'MYŚLI…' : 'TWÓJ RUCH'
          }}</span>
        </div>
        <div class="board-frame">
          <div class="board-grid">
            <button
              v-for="(cell, i) in state.board"
              :key="i"
              type="button"
              class="square"
              :class="{
                'dark-square': (Math.floor(i / 8) + (i % 8)) % 2 === 1,
                'last-square': lastMove?.from === i || lastMove?.to === i,
                'selected-square': selected === i,
              }"
              :aria-label="squareLabel(i)"
              :aria-pressed="selected === i"
              :disabled="locked"
              @click="clickSquare(i)"
            >
              <span v-if="i % 8 === 0" class="rank-label" aria-hidden="true">{{
                8 - Math.floor(i / 8)
              }}</span
              ><span v-if="i >= 56" class="file-label" aria-hidden="true">{{
                'abcdefgh'[i % 8]
              }}</span>
              <span
                v-if="cell"
                class="piece"
                :class="cell.side === 0 ? 'light-piece' : 'dark-piece'"
                ><span class="piece-icon" :class="{ spent: cell.used }" aria-hidden="true">{{
                  cell.power ? powerInfo[cell.power].symbol : cell.king ? '♛' : '●'
                }}</span
                ><span v-if="cell.king && cell.power" class="crown" aria-hidden="true"
                  >♛</span
                ></span
              >
              <span
                v-if="targets.some((m) => m.to === i)"
                class="target"
                :class="{ 'power-target': powerMode }"
                aria-hidden="true"
              ></span>
            </button>
          </div>
        </div>
        <div class="player-line" :class="{ current: state.side === 0 && !session.outcome }">
          <span class="player-avatar light-avatar" aria-hidden="true">◉</span>
          <div>
            <strong>{{ opponent === 'computer' ? 'Ty' : 'Gracz 1' }}</strong
            ><small>Jasna drużyna · {{ pieceCount(0) }} pionków</small>
          </div>
          <span v-if="state.side === 0 && !session.outcome" class="turn-tag">TWÓJ RUCH</span>
        </div>
        <p class="game-status" role="status" aria-live="polite">
          <span aria-hidden="true">{{ thinking ? '◌' : '↳' }}</span
          >{{ status }}
        </p>
        <div class="board-actions">
          <span>RUCH {{ String(session.turn).padStart(2, '0') }}</span
          ><button type="button" class="text-button" :aria-pressed="sound" @click="toggleSound">
            ♪ Dźwięk {{ sound ? 'wł.' : 'wył.' }}
          </button>
        </div>
        <button v-if="aiError" class="secondary-button" type="button" @click="startComputer">
          Ponów ruch komputera
        </button>
      </section>

      <aside class="arsenal-column">
        <section class="arena-panel arsenal">
          <p class="eyebrow">02 / TWÓJ ARSENAŁ</p>
          <h2>Przewaga tkwi w mocy</h2>
          <div class="selected-piece-card" :class="{ 'power-active': powerMode }">
            <span class="selected-symbol" aria-hidden="true">{{
              selectedInfo?.symbol ?? (piece?.king ? '♛' : '✧')
            }}</span>
            <p v-if="selected !== null && piece" class="eyebrow">
              {{ coordinate(selected).toUpperCase() }} · {{ piece.side === 0 ? 'JASNY' : 'CIEMNY' }}
              {{ piece.king ? 'KRÓL' : 'PIONEK' }}
            </p>
            <h3>
              {{
                piece
                  ? (selectedInfo?.name ?? (piece.king ? 'Król' : 'Zwykły pionek'))
                  : 'Poznaj swój pionek'
              }}
            </h3>
            <p>
              {{
                piece
                  ? (selectedInfo?.description ??
                    (piece.king
                      ? 'Jeden krok po skosie w każdą stronę. Król nie lata przez całą planszę.'
                      : 'Jeden krok po skosie do przodu. Zbijaj przeciwników i dotrzyj do ostatniego rzędu.'))
                  : 'Kliknij pionek na planszy, aby odkryć jego umiejętność.'
              }}
            </p>
            <button
              v-if="piece && state.mode === 'arena'"
              type="button"
              class="power-button"
              :disabled="locked || !skillMoves.length"
              :aria-pressed="powerMode"
              @click="togglePower"
            >
              {{ powerLabel }}
            </button>
          </div>
          <div class="power-legend" :class="{ 'classic-legend': state.mode === 'classic' }">
            <p class="eyebrow">
              {{ state.mode === 'classic' ? 'MOCE WYŁĄCZONE W KLASYKU' : 'TWOJE DOSTĘPNE MOCE' }}
            </p>
            <div
              v-for="power in powers"
              :key="power"
              class="legend-row"
              :title="powerInfo[power].description"
            >
              <span class="legend-symbol" aria-hidden="true">{{ powerInfo[power].symbol }}</span
              ><span>{{ powerInfo[power].name }}</span
              ><small>{{ powerCount(power) }} / 3</small>
            </div>
          </div>
        </section>
        <section class="arena-panel history">
          <div class="history-heading">
            <h3>Ostatnie ruchy</h3>
            <span aria-hidden="true">↗</span>
          </div>
          <p v-if="!session.history.length" class="empty-history">
            Historia zacznie się od Twojego pierwszego ruchu.
          </p>
          <ol v-else>
            <li v-for="(entry, i) in session.history" :key="`${entry.turn}-${i}`">
              <span class="history-number">{{ String(entry.turn).padStart(2, '0') }}</span
              ><span
                :class="entry.side === 0 ? 'light-dot' : 'dark-dot'"
                :aria-label="entry.side === 0 ? 'Jasne' : 'Ciemne'"
                >●</span
              ><span
                >{{ coordinate(entry.move.from) }}
                {{ entry.move.captureIndex !== undefined ? '×' : '→' }}
                {{ coordinate(entry.move.to)
                }}<small v-if="entry.move.skill || entry.promoted"
                  >{{ entry.move.skill ? powerInfo[entry.move.skill].name : '' }}
                  {{ entry.promoted ? '♛ Król' : '' }}</small
                ></span
              >
            </li>
          </ol>
        </section>
      </aside>
    </div>
    <footer class="arena-footer">
      <span>◈ Myśl o ruch do przodu. Albo zaskocz wszystkich.</span
      ><a
        v-if="!standalone"
        href="/games/warcaby-arena-mocy.html"
        download="warcaby-arena-mocy.html"
        >Pobierz grę · HTML + JS ↗</a
      ><span v-else>Wersja offline · bez połączenia z internetem</span>
    </footer>

    <GameDialog
      v-if="activeModal"
      :key="activeModal"
      :title="
        activeModal === 'help'
          ? 'Znane zasady. Nowe możliwości.'
          : activeModal === 'restart'
            ? 'Rozpocząć nową partię?'
            : outcomeTitle
      "
      @close="closeModal"
    >
      <template v-if="activeModal === 'help'"
        ><p>
          Wybierz pionek, a potem podświetlone pole. W grze z komputerem grasz jasnymi. We dwoje
          przekazujecie sobie urządzenie. Jasne zawsze zaczynają — to zasada tej areny.
        </p>
        <ul>
          <li>
            Pionki poruszają się i biją po skosie tylko do przodu. Bicie jest obowiązkowe w całej
            drużynie; możesz wybrać dowolną ścieżkę bicia.
          </li>
          <li>
            Jeśli po biciu możesz bić dalej, kontynuujesz tym samym pionkiem. Promocja na ostatnim
            rzędzie kończy turę. Król porusza się o jedno pole, a bije przez jedno pole w dowolną
            stronę.
          </li>
          <li>
            W Arenie każdy pionek ma jednorazową moc. Wybierz „Aktywuj moc”, a potem złote pole.
            Moce nie biją i nie można ich używać zamiast obowiązkowego bicia.
          </li>
        </ul>
        <p v-for="power in powers" :key="power">
          <strong>{{ powerInfo[power].symbol }} {{ powerInfo[power].name }}:</strong>
          {{ powerInfo[power].description }}
        </p>
        <p>
          Moce króla zachowują kierunek jego drużyny. Promocja nie odnawia mocy. Zużyte symbole
          pozostają przygaszone.
        </p>
        <p>
          Wygrywasz, gdy przeciwnik nie ma dozwolonego ruchu. Remis: trzecie powtórzenie pozycji lub
          80 ruchów obu stron bez bicia i promocji. To uproszczone zasady remisu przyjęte w tej
          grze.
        </p>
        <p>
          Jasna drużyna zdobywa 10 PD za zbicie, 20 za promocję, 100 za zwycięstwo i 30 za misję.
          Poziom jest wyłącznie ozdobą. PD pozostają w tej przeglądarce; planszy nie zapisujemy.
        </p>
        <button type="button" class="primary-button" @click="showHelp = false">
          Wchodzę do gry ↗
        </button></template
      >
      <template v-else-if="activeModal === 'restart'"
        ><p>Obecna rozgrywka zostanie zakończona. Zdobyte PD zachowasz.</p>
        <div class="dialog-buttons">
          <button type="button" class="primary-button" @click="restartMode && reset(restartMode)">
            Rozpocznij</button
          ><button type="button" class="secondary-button" @click="restartMode = null">
            Wróć do gry
          </button>
        </div></template
      >
      <template v-else
        ><p class="outcome-star">✧</p>
        <p>KONIEC ROZGRYWKI</p>
        <p>{{ session.outcome?.reason }}</p>
        <p v-if="session.outcome?.winner === 0" class="outcome-bonus">+100 PD za zwycięstwo</p>
        <div class="dialog-buttons">
          <button type="button" class="primary-button" @click="reset(state.mode)">
            Jeszcze jedna partia ↗</button
          ><button type="button" class="secondary-button" @click="showOutcome = false">
            Zobacz planszę
          </button>
        </div></template
      >
    </GameDialog>
  </div>
</template>

<style scoped>
.arena {
  --arena-lime: #d5ef89;
  --arena-muted: #a4b0a5;
  box-sizing: border-box;
  background: #101918;
  color: #e9ecde;
  font:
    14px/1.6 'DM Sans',
    system-ui,
    sans-serif;
  padding: 0 max(5%, calc((100% - 1390px) / 2));
  min-height: 100vh;
}
.arena *,
.arena *::before,
.arena *::after {
  box-sizing: border-box;
}
.arena h1,
.arena h2,
.arena h3,
.arena p {
  margin: 0;
}
.arena button,
.arena select {
  font: inherit;
}
.arena button {
  cursor: pointer;
}
.arena button:disabled {
  cursor: default;
}
.arena :focus-visible {
  outline: 3px solid #d5ef89;
  outline-offset: 3px;
}
.arena-top {
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #2b3731;
  font-size: 12px;
  letter-spacing: 0.14em;
  font-weight: 700;
}
.arena-motto {
  font-size: 9px;
  font-weight: 500;
  color: #a4b0a5;
  letter-spacing: 0.18em;
}
.muted {
  color: #a4b0a5;
}
.text-button {
  border: 0;
  padding: 6px 0;
  background: transparent;
  color: #d5ef89;
  font-size: 12px !important;
}
.arena-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 38px 0 32px;
}
.eyebrow {
  font-size: 9px;
  letter-spacing: 0.16em;
  font-weight: 700;
  color: #a4b0a5;
}
.arena h1 {
  font-size: 43px;
  line-height: 1.08;
  font-weight: 600;
  letter-spacing: -0.055em;
  margin: 12px 0;
}
.arena h1 span {
  color: #d5ef89;
}
.intro-copy {
  color: #a4b0a5;
  font-size: 13px;
}
.xp-card {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 225px;
}
.xp-emblem {
  font-size: 46px;
  color: #d5ef89;
}
.xp-card strong,
.xp-card small {
  display: block;
}
.xp-card strong {
  font-size: 20px;
  margin: 3px 0 8px;
}
.xp-card small {
  color: #a4b0a5;
  font-size: 10px;
  margin-top: 5px;
}
.xp-card progress {
  height: 4px;
  width: 155px;
  display: block;
  border: 0;
  border-radius: 4px;
  accent-color: #d5ef89;
}
progress::-webkit-progress-bar {
  background: #2b3731;
  border-radius: 4px;
}
progress::-webkit-progress-value {
  background: #d5ef89;
  border-radius: 4px;
}
progress::-moz-progress-bar {
  background: #d5ef89;
}
.arena-columns {
  display: grid;
  grid-template-columns: minmax(205px, 1fr) minmax(340px, 560px) minmax(210px, 1fr);
  gap: 30px;
  align-items: start;
}
.arena-panel {
  background: #16211f;
  border: 1px solid #2b3731;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.arena h2 {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.035em;
  margin: 9px 0 22px;
}
.arena h3 {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}
.mode-switch {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 3px;
  padding: 4px;
  border: 1px solid #354334;
  border-radius: 7px;
  background: #101918;
}
.mode-switch button {
  font-size: 10px;
  font-weight: 700;
  color: #a4b0a5;
  padding: 9px 3px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  white-space: nowrap;
}
.mode-switch button[aria-pressed='true'] {
  color: #17221a;
  background: #d5ef89;
}
.settings-description {
  min-height: 70px;
  padding-top: 13px;
  font-size: 12px;
  color: #a4b0a5;
}
.arena label {
  display: block;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #a4b0a5;
  margin: 17px 0 6px;
}
.arena select {
  width: 100%;
  border: 1px solid #354334;
  border-radius: 6px;
  background: #111c18;
  color: #e9ecde;
  padding: 10px 8px;
  font-size: 12px;
  color-scheme: dark;
}
.arena select:disabled {
  opacity: 0.5;
}
.primary-button,
.secondary-button,
.power-button {
  border: 0;
  border-radius: 6px;
  padding: 12px 15px;
  font:
    600 12px/1.4 system-ui,
    sans-serif;
  cursor: pointer;
  background: #d5ef89;
  color: #17221a;
  text-align: center;
}
.full-button {
  width: 100%;
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
}
.primary-button:hover {
  background: #e2ffa1;
}
.secondary-button {
  background: #26362e;
  color: #e9ecde;
  border: 1px solid #40503d;
}
.mission .eyebrow {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.mission .eyebrow span {
  color: #d5ef89;
  white-space: nowrap;
}
.mission h3 {
  margin: 14px 0 6px;
}
.mission p:not(.eyebrow),
.mission small {
  color: #a4b0a5;
  font-size: 11px;
}
.mission-progress {
  display: flex;
  gap: 5px;
  margin: 18px 0 8px;
}
.mission-progress span {
  height: 5px;
  border-radius: 3px;
  flex: 1;
  background: #2b3731;
}
.mission-progress .complete {
  background: #d5ef89;
}
.arena-tip {
  padding: 14px 15px;
}
.arena-tip > span {
  float: left;
  margin-right: 12px;
  color: #d5ef89;
  font-size: 26px;
}
.arena-tip h3 {
  font-size: 15px;
}
.arena-tip p {
  margin-top: 12px;
  color: #a4b0a5;
  font-size: 11px;
}
.board-column {
  min-width: 0;
}
.player-line {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 3px 0 15px;
}
.board-frame + .player-line {
  padding: 16px 0 0;
}
.player-avatar {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  border: 1px solid #41513e;
  border-radius: 9px;
  font-size: 24px;
}
.dark-avatar {
  color: #ba7459;
  background: #302820;
}
.light-avatar {
  color: #d5ef89;
  background: #293321;
}
.player-line strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
}
.player-line small {
  display: block;
  color: #a4b0a5;
  font-size: 10px;
}
.turn-tag {
  margin-left: auto;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: #d5ef89;
  background: #263521;
  border: 1px solid #3c5131;
  padding: 4px 7px;
  border-radius: 4px;
}
.board-frame {
  padding: 14px;
  border-radius: 9px;
  background: #26362e;
  box-shadow:
    0 20px 55px #0005,
    inset 0 1px #52644e80;
}
.board-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 2px;
}
.square {
  position: relative;
  border: 0;
  padding: 0;
  margin: 0;
  aspect-ratio: 1;
  min-width: 0;
  background: #b6bca4;
  display: grid;
  place-items: center;
  border-radius: 0;
}
.square:focus-visible {
  outline-offset: -4px;
  z-index: 1;
}
.square.dark-square {
  background: #52644e;
}
.square.last-square {
  background: #788855;
}
.square.selected-square {
  background: #9eab60;
  box-shadow: inset 0 0 0 2px #e3f7a6;
}
.rank-label,
.file-label {
  position: absolute;
  font-size: 8px;
  font-weight: 700;
  color: #26362e;
  line-height: 1;
  pointer-events: none;
}
.rank-label {
  top: 3px;
  left: 3px;
}
.file-label {
  bottom: 2px;
  right: 4px;
}
.dark-square .rank-label,
.dark-square .file-label {
  color: #e9ecde;
}
.piece {
  position: relative;
  width: 76%;
  height: 76%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid #dfe5b1;
  box-shadow:
    0 4px 0 #84916c,
    0 5px 7px #0006,
    inset 0 1px 3px #fff9;
  transition: transform 0.15s;
}
.piece::before {
  content: '';
  position: absolute;
  inset: 10%;
  border: 1px solid currentColor;
  opacity: 0.25;
  border-radius: 50%;
}
.light-piece {
  background: linear-gradient(135deg, #f2f4d5, #cbd5ac);
  color: #536442;
}
.dark-piece {
  background: linear-gradient(135deg, #ba7459, #874831);
  color: #f4d0a1;
  border-color: #c58a60;
  box-shadow:
    0 4px 0 #623621,
    0 5px 7px #0006,
    inset 0 1px 3px #ffcf9166;
}
.square:not(:disabled):hover .piece {
  transform: translateY(-2px);
}
.piece-icon {
  font-size: clamp(17px, 2.3vw, 29px);
  line-height: 1;
  font-weight: 600;
}
.piece-icon.spent {
  opacity: 0.3;
}
.crown {
  position: absolute;
  right: -4%;
  top: -14%;
  color: #fbe698;
  font-size: 16px;
  text-shadow: 0 1px 2px #000;
}
.target {
  position: absolute;
  width: 22%;
  height: 22%;
  border-radius: 50%;
  background: #deff9b;
  box-shadow: 0 0 14px #deff9b70;
}
.power-target {
  background: #f6cf83;
  box-shadow: 0 0 14px #f6cf8380;
}
.game-status {
  min-height: 64px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: #becab7;
  padding-top: 12px;
}
.game-status > span {
  color: #d5ef89;
  font-size: 22px;
}
.board-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #2b3731;
  padding: 7px 0;
}
.board-actions > span {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #a4b0a5;
}
.selected-piece-card {
  text-align: center;
  border: 1px dashed #41503d;
  border-radius: 9px;
  padding: 19px 12px;
  background: #13201b;
  min-height: 195px;
}
.selected-symbol {
  display: block;
  color: #d5ef89;
  font-size: 37px;
  line-height: 1.3;
  margin-bottom: 8px;
}
.selected-piece-card h3 {
  margin: 9px 0;
}
.selected-piece-card p:not(.eyebrow) {
  color: #a4b0a5;
  font-size: 11px;
}
.power-button {
  margin-top: 16px;
  width: 100%;
  background: #f6cf83;
  font-size: 11px;
}
.power-button:disabled {
  background: #2b3731;
  color: #a4b0a5;
}
.power-active {
  border-color: #f6cf83;
}
.power-legend {
  margin-top: 24px;
}
.classic-legend {
  opacity: 0.4;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-top: 11px;
  font-size: 12px;
}
.legend-symbol {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #354334;
  color: #d5ef89;
  font-size: 21px;
}
.legend-row small {
  margin-left: auto;
  color: #a4b0a5;
  font-size: 10px;
}
.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.history-heading span {
  color: #a4b0a5;
}
.empty-history {
  padding: 20px 0 5px;
  color: #a4b0a5;
  font-size: 11px;
}
.history ol {
  list-style: none;
  margin: 13px 0 0;
  padding: 0;
}
.history li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  font-size: 12px;
  border-top: 1px solid #2b3731;
}
.history li small {
  display: block;
  font-size: 9px;
  color: #a4b0a5;
}
.history-number {
  font-size: 9px;
  color: #a4b0a5;
}
.light-dot {
  color: #d5ef89;
}
.dark-dot {
  color: #ba7459;
}
.arena-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid #2b3731;
  margin-top: 34px;
  padding: 24px 0;
  font-size: 10px;
  color: #a4b0a5;
}
.arena-footer a {
  color: #d5ef89;
  text-decoration: none;
}
.dialog-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}
.outcome-star {
  color: #d5ef89;
  font-size: 54px;
}
.outcome-bonus {
  color: #d5ef89;
}
@media (max-width: 1100px) {
  .arena {
    padding-inline: 3%;
  }
  .arena-columns {
    gap: 18px;
    grid-template-columns: minmax(190px, 1fr) minmax(300px, 1.65fr) minmax(190px, 1fr);
  }
  .arena-panel {
    padding: 16px;
  }
  .arena h2 {
    font-size: 18px;
  }
}
@media (max-width: 850px) {
  .arena-columns {
    grid-template-columns: minmax(0, 1.7fr) minmax(205px, 1fr);
  }
  .board-column {
    grid-column: 1;
    grid-row: 1;
  }
  .arsenal-column {
    grid-column: 2;
    grid-row: 1;
  }
  .settings-column {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .settings-column .arena-tip {
    grid-column: 2;
    grid-row: 1;
    align-self: end;
    margin-bottom: 15px;
  }
  .settings-column .mission {
    align-self: start;
    padding-bottom: 25px;
  }
  .xp-card {
    display: none;
  }
  .arena-motto {
    display: none;
  }
  .piece-icon {
    font-size: 26px;
  }
}
@media (max-width: 560px) {
  .arena {
    padding-inline: 15px;
  }
  .arena-top {
    min-height: 62px;
  }
  .arena-intro {
    padding: 25px 0;
  }
  .arena h1 {
    font-size: 34px;
  }
  .arena-columns {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .board-column {
    order: 0;
    width: 100%;
  }
  .arsenal-column {
    order: 1;
    width: 100%;
  }
  .settings-column {
    order: 2;
    display: block;
    width: 100%;
  }
  .arsenal {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 15px;
  }
  .arsenal > .eyebrow,
  .arsenal > h2 {
    grid-column: 1 / -1;
  }
  .power-legend {
    margin-top: 5px;
  }
  .selected-piece-card {
    min-height: 180px;
    padding: 12px 8px;
  }
  .selected-symbol {
    font-size: 30px;
  }
  .arena-panel {
    margin-bottom: 12px;
  }
  .arena-footer {
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }
  .board-frame {
    padding: 12px;
  }
  .piece-icon {
    font-size: 25px;
  }
  .arena-tip {
    margin: 15px 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .piece {
    transition: none;
  }
}
</style>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import GameDialog from '../../components/GameDialog.vue'
import { RULES, stationSymbol, timeText } from './config'
import { useExpress } from './useExpress'
const {
  canvas,
  arena,
  ready,
  error,
  message,
  storageWarning,
  corrupt,
  help,
  restart,
  sound,
  tutorial,
  best,
  camera,
  building,
  tool,
  pending,
  from,
  target,
  hud,
  sync,
  pause,
  resume,
  focus,
  home,
  newest,
  zoom,
  setBuilding,
  setTool,
  connect,
  command,
  commit,
  select,
  choose,
  toggleSound,
  openHelp,
  askRestart,
  newGame,
  dismissTutorial,
} = useExpress()
const upgradePanel = ref<HTMLElement>()
watch(
  () => hud.value.mode,
  async (mode) => {
    if (mode === 'upgrade') {
      await nextTick()
      upgradePanel.value?.scrollIntoView({ block: 'nearest' })
      upgradePanel.value?.querySelector('button')?.focus({ preventScroll: true })
    }
  },
)
function run() {
  resume()
  void nextTick(() => {
    if (window.innerWidth < 950)
      arena.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
  })
}
const toolNames = {
  connect: 'Połącz',
  node: 'Nowy węzeł',
  split: 'Podziel tor',
  remove: 'Usuń tor',
}
const tools = ['connect', 'node', 'split', 'remove'] as const
function selectNode(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  select(id ? { kind: 'node', id } : null)
}
function cancelDraft() {
  pending.value = null
  from.value = null
  target.value = null
  sync()
}
</script>
<template>
  <div class="express-game">
    <header class="ne-heading">
      <div>
        <p class="ne-eyebrow">ZGRANA / NOCNA ZMIANA / DYSPOZYTORNIA</p>
        <h1>Nocny <em>ekspres.</em></h1>
        <p>Miasto nie zasypia. Niech Twoja kolej dotrzyma mu kroku.</p>
      </div>
      <button class="ne-button" @click="openHelp">Jak grać? ↗</button>
    </header>
    <div class="ne-layout">
      <div class="ne-main">
        <div ref="arena" class="ne-stage">
          <div class="ne-scoreboard" aria-label="Stan sieci">
            <div>
              <small>WYNIK</small
              ><strong data-testid="express-score">{{ hud.score.toLocaleString('pl-PL') }}</strong>
            </div>
            <div>
              <small>CZAS ZMIANY</small
              ><strong data-testid="express-time">{{ timeText(hud.elapsed) }}</strong>
            </div>
            <div>
              <small>POZOSTAŁE SZANSE</small
              ><strong class="ne-lives" :aria-label="`${hud.lives} z 3 szans`"
                ><span v-for="n in 3" :key="n" :class="{ used: n > hud.lives }">◆</span></strong
              >
            </div>
          </div>
          <div class="ne-map" :data-mode="hud.mode" :data-building="building">
            <canvas
              ref="canvas"
              tabindex="0"
              aria-label="Mapa Nocnego ekspresu. Przeciągnij tło, aby przesunąć mapę. Strzałki przesuwają widok, Enter wybiera środek mapy, plus i minus zmieniają skalę, P włącza pauzę."
              >Do gry potrzebujesz JavaScript i obsługi Canvas 2D.</canvas
            >
            <div class="ne-map-label">
              <i :class="{ running: hud.mode === 'playing' }"></i
              >{{
                building
                  ? 'TRYB BUDOWY'
                  : hud.mode === 'playing'
                    ? 'RUCH TRWA'
                    : hud.mode === 'gameover'
                      ? 'KONIEC ZMIANY'
                      : 'RUCH ZATRZYMANY'
              }}
            </div>
            <div class="ne-zoom">
              <button aria-label="Przybliż mapę" @click="zoom(1.25)">+</button
              ><button aria-label="Oddal mapę" @click="zoom(0.8)">−</button
              ><button aria-label="Wróć do zajezdni" title="Zajezdnia" @click="home">⌂</button
              ><button
                aria-label="Pokaż najnowszą dzielnicę"
                title="Nowa dzielnica"
                @click="newest"
              >
                ↗
              </button>
            </div>
            <div v-if="building" class="ne-crosshair" aria-hidden="true">+</div>
            <p class="ne-map-note">
              {{ Math.round(camera.zoom * 100) }}% · Przesuwaj tło · Dotknij minimapy
            </p>
          </div>
          <div class="ne-controls">
            <button
              class="ne-primary"
              :disabled="
                !ready || !!error || corrupt || hud.mode === 'upgrade' || hud.mode === 'gameover'
              "
              @click="hud.mode === 'playing' ? pause() : run()"
            >
              {{ hud.mode === 'playing' ? 'Ⅱ Pauza' : '▶ Wznów ruch' }}</button
            ><button
              class="ne-button"
              :aria-pressed="building"
              :disabled="!ready || corrupt || hud.mode === 'upgrade' || hud.mode === 'gameover'"
              @click="setBuilding(!building)"
            >
              {{ building ? '✓ Tryb ruchu' : '＋ Buduj sieć' }}</button
            ><button
              class="ne-button ne-sound"
              :aria-pressed="sound"
              :aria-label="sound ? 'Wyłącz dźwięk' : 'Włącz dźwięk'"
              @click="toggleSound"
            >
              {{ sound ? '♪ Dźwięk wł.' : '♪ Dźwięk wył.' }}
            </button>
          </div>
        </div>
        <p v-if="error" class="ne-notice" role="alert">{{ error }}</p>
        <p class="ne-message" role="status">{{ message }}</p>
        <div v-if="storageWarning" class="ne-notice" role="alert">
          {{ storageWarning
          }}<button v-if="corrupt" class="ne-button" @click="askRestart">
            Rozpocznij nową grę
          </button>
        </div>
        <div v-if="hud.warnings.length && hud.mode !== 'gameover'" class="ne-warnings">
          <button
            v-for="w in hud.warnings.slice(0, 3)"
            :key="`${w.first}:${w.second}`"
            @click="focus(w)"
          >
            ⚠ T{{ w.first }} i T{{ w.second }} blisko siebie
            {{ w.offscreen ? '· poza widokiem' : '' }} ↗
          </button>
        </div>
        <section v-if="building" class="ne-builder">
          <div class="ne-section-heading">
            <div>
              <p class="ne-eyebrow">BIURO PROJEKTOWE</p>
              <h2>Ułóż dobry przebieg.</h2>
            </div>
            <span>{{ hud.rails }} jednostek torów</span>
          </div>
          <div class="ne-tools">
            <button
              v-for="name in tools"
              :key="name"
              class="ne-button"
              :aria-pressed="tool === name"
              @click="setTool(name)"
            >
              {{ toolNames[name] }}
            </button>
          </div>
          <p v-if="tool === 'connect'">
            Przeciągnij między punktami lub dotknij początku i końca. Tory nie mogą się przecinać.
          </p>
          <p v-else-if="tool === 'node'">
            Dotknij wolnego miejsca. Klawiatura: strzałkami ustaw środek mapy i naciśnij Enter.
          </p>
          <p v-else-if="tool === 'split'">
            Dotknij pustego odcinka w miejscu nowego węzła. Pociąg na torze blokuje podział.
          </p>
          <p v-else>
            Wybierz pusty tor. Usunięcie zwraca dokładnie tyle materiału, ile przypisano do odcinka.
          </p>
          <div v-if="tool === 'connect'" class="ne-connect">
            <label
              >Początek<select v-model="from" @change="sync">
                <option :value="null">Wybierz punkt</option>
                <option v-for="n in hud.nodes" :key="n.id" :value="n.id">
                  {{ n.label }} · {{ n.kind === 'station' ? 'stacja' : 'węzeł' }}
                </option>
              </select></label
            ><label
              >Koniec<select v-model="target">
                <option :value="null">Wybierz punkt</option>
                <option v-for="n in hud.nodes" :key="n.id" :value="n.id">{{ n.label }}</option>
              </select></label
            ><button
              class="ne-button"
              :disabled="from === null || target === null"
              @click="from !== null && target !== null && connect(from, target)"
            >
              Podgląd toru
            </button>
          </div>
          <div v-if="pending && hud.verdict" class="ne-draft" :class="{ invalid: !hud.verdict.ok }">
            <p>{{ hud.verdict.message }}</p>
            <div>
              <button class="ne-primary" :disabled="!hud.verdict.ok" @click="commit">
                Zatwierdź zmianę</button
              ><button class="ne-button" @click="cancelDraft">Anuluj</button>
            </div>
          </div>
        </section>
        <section v-if="hud.mode === 'upgrade'" ref="upgradePanel" class="ne-upgrades">
          <p class="ne-eyebrow">NOWE MOŻLIWOŚCI / CZAS ZATRZYMANY</p>
          <h2>Miasto rośnie. Co dalej?</h2>
          <div>
            <button v-for="choice in hud.choices" :key="choice" @click="choose(choice)">
              <span>{{
                choice === 'train'
                  ? '＋ 1 POCIĄG'
                  : choice === 'capacity'
                    ? '＋ 2 MIEJSCA'
                    : '＋ 12 TORÓW'
              }}</span
              ><strong>{{
                choice === 'train'
                  ? 'Więcej kursów'
                  : choice === 'capacity'
                    ? 'Dłuższe składy'
                    : 'Nowe połączenia'
              }}</strong
              ><small>{{
                choice === 'train'
                  ? `Nowy skład w zajezdni. Flota ${hud.trains.length}/${RULES.maxTrains}.`
                  : choice === 'capacity'
                    ? `Pojemność wszystkich pociągów: ${hud.capacity} → ${hud.capacity + 2}.`
                    : 'Dodatkowy materiał na połączenie kolejnych stacji.'
              }}</small>
            </button>
          </div>
        </section>
        <section v-if="hud.mode === 'gameover'" class="ne-result">
          <p class="ne-eyebrow">OSTATNI POCIĄG TEJ NOCY</p>
          <h2>Zmiana zakończona.</h2>
          <strong>{{ hud.score.toLocaleString('pl-PL') }} pkt</strong>
          <p>
            {{ timeText(hud.elapsed) }} · {{ hud.delivered }} przewiezionych pasażerów ·
            {{ hud.districts }} dzielnic · {{ hud.accidents }} kolizje
          </p>
          <button class="ne-primary" @click="askRestart">Jeszcze jedna noc →</button>
        </section>
        <section v-if="tutorial && !building && hud.mode !== 'gameover'" class="ne-tutorial">
          <div class="ne-section-heading">
            <h2>Pierwsza noc w dyspozytorni</h2>
            <button class="ne-button" @click="dismissTutorial">Rozumiem</button>
          </div>
          <ol>
            <li>
              <strong>Spójrz na rozjazd.</strong> Złote ramiona pokazują aktywne połączenie. Dotknij
              go, żeby przełączyć kierunek.
            </li>
            <li>
              <strong>Wypuść pociągi.</strong> Zabierają pasażerów automatycznie. Wybierz skład, aby
              zobaczyć ich cele.
            </li>
            <li>
              <strong>Daj sobie czas.</strong> Pauzuj i buduj bez pośpiechu. Sygnałem przy stacji
              zatrzymasz odjazdy.
            </li>
          </ol>
        </section>
      </div>
      <aside class="ne-sidebar">
        <section class="ne-dispatch">
          <p class="ne-eyebrow">TABLICA DYSPOZYTORA</p>
          <h2>Twoja nocna sieć.</h2>
          <dl>
            <div>
              <dt>Rekord</dt>
              <dd>{{ best.toLocaleString('pl-PL') }} pkt</dd>
            </div>
            <div>
              <dt>Przewiezieni</dt>
              <dd>{{ hud.delivered }}</dd>
            </div>
            <div>
              <dt>Czekają na stacjach</dt>
              <dd>{{ hud.waiting }}</dd>
            </div>
            <div>
              <dt>Jednostki torów</dt>
              <dd>{{ hud.rails }}</dd>
            </div>
            <div>
              <dt>Dzielnice</dt>
              <dd>{{ hud.districts }} ↗</dd>
            </div>
          </dl>
          <p>
            Następna dostawa rozwoju co 2 minuty, nowa dzielnica co 3. Liczy się wyłącznie czas
            jazdy.
          </p>
        </section>
        <section class="ne-selection" aria-label="Wybrany obiekt">
          <p class="ne-eyebrow">POD LUPĄ</p>
          <label class="ne-node-picker"
            >Punkt na widocznej mapie<select :value="hud.node?.id ?? ''" @change="selectNode">
              <option value="">Wybierz punkt</option>
              <option v-for="n in hud.nodes" :key="n.id" :value="n.id">
                {{ n.label }} · {{ n.kind === 'station' ? 'stacja' : 'węzeł' }}
              </option>
            </select></label
          >
          <template v-if="hud.node"
            ><h2>
              {{
                hud.node.kind === 'station'
                  ? `${stationSymbol(hud.node.id)} Stacja ${hud.node.label}`
                  : `Rozjazd ${hud.node.label}`
              }}
            </h2>
            <template v-if="hud.node.kind === 'station'"
              ><p>{{ hud.node.waiting.length }} / 24 oczekujących</p>
              <button
                class="ne-primary"
                :disabled="hud.mode === 'upgrade' || hud.mode === 'gameover' || corrupt"
                @click="command({ type: 'hold', node: hud.node.id })"
              >
                {{ hud.node.hold ? '▶ Zezwól na odjazdy' : 'Ⅱ Wstrzymaj odjazdy' }}</button
              ><small>Pociągi mogą przyjeżdżać. Sygnał steruje tylko wyjazdem.</small></template
            ><template v-else
              ><p>
                Aktywne ramiona:
                {{
                  hud.node.ports
                    .filter((p) => hud.node!.pair.includes(p.node))
                    .map((p) => p.label)
                    .join(' ↔ ') || 'brak połączenia'
                }}
              </p>
              <button
                class="ne-primary"
                :disabled="hud.node.locked || corrupt"
                @click="command({ type: 'switch', node: hud.node.id })"
              >
                Przełącz zwrotnicę</button
              ><small
                >Trzy ramiona tworzą zwrotnicę. Pociąg na rozjeździe blokuje przełączenie.</small
              ></template
            ></template
          >
          <template v-else-if="hud.train"
            ><h2>Pociąg T{{ hud.train.id }}</h2>
            <p>{{ hud.train.onboard.length }} / {{ hud.capacity }} zajętych miejsc</p>
            <button class="ne-button" @click="focus(hud.train.point)">Znajdź na mapie ↗</button>
            <ul v-if="hud.train.onboard.length" class="ne-passengers">
              <li v-for="(p, i) in hud.train.onboard" :key="i">
                {{ stationSymbol(p.destination) }} Cel: <strong>{{ p.label }}</strong>
              </li>
            </ul>
            <p v-else>
              Ten skład jest pusty. Pasażerowie wsiądą przed odjazdem ze stacji.
            </p></template
          >
          <template v-else-if="hud.edge"
            ><h2>{{ hud.edge.aLabel }} ↔ {{ hud.edge.bLabel }}</h2>
            <p>Materiał przypisany do odcinka: {{ hud.edge.cost }}.</p>
            <p>Przejdź do budowy, aby podzielić lub usunąć pusty odcinek.</p></template
          >
          <template v-else
            ><h2>Zobacz, co jedzie.</h2>
            <p>
              Dotknij pociągu, stacji lub toru. Cele pasażerów i sygnały pojawią się tutaj.
            </p></template
          >
        </section>
        <section class="ne-fleet">
          <p class="ne-eyebrow">FLOTA / {{ hud.trains.length }} SKŁADY</p>
          <div>
            <button
              v-for="t in hud.trains"
              :key="t.id"
              class="ne-button"
              @click="select({ kind: 'train', id: t.id })"
            >
              T{{ t.id }} <span>{{ t.onboard }}/{{ hud.capacity }}</span>
            </button>
          </div>
        </section>
        <button class="ne-button ne-reset" @click="askRestart">Rozpocznij nową noc</button>
      </aside>
    </div>
    <section class="ne-guide">
      <p class="ne-eyebrow">KOLEJ MA SWÓJ RYTM. TY WYBIERASZ KIERUNEK.</p>
      <h2>Dobre połączenie<br />zaczyna się od <em>jednej decyzji.</em></h2>
      <div>
        <p>
          Nocny ekspres to kolejowa gra logistyczna, w której samodzielnie budujesz sieć i kierujesz
          ruchem. Nie prowadzisz lokomotywy — dbasz, by pasażerowie dojechali tam, gdzie trzeba.
          Każdy rozjazd może usprawnić podróż albo stać się miejscem niebezpiecznego spotkania.
        </p>
        <p>
          Nowe dzielnice otwierają kolejne możliwości, ale dłuższa sieć wymaga uważniejszego
          planowania. Rozwijaj flotę, zwiększaj pojemność wagonów i zostawiaj miejsce na przebudowę.
          Gdy robi się tłoczno, zatrzymaj czas. Twoja nocna zmiana może poczekać.
        </p>
      </div>
    </section>
    <section class="ne-faq">
      <h2>Zanim wyprawisz pierwszy pociąg</h2>
      <details>
        <summary>Jak sterować koleją na telefonie?</summary>
        <p>
          Przesuwaj mapę palcem i zmieniaj skalę dwoma palcami lub przyciskami. Dotknięcie zwrotnicy
          zmienia aktywne ramiona. W trybie budowy połącz punkty gestem albo wybierz je w panelu;
          każda zmiana wymaga zatwierdzenia.
        </p>
      </details>
      <details>
        <summary>Dlaczego pociąg nie jedzie?</summary>
        <p>
          Może czekać dwie sekundy na stacji, przed zamkniętym ramieniem zwrotnicy, przed zajętym
          wyjazdem lub przy ślepym torze. Sprawdź też sygnał stacji „Wstrzymaj odjazdy” i czy gra
          jest wznowiona.
        </p>
      </details>
      <details>
        <summary>Co dzieje się po zderzeniu?</summary>
        <p>
          Masz trzy szanse. Kolizja grupy pociągów zabiera jedną z nich, pasażerowie tych składów
          przepadają, a pociągi wracają do zajezdni. Ruch zostaje zatrzymany, żebyś mógł poprawić
          sieć. Trzecia kolizja kończy grę.
        </p>
      </details>
      <details>
        <summary>Jak zdobywać punkty i rozwijać miasto?</summary>
        <p>
          Dowieziony pasażer daje 10 punktów. Rezygnacja z oczekiwania po dwóch minutach lub pełna
          kolejka stacji kosztuje 5 punktów, ale nie odbiera szans. Co dwie minuty wybierasz rozwój,
          a co trzy odkrywasz dzielnicę z nowymi stacjami i dostawą torów.
        </p>
      </details>
      <details>
        <summary>Czy moja sieć zostanie zapisana?</summary>
        <p>
          Tak, zapisujemy całą rozgrywkę i rekord lokalnie w tej przeglądarce. Powrót zawsze zaczyna
          się od pauzy; podczas nieobecności nie płynie czas. Zapis nie jest synchronizowany między
          urządzeniami. Jeśli pamięć jest niedostępna lub pełna, zobaczysz ostrzeżenie.
        </p>
      </details>
    </section>
    <GameDialog v-if="help" title="Twoja pierwsza nocna zmiana" @close="help = false"
      ><p>
        Wznów gotową sieć, obserwuj pociągi i przełączaj złote ramiona rozjazdu. Pasażerowie mają
        konkretne stacje docelowe — nie wysiadają na przesiadki.
      </p>
      <ul>
        <li>Trzy kolizje kończą grę. Na peronach składy czekają bezpiecznie.</li>
        <li>Pauza jest nieograniczona. Budowanie zatrzymuje czas.</li>
        <li>
          Strzałki: przesuń mapę. Enter: wybierz środek mapy. + / −: skala. Home: zajezdnia. P /
          Escape: pauza.
        </li>
        <li>Formularz budowy pozwala łączyć widoczne punkty bez przeciągania.</li>
        <li>Ostrzeżenie o zbliżeniu nie zatrzymuje automatycznie pociągów.</li>
      </ul>
      <button class="ne-primary" @click="help = false">Rozumiem</button></GameDialog
    >
    <GameDialog v-if="restart" title="Rozpocząć nową noc?" @close="restart = false"
      ><p>
        {{
          corrupt
            ? 'Potwierdzenie zastąpi uszkodzony zapis nową siecią.'
            : 'Bieżąca sieć zostanie zastąpiona. Twój rekord pozostanie zapisany.'
        }}
      </p>
      <div class="ne-dialog-actions">
        <button class="ne-button" @click="restart = false">Zachowaj obecną sieć</button
        ><button class="ne-primary" @click="newGame">Nowa gra</button>
      </div></GameDialog
    >
  </div>
</template>
<style scoped>
.ne-node-picker {
  display: block;
  color: #a5b8c6;
  font-size: 11px;
  margin-bottom: 20px;
}
.ne-node-picker select {
  display: block;
  width: 100%;
  background: #102635;
  color: #e7e5d8;
  border: 1px solid #4c6474;
  border-radius: 8px;
  min-height: 44px;
  padding: 10px;
  margin-top: 7px;
  font: 12px system-ui;
}
.express-game {
  --ink: #ecede3;
  --muted: #a5b8c6;
  --gold: #eac087;
  --line: #354b5b;
  color: var(--ink);
  max-width: 1420px;
  margin: auto;
  padding: 38px 24px 80px;
  font-family: system-ui, sans-serif;
}
.ne-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}
.ne-eyebrow {
  color: var(--gold);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.18em;
  margin: 0 0 16px;
}
h1 {
  font-size: clamp(40px, 6vw, 78px);
  font-weight: 750;
  letter-spacing: -0.065em;
  line-height: 1;
  margin: 0 0 18px;
}
em {
  font-family: Georgia, serif;
  font-weight: 400;
  color: var(--gold);
}
.ne-heading > div > p:last-child {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}
.ne-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 285px;
  gap: 26px;
  align-items: start;
}
.ne-main {
  min-width: 0;
}
.ne-stage {
  scroll-margin-top: 8px;
}
.ne-scoreboard {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  border: 1px solid var(--line);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
  background: #102331;
  padding: 19px 22px;
}
.ne-scoreboard > div + div {
  border-left: 1px solid var(--line);
  padding-left: 20px;
}
.ne-scoreboard small {
  display: block;
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.1em;
}
.ne-scoreboard strong {
  display: block;
  color: #ffe1ad;
  font-size: 27px;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  margin-top: 5px;
}
.ne-lives {
  display: flex !important;
  gap: 7px;
}
.ne-lives .used {
  color: #4b4e51;
}
.ne-map {
  height: 570px;
  position: relative;
  overflow: hidden;
  border: 1px solid #526475;
  background: #0a1a29;
  border-radius: 0 0 16px 16px;
}
.ne-map canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  outline-offset: -4px;
}
.ne-map canvas:focus-visible {
  outline: 3px solid #f4d398;
}
.ne-map-label {
  position: absolute;
  top: 16px;
  left: 14px;
  color: #d8dfdc;
  background: #091b2adc;
  border: 1px solid #486072;
  padding: 9px 11px;
  border-radius: 7px;
  font-size: 9px;
  letter-spacing: 0.1em;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 7px;
}
.ne-map-label i {
  width: 6px;
  height: 6px;
  border-radius: 100%;
  background: #e8bd7b;
}
.ne-map-label i.running {
  background: #8fd7b3;
}
.ne-zoom {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  grid-template-columns: repeat(2, 36px);
  gap: 5px;
}
.ne-zoom button {
  height: 36px;
  border-radius: 7px;
  border: 1px solid #576d7d;
  background: #0d2335ee;
  color: #f3dfbd;
  font: 20px system-ui;
  cursor: pointer;
}
.ne-map-note {
  position: absolute;
  bottom: 10px;
  left: 12px;
  right: 140px;
  font-size: 9px;
  color: #c1cbd1;
  pointer-events: none;
  line-height: 1.6;
  margin: 0;
}
.ne-crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff70;
  pointer-events: none;
}
.ne-controls {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  margin-top: 12px;
}
.ne-button,
.ne-primary {
  font: 600 12px/1.4 system-ui;
  min-height: 44px;
  padding: 12px 16px;
  border-radius: 9px;
  cursor: pointer;
}
.ne-button {
  border: 1px solid #405666;
  background: #132b3b;
  color: #d8e1df;
}
.ne-primary {
  border: 1px solid #f4d39c;
  background: #eac087;
  color: #182b38;
}
.ne-button[aria-pressed='true'] {
  background: #29434b;
  border-color: #d8bd8b;
  color: #ffe6b3;
}
button:disabled {
  opacity: 0.42;
  cursor: default;
}
button:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 3px solid #ffe2a8;
  outline-offset: 3px;
}
.ne-message {
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  margin: 15px 0 20px;
}
.ne-notice {
  padding: 16px;
  background: #442b2d;
  border: 1px solid #946c60;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.8;
}
.ne-notice button {
  margin-top: 10px;
  display: block;
}
.ne-warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.ne-warnings button {
  color: #ffd3ad;
  background: #3a2d2b;
  border: 1px solid #b48b6f;
  font: 12px/1.5 system-ui;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}
.ne-sidebar {
  display: grid;
  gap: 18px;
}
.ne-dispatch,
.ne-selection,
.ne-fleet,
.ne-builder,
.ne-tutorial,
.ne-upgrades,
.ne-result {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: linear-gradient(135deg, #182c3c, #102332);
}
h2 {
  font-size: 25px;
  line-height: 1.2;
  font-weight: 500;
  letter-spacing: -0.04em;
  margin: 0 0 18px;
}
.ne-dispatch dl {
  margin: 25px 0;
}
.ne-dispatch dl > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #304453;
  font-size: 12px;
}
.ne-dispatch dt {
  color: var(--muted);
}
.ne-dispatch dd {
  margin: 0;
  color: #f1d29f;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ne-dispatch > p:last-child,
.ne-selection p,
.ne-builder > p {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
  margin-bottom: 0;
}
.ne-selection h2 {
  font-size: 22px;
}
.ne-selection button {
  width: 100%;
  margin-top: 16px;
}
.ne-selection small {
  display: block;
  font-size: 11px;
  line-height: 1.7;
  color: var(--muted);
  margin-top: 14px;
}
.ne-fleet > div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.ne-fleet button {
  padding: 9px 12px;
}
.ne-fleet span {
  font-size: 10px;
  color: var(--muted);
  margin-left: 5px;
}
.ne-passengers {
  list-style: none;
  padding: 0;
  margin: 15px 0 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 11px;
}
.ne-passengers li {
  background: #223b49;
  border-radius: 5px;
  padding: 7px;
}
.ne-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}
.ne-section-heading h2 {
  margin-bottom: 10px;
}
.ne-section-heading > span {
  color: #efd3a5;
  font-size: 12px;
  white-space: nowrap;
}
.ne-builder {
  margin: 18px 0;
}
.ne-tools {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}
.ne-tools button {
  flex: 1;
  padding: 10px;
}
.ne-connect {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 18px;
  align-items: end;
}
.ne-connect label {
  font-size: 11px;
  color: var(--muted);
  min-width: 0;
}
.ne-connect select {
  display: block;
  width: 100%;
  min-height: 44px;
  color: #e7e6da;
  background: #0e2535;
  border: 1px solid #4c6474;
  border-radius: 8px;
  padding: 10px;
  margin-top: 7px;
  font: 12px system-ui;
}
.ne-connect > button {
  grid-column: 1/-1;
}
.ne-draft {
  margin-top: 16px;
  padding: 16px;
  border-radius: 10px;
  background: #20463c;
  border: 1px solid #5e9d86;
  color: #dcf7e3;
  font-size: 13px;
}
.ne-draft.invalid {
  background: #412e30;
  border-color: #a07569;
  color: #ffcfbd;
}
.ne-draft > div {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ne-upgrades,
.ne-result {
  margin: 22px 0;
  border-color: #bb9766;
  background: linear-gradient(140deg, #26393e, #1c2b3d);
}
.ne-upgrades > div {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.ne-upgrades button {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 15px;
  background: #122b3d;
  color: #efeade;
  border: 1px solid #6d7774;
  border-radius: 12px;
  cursor: pointer;
}
.ne-upgrades button > span {
  color: #e2c394;
  font-size: 10px;
  letter-spacing: 0.1em;
}
.ne-upgrades strong {
  font-size: 17px;
  line-height: 1.4;
}
.ne-upgrades small {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}
.ne-result > strong {
  font-size: 44px;
  color: #f5d29e;
}
.ne-result > p {
  line-height: 1.8;
  font-size: 13px;
  color: var(--muted);
}
.ne-tutorial {
  margin-top: 22px;
  background: #122936;
}
.ne-tutorial h2 {
  font-size: 21px;
  margin: 0;
}
.ne-tutorial ol {
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.9;
  color: var(--muted);
  margin: 20px 0 0;
}
.ne-tutorial li + li {
  margin-top: 10px;
}
.ne-tutorial strong {
  color: #e4e7db;
}
.ne-guide {
  margin-top: 65px;
  padding-top: 38px;
  border-top: 1px solid var(--line);
}
.ne-guide h2 {
  font-size: clamp(32px, 4vw, 47px);
  line-height: 1.15;
  max-width: 750px;
}
.ne-guide > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.9;
}
.ne-guide p {
  margin-top: 0;
}
.ne-faq {
  margin-top: 45px;
}
.ne-faq h2 {
  font-size: 30px;
}
.ne-faq details {
  border-bottom: 1px solid var(--line);
  padding: 20px 0;
}
.ne-faq summary {
  font-size: 14px;
  color: #dfddcb;
  cursor: pointer;
}
.ne-faq details p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.9;
  max-width: 900px;
  margin-bottom: 0;
}
.ne-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
@media (max-width: 1050px) {
  .ne-layout {
    grid-template-columns: minmax(0, 1fr) 245px;
    gap: 16px;
  }
  .ne-dispatch,
  .ne-selection,
  .ne-fleet {
    padding: 20px;
  }
  .ne-upgrades > div {
    grid-template-columns: 1fr;
  }
  .ne-map {
    height: 540px;
  }
}
@media (max-width: 850px) {
  .ne-layout {
    grid-template-columns: 1fr;
  }
  .ne-sidebar {
    grid-template-columns: 1fr 1fr;
  }
  .ne-fleet,
  .ne-reset {
    grid-column: 1/-1;
  }
  .ne-map {
    height: 560px;
  }
  .ne-upgrades > div {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 600px) {
  .express-game {
    padding: 25px 12px 60px;
  }
  .ne-heading {
    align-items: start;
    gap: 10px;
  }
  .ne-heading h1 {
    font-size: 43px;
  }
  .ne-heading > div > p:last-child {
    font-size: 12px;
    max-width: 280px;
  }
  .ne-heading > .ne-button {
    padding: 8px 10px;
    font-size: 10px;
    flex-shrink: 0;
  }
  .ne-eyebrow {
    font-size: 8px;
    letter-spacing: 0.13em;
  }
  .ne-scoreboard {
    padding: 13px 12px;
    gap: 9px;
  }
  .ne-scoreboard > div + div {
    padding-left: 10px;
  }
  .ne-scoreboard small {
    font-size: 7px;
    letter-spacing: 0;
  }
  .ne-scoreboard strong {
    font-size: 20px;
  }
  .ne-lives {
    gap: 4px;
  }
  .ne-map {
    height: clamp(280px, calc(100svh - 205px), 540px);
  }
  .ne-map-label {
    font-size: 7px;
    left: 9px;
    top: 10px;
    padding: 7px;
  }
  .ne-zoom {
    right: 9px;
    top: 10px;
    grid-template-columns: repeat(2, 35px);
  }
  .ne-controls {
    grid-template-columns: 1fr 1fr 44px;
    gap: 6px;
  }
  .ne-controls > .ne-button,
  .ne-controls > .ne-primary {
    padding: 11px 8px;
    font-size: 11px;
  }
  .ne-sound {
    font-size: 0 !important;
  }
  .ne-sound:before {
    content: '♪';
    font-size: 18px;
  }
  .ne-sidebar {
    grid-template-columns: 1fr;
  }
  .ne-upgrades > div {
    grid-template-columns: 1fr;
  }
  .ne-upgrades button {
    padding: 16px;
    gap: 8px;
  }
  .ne-builder,
  .ne-tutorial,
  .ne-upgrades,
  .ne-result {
    padding: 19px 15px;
  }
  .ne-section-heading {
    align-items: start;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ne-section-heading h2 {
    font-size: 22px;
  }
  .ne-tutorial .ne-section-heading {
    flex-wrap: nowrap;
    align-items: center;
  }
  .ne-tutorial h2 {
    font-size: 18px;
  }
  .ne-tutorial .ne-button {
    padding: 10px;
    font-size: 10px;
  }
  .ne-tools {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .ne-guide {
    margin-top: 42px;
  }
  .ne-guide > div {
    grid-template-columns: 1fr;
    gap: 8px;
    font-size: 13px;
  }
  .ne-faq {
    margin-top: 28px;
  }
  .ne-faq summary {
    font-size: 13px;
  }
  .ne-stage {
    scroll-margin-top: 6px;
  }
  .ne-message {
    font-size: 11px;
  }
}
</style>

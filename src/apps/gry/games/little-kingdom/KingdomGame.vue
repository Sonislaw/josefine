<script setup lang="ts">
import { computed, ref } from 'vue'
import GameDialog from '../../components/GameDialog.vue'
import KingdomBoard from './KingdomBoard.vue'
import ResourceBar from './ResourceBar.vue'
import BuildingOffer from './BuildingOffer.vue'
import {
  BUILDINGS,
  KEYS,
  RESOURCE_NAMES,
  SEASONS,
  TERRAIN_NAMES,
  buildingProduction,
  capacity,
  explorationCost,
  frontier,
  production,
  season,
  terrain,
  year,
  type Point,
} from './engine'
import { useKingdom } from './useKingdom'
import { resourceList as priceText } from './format'
const {
  state,
  ready,
  corrupt,
  unavailable,
  selected,
  selectedBuilding,
  action,
  card,
  error,
  preview,
  blocked,
  tutorialDismissed,
  help,
  restart,
  message,
  actionName,
  select,
  chooseCard,
  explore,
  choose,
  commit,
  startNew,
  dismissTutorial,
} = useKingdom()
const board = ref<InstanceType<typeof KingdomBoard>>()
const seasonIndex = computed(() => season(state.value.turn))
const output = computed(() => production(state.value))
const edges = computed(() => frontier(state.value))
const selectedName = computed(() =>
  selectedBuilding.value
    ? selectedBuilding.value.kind === 'hall'
      ? 'Ratusz'
      : BUILDINGS[selectedBuilding.value.kind].name
    : selected.value
      ? TERRAIN_NAMES[terrain(state.value.seed, selected.value.x, selected.value.y)]
      : 'Wybierz pole na mapie',
)
const selectedOutput = computed(() =>
  selectedBuilding.value ? buildingProduction(state.value, selectedBuilding.value) : null,
)
function exploreFromList(p: Point) {
  explore(p)
  board.value?.locate({ x: p.x * 7 + 3, y: p.y * 7 + 3 })
}
function reset() {
  startNew()
  board.value?.locate({ x: 3, y: 3 })
}
function compass(p: Point) {
  return `Sektor ${p.x}, ${p.y}`
}
</script>
<template>
  <div class="kingdom-game">
    <header class="kingdom-heading">
      <div>
        <p class="eyebrow">ZGRANA / SPOKOJNA STRATEGIA</p>
        <h1>Małe <em>królestwo.</em></h1>
        <p>Od pierwszej chaty po ziemie za horyzontem. Twoje tempo, Twoja osada.</p>
      </div>
      <div class="heading-buttons">
        <button type="button" @click="help = true">Jak grać?</button
        ><button type="button" :disabled="!ready" @click="restart = true">Nowa osada</button>
      </div>
    </header>
    <div v-if="corrupt" class="kingdom-notice danger" role="alert">
      <strong>Nie możemy odczytać zapisanej osady.</strong>
      <p>Dotychczasowy zapis pozostaje nietknięty. Rozpoczęcie nowej osady go zastąpi.</p>
      <button type="button" @click="restart = true">Rozpocznij nową osadę</button>
    </div>
    <p v-if="unavailable" class="kingdom-notice" role="status">
      Zapis lokalny jest niedostępny. Możesz grać, ale po zamknięciu strony postęp może zniknąć.
    </p>
    <section v-if="!tutorialDismissed" class="kingdom-tutorial">
      <div>
        <strong>Mały początek. Wielkie plany.</strong>
        <p>
          1. Wybierz kartę budynku i pustą łąkę. 2. Sprawdź prognozę. 3. Zatwierdź turę. Buduj farmy
          przed zimą; tartak przy lesie da więcej drewna. Możesz też zacząć od zbierania zapasów.
        </p>
      </div>
      <button type="button" :disabled="!ready || corrupt" @click="dismissTutorial">Rozumiem</button>
    </section>
    <section aria-label="Twoja osada" class="kingdom-play">
      <div class="season-row">
        <span class="season-badge" :class="{ winter: seasonIndex === 3 }"
          >{{ ['❀', '☀', '❧', '❄'][seasonIndex] }} {{ SEASONS[seasonIndex] }}</span
        ><span
          >Rok {{ year(state.turn) }}
          <span class="muted"
            >/ Tura <b data-testid="kingdom-turn">{{ state.turn + 1 }}</b></span
          ></span
        ><span class="population"
          >♙ {{ state.population }} / {{ capacity(state) }}
          <span class="muted">mieszkańców</span></span
        >
      </div>
      <ResourceBar :resources="state.resources" :delta="preview?.delta" />
      <div class="economy-line">
        <span>Produkcja / turę: {{ priceText(output) }}</span
        ><span
          >Wyżywienie: {{ state.population }} · Bilans żywności:
          <b :class="{ deficit: output.food < state.population }"
            >{{ output.food - state.population >= 0 ? '+' : ''
            }}{{ output.food - state.population }}</b
          ></span
        >
      </div>
      <p v-if="seasonIndex === 2" class="winter-warning">
        ❄ Zima za {{ 9 - (state.turn % 12) }} {{ 9 - (state.turn % 12) === 1 ? 'turę' : 'tury' }}.
        Farmy i sady dadzą połowę plonów — zachowaj zapasy.
      </p>
      <p v-if="state.hunger" class="kingdom-notice danger">
        Brakuje żywności. Kolejna tura niedoboru spowoduje odejście mieszkańca. Sprawdź prognozę
        przed zatwierdzeniem.
      </p>
      <div class="kingdom-workspace">
        <div class="map-column">
          <KingdomBoard
            ref="board"
            :state="state"
            :selected="selected"
            :winter="seasonIndex === 3"
            @select="select"
            @explore="explore"
          />
          <div class="selected-panel">
            <div>
              <p class="eyebrow">
                WYBRANE POLE <span v-if="selected">/ {{ selected.x }}, {{ selected.y }}</span>
              </p>
              <h2>
                {{ selectedName }}
                <small v-if="selectedBuilding">· poziom {{ selectedBuilding.level }}</small>
              </h2>
              <p v-if="selectedBuilding && selectedBuilding.kind !== 'hall'">
                {{ BUILDINGS[selectedBuilding.kind].description }}
              </p>
              <p v-if="selectedOutput && KEYS.some((k) => selectedOutput![k])">
                Produkcja teraz: <strong>{{ priceText(selectedOutput) }}</strong>
              </p>
              <p v-if="selectedBuilding?.kind === 'house'">
                Miejsca dla mieszkańców: {{ selectedBuilding.level * 3 }}.
              </p>
              <p
                v-if="
                  selected &&
                  !selectedBuilding &&
                  terrain(state.seed, selected.x, selected.y) !== 'meadow'
                "
              >
                Zachowujemy naturalny teren. Wykorzystaj go, stawiając odpowiedni budynek na
                sąsiedniej łące.
              </p>
            </div>
            <div
              v-if="selectedBuilding && selectedBuilding.kind !== 'hall' && selected"
              class="selected-actions"
            >
              <button
                type="button"
                :disabled="blocked || selectedBuilding.level >= 3"
                @click="choose({ type: 'upgrade', ...selected })"
              >
                Ulepsz do {{ Math.min(3, selectedBuilding.level + 1) }}</button
              ><button
                type="button"
                :disabled="blocked"
                @click="choose({ type: 'demolish', ...selected })"
              >
                Wyburz
              </button>
            </div>
          </div>
          <details class="exploration">
            <summary>
              ✧ Nowe ziemie <span>{{ priceText(explorationCost(state)) }}</span>
            </summary>
            <p>Wybierz sąsiedni sektor. Każdy odkrywa 49 pól; samo wskazanie nic nie kosztuje.</p>
            <div>
              <button
                v-for="p in edges"
                :key="`${p.x},${p.y}`"
                type="button"
                :disabled="blocked"
                @click="exploreFromList(p)"
              >
                {{ compass(p) }} ↗
              </button>
            </div>
          </details>
        </div>
        <aside class="kingdom-planning" aria-label="Planowanie tury">
          <div class="offer-panel">
            <p class="eyebrow">CO ZBUDUJESZ?</p>
            <h2>Trzy możliwości.</h2>
            <BuildingOffer
              :offer="state.offer"
              :selected="card"
              :resources="state.resources"
              :disabled="blocked"
              @choose="chooseCard"
            /><button
              class="gather"
              type="button"
              :disabled="blocked"
              :aria-pressed="action?.type === 'gather'"
              @click="choose({ type: 'gather' })"
            >
              ♧ Zbierz zapasy <small>+3 żywności · +2 drewna · jedna tura</small>
            </button>
          </div>
          <div class="turn-preview" :class="{ 'has-action': action }">
            <p class="eyebrow">NASTĘPNA TURA / {{ SEASONS[seasonIndex] }}</p>
            <h2>{{ actionName }}</h2>
            <p v-if="!action">
              Wybierz budynek i pole, ulepsz swoją osadę albo zbierz zapasy. Czas płynie dopiero po
              zatwierdzeniu.
            </p>
            <p v-if="error" class="preview-error" role="status">{{ error }}</p>
            <template v-if="preview"
              ><p>Koszt: {{ priceText(preview.cost) }}</p>
              <p v-if="action?.type === 'demolish'">
                Odzyskasz połowę podstawowego kosztu. Ulepszenia nie zwiększają zwrotu.
              </p>
              <dl>
                <div v-for="r in KEYS" :key="r">
                  <dt>{{ RESOURCE_NAMES[r] }}</dt>
                  <dd>
                    {{ state.resources[r] }} → <strong>{{ preview.state.resources[r] }}</strong>
                    <small :class="{ deficit: preview.delta[r] < 0 }"
                      >({{ preview.delta[r] >= 0 ? '+' : '' }}{{ preview.delta[r] }})</small
                    >
                  </dd>
                </div>
                <div>
                  <dt>Mieszkańcy</dt>
                  <dd>{{ state.population }} → {{ preview.state.population }}</dd>
                </div>
              </dl>
              <p v-if="preview.shortage" class="preview-error">
                {{
                  preview.populationChange < 0
                    ? 'Uwaga: mieszkaniec odejdzie z powodu braku żywności.'
                    : 'Uwaga: nie wystarczy żywności dla wszystkich.'
                }}
              </p>
              <p v-if="preview.state.status === 'gameover'" class="preview-error">
                Ta tura zakończy rozgrywkę — osada opustoszeje.
              </p></template
            ><button
              type="button"
              class="commit-turn"
              :disabled="blocked || !preview"
              @click="commit"
            >
              Zatwierdź turę <span>→</span>
            </button>
          </div>
        </aside>
      </div>
      <p class="kingdom-message" role="status" aria-live="polite">{{ message }}</p>
      <section v-if="state.status === 'gameover'" class="kingdom-end">
        <p class="eyebrow">KAŻDA OSADA MA SWOJĄ HISTORIĘ</p>
        <h2>W królestwie zapadła cisza.</h2>
        <p>
          Przetrwano {{ state.turn }} tur. Odkryte sektory: {{ state.sectors.length }}. Budynki:
          {{ Object.keys(state.buildings).length }}. Spróbuj ponownie — farmy i zapasy pomogą
          przetrwać zimę.
        </p>
        <button type="button" @click="restart = true">Zbuduj nowe królestwo →</button>
      </section>
      <p class="save-note">
        ↳ Osada zapisuje się w tej przeglądarce po każdej turze. Bez konta i bez upływu czasu
        podczas przerwy.
      </p>
    </section>
    <section class="kingdom-guide">
      <p class="eyebrow">OD MAŁEJ OSADY DO WŁASNEGO ŚWIATA</p>
      <h2>Jeszcze jedna dobra decyzja.</h2>
      <div class="guide-columns">
        <article>
          <span>01 / BLISKOŚĆ MA ZNACZENIE</span>
          <h3>Nie tylko co, ale gdzie.</h3>
          <p>
            Tartak przy lesie, farma przy wodzie, młyn między polami. Sąsiednie kafelki potrafią
            zmienić skromną osadę w dobrze działające królestwo. Liczą się wspólne krawędzie, nie
            przekątne.
          </p>
        </article>
        <article>
          <span>02 / RYTM NATURY</span>
          <h3>Myśl o następnej zimie.</h3>
          <p>
            Rok to dwanaście tur. Jesienią sady dają więcej żywności, ale zimą plony maleją. Rosnąca
            populacja potrzebuje coraz więcej jedzenia — nie wydawaj wszystkich zasobów na domy.
          </p>
        </article>
        <article>
          <span>03 / ZA HORYZONTEM</span>
          <h3>Odkrywaj w swoim tempie.</h3>
          <p>
            Za granicą czekają kolejne lasy, skały i miejsca pod zabudowę. Nowe sektory zwiększają
            możliwości, lecz kosztują coraz więcej. Czasem lepiej ulepszyć farmę niż od razu
            poszerzać granice.
          </p>
        </article>
      </div>
    </section>
    <section class="kingdom-faq">
      <h2>Pytania przed pierwszą wyprawą</h2>
      <details>
        <summary>Czy Małe królestwo ma limit czasu?</summary>
        <p>
          Nie. To turowa gra strategiczna w przeglądarce. Możesz spokojnie sprawdzić produkcję i
          zaplanować ruch. Rozgrywka nie kończy się po określonej liczbie lat. Brak żywności
          powoduje odejścia mieszkańców, ale ratusz utrzymuje dwie ostatnie osoby — możesz odbudować
          osadę.
        </p>
      </details>
      <details>
        <summary>Jak zapisać grę i wrócić do osady?</summary>
        <p>
          Zapis odbywa się automatycznie po zatwierdzeniu tury, w pamięci tej przeglądarki. Wróć na
          tę samą stronę na tym samym urządzeniu. Czyszczenie danych witryny usuwa zapis; tryb
          prywatny może go nie zachować. Nie synchronizujemy osady między urządzeniami.
        </p>
      </details>
      <details>
        <summary>Dlaczego nie mogę postawić budynku?</summary>
        <p>
          Wybierz kartę z aktualnej oferty, pustą łąkę i sprawdź koszt. Na wodzie, skałach i w lesie
          nie budujemy. Wciąż możesz zebrać zapasy — ta akcja nie wymaga zasobów, lecz zużywa turę i
          mieszkańcy nadal potrzebują jedzenia.
        </p>
      </details>
      <details>
        <summary>Jak przybywają mieszkańcy?</summary>
        <p>
          Na końcu każdej pory roku może przybyć jedna osoba. Potrzebuje wolnego miejsca w domu i
          zapasów: po wyżywieniu musi zostać przynajmniej dwukrotność obecnej populacji. W turze
          niedoboru nikt nie przybywa.
        </p>
      </details>
      <details>
        <summary>Czy można grać na telefonie?</summary>
        <p>
          Tak. Dotknij pola, aby je wybrać, przeciągnij mapę, by zobaczyć dalsze ziemie, i przybliż
          dwoma palcami lub przyciskami. Budowę zawsze potwierdzasz oddzielnym przyciskiem, więc
          przesuwanie mapy nie wydaje zasobów.
        </p>
      </details>
    </section>
    <GameDialog v-if="help" title="Twoje małe królestwo" @close="help = false"
      ><p>
        Wybierz jedną akcję, sprawdź prognozę i zatwierdź turę. Budynki produkują od razu, następnie
        mieszkańcy jedzą, a na końcu pory roku może przybyć nowa osoba.
      </p>
      <ul>
        <li>Rok ma 12 tur, po 3 na porę roku. Zimą farmy i sady dają połowę plonów.</li>
        <li>
          Każdy mieszkaniec potrzebuje 1 żywności na turę. Pierwszy niedobór to ostrzeżenie, kolejne
          oznaczają odejścia. Ratusz produkuje 2 żywności i utrzymuje dwie ostatnie osoby.
        </li>
        <li>
          Buduj na łąkach. Sąsiedztwo czterech krawędzi daje premie. Budynki ulepszysz do poziomu 3.
        </li>
        <li>Oferta zmienia się wyłącznie po budowie. Zawsze zawiera farmę.</li>
        <li>Zbieranie daje 3 żywności i 2 drewna, ale także zużywa turę.</li>
        <li>
          Mapa: przeciąganie i gest przybliżania. Klawiatura: strzałki wybierają pola, Home wraca do
          ratusza.
        </li>
      </ul>
      <button type="button" class="dialog-action" @click="help = false">
        Wracam do osady
      </button></GameDialog
    >
    <GameDialog v-if="restart" title="Założyć nową osadę?" @close="restart = false"
      ><p>
        {{
          corrupt
            ? 'Nieczytelny zapis zostanie zastąpiony nowym. Tej operacji nie można cofnąć.'
            : 'Obecna osada zostanie zastąpiona nową mapą. Tej operacji nie można cofnąć.'
        }}
      </p>
      <div class="restart-actions">
        <button type="button" class="dialog-action" @click="reset">Tak, nowa osada</button
        ><button type="button" class="dialog-action secondary" @click="restart = false">
          Zachowaj obecną
        </button>
      </div></GameDialog
    >
  </div>
</template>
<style scoped>
.kingdom-game {
  --cream: #f5ebcf;
  --sage: #b9ce9c;
  max-width: 1320px;
  margin: auto;
  padding: 34px 24px 70px;
  color: var(--cream);
  font-family: system-ui, sans-serif;
}
.kingdom-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 26px;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 0.17em;
  font-weight: 750;
  color: #d4b877;
  margin: 0 0 12px;
}
h1 {
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(38px, 5vw, 70px);
  letter-spacing: -0.055em;
  line-height: 1.06;
  margin: 0 0 16px;
}
h1 em {
  font-weight: 400;
  color: #bed68f;
}
h2 {
  font-size: 20px;
  letter-spacing: -0.035em;
  margin: 0 0 12px;
}
h3 {
  font-family: Georgia, serif;
  font-size: 24px;
  font-weight: 400;
  margin: 12px 0;
}
.kingdom-heading > div > p:last-child {
  font-size: 14px;
  color: #b9c7b4;
  max-width: 540px;
  line-height: 1.7;
  margin: 0;
}
.heading-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
button {
  font: inherit;
  cursor: pointer;
  border: 1px solid #677458;
  border-radius: 10px;
  background: #294637;
  color: #f6ebcc;
  padding: 11px 14px;
  min-height: 44px;
  font-size: 12px;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
button:focus-visible,
summary:focus-visible {
  outline: 3px solid #e9d184;
  outline-offset: 3px;
}
.kingdom-tutorial {
  display: flex;
  gap: 22px;
  align-items: center;
  background: linear-gradient(115deg, #344d39, #253f34);
  border: 1px solid #667549;
  border-radius: 17px;
  padding: 18px 22px;
  margin-bottom: 24px;
}
.kingdom-tutorial strong {
  font-family: Georgia, serif;
  font-size: 21px;
  font-weight: 400;
}
.kingdom-tutorial p {
  font-size: 12px;
  line-height: 1.8;
  color: #d4dec2;
  margin: 8px 0 0;
}
.kingdom-tutorial button {
  flex-shrink: 0;
}
.kingdom-play {
  padding: 22px;
  border: 1px solid #3b5141;
  border-radius: 26px;
  background: linear-gradient(145deg, #1b3229, #11271f);
}
.season-row {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.season-badge {
  color: #e1e9ac;
  background: #425937;
  border: 1px solid #69814d;
  padding: 8px 13px;
  border-radius: 30px;
}
.season-badge.winter {
  background: #36585c;
  border-color: #7daba4;
  color: #d3e7e0;
}
.population {
  margin-left: auto;
}
.muted {
  color: #a2b79e;
}
.economy-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #b4c5a9;
  font-size: 11px;
  line-height: 1.8;
  margin: 13px 2px 20px;
  flex-wrap: wrap;
}
.deficit {
  color: #ffbc94;
}
.winter-warning {
  background: #3a4532;
  border: 1px solid #7a8152;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 12px;
  color: #f0dfae;
  line-height: 1.7;
}
.kingdom-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 20px;
  align-items: start;
}
.map-column {
  min-width: 0;
}
.kingdom-planning {
  display: grid;
  gap: 14px;
}
.offer-panel,
.turn-preview {
  background: #243d30;
  border: 1px solid #4e6143;
  border-radius: 18px;
  padding: 18px;
}
.gather {
  display: block;
  width: 100%;
  margin-top: 14px;
  text-align: left;
  background: transparent;
  border-style: dashed;
  color: #e8dcaf;
}
.gather[aria-pressed='true'] {
  border-color: #e8c66e;
  background: #405238;
}
.gather small {
  display: block;
  font-size: 10px;
  color: #b7c79c;
  margin-top: 5px;
}
.turn-preview {
  background: #ece6d3;
  color: #294635;
}
.turn-preview .eyebrow {
  color: #87643b;
}
.turn-preview p {
  font-size: 12px;
  line-height: 1.8;
  color: #596c53;
}
.turn-preview.has-action {
  border-color: #ddbf78;
}
.turn-preview dl {
  font-size: 12px;
  margin: 12px 0;
}
.turn-preview dl > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #ced3bd;
}
.turn-preview dd {
  margin: 0;
}
.turn-preview small {
  font-size: 10px;
  color: #536c3d;
}
.turn-preview .deficit,
.turn-preview .preview-error {
  color: #963f29;
}
.commit-turn {
  background: #345a3e;
  width: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  border: 0;
  margin-top: 16px;
  min-height: 49px;
  color: #fff2c7;
}
.selected-panel {
  margin-top: 14px;
  border: 1px solid #425b42;
  border-radius: 16px;
  padding: 18px;
  background: #213a2d;
}
.selected-panel h2 {
  font-size: 20px;
}
.selected-panel h2 small {
  font-family: system-ui;
  font-size: 12px;
  color: #b9c7a6;
}
.selected-panel p:not(.eyebrow) {
  font-size: 12px;
  line-height: 1.8;
  color: #bfd0b2;
  margin: 8px 0 0;
}
.selected-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.exploration {
  margin-top: 14px;
  border: 1px solid #425b42;
  border-radius: 16px;
  padding: 16px;
}
.exploration summary {
  cursor: pointer;
  font-size: 14px;
}
.exploration summary span {
  display: block;
  font-size: 11px;
  color: #b7c8a2;
  margin: 8px 0 0 15px;
}
.exploration > p {
  font-size: 12px;
  line-height: 1.7;
  color: #b7c8a2;
}
.exploration > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 250px;
  overflow: auto;
}
.kingdom-message {
  font-size: 12px;
  line-height: 1.8;
  border-left: 2px solid #a2bd75;
  padding: 2px 0 2px 12px;
  color: #e3ddba;
  margin-top: 24px;
}
.save-note {
  font-size: 11px;
  color: #99b294;
  margin: 16px 0 0;
  line-height: 1.7;
}
.kingdom-notice {
  padding: 16px;
  border: 1px solid #b59b5a;
  background: #433d28;
  color: #f2dfb4;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.8;
}
.danger {
  border-color: #a77152;
  background: #4b3529;
  color: #ffdec2;
}
.kingdom-end {
  padding: 28px;
  text-align: center;
  border: 1px solid #bf9b62;
  border-radius: 16px;
  margin-top: 20px;
}
.kingdom-end p:not(.eyebrow) {
  font-size: 14px;
  line-height: 1.8;
  color: #cbd3b1;
}
.kingdom-guide {
  margin-top: 64px;
}
.kingdom-guide > h2 {
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: 36px;
}
.guide-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 28px;
}
.guide-columns article {
  border-top: 1px solid #566544;
  padding-top: 24px;
}
.guide-columns span {
  font-size: 10px;
  letter-spacing: 0.09em;
  color: #c5b87d;
}
.guide-columns p {
  font-size: 13px;
  line-height: 1.9;
  color: #b1c0a8;
}
.kingdom-faq {
  margin-top: 52px;
}
.kingdom-faq h2 {
  font-family: Georgia, serif;
  font-size: 28px;
  font-weight: 400;
}
.kingdom-faq details {
  border-bottom: 1px solid #3e513c;
  padding: 18px 0;
}
.kingdom-faq summary {
  cursor: pointer;
  font-size: 14px;
  color: #e7e2c7;
}
.kingdom-faq p {
  font-size: 13px;
  line-height: 1.9;
  color: #b5c5aa;
  max-width: 850px;
}
.dialog-action {
  background: #d2e59d;
  color: #263e2b;
  font-weight: 700;
}
.dialog-action.secondary {
  background: #344c3b;
  color: #e5edcf;
}
.restart-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
@media (min-width: 1400px) {
  .kingdom-workspace {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
@media (max-width: 950px) {
  .kingdom-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .kingdom-planning {
    grid-template-columns: 1fr 1fr;
  }
  .kingdom-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .guide-columns {
    gap: 20px;
  }
}
@media (max-width: 600px) {
  .kingdom-game {
    padding: 26px 12px 55px;
  }
  .kingdom-play {
    padding: 12px;
    border-radius: 18px;
  }
  .kingdom-tutorial {
    padding: 16px;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
  .kingdom-planning {
    grid-template-columns: 1fr;
  }
  .season-row {
    font-size: 12px;
    gap: 8px;
  }
  .population {
    margin-left: 0;
    width: 100%;
  }
  .kingdom-workspace {
    gap: 14px;
  }
  .guide-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .kingdom-guide > h2 {
    font-size: 30px;
  }
  .economy-line {
    font-size: 10px;
  }
  .kingdom-heading h1 {
    font-size: 43px;
  }
  .kingdom-heading > div > p:last-child {
    font-size: 13px;
  }
}
</style>

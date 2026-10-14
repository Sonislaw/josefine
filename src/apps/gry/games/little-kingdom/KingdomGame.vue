<script setup lang="ts">
import { computed, ref } from 'vue'
import GameDialog from '../../components/GameDialog.vue'
import KingdomBoard from './KingdomBoard.vue'
import ResourceBar from './ResourceBar.vue'
import BuildingOffer from './BuildingOffer.vue'
import DiscoveryJournal from './DiscoveryJournal.vue'
import DiscoveryArt from './DiscoveryArt.vue'
import HallArt from './HallArt.vue'
import ProgressionPanel from './ProgressionPanel.vue'
import ResidentsPanel from './ResidentsPanel.vue'
import DefencePanel from './DefencePanel.vue'
import BattleSummary from './BattleSummary.vue'
import {
  TACTICS,
  militaryBuilding,
  upkeep,
  armySize,
  type Tactic,
  type MilitaryBuilding,
} from './military'
import { settlementAt, SETTLEMENTS, RELATIONS } from './neighbours'
import { REQUESTS } from './requests'
import { RANKS } from './progression'
import { DISCOVERIES, discoveryStatus, discoveryBonus } from './discoveries'
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
  tactic,
  latestBattle,
  state,
  ready,
  corrupt,
  unavailable,
  selected,
  selectedBuilding,
  selectedDiscovery,
  latestDiscovery,
  latestPromotion,
  latestRequest,
  manageResidents,
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
const buildTab = ref<'economy' | 'defence'>('economy')
function changeBuildTab(tab: 'economy' | 'defence') {
  buildTab.value = tab
  card.value = null
  action.value = null
}
const tactics = Object.keys(TACTICS) as Tactic[]
const militaryOffer = computed(() =>
  (['barracks', 'watchtower'] as MilitaryBuilding[]).filter(
    (kind) => !Object.values(state.value.buildings).some((b) => b.kind === kind),
  ),
)
const selectedSettlement = computed(() =>
  selected.value ? settlementAt(state.value, selected.value) : undefined,
)
const seasonIndex = computed(() => season(state.value.turn))
const output = computed(() => production(state.value))
const edges = computed(() => frontier(state.value))
const selectedName = computed(() =>
  selectedSettlement.value
    ? SETTLEMENTS[selectedSettlement.value.id]!.name
    : selectedBuilding.value
      ? selectedBuilding.value.kind === 'hall'
        ? 'Ratusz'
        : BUILDINGS[selectedBuilding.value.kind].name
      : selectedDiscovery.value
        ? DISCOVERIES[selectedDiscovery.value.kind].name
        : selected.value
          ? TERRAIN_NAMES[terrain(state.value.seed, selected.value.x, selected.value.y)]
          : 'Wybierz pole na mapie',
)
const selectedOutput = computed(() =>
  selectedBuilding.value ? buildingProduction(state.value, selectedBuilding.value) : null,
)
const selectedBonus = computed(() =>
  selectedBuilding.value ? discoveryBonus(state.value, selectedBuilding.value) : null,
)
const previewBonuses = computed(() => {
  const a = action.value,
    p = preview.value
  if (!a || !p || !['landmark', 'build', 'upgrade'].includes(a.type) || !('x' in a)) return []
  return Object.values(p.state.buildings).flatMap((b) => {
    const bonus = discoveryBonus(p.state, b)
    if (
      !bonus ||
      (a.type === 'landmark'
        ? bonus.source.x !== a.x || bonus.source.y !== a.y
        : b.x !== a.x || b.y !== a.y)
    )
      return []
    return [
      { building: b.kind === 'hall' ? 'Ratusz' : BUILDINGS[b.kind].name, x: b.x, y: b.y, ...bonus },
    ]
  })
})
function locateDiscovery(p: Point) {
  card.value = null
  select(p)
  board.value?.reveal(p)
}
function exploreFromList(p: Point) {
  explore(p)
  board.value?.locate({ x: p.x * 7 + 3, y: p.y * 7 + 3 })
}
function reset() {
  startNew()
  buildTab.value = 'economy'
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
        <p>
          Odkrywaj sąsiednie osady, dbaj o mieszkańców i przygotuj obronę. Każdą decyzję podejmujesz
          we własnym tempie — czas płynie tylko po zatwierdzeniu tury.
        </p>
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
      <p v-if="state.affairs.raid" class="kingdom-notice danger" role="status">
        ⚑ Najazd za {{ state.affairs.raid.dueTurn - state.turn }} tur! Wróg: 3 włóczników i 2
        łuczników. Przygotuj obronę lub opłać rozejm w panelu sąsiadów.
      </p>
      <p class="rank-badge" data-testid="kingdom-rank">♜ {{ RANKS[state.rank]!.name }}</p>
      <div class="economy-line">
        <span>Produkcja / turę: {{ priceText(output) }}</span
        ><span
          >Wyżywienie: {{ state.population }} + wojsko {{ upkeep(state.affairs.army) }} · Bilans
          żywności:
          <b :class="{ deficit: output.food < state.population + upkeep(state.affairs.army) }"
            >{{ output.food - state.population - upkeep(state.affairs.army) >= 0 ? '+' : ''
            }}{{ output.food - state.population - upkeep(state.affairs.army) }}</b
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
      <div v-if="latestPromotion" class="promotion-announcement" role="status">
        <svg viewBox="0 0 64 64" aria-hidden="true"><HallArt :rank="latestPromotion.rank" /></svg>
        <div>
          <small>NOWY ROZDZIAŁ TWOJEJ OSADY</small>
          <strong>Awans: {{ RANKS[latestPromotion.rank]!.name }}!</strong>
          <span
            >Prezent dodany do zapasów: {{ priceText(RANKS[latestPromotion.rank]!.gift) }}.</span
          >
        </div>
        <button
          type="button"
          aria-label="Zamknij komunikat o awansie"
          @click="latestPromotion = null"
        >
          Zamknij
        </button>
      </div>
      <ProgressionPanel :state="state" />
      <div v-if="latestBattle" class="battle-result" role="status">
        <BattleSummary :report="latestBattle" /><button type="button" @click="latestBattle = null">
          Zamknij raport bitwy
        </button>
      </div>
      <ResidentsPanel
        :state="state"
        :disabled="blocked"
        :latest="latestRequest"
        @command="manageResidents"
        @locate="locateDiscovery"
        @dismiss="latestRequest = null"
      />
      <div v-if="latestDiscovery" class="discovery-announcement" role="status">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <DiscoveryArt :discovery="latestDiscovery" />
        </svg>
        <div>
          <small>ZIEMIE PEŁNE TAJEMNIC</small
          ><strong>Odkryto: {{ DISCOVERIES[latestDiscovery.kind].name }}</strong
          ><span>Miejsce czeka na Twoją decyzję. Zbadanie zajmie osobną turę.</span>
        </div>
        <button type="button" @click="locateDiscovery(latestDiscovery)">Pokaż na mapie ↗</button>
      </div>
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
          <DefencePanel
            :state="state"
            :disabled="blocked"
            @choose="choose"
            @locate="locateDiscovery"
          />
          <div class="selected-panel">
            <div>
              <p class="eyebrow">
                WYBRANE POLE <span v-if="selected">/ {{ selected.x }}, {{ selected.y }}</span>
              </p>
              <h2>
                {{ selectedName }}
                <small v-if="selectedBuilding?.kind === 'hall'"
                  >· {{ RANKS[state.rank]!.name }}</small
                >
                <small v-else-if="selectedBuilding">· poziom {{ selectedBuilding.level }}</small>
              </h2>
              <p v-if="selectedBuilding && selectedBuilding.kind !== 'hall'">
                {{ BUILDINGS[selectedBuilding.kind].description }}
              </p>
              <p v-if="selectedSettlement">
                {{ RELATIONS[selectedSettlement.relation] }}.
                {{ SETTLEMENTS[selectedSettlement.id]!.description }} Decyzje znajdziesz w panelu
                „Sąsiednie osady”.
              </p>
              <p v-if="selectedBuilding?.damaged" class="kingdom-notice danger">
                Uszkodzony budynek: produkcja i premie są wyłączone. Naprawa zachowa jego poziom.
              </p>
              <p v-if="selectedBuilding?.kind === 'hall'">
                Ratusz zmienia wygląd wraz z rangą osady. Jego produkcja pozostaje taka sama; nie
                wymaga osobnego ulepszania.
              </p>
              <p v-if="selectedOutput && KEYS.some((k) => selectedOutput![k])">
                Produkcja teraz: <strong>{{ priceText(selectedOutput) }}</strong>
              </p>
              <p v-if="selectedBonus" class="discovery-bonus">
                ✧ Premia: {{ DISCOVERIES[selectedBonus.source.kind].name }} ({{
                  selectedBonus.source.x
                }}, {{ selectedBonus.source.y }}) ·
                {{
                  selectedBonus.resource === 'food'
                    ? '+1 żywności przed zimowym zmniejszeniem plonów'
                    : '+1 moneta'
                }}. Nie mnoży się przez poziom ani liczbę miejsc.
              </p>
              <div v-if="selectedDiscovery && !selectedBuilding" class="discovery-description">
                <span>{{ discoveryStatus(selectedDiscovery) }}</span>
                <p>{{ DISCOVERIES[selectedDiscovery.kind].description }}</p>
                <p>{{ DISCOVERIES[selectedDiscovery.kind].benefit }}</p>
                <p v-if="selectedDiscovery.status === 'available'">
                  Koszt: {{ priceText(DISCOVERIES[selectedDiscovery.kind].cost) }} · jedna tura.
                </p>
                <p v-else-if="!DISCOVERIES[selectedDiscovery.kind].permanent">
                  Nagroda została już odebrana. To pole jest dostępne pod zabudowę.
                </p>
              </div>
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
              v-if="selectedDiscovery?.status === 'available' && !selectedBuilding && selected"
              class="selected-actions"
            >
              <button
                type="button"
                :disabled="blocked"
                @click="choose({ type: 'landmark', ...selected })"
              >
                {{ DISCOVERIES[selectedDiscovery.kind].action }}
              </button>
            </div>
            <div
              v-if="selectedBuilding && selectedBuilding.kind !== 'hall' && selected"
              class="selected-actions"
            >
              <button
                type="button"
                v-if="!selectedBuilding.damaged && !militaryBuilding(selectedBuilding.kind)"
                :disabled="blocked || selectedBuilding.level >= 3"
                @click="choose({ type: 'upgrade', ...selected })"
              >
                Ulepsz do {{ Math.min(3, selectedBuilding.level + 1) }}</button
              ><button
                v-if="selectedBuilding.damaged"
                type="button"
                :disabled="blocked"
                @click="choose({ type: 'repair', ...selected })"
              >
                Napraw budynek</button
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
            <p>
              Wybierz sąsiedni sektor. Każdy odkrywa 49 pól i jedno wyjątkowe miejsce; samo
              wskazanie nic nie kosztuje.
            </p>
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
          <DiscoveryJournal :discoveries="state.discoveries" @locate="locateDiscovery" />
        </div>
        <aside class="kingdom-planning" aria-label="Planowanie tury">
          <div class="offer-panel">
            <div class="build-tabs" role="group" aria-label="Rodzaj zabudowy">
              <button
                type="button"
                :aria-pressed="buildTab === 'economy'"
                @click="changeBuildTab('economy')"
              >
                Gospodarka
              </button>
              <button
                type="button"
                :aria-pressed="buildTab === 'defence'"
                @click="changeBuildTab('defence')"
              >
                Obrona
              </button>
            </div>
            <p class="eyebrow">CO ZBUDUJESZ?</p>
            <h2>{{ buildTab === 'economy' ? 'Trzy możliwości.' : 'Bezpieczna osada.' }}</h2>
            <p v-if="buildTab === 'defence' && state.rank < 1">
              Obrona odblokuje się na randze Wioska.
            </p>
            <BuildingOffer
              :offer="buildTab === 'economy' ? state.offer : state.rank >= 1 ? militaryOffer : []"
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
            <fieldset
              v-if="state.affairs.raid || action?.type === 'expedition'"
              class="tactic-picker"
            >
              <legend>Taktyka bitwy</legend>
              <label v-for="t in tactics" :key="t"
                ><input v-model="tactic" type="radio" name="battle-tactic" :value="t" /><span
                  >{{ TACTICS[t].name }}<small>{{ TACTICS[t].description }}</small></span
                ></label
              ><small>Straty dotyczą najpierw włóczników, potem łuczników.</small>
            </fieldset>
            <p class="eyebrow">NASTĘPNA TURA / {{ SEASONS[seasonIndex] }}</p>
            <h2>{{ actionName }}</h2>
            <p v-if="!action">
              Wybierz budynek i pole, ulepsz swoją osadę albo zbierz zapasy. Czas płynie dopiero po
              zatwierdzeniu.
            </p>
            <p v-if="error" class="preview-error" role="status">{{ error }}</p>
            <template v-if="preview"
              ><p>Koszt: {{ priceText(preview.cost) }}</p>
              <BattleSummary v-if="preview.battle" :report="preview.battle" preview />
              <p v-if="preview.state.affairs.raid">
                Najazd po tej turze: za
                {{ preview.state.affairs.raid.dueTurn - preview.state.turn }} tur.
              </p>
              <p v-if="preview.armyFood || armySize(preview.deserters)">
                Wojsko zużyje {{ preview.armyFood }} żywności. Odejścia z niedoboru:
                {{ preview.deserters.spearman }} włóczników i
                {{ preview.deserters.archer }} łuczników.
              </p>
              <p v-if="Object.values(preview.diplomaticReward).some(Boolean)">
                Dar po wyżywieniu: {{ priceText(preview.diplomaticReward) }}.
              </p>
              <p v-if="preview.state.affairs.settlements.length > state.affairs.settlements.length">
                Poznasz osadę: {{ SETTLEMENTS[state.affairs.settlements.length]!.name }}. Kontakt
                znajdziesz w panelu sąsiadów.
              </p>
              <p v-if="KEYS.some((k) => preview!.reward[k])" class="discovery-reward">
                Jednorazowa nagroda: <strong>{{ priceText(preview.reward) }}</strong>
              </p>
              <p v-if="preview.promotion" class="promotion-preview">
                <strong>Awans: {{ RANKS[preview.promotion.rank]!.name }}!</strong><br />
                Prezent: {{ priceText(preview.promotionGift) }}. Trafi do zapasów po wyżywieniu i
                zmianie populacji. Poniższy bilans już go uwzględnia.
              </p>
              <p v-if="preview.completedRequest" class="promotion-preview request-preview">
                <strong>Prośba wykonana: {{ REQUESTS[preview.completedRequest.id].title }}</strong
                ><br />
                Nagroda: {{ priceText(preview.requestReward) }}. Poniższy bilans już ją uwzględnia;
                otrzymasz ją po wyżywieniu i sprawdzeniu awansu osady.
              </p>
              <p>Produkcja w tej turze: {{ priceText(preview.produced) }}</p>
              <p v-if="action?.type === 'explore'">
                Nowy sektor ujawni wyjątkowe miejsce. Jego zbadanie lub odnowienie będzie osobną
                decyzją.
              </p>
              <p v-for="b in previewBonuses" :key="`${b.x},${b.y}`" class="discovery-bonus">
                {{ b.building }} ({{ b.x }}, {{ b.y }}): {{ DISCOVERIES[b.source.kind].name }} daje
                {{
                  b.resource === 'food'
                    ? '+1 żywności przed zimowym zmniejszeniem plonów'
                    : '+1 monetę'
                }}. Premia jest już ujęta w produkcji.
              </p>
              <p v-if="action?.type === 'demolish'">
                {{
                  selectedBuilding?.damaged
                    ? 'Uszkodzony budynek nie zwraca materiałów.'
                    : 'Odzyskasz połowę podstawowego kosztu. Ulepszenia nie zwiększają zwrotu.'
                }}
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
            Za granicą czekają ruiny strażnic, porzucone wozy, źródła i dawne punkty handlowe. Jedne
            odkrycia przyniosą zapasy, inne pomogą gospodarstwom i targom w sąsiedztwie. Odkryj
            ziemię, sprawdź znalezisko i zdecyduj, kiedy warto poświęcić na nie turę.
          </p>
        </article>
      </div>
    </section>
    <section class="kingdom-faq">
      <h2>Pytania przed pierwszą wyprawą</h2>
      <details>
        <summary>Jak działają najazdy i rozejm?</summary>
        <p>
          Po osiągnięciu Wioski trzy kolejne eksploracje odkrywają Brzeziny, Kamienny Bród i
          Czerwone Wzgórze. Wróg daje 12 tur spokoju, a potem zapowiada najazd z wyprzedzeniem 4
          tur. Możesz przygotować wojsko i wieżę albo zapłacić 12 monet za rozejm. Po starciu lub
          rozejmie masz 12 tur ochrony. Zamknięcie strony nie przyspiesza ataku.
        </p>
      </details>
      <details>
        <summary>Jak wygrywać bitwy i odbudować osadę?</summary>
        <p>
          Koszary mieszczą 6 najemników. Wybierz szyk obronny (+2 siły na włócznika), ostrzał (+2 na
          łucznika) lub szturm (+25% siły i dodatkowa strata jednostki). Wieża daje +6 siły w
          obronie. Remis wygrywa obrońca. Prognoza pokazuje dokładny wynik i straty przed
          zatwierdzeniem.
        </p>
        <p>
          Zwycięstwo kosztuje 25% oddziału, a porażka 50%, zaokrąglając w górę. Zwycięstwo z
          dwukrotną przewagą nie kosztuje jednostek. Szturm dodaje jedną stratę. Najpierw tracisz
          włóczników. Przegrany najazd odbiera mieszkańca, grabi do 10 drewna, 6 kamienia, 8
          żywności i 6 monet oraz uszkadza jeden budynek gospodarczy. Naprawa kosztuje połowę
          podstawowych materiałów, w górę, i jedną turę. Ratusz, domy i infrastruktura wojskowa są
          chronione. Pokonanie garnizonu kończy najazdy.
        </p>
      </details>
      <details>
        <summary>Czy Małe królestwo ma limit czasu?</summary>
        <p>
          Nie. To turowa gra strategiczna w przeglądarce. Możesz spokojnie sprawdzić produkcję i
          zaplanować ruch. Rozgrywka nie kończy się po określonej liczbie lat. Brak żywności
          powoduje odejścia mieszkańców. Najazdy są zapowiadane i mogą odebrać mieszkańca, uszkodzić
          budynek oraz zabrać zapasy. Utrata ostatniej osoby kończy rozgrywkę.
        </p>
      </details>
      <details>
        <summary>Jak zapisać grę i wrócić do osady?</summary>
        <p>
          Zapis odbywa się automatycznie po zatwierdzeniu tury, w pamięci tej przeglądarki. Wróć na
          tę samą stronę na tym samym urządzeniu. Czyszczenie danych witryny usuwa zapis; tryb
          prywatny może go nie zachować. Nie synchronizujemy osady między urządzeniami. Starsze
          zapisy osad są zachowywane i przenoszone do nowej wersji. Wyjątkowe miejsca pojawią się w
          nich dopiero w nowo odkrywanych sektorach, bez zmiany starej zabudowy. Po aktualizacji
          zachowujemy istniejące rangi i prośby. Najstarsze zapisy bez rang zaczynają od rangi
          „Osada”. Spełnione wymagania pozwolą awansować w kolejnych zatwierdzonych turach, po
          jednym stopniu na turę. Migracja nie wydaje zasobów ani nie nalicza czasu.
        </p>
      </details>
      <details>
        <summary>Dlaczego nie mogę postawić budynku?</summary>
        <p>
          Wybierz kartę z aktualnej oferty, pustą łąkę i sprawdź koszt. Na wodzie, skałach i w lesie
          nie budujemy. Wciąż możesz zebrać zapasy — ta akcja nie wymaga zasobów, lecz zużywa turę i
          mieszkańcy nadal potrzebują jedzenia. Wyjątkowe miejsca także zajmują pole. Zbadane ruiny
          i opróżniony wóz je zwalniają, a odnowione źródło i punkt handlowy pozostają częścią
          krajobrazu.
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
      <details>
        <summary>Co mogę znaleźć na nowych ziemiach?</summary>
        <p>
          Każdy nowo odkryty sektor kryje jedno miejsce: ruiny strażnicy, porzucony wóz, zarośnięte
          źródło albo dawny punkt handlowy. Ruiny i wóz dają jednorazowe zasoby. Odnowione źródło
          wspiera farmy i sady, a punkt handlowy — targi przy wspólnej krawędzi. Zbadanie lub
          odnowienie zajmuje jedną osobno zatwierdzoną turę. Po osiągnięciu Wioski trzy kolejne
          eksploracje odkrywają również osady: przyjazną, neutralną i wrogą.
        </p>
      </details>
      <details>
        <summary>Czy premie odkryć sumują się z budynkami i działają zimą?</summary>
        <p>
          Źródło dodaje 1 żywność do plonów sąsiedniej farmy lub sadu, już po uwzględnieniu poziomu
          i premii młynów oraz wody. Zimą całość dzielimy przez dwa, zaokrąglając w dół. Punkt
          handlowy dodaje 1 monetę do produkcji sąsiedniego targu. Kilka takich samych miejsc nie
          zwiększa premii dla jednego budynku. Odnowione miejsce działa od razu w turze odnowienia.
        </p>
      </details>
      <details>
        <summary>Jak awansować od osady do Małego królestwa?</summary>
        <p>
          Rozwijaj populację, buduj różne rodzaje budynków i odkrywaj ziemie. Wszystkie wymagania
          następnej rangi muszą być spełnione jednocześnie na koniec zatwierdzonej tury. Ratusz nie
          liczy się do zabudowy, a ulepszony budynek nadal liczy się jako jeden.
        </p>
        <p v-for="r in RANKS.slice(1)" :key="r.name">
          <strong>{{ r.name }}.</strong> Mieszkańcy: {{ r.requirements.population }}; budynki:
          {{ r.requirements.buildings }}; rodzaje budynków: {{ r.requirements.kinds }}; odkryte
          sektory (ze startowym): {{ r.requirements.sectors }}
          <template v-if="r.requirements.discoveries"
            >; wykorzystane odkrycia: {{ r.requirements.discoveries }}</template
          >. Prezent: {{ priceText(r.gift) }}.
        </p>
      </details>
      <details>
        <summary>Czy mogę stracić rangę albo skończyć grę po ostatnim awansie?</summary>
        <p>
          Nie tracisz osiągniętej rangi po wyburzeniu budynków lub odejściu mieszkańców. Każdy
          prezent otrzymujesz tylko raz, po wyżywieniu i zmianie populacji — nie zapobiega
          niedoborowi w tej samej turze. Po zdobyciu rangi „Małe królestwo” możesz dalej odkrywać
          mapę i rozwijać osadę. Nie ma limitu czasu ani obowiązkowego końca.
        </p>
      </details>
      <details>
        <summary>Jak działają prośby mieszkańców?</summary>
        <p>
          W panelu „Głos mieszkańców” wybierasz jedną z maksymalnie trzech dostępnych próśb. Masz
          dowolnie dużo czasu; możesz ją odłożyć i wrócić później. Prośby dotyczą sąsiedztwa,
          ulepszania budynków i odnowionych miejsc. Kolejne odblokowują się wraz z rangą osady.
          Wyższa ranga daje przycisk „Inne prośby”, jeśli masz więcej celów do wyboru.
        </p>
      </details>
      <details>
        <summary>Czy muszę budować od nowa i kiedy dostanę nagrodę?</summary>
        <p>
          Istniejące budynki też spełniają prośby. Po ich przyjęciu sprawdź cel i zatwierdź dowolną
          legalną turę — warunek musi być nadal spełniony po tym ruchu. Prognoza pokaże nagrodę i
          końcowy bilans. Zasoby otrzymujesz po wyżywieniu, zmianie populacji i sprawdzeniu awansu.
          Każda z 12 próśb daje nagrodę tylko raz; aktywny cel i historia pomocy zapisują się razem
          z osadą.
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
          Buduj na łąkach. Sąsiedztwo czterech krawędzi daje premie. Budynki gospodarcze ulepszysz
          do poziomu 3; wojskowe mają jeden poziom.
        </li>
        <li>
          Oferta gospodarcza zmienia się wyłącznie po budowie gospodarczej. Zawsze zawiera farmę.
          Koszary i wieża są w zakładce „Obrona”.
        </li>
        <li>
          Najazd jest zapowiadany 4 tury wcześniej. Wybierz taktykę i sprawdź prognozę, przygotuj
          wojsko lub opłać rozejm. Przegrana może odebrać ostatniego mieszkańca i zakończyć grę.
        </li>
        <li>
          „Głos mieszkańców” daje 12 opcjonalnych próśb, odblokowywanych wraz z rangą. Wybierz
          jedną; istniejące budynki też się liczą. Cel i jednorazową nagrodę sprawdzamy po
          zatwierdzeniu tury. Możesz odłożyć prośbę bez kary.
        </li>
        <li>
          Panel „Rozwój osady” pokazuje wymagania awansu. Po ich spełnieniu na koniec tury otrzymasz
          nową rangę i jednorazowy prezent. Ranga pozostaje na zawsze, a produkcja ratusza się nie
          zmienia.
        </li>
        <li>Zbieranie daje 3 żywności i 2 drewna, ale także zużywa turę.</li>
        <li>
          Nowy sektor kryje jedno wyjątkowe miejsce. Wybierz je, sprawdź koszt i osobno zatwierdź
          zbadanie lub odnowienie. Dziennik odkryć pomoże do niego wrócić.
        </li>
        <li>
          Źródło wspiera sąsiednie farmy i sady, punkt handlowy — targi. Premie nie mnożą się przez
          poziom ani liczbę miejsc; żywność zimą nadal podlega zmniejszeniu.
        </li>
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
.build-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.build-tabs button,
.battle-result > button {
  min-height: 44px;
  border: 1px solid #a9b198;
  border-radius: 10px;
  padding: 8px 14px;
  background: #e3e9d5;
  color: #294a39;
  cursor: pointer;
}
.build-tabs button[aria-pressed='true'] {
  background: #324c3a;
  color: #fff1c9;
}
.battle-result {
  margin: 16px 0;
}
.battle-result > button {
  margin-top: 8px;
}
.tactic-picker {
  border: 1px solid #9ba98b;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
  min-width: 0;
}
.tactic-picker label {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  cursor: pointer;
}
.tactic-picker small {
  display: block;
  font-size: 0.8rem;
}
.tactic-picker input {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.build-tabs :focus-visible,
.battle-result > button:focus-visible {
  outline: 3px solid #bb9237;
  outline-offset: 3px;
}
.rank-badge {
  display: inline-block;
  border: 1px solid #bba467;
  border-radius: 30px;
  padding: 6px 13px;
  margin: 12px 0 0;
  color: #f5dda3;
  background: #3b4c32;
  font-size: 12px;
}
.promotion-announcement {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid #bca363;
  border-radius: 18px;
  background: linear-gradient(110deg, #4e5030, #2e4935);
}
.promotion-announcement svg {
  width: 64px;
  flex-shrink: 0;
}
.promotion-announcement div {
  flex: 1;
  min-width: 0;
}
.promotion-announcement small,
.promotion-announcement strong,
.promotion-announcement span {
  display: block;
}
.promotion-announcement small {
  color: #e9d391;
  font-size: 10px;
  letter-spacing: 0.1em;
}
.promotion-announcement strong {
  margin: 6px 0;
  font:
    400 24px Georgia,
    serif;
  color: #fff1c8;
}
.promotion-announcement span {
  font-size: 12px;
  line-height: 1.7;
  color: #e1e5c7;
}
.turn-preview .promotion-preview {
  border: 1px solid #b29b5e;
  border-radius: 10px;
  padding: 10px;
  color: #4b532b;
  background: #f8efce;
}
@media (max-width: 600px) {
  .promotion-announcement {
    flex-wrap: wrap;
  }
  .promotion-announcement svg {
    width: 44px;
  }
  .promotion-announcement button {
    margin-left: 58px;
  }
}
.discovery-announcement {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid #e3c78970;
  border-radius: 18px;
  background: linear-gradient(110deg, #324c39, #213e37);
  color: #f5ebcf;
}
.discovery-announcement svg {
  width: 56px;
  flex-shrink: 0;
}
.discovery-announcement div {
  flex: 1;
  min-width: 0;
}
.discovery-announcement small,
.discovery-announcement strong,
.discovery-announcement span {
  display: block;
}
.discovery-announcement small {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: #ebce93;
}
.discovery-announcement strong {
  margin: 5px 0;
}
.discovery-announcement span {
  font-size: 0.8rem;
  line-height: 1.6;
  color: #c4d1bd;
}
.discovery-announcement button {
  min-height: 44px;
  border: 1px solid #d4c39170;
  border-radius: 10px;
  padding: 10px 12px;
  background: #213c2e;
  color: #f5ebcf;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.discovery-announcement button:focus-visible {
  outline: 3px solid #f0c985;
  outline-offset: 3px;
}
.discovery-description > span {
  display: inline-block;
  padding: 4px 9px;
  border: 1px solid #b9ce9c50;
  border-radius: 20px;
  color: #dfd6ad;
  font-size: 0.75rem;
}
.discovery-bonus {
  border-left: 3px solid #a1c99b;
  padding-left: 10px;
  color: #cfe4b8 !important;
  font-size: 0.8rem;
  line-height: 1.6;
}
.discovery-reward {
  color: #f1d193;
}
@media (max-width: 600px) {
  .discovery-announcement {
    flex-wrap: wrap;
  }
  .discovery-announcement button {
    margin-left: 70px;
  }
}
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

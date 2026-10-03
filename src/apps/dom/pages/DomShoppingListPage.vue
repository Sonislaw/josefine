<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  ArrowLeft,
  ArrowUpRight,
  House,
  Pencil,
  Plus,
  Ruler,
  ShoppingBasket,
  Trash2,
  X,
} from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  useDomShoppingList,
  shoppingKinds,
  type ShoppingItem,
  type ShoppingRoom,
} from '../stores/shoppingList'
import { domPath, domSiteName, domSiteUrl, useDomSeo } from '../seo/useDomSeo'
import {
  calculateRoomMetrics,
  parseRoomDimension,
  type RoomDimensions,
  type RoomMetrics,
} from '../lib/room-metrics'
import { createRoomToolLinks } from '../lib/room-links'

useDomSeo('shopping-list', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Mój remont — lista zakupów',
  url: `${domSiteUrl}/moj-remont`,
  isPartOf: { '@type': 'WebSite', name: domSiteName, url: domSiteUrl },
})

const list = useDomShoppingList()
const { items, rooms, hydrated, storageError, knownTotal, unknownPriceCount } = storeToRefs(list)
const pricedCount = computed(() => items.value.length - unknownPriceCount.value)
const newRoomName = ref('')
const createError = ref('')
const editingRoomId = ref<string | null>(null)
const editingRoomName = ref('')
const renameError = ref('')
const editingDimensionsRoomId = ref<string | null>(null)
const dimensionForm = reactive({ length: '', width: '', height: '' })
const dimensionError = ref('')
const dimensionFields = [
  { id: 'length', label: 'Długość' },
  { id: 'width', label: 'Szerokość' },
  { id: 'height', label: 'Wysokość' },
] as const

interface RoomGroup {
  id: string | null
  room: ShoppingRoom | null
  name: string
  items: ShoppingItem[]
  knownTotal: number
  missingPrices: number
  metrics: RoomMetrics | null
  links: ReturnType<typeof createRoomToolLinks>
}

function makeGroup(room: ShoppingRoom | null, name: string, groupItems: ShoppingItem[]): RoomGroup {
  return {
    id: room?.id ?? null,
    room,
    name,
    items: groupItems,
    knownTotal:
      groupItems.reduce(
        (cents, item) => cents + (item.cost === null ? 0 : Math.round(item.cost * 100)),
        0,
      ) / 100,
    missingPrices: groupItems.filter((item) => item.cost === null).length,
    metrics: room?.dimensions ? calculateRoomMetrics(room.dimensions) : null,
    links: room?.dimensions ? createRoomToolLinks(room.dimensions, room.id) : [],
  }
}

const groups = computed(() => {
  const result = rooms.value.map((room) =>
    makeGroup(
      room,
      room.name,
      items.value.filter((item) => item.roomId === room.id),
    ),
  )
  const unassigned = items.value.filter((item) => item.roomId === null)
  if (unassigned.length || !rooms.value.length)
    result.push(makeGroup(null, 'Bez pomieszczenia', unassigned))
  return result
})
const formatMoney = (value: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
const formatLiters = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 6 }).format(value)
const formatDimension = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 6 }).format(value)
const formatMetric = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(value)

function itemAmount(item: ShoppingItem): string {
  const amount = `${formatCount(item.quantity)} ${shoppingKinds[item.kind].unit}`
  return item.kind === 'paintCans'
    ? `${amount} po ${formatLiters(item.packageSizeLiters)} l (${formatLiters(item.quantity * item.packageSizeLiters)} l razem)`
    : amount
}

function clearAll() {
  if (
    window.confirm(
      'Usunąć wszystkie pozycje z listy Mój remont? Utworzone pomieszczenia pozostaną.',
    )
  )
    list.clearItems()
}

function createRoom() {
  createError.value = ''
  if (!list.createRoom(newRoomName.value)) {
    createError.value = 'Wpisz unikalną nazwę do 40 znaków, inną niż „Bez pomieszczenia”.'
    return
  }
  newRoomName.value = ''
}

function beginRename(room: ShoppingRoom) {
  editingDimensionsRoomId.value = null
  editingRoomId.value = room.id
  editingRoomName.value = room.name
  renameError.value = ''
}

function beginDimensionEdit(room: ShoppingRoom) {
  editingRoomId.value = null
  editingDimensionsRoomId.value = room.id
  dimensionForm.length = room.dimensions ? String(room.dimensions.length) : ''
  dimensionForm.width = room.dimensions ? String(room.dimensions.width) : ''
  dimensionForm.height = room.dimensions ? String(room.dimensions.height) : ''
  dimensionError.value = ''
}

function saveDimensions() {
  const length = parseRoomDimension(dimensionForm.length)
  const width = parseRoomDimension(dimensionForm.width)
  const height = parseRoomDimension(dimensionForm.height)
  if (!editingDimensionsRoomId.value || length === null || width === null || height === null) {
    dimensionError.value = 'Podaj trzy wymiary w metrach, większe od zera i nie większe niż 1000 m.'
    return
  }
  const dimensions: RoomDimensions = { length, width, height }
  if (!list.setRoomDimensions(editingDimensionsRoomId.value, dimensions)) {
    dimensionError.value = 'Nie udało się zapisać wymiarów. Spróbuj ponownie.'
    return
  }
  editingDimensionsRoomId.value = null
  dimensionError.value = ''
}

function clearDimensions(room: ShoppingRoom) {
  if (
    window.confirm(
      `Usunąć zapisane wymiary pomieszczenia „${room.name}”? Zakupy pozostaną bez zmian.`,
    )
  ) {
    list.setRoomDimensions(room.id, null)
    if (editingDimensionsRoomId.value === room.id) editingDimensionsRoomId.value = null
  }
}

function saveRename() {
  renameError.value = ''
  if (!editingRoomId.value || !list.renameRoom(editingRoomId.value, editingRoomName.value)) {
    renameError.value = 'Wpisz unikalną nazwę do 40 znaków, inną niż „Bez pomieszczenia”.'
    return
  }
  editingRoomId.value = null
}

function deleteRoom(room: ShoppingRoom) {
  const count = items.value.filter((item) => item.roomId === room.id).length
  const message = count
    ? `Usunąć pomieszczenie „${room.name}”? ${count} ${count === 1 ? 'zakup trafi' : 'zakupów trafi'} do „Bez pomieszczenia”.`
    : `Usunąć pomieszczenie „${room.name}”?`
  if (window.confirm(message)) {
    list.deleteRoom(room.id)
    if (editingRoomId.value === room.id) editingRoomId.value = null
    if (editingDimensionsRoomId.value === room.id) editingDimensionsRoomId.value = null
  }
}

function assignItem(itemId: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  list.assignItem(itemId, value || null)
}
</script>

<template>
  <article class="shopping-page">
    <RouterLink class="back-link" :to="domPath('/')"
      ><ArrowLeft :size="17" aria-hidden="true" /> Kalkulatory Dom</RouterLink
    >

    <header class="page-hero">
      <div class="hero-copy">
        <p class="eyebrow">PLAN ZAKUPÓW</p>
        <h1>Mój remont<span>.</span></h1>
        <p>
          W jednym miejscu zbierz materiały policzone w kalkulatorach Dom. Panele, płytki, listwy i
          farbę zapiszesz z wyniku i rozdzielisz według pomieszczeń. Ceny dodasz tylko wtedy, gdy je
          znasz.
        </p>
      </div>
      <div class="hero-graphic" aria-hidden="true">
        <ShoppingBasket :size="76" :stroke-width="1.3" /><span>Twój plan<br />pod ręką</span>
      </div>
    </header>

    <div class="local-note">
      <strong>Lista jest tylko na tym urządzeniu.</strong>
      <span
        >Zapisujemy ją w pamięci tej przeglądarki. Nie synchronizuje się między telefonem a
        komputerem; wyczyszczenie danych przeglądarki lub tryb prywatny mogą ją usunąć.</span
      >
    </div>

    <p v-if="storageError" class="storage-warning" role="alert">
      Przeglądarka nie pozwala teraz odczytać lub zapisać listy. Zmiany mogą zniknąć po odświeżeniu
      strony.
    </p>

    <section v-if="hydrated" class="room-manager" aria-labelledby="rooms-title">
      <div class="manager-copy">
        <p class="eyebrow">UPORZĄDKUJ ZAKUPY</p>
        <h2 id="rooms-title">Pomieszczenia</h2>
        <p>
          Stwórz pokój i przypisz do niego zapisane materiały. Zakupy bez przypisania pozostają w
          osobnej grupie. Możesz też zapisać wymiary pokoju i otwierać kalkulatory z gotowymi
          danymi.
        </p>
      </div>
      <form class="room-form" @submit.prevent="createRoom">
        <label for="new-room-name">Nazwa pomieszczenia</label>
        <div class="room-form-controls">
          <input
            id="new-room-name"
            v-model="newRoomName"
            type="text"
            maxlength="40"
            autocomplete="off"
            placeholder="np. Salon"
            :aria-invalid="!!createError"
            :aria-describedby="createError ? 'create-room-error' : undefined"
          /><button type="submit"><Plus :size="17" aria-hidden="true" /> Dodaj pokój</button>
        </div>
        <p v-if="createError" id="create-room-error" class="form-error" role="alert">
          {{ createError }}
        </p>
      </form>
      <button v-if="items.length" type="button" class="clear-button" @click="clearAll">
        <Trash2 :size="16" aria-hidden="true" /> Wyczyść zakupy
      </button>
    </section>

    <div v-if="!hydrated" class="list-card" role="status">Wczytywanie listy…</div>
    <div v-else-if="items.length || rooms.length" class="content-grid">
      <div class="room-groups">
        <section
          v-for="(group, index) in groups"
          :key="group.id ?? 'unassigned'"
          class="list-card"
          :aria-labelledby="`room-heading-${index}`"
        >
          <div class="group-heading">
            <span class="group-icon"
              ><House v-if="group.room" :size="21" aria-hidden="true" /><ShoppingBasket
                v-else
                :size="21"
                aria-hidden="true"
            /></span>
            <div class="group-title">
              <p class="eyebrow">{{ group.room ? 'POMIESZCZENIE' : 'DO PRZYPISANIA' }}</p>
              <h2 :id="`room-heading-${index}`">{{ group.name }}</h2>
              <span
                >{{ group.items.length }} {{ group.items.length === 1 ? 'pozycja' : 'pozycji' }} ·
                {{
                  group.items.length > group.missingPrices
                    ? formatMoney(group.knownTotal)
                    : 'brak podanych cen'
                }}</span
              >
            </div>
            <div v-if="group.room" class="group-actions">
              <button
                type="button"
                :aria-label="`Zmień nazwę pomieszczenia ${group.name}`"
                @click="beginRename(group.room)"
              >
                <Pencil :size="16" aria-hidden="true" /></button
              ><button
                type="button"
                :aria-label="`Usuń pomieszczenie ${group.name}`"
                @click="deleteRoom(group.room)"
              >
                <Trash2 :size="16" aria-hidden="true" />
              </button>
            </div>
          </div>

          <form
            v-if="group.room && editingRoomId === group.id"
            class="rename-form"
            @submit.prevent="saveRename"
          >
            <label :for="`rename-room-${group.id}`">Nowa nazwa pomieszczenia</label>
            <div>
              <input
                :id="`rename-room-${group.id}`"
                v-model="editingRoomName"
                type="text"
                maxlength="40"
                autocomplete="off"
                :aria-invalid="!!renameError"
                :aria-describedby="renameError ? `rename-error-${group.id}` : undefined"
              /><button type="submit">Zapisz</button
              ><button type="button" class="cancel-button" @click="editingRoomId = null">
                <X :size="16" aria-hidden="true" /> Anuluj
              </button>
            </div>
            <p v-if="renameError" :id="`rename-error-${group.id}`" class="form-error" role="alert">
              {{ renameError }}
            </p>
          </form>

          <div v-if="group.room" class="room-dimensions">
            <div class="dimension-heading">
              <div>
                <strong><Ruler :size="17" aria-hidden="true" /> Wymiary pokoju</strong>
                <p v-if="group.room.dimensions">
                  {{ formatDimension(group.room.dimensions.length) }} ×
                  {{ formatDimension(group.room.dimensions.width) }} ×
                  {{ formatDimension(group.room.dimensions.height) }} m
                </p>
                <p v-else>Opcjonalnie: długość, szerokość i wysokość prostokątnego pokoju.</p>
              </div>
              <div class="dimension-actions">
                <button type="button" @click="beginDimensionEdit(group.room)">
                  {{ group.room.dimensions ? 'Zmień wymiary' : 'Dodaj wymiary' }}
                </button>
                <button
                  v-if="group.room.dimensions"
                  type="button"
                  class="remove-dimensions"
                  @click="clearDimensions(group.room)"
                >
                  Usuń wymiary
                </button>
              </div>
            </div>

            <form
              v-if="editingDimensionsRoomId === group.id"
              class="dimension-form"
              @submit.prevent="saveDimensions"
            >
              <div class="dimension-inputs">
                <label
                  v-for="field in dimensionFields"
                  :key="field.id"
                  :for="`dimension-${group.id}-${field.id}`"
                >
                  {{ field.label }}
                  <span>
                    <input
                      :id="`dimension-${group.id}-${field.id}`"
                      v-model="dimensionForm[field.id]"
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      placeholder="np. 2,5"
                      :aria-invalid="
                        !!dimensionError && parseRoomDimension(dimensionForm[field.id]) === null
                      "
                    />
                    m
                  </span>
                </label>
              </div>
              <p>
                Wpisz metry. Każdy wymiar powinien być większy od zera i nie przekraczać 1000 m.
              </p>
              <p v-if="dimensionError" class="form-error" role="alert">{{ dimensionError }}</p>
              <div class="dimension-form-actions">
                <button type="submit">Zapisz wymiary</button>
                <button type="button" class="cancel-button" @click="editingDimensionsRoomId = null">
                  <X :size="16" aria-hidden="true" /> Anuluj
                </button>
              </div>
            </form>

            <template v-else-if="group.metrics">
              <div class="room-metrics">
                <div>
                  <span>Podłoga</span><strong>{{ formatMetric(group.metrics.floor) }} m²</strong>
                </div>
                <div>
                  <span>Obwód</span><strong>{{ formatMetric(group.metrics.perimeter) }} m</strong>
                </div>
                <div>
                  <span>Ściany</span><strong>{{ formatMetric(group.metrics.walls) }} m²</strong>
                </div>
                <div>
                  <span>Kubatura</span><strong>{{ formatMetric(group.metrics.volume) }} m³</strong>
                </div>
              </div>
              <p class="tool-links-heading">Policz dla tego pokoju</p>
              <div class="room-tool-links">
                <RouterLink v-for="step in group.links" :key="step.title" :to="step.to">
                  <span
                    ><strong>{{ step.title }}</strong
                    ><small>{{ step.detail }}</small></span
                  >
                  <ArrowUpRight :size="17" aria-hidden="true" />
                </RouterLink>
              </div>
              <p class="dimension-note">
                Powierzchnia ścian nie uwzględnia okien, drzwi ani skosów. Zmiana wymiarów nie
                aktualizuje już zapisanych zakupów.
              </p>
            </template>
          </div>

          <ul v-if="group.items.length" class="items-list">
            <li v-for="item in group.items" :key="item.id" class="item-row">
              <div class="item-icon"><ShoppingBasket :size="21" aria-hidden="true" /></div>
              <div class="item-copy">
                <strong>{{ shoppingKinds[item.kind].label }}</strong
                ><span
                  >{{ itemAmount(item) }} ·
                  <RouterLink :to="domPath(shoppingKinds[item.kind].path)"
                    >Otwórz kalkulator
                    <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink></span
                ><label v-if="rooms.length" class="assignment"
                  >Pomieszczenie
                  <select
                    :value="item.roomId ?? ''"
                    :aria-label="`Przypisz ${shoppingKinds[item.kind].label} do pomieszczenia`"
                    @change="assignItem(item.id, $event)"
                  >
                    <option value="">Bez pomieszczenia</option>
                    <option v-for="room in rooms" :key="room.id" :value="room.id">
                      {{ room.name }}
                    </option>
                  </select></label
                >
              </div>
              <div class="item-end">
                <strong>{{ item.cost === null ? 'Cena niepodana' : formatMoney(item.cost) }}</strong
                ><button
                  type="button"
                  :aria-label="`Usuń pozycję: ${shoppingKinds[item.kind].label}, ${itemAmount(item)}`"
                  @click="list.removeItem(item.id)"
                >
                  <Trash2 :size="17" aria-hidden="true" />
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="empty-room">
            Nie ma tu jeszcze zakupów. Dodaj je z kalkulatora albo przenieś z innej grupy.
          </p>
          <p v-if="group.missingPrices" class="group-note">
            Pozycji bez ceny: {{ group.missingPrices }}. Suma tej grupy jest niepełna.
          </p>
        </section>
        <p v-if="items.length" class="snapshot-note">
          Pozycje są zapisanymi wynikami. Ponowne obliczenie w kalkulatorze nie zmieni listy — usuń
          starą pozycję i dodaj nową, jeśli zmieniasz plan.
        </p>
      </div>

      <aside class="summary-card" aria-labelledby="summary-heading">
        <p class="eyebrow">CAŁY REMONT</p>
        <h2 id="summary-heading">Suma podanych cen</h2>
        <strong class="total">{{ pricedCount ? formatMoney(knownTotal) : 'Brak cen' }}</strong>
        <p>Pozycji: {{ items.length }} · Utworzone pomieszczenia: {{ rooms.length }}.</p>
        <p v-if="unknownPriceCount">
          Liczba pozycji bez ceny: {{ unknownPriceCount }}. Nie uwzględniono ich w sumie, więc nie
          jest to pełny koszt remontu.
        </p>
        <p v-else>
          To orientacyjny koszt zapisanych materiałów. Nie obejmuje robocizny, transportu ani innych
          zakupów.
        </p>
      </aside>
    </div>

    <section v-if="hydrated && !items.length" class="empty-card" aria-labelledby="empty-heading">
      <div class="empty-icon"><ShoppingBasket :size="34" aria-hidden="true" /></div>
      <h2 id="empty-heading">Lista jeszcze czeka na pierwszy zakup.</h2>
      <p>
        Policz potrzebną ilość materiału, a następnie wybierz „Dodaj do Mojego remontu” obok wyniku.
        Zacznij od jednego z planów:
      </p>
      <div class="start-links">
        <RouterLink :to="domPath('/liczba-paczek-paneli')"
          >Panele <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink
        ><RouterLink :to="domPath('/liczba-plytek')"
          >Płytki <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink
        ><RouterLink :to="domPath('/obwod-prostokata')"
          >Listwy <ArrowUpRight :size="16" aria-hidden="true"
        /></RouterLink>
        <RouterLink :to="domPath('/ilosc-farby')"
          >Farba <ArrowUpRight :size="16" aria-hidden="true"
        /></RouterLink>
      </div>
    </section>
  </article>
</template>

<style scoped>
.shopping-page {
  width: min(100% - 2.5rem, 1280px);
  margin-inline: auto;
  padding-block: 2.5rem 1rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #54725e;
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  margin-top: 1.4rem;
  padding: clamp(1.6rem, 4vw, 3.2rem);
  border-radius: 26px;
  background: linear-gradient(115deg, #e4efdd, #faf1e2);
}
.eyebrow {
  color: #a96b4d;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h1,
h2 {
  font-family: var(--font-heading);
  letter-spacing: -0.055em;
}
h1 {
  margin-top: 0.6rem;
  font-size: clamp(2.7rem, 6vw, 5.2rem);
  line-height: 1.05;
}
h1 span {
  color: #b77356;
}
.hero-copy > p:last-child {
  max-width: 660px;
  margin-top: 1.2rem;
  color: #536c5c;
  line-height: 1.75;
}
.hero-graphic {
  flex: 0 0 210px;
  display: grid;
  place-items: center;
  min-height: 190px;
  border: 1px solid #b9cfb3;
  border-radius: 26px;
  background: #f8fcf3;
  color: #315d42;
  transform: rotate(5deg);
}
.hero-graphic span {
  margin-top: -1.6rem;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
  text-align: center;
}
.local-note {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-block: 1.5rem;
  padding: 1rem 1.2rem;
  border: 1px solid #dce7d9;
  border-radius: 14px;
  background: #f6faf1;
  color: #526b57;
  font-size: 0.78rem;
  line-height: 1.6;
}
.local-note strong {
  color: #315c42;
}
.storage-warning {
  margin-bottom: 1.2rem;
  padding: 1rem;
  border: 1px solid #e3c6ad;
  border-radius: 12px;
  background: #fff2e6;
  color: #8a4c33;
  font-size: 0.85rem;
}
.room-manager {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 390px) auto;
  align-items: end;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  padding: 1.5rem;
  border: 1px solid #d6e5d1;
  border-radius: 20px;
  background: #eef5e9;
}
.manager-copy h2 {
  margin-top: 0.3rem;
  font-size: clamp(1.45rem, 2.4vw, 2rem);
}
.manager-copy > p:last-child {
  max-width: 480px;
  margin-top: 0.35rem;
  color: #657b68;
  font-size: 0.8rem;
  line-height: 1.6;
}
.room-form label,
.rename-form label {
  display: block;
  margin-bottom: 0.4rem;
  color: #315c43;
  font-size: 0.75rem;
  font-weight: 800;
}
.room-form-controls,
.rename-form > div {
  display: flex;
  gap: 0.5rem;
}
.room-form input,
.rename-form input {
  width: 100%;
  min-width: 0;
  min-height: 43px;
  padding: 0.6rem 0.75rem;
  border: 1px solid #c9d8c5;
  border-radius: 10px;
  background: #fffefa;
  color: #294b36;
  font: inherit;
  font-size: 0.82rem;
}
.room-form input:focus-visible,
.rename-form input:focus-visible,
.assignment select:focus-visible {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.room-form input[aria-invalid='true'],
.rename-form input[aria-invalid='true'] {
  border-color: #c97561;
}
.room-form button,
.rename-form button:not(.cancel-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex: 0 0 auto;
  padding: 0.65rem 0.8rem;
  border: 0;
  border-radius: 10px;
  background: #28573e;
  color: #fff;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}
.room-form button:hover,
.rename-form button:not(.cancel-button):hover {
  background: #1d4530;
}
.form-error {
  margin-top: 0.4rem;
  color: #a34f3c;
  font-size: 0.72rem;
}
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  align-items: start;
  gap: 1.2rem;
}
.room-groups {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-width: 0;
}
.list-card,
.summary-card,
.empty-card {
  padding: clamp(1.3rem, 3vw, 2rem);
  border: 1px solid #e0e6d9;
  border-radius: 22px;
  background: #fffefa;
}
.group-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.group-icon {
  display: grid;
  place-items: center;
  flex: 0 0 46px;
  height: 46px;
  border-radius: 13px;
  background: #e8f1e4;
  color: #39714c;
}
.group-title {
  flex: 1;
  min-width: 0;
}
.group-title h2 {
  margin-top: 0.25rem;
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  overflow-wrap: anywhere;
}
.group-title > span {
  display: block;
  margin-top: 0.25rem;
  color: #758575;
  font-size: 0.74rem;
}
.group-actions {
  display: flex;
  align-self: flex-start;
  gap: 0.2rem;
}
.group-actions button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #58735f;
  cursor: pointer;
}
.group-actions button:hover {
  background: #edf3e8;
}
.group-actions button:last-child {
  color: #a45a46;
}
.rename-form {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #d9e5d3;
  border-radius: 12px;
  background: #f6faf2;
}
.cancel-button {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem;
  border: 0;
  background: transparent;
  color: #58735f;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.room-dimensions {
  margin-top: 1.2rem;
  padding: 1rem;
  border: 1px solid #dce8d7;
  border-radius: 15px;
  background: #f7faf4;
}
.dimension-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
}
.dimension-heading strong {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #315c43;
  font-size: 0.84rem;
}
.dimension-heading p {
  margin-top: 0.25rem;
  color: #6a806e;
  font-size: 0.73rem;
  line-height: 1.5;
}
.dimension-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.dimension-actions button,
.dimension-form-actions button[type='submit'] {
  min-height: 36px;
  padding: 0.45rem 0.7rem;
  border: 1px solid #bfd4bd;
  border-radius: 8px;
  background: #fffefa;
  color: #315d42;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}
.dimension-actions button:hover {
  background: #eaf2e6;
}
.dimension-actions .remove-dimensions {
  color: #9c5947;
}
.dimension-form {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid #dce8d7;
}
.dimension-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.dimension-inputs label {
  color: #315c43;
  font-size: 0.73rem;
  font-weight: 800;
}
.dimension-inputs label span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.35rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid #c9d8c5;
  border-radius: 8px;
  background: #fffefa;
  color: #6a806e;
}
.dimension-inputs input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #294b36;
  font: inherit;
  font-size: 0.82rem;
}
.dimension-inputs label span:focus-within {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.dimension-inputs label span:has(input[aria-invalid='true']) {
  border-color: #c97561;
}
.dimension-form > p,
.dimension-note {
  margin-top: 0.6rem;
  color: #748778;
  font-size: 0.71rem;
  line-height: 1.55;
}
.dimension-form > .form-error {
  color: #a34f3c;
}
.dimension-form-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.8rem;
}
.dimension-form-actions button[type='submit'] {
  border-color: #28573e;
  background: #28573e;
  color: #fff;
}
.dimension-form-actions button[type='submit']:hover {
  background: #1d4530;
}
.room-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.9rem;
}
.room-metrics > div {
  display: grid;
  gap: 0.25rem;
  padding: 0.65rem;
  border-radius: 9px;
  background: #eaf2e6;
}
.room-metrics span {
  color: #66806b;
  font-size: 0.68rem;
}
.room-metrics strong {
  color: #2d593e;
  font-size: 0.86rem;
  white-space: nowrap;
}
.tool-links-heading {
  margin-top: 1rem;
  color: #315c43;
  font-size: 0.76rem;
  font-weight: 800;
}
.room-tool-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.5rem;
}
.room-tool-links a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.65rem;
  border: 1px solid #d6e5d1;
  border-radius: 9px;
  background: #fffefa;
  color: #315c43;
  text-decoration: none;
}
.room-tool-links a:hover,
.room-tool-links a:focus-visible {
  border-color: #76a47c;
  background: #edf5e9;
}
.room-tool-links a span {
  min-width: 0;
}
.room-tool-links a strong,
.room-tool-links a small {
  display: block;
}
.room-tool-links a strong {
  font-size: 0.74rem;
}
.room-tool-links a small {
  margin-top: 0.2rem;
  color: #748778;
  font-size: 0.67rem;
  line-height: 1.35;
}
.room-tool-links a svg {
  flex: 0 0 auto;
}
.empty-room {
  margin-top: 1.3rem;
  padding: 1rem;
  border: 1px dashed #d6e2d0;
  border-radius: 12px;
  color: #768a78;
  font-size: 0.79rem;
  line-height: 1.6;
}
.group-note {
  margin-top: 0.7rem;
  color: #8b7154;
  font-size: 0.73rem;
  line-height: 1.5;
}
.summary-card h2,
.empty-card h2 {
  margin-top: 0.45rem;
  font-size: clamp(1.4rem, 2vw, 2rem);
}
.list-heading h2 span {
  color: #a4b5a1;
}
.clear-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  background: transparent;
  color: #a15543;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}
.room-manager .clear-button {
  align-self: center;
  white-space: nowrap;
}
.clear-button:hover {
  text-decoration: underline;
}
.items-list {
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 0;
  border-top: 1px solid #edf0e8;
}
.item-icon {
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  height: 42px;
  border-radius: 12px;
  background: #eaf2e6;
  color: #39714c;
}
.item-copy {
  flex: 1;
  min-width: 0;
}
.item-copy strong {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.97rem;
}
.item-copy span {
  display: block;
  margin-top: 0.25rem;
  color: #758575;
  font-size: 0.74rem;
}
.item-copy a {
  color: #38694b;
  font-weight: 800;
  white-space: nowrap;
}
.item-copy a svg {
  display: inline;
  vertical-align: middle;
}
.assignment {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.6rem;
  color: #617865;
  font-size: 0.7rem;
  font-weight: 800;
}
.assignment select {
  max-width: 210px;
  min-height: 34px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #d3dfce;
  border-radius: 8px;
  background: #fffefa;
  color: #315a40;
  font: inherit;
  font-size: 0.72rem;
}
.item-end {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.item-end strong {
  color: #31593e;
  font-size: 0.8rem;
  text-align: right;
  white-space: nowrap;
}
.item-end button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #b16751;
  cursor: pointer;
}
.item-end button:hover {
  background: #fbede7;
}
.snapshot-note {
  margin-top: 0.65rem;
  color: #7a8b7c;
  font-size: 0.72rem;
  line-height: 1.6;
}
.summary-card {
  background: #e7f0e2;
}
.summary-card .total {
  display: block;
  margin-top: 1.2rem;
  color: #28543c;
  font-family: var(--font-heading);
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  letter-spacing: -0.05em;
}
.summary-card > p:not(.eyebrow) {
  margin-top: 1rem;
  color: #5f7966;
  font-size: 0.78rem;
  line-height: 1.65;
}
.empty-card {
  margin-top: 1.2rem;
  padding-block: 3.2rem;
  text-align: center;
}
.empty-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  margin-inline: auto;
  border-radius: 20px;
  background: #e8f1e4;
  color: #386d4b;
}
.empty-card h2 {
  margin-top: 1.2rem;
}
.empty-card p {
  max-width: 590px;
  margin: 0.8rem auto 0;
  color: #718272;
  line-height: 1.7;
}
.start-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 1.5rem;
}
.start-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #28573e;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
}
.start-links a:hover {
  background: #1d4530;
}
@media (max-width: 830px) {
  .room-manager {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .room-manager .clear-button {
    justify-self: start;
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
}
@media (min-width: 831px) and (max-width: 1050px) {
  .room-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .hero-graphic {
    display: none;
  }
  .item-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .item-end {
    width: 100%;
    justify-content: space-between;
    padding-left: 3.35rem;
  }
  .room-form-controls,
  .rename-form > div {
    flex-wrap: wrap;
  }
  .dimension-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .dimension-inputs {
    grid-template-columns: 1fr;
  }
  .room-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .room-tool-links {
    grid-template-columns: 1fr;
  }
}
</style>

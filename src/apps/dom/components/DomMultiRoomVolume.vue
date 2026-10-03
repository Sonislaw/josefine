<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Layers3, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import { useRoute } from 'vue-router'
import ShareResultButton from '@/shared/components/ShareResultButton.vue'
import {
  useShareableCalculator,
  type ShareField,
} from '@/shared/composables/useShareableCalculator'
import { formatDomResult } from '../lib/calculations'
import {
  calculateMultiRoomVolume,
  MAX_VOLUME_ROOMS,
  parseVolumeDimension,
  parseVolumeRooms,
  serializeVolumeRooms,
  type VolumeRoomInput,
} from '../lib/multi-room-volume'
import { calculateRoomMetrics } from '../lib/room-metrics'
import { useDomShoppingList } from '../stores/shoppingList'

const props = defineProps<{ baseLength: string; baseWidth: string; baseHeight: string }>()
const enabled = defineModel<boolean>('enabled', { required: true })
const rooms = defineModel<VolumeRoomInput[]>('rooms', { required: true })
const route = useRoute()
const list = useDomShoppingList()
const { rooms: savedRooms } = storeToRefs(list)

onMounted(() => list.hydrate())

const canStart = computed(() =>
  [props.baseLength, props.baseWidth, props.baseHeight].every(
    (value) => parseVolumeDimension(value) !== null,
  ),
)
const result = computed(() => calculateMultiRoomVolume(rooms.value))
const availableSavedRooms = computed(() => savedRooms.value.filter((room) => room.dimensions))

const roomsShareField: ShareField = {
  key: 'rooms',
  read: () => (enabled.value ? serializeVolumeRooms(rooms.value) : ''),
  restore: (raw) => {
    const restored = parseVolumeRooms(raw)
    rooms.value = restored ?? []
    enabled.value = restored !== null
  },
}
const { buildShareUrl, canShareInputs } = useShareableCalculator([roomsShareField])

// Opening the plain calculator URL after a shared plan must return to the basic mode.
watch(
  () => route.query.rooms,
  (value) => {
    if (typeof value !== 'string') {
      rooms.value = []
      enabled.value = false
    }
  },
)

function buildPlanUrl() {
  const url = new URL(buildShareUrl())
  url.searchParams.set('mode', 'multi')
  return url.href
}

function chooseMode(multiple: boolean) {
  if (multiple && !enabled.value && rooms.value.length === 0) {
    if (!canStart.value) return
    // The first row inherits the basic calculator's current measurement.
    rooms.value = [
      {
        id: 1,
        name: 'Pomieszczenie 1',
        length: props.baseLength,
        width: props.baseWidth,
        height: props.baseHeight,
      },
    ]
  }
  enabled.value = multiple
}

function nextId() {
  return Math.max(0, ...rooms.value.map((room) => room.id)) + 1
}

function addRoom() {
  if (rooms.value.length >= MAX_VOLUME_ROOMS) return
  rooms.value = [
    ...rooms.value,
    {
      id: nextId(),
      name: `Pomieszczenie ${rooms.value.length + 1}`,
      length: '',
      width: '',
      height: '',
    },
  ]
}

function addSavedRoom(event: Event) {
  const select = event.target as HTMLSelectElement
  const room = availableSavedRooms.value.find((entry) => entry.id === select.value)
  select.value = ''
  if (!room?.dimensions || rooms.value.length >= MAX_VOLUME_ROOMS) return
  rooms.value = [
    ...rooms.value,
    {
      id: nextId(),
      name: room.name,
      length: String(room.dimensions.length),
      width: String(room.dimensions.width),
      height: String(room.dimensions.height),
    },
  ]
}

function removeRoom(id: number) {
  if (rooms.value.length <= 1) return
  rooms.value = rooms.value.filter((room) => room.id !== id)
}

function resetRooms() {
  rooms.value = [
    { id: 1, name: 'Salon', length: '5', width: '4', height: '2,5' },
    { id: 2, name: 'Sypialnia', length: '4', width: '3', height: '2,5' },
  ]
}

function roomVolume(room: VolumeRoomInput) {
  const length = parseVolumeDimension(room.length)
  const width = parseVolumeDimension(room.width)
  const height = parseVolumeDimension(room.height)
  if (length === null || width === null || height === null) return null
  return calculateRoomMetrics({ length, width, height })?.volume ?? null
}

function formatVolume(volume: number) {
  return formatDomResult({ label: 'Kubatura', value: volume, unit: 'm³' })
}

function nameInvalid(name: string) {
  return !name.trim() || name.trim().length > 40 || /[\u0000-\u001f\u007f]/.test(name)
}
</script>

<template>
  <section class="volume-modes" aria-labelledby="volume-mode-title">
    <div class="mode-heading">
      <span class="mode-icon"><Layers3 :size="20" aria-hidden="true" /></span>
      <div>
        <p class="eyebrow">OD POKOJU DO CAŁEGO MIESZKANIA</p>
        <h2 id="volume-mode-title">Ile pomieszczeń chcesz policzyć?</h2>
      </div>
    </div>
    <div class="mode-buttons" role="group" aria-label="Sposób liczenia kubatury">
      <button
        type="button"
        :aria-pressed="!enabled"
        :class="{ active: !enabled }"
        @click="chooseMode(false)"
      >
        Jedno pomieszczenie
      </button>
      <button
        type="button"
        :aria-pressed="enabled"
        :class="{ active: enabled }"
        :disabled="!enabled && rooms.length === 0 && !canStart"
        @click="chooseMode(true)"
      >
        Kilka pomieszczeń
      </button>
    </div>
    <p v-if="!enabled && rooms.length === 0 && !canStart" class="mode-help">
      Popraw wymiary pokoju w prostym kalkulatorze, aby rozpocząć plan wielu pomieszczeń.
    </p>
  </section>

  <section v-if="enabled" class="multi-volume" aria-labelledby="multi-volume-title">
    <div class="calculator-header">
      <div>
        <p class="eyebrow">KUBATURA KROK PO KROKU</p>
        <h2 id="multi-volume-title">Pomieszczenia i ich łączna objętość</h2>
        <p>Dodaj pokoje ręcznie lub skopiuj ich wymiary z Mojego remontu.</p>
      </div>
      <button type="button" class="reset-button" @click="resetRooms">
        <RotateCcw :size="16" aria-hidden="true" /> Przywróć przykład
      </button>
    </div>

    <div class="calculator-grid">
      <div class="rooms-panel">
        <article v-for="(room, index) in rooms" :key="room.id" class="room-card">
          <div class="room-heading">
            <strong
              >{{ String(index + 1).padStart(2, '0') }} /
              {{ room.name.trim() || 'Bez nazwy' }}</strong
            >
            <button
              type="button"
              class="remove-button"
              :disabled="rooms.length <= 1"
              :aria-label="`Usuń pomieszczenie ${index + 1}`"
              @click="removeRoom(room.id)"
            >
              <Trash2 :size="17" aria-hidden="true" />
            </button>
          </div>
          <div class="room-fields">
            <label class="name-field" :for="`volume-name-${room.id}`">
              <span>Nazwa pomieszczenia</span>
              <input
                :id="`volume-name-${room.id}`"
                v-model="room.name"
                type="text"
                maxlength="40"
                autocomplete="off"
                :aria-invalid="nameInvalid(room.name)"
              />
            </label>
            <label
              v-for="field in ['length', 'width', 'height'] as const"
              :key="field"
              :for="`volume-${field}-${room.id}`"
            >
              <span>{{
                field === 'length' ? 'Długość' : field === 'width' ? 'Szerokość' : 'Wysokość'
              }}</span>
              <span class="input-wrap">
                <input
                  :id="`volume-${field}-${room.id}`"
                  v-model="room[field]"
                  type="text"
                  inputmode="decimal"
                  autocomplete="off"
                  :aria-invalid="parseVolumeDimension(room[field]) === null"
                /><small>m</small>
              </span>
            </label>
          </div>
          <p class="room-volume" aria-live="polite">
            Kubatura:
            <strong
              >{{ roomVolume(room) === null ? '—' : formatVolume(roomVolume(room)!) }} m³</strong
            >
          </p>
        </article>

        <div class="add-controls">
          <button
            type="button"
            class="add-button"
            :disabled="rooms.length >= MAX_VOLUME_ROOMS"
            @click="addRoom"
          >
            <Plus :size="17" aria-hidden="true" /> Dodaj pomieszczenie
          </button>
          <label v-if="availableSavedRooms.length" class="saved-control">
            <span>Lub dodaj zapisany pokój</span>
            <select :disabled="rooms.length >= MAX_VOLUME_ROOMS" :value="''" @change="addSavedRoom">
              <option value="">Wybierz z Mojego remontu</option>
              <option v-for="saved in availableSavedRooms" :key="saved.id" :value="saved.id">
                {{ saved.name }}
              </option>
            </select>
          </label>
        </div>
        <p class="limit-note">
          Maksymalnie {{ MAX_VOLUME_ROOMS }} pomieszczeń. Wymiary zapisanych pokoi są kopiowane i
          można je tu zmienić.
        </p>
      </div>

      <div class="result-panel" aria-live="polite">
        <p class="eyebrow">CAŁE MIESZKANIE</p>
        <template v-if="result">
          <div class="primary-result">
            <span>Łączna kubatura</span>
            <strong>{{ formatVolume(result.total) }} <small>m³</small></strong>
          </div>
          <dl class="result-rows">
            <div v-for="row in result.rows" :key="row.id">
              <dt>{{ row.name }}</dt>
              <dd>{{ formatVolume(row.volume) }} m³</dd>
            </div>
          </dl>
        </template>
        <div v-else class="empty-result">
          <strong>—</strong>
          <p>Uzupełnij nazwy i wszystkie wymiary, aby zobaczyć pełną sumę.</p>
        </div>
        <ShareResultButton
          :get-url="buildPlanUrl"
          :disabled="!result || !canShareInputs"
          class="share-action"
        />
        <p class="share-note">
          Link zawiera nazwy i wymiary tych pomieszczeń, ale nie dołącza listy zakupów.
        </p>
        <p class="result-note">
          Sumujemy długość × szerokość × wysokość każdego prostokątnego pokoju. Wynik nie uwzględnia
          skosów i nie służy samodzielnie do doboru instalacji wentylacyjnej lub grzewczej.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.volume-modes {
  margin-bottom: 1.25rem;
  padding: 1.5rem 2rem;
  border: 1px solid #dce7d8;
  border-radius: 20px;
  background: linear-gradient(120deg, #edf5ed, #fbf3e8);
}
.mode-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
.mode-icon {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 12px;
  background: #dfeedd;
  color: #356748;
}
.eyebrow {
  color: #ac6b50;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
h2 {
  margin-top: 0.25rem;
  color: #294f38;
  font-family: var(--font-heading);
  font-size: clamp(1.3rem, 2.2vw, 1.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}
.mode-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1.2rem;
}
.mode-buttons button,
.reset-button,
.add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.65rem 0.9rem;
  border: 1px solid #d5e2d1;
  border-radius: 10px;
  background: #fffefa;
  color: #3e644a;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.mode-buttons button.active {
  border-color: #2d6044;
  background: #2d6044;
  color: #fff;
}
button:disabled,
select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid #3b7955;
  outline-offset: 2px;
}
.mode-help {
  margin-top: 0.7rem;
  color: #a05d48;
  font-size: 0.72rem;
}
.multi-volume {
  overflow: hidden;
  border: 1px solid #dce5dc;
  border-radius: 24px;
  background: #fffefa;
  box-shadow: 0 18px 48px #32574312;
}
.calculator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.6rem 2rem;
}
.calculator-header p:last-child {
  margin-top: 0.5rem;
  color: #728574;
  font-size: 0.78rem;
}
.calculator-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(0, 0.82fr);
  gap: 1rem;
  padding: 0 2rem 2rem;
}
.rooms-panel,
.result-panel {
  min-width: 0;
  padding: 1.4rem;
  border-radius: 18px;
}
.rooms-panel {
  display: grid;
  gap: 0.9rem;
  align-content: start;
  border: 1px solid #e1e8da;
  background: #f8faf3;
}
.room-card {
  padding: 1rem;
  border: 1px solid #dae5d9;
  border-radius: 14px;
  background: #fffefa;
}
.room-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}
.room-heading strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #315b40;
  font-family: var(--font-heading);
  font-size: 0.9rem;
}
.remove-button {
  display: grid;
  place-items: center;
  flex: 0 0 32px;
  height: 32px;
  border: 1px solid #e2e4da;
  border-radius: 9px;
  background: #fff;
  color: #8e695c;
  cursor: pointer;
}
.remove-button:hover:not(:disabled) {
  background: #faeee9;
}
.room-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}
.room-fields label {
  min-width: 0;
  color: #355b43;
  font-size: 0.72rem;
  font-weight: 800;
}
.room-fields label > span:first-child {
  display: block;
  margin-bottom: 0.35rem;
}
.room-fields .name-field {
  grid-column: 1 / -1;
}
.room-fields input,
.saved-control select {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #cfddcf;
  border-radius: 9px;
  background: #fff;
  color: #213a30;
  font: inherit;
  font-size: 0.85rem;
}
.room-fields input[aria-invalid='true'] {
  border-color: #c97561;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.input-wrap input {
  flex: 1;
}
.input-wrap small {
  color: #708575;
}
.room-volume {
  margin-top: 0.8rem;
  color: #718675;
  font-size: 0.76rem;
}
.room-volume strong {
  color: #315b40;
}
.add-controls {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 0.8rem;
}
.saved-control {
  display: grid;
  flex: 1 1 180px;
  gap: 0.3rem;
  color: #54715b;
  font-size: 0.7rem;
  font-weight: 800;
}
.saved-control select {
  font-weight: 600;
}
.limit-note {
  color: #718675;
  font-size: 0.7rem;
  line-height: 1.55;
}
.result-panel {
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #244f46, #1f3e40);
  color: #fff;
}
.result-panel .eyebrow {
  color: #c9e3d9;
}
.primary-result {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.primary-result span {
  color: #c9e3d9;
  font-size: 0.8rem;
}
.primary-result strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 4.5vw, 4rem);
  line-height: 1.1;
  letter-spacing: -0.06em;
}
.primary-result small {
  font-size: 0.48em;
  letter-spacing: 0;
}
.result-rows {
  display: grid;
  gap: 0.65rem;
  margin: 1.5rem 0 0;
  padding-top: 1.2rem;
  border-top: 1px solid #ffffff38;
}
.result-rows > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.65rem;
}
.result-rows dt {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #c3ddd4;
  font-size: 0.75rem;
}
.result-rows dd {
  flex: 0 0 auto;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: right;
}
.empty-result {
  margin-top: 1.5rem;
}
.empty-result strong {
  font-family: var(--font-heading);
  font-size: 3rem;
}
.empty-result p,
.result-note,
.share-note {
  color: #c6dcd0;
  font-size: 0.75rem;
  line-height: 1.6;
}
.share-action {
  align-self: flex-start;
  margin-top: 1.4rem;
}
.share-note {
  margin-top: 0.5rem;
}
.result-note {
  margin-top: auto;
  padding-top: 2rem;
}
@media (max-width: 860px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .volume-modes,
  .calculator-header {
    padding: 1.25rem;
  }
  .calculator-grid {
    padding: 0 1.25rem 1.25rem;
  }
  .rooms-panel,
  .result-panel {
    padding: 1.1rem;
  }
  .room-fields {
    grid-template-columns: 1fr;
  }
  .room-fields .name-field {
    grid-column: auto;
  }
}
</style>

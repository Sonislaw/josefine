<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, Grid3X3, RotateCw } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { parseRoomDimension } from '../lib/room-metrics'
import { calculateTileLayoutPreview, type TileOrientation } from '../lib/tile-layout'
import { domPath } from '../seo/useDomSeo'

const props = defineProps<{
  tileLength: number | null
  tileWidth: number | null
  calculatorArea: number | null
}>()
const emit = defineEmits<{ applyArea: [value: string] }>()
const enabled = defineModel<boolean>('enabled', { required: true })
const roomLength = defineModel<string>('roomLength', { required: true })
const roomWidth = defineModel<string>('roomWidth', { required: true })
const orientation = defineModel<TileOrientation>('orientation', { required: true })

const length = computed(() => parseRoomDimension(roomLength.value))
const width = computed(() => parseRoomDimension(roomWidth.value))
const area = computed(() =>
  length.value !== null && width.value !== null && length.value >= 0.01 && width.value >= 0.01
    ? length.value * width.value
    : null,
)
const layout = computed(() => {
  if (area.value === null || props.tileLength === null || props.tileWidth === null) return null
  return calculateTileLayoutPreview({
    roomLengthM: length.value!,
    roomWidthM: width.value!,
    tileLengthCm: props.tileLength,
    tileWidthCm: props.tileWidth,
    orientation: orientation.value,
  })
})
const areaMatches = computed(
  () =>
    area.value !== null &&
    props.calculatorArea !== null &&
    Math.abs(area.value - props.calculatorArea) <= 0.000001,
)
const canRotate = computed(
  () =>
    props.tileLength !== null && props.tileWidth !== null && props.tileLength !== props.tileWidth,
)
const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 4 }).format(value)
const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)

function applyArea() {
  if (area.value !== null) emit('applyArea', String(Number(area.value.toFixed(8))))
}
</script>

<template>
  <section class="tile-layout" aria-labelledby="tile-layout-title">
    <div class="layout-heading">
      <div class="heading-copy">
        <p class="eyebrow"><Grid3X3 :size="16" aria-hidden="true" /> ZOBACZ UKŁAD</p>
        <h3 id="tile-layout-title">Zanim kupisz, spójrz na docinki.</h3>
        <p>
          Prosty podgląd od narożnika pokazuje, gdzie płytki trzeba będzie dociąć. Wymiary możesz
          wpisać tutaj albo otworzyć kalkulator z zapisanego pokoju w
          <RouterLink :to="domPath('/moj-remont')">Moim remoncie</RouterLink>.
        </p>
      </div>
      <label class="layout-toggle">
        <input v-model="enabled" type="checkbox" />
        <span>{{ enabled ? 'Podgląd włączony' : 'Włącz podgląd' }}</span>
      </label>
    </div>

    <template v-if="enabled">
      <div class="layout-controls">
        <div class="dimension-fields">
          <label for="tile-room-length">
            Długość podłogi
            <span class="input-wrap">
              <input
                id="tile-room-length"
                v-model="roomLength"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                placeholder="np. 4"
                :aria-invalid="roomLength !== '' && (length === null || length < 0.01)"
              />
              <small>m</small>
            </span>
          </label>
          <label for="tile-room-width">
            Szerokość podłogi
            <span class="input-wrap">
              <input
                id="tile-room-width"
                v-model="roomWidth"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                placeholder="np. 3"
                :aria-invalid="roomWidth !== '' && (width === null || width < 0.01)"
              />
              <small>m</small>
            </span>
          </label>
        </div>
        <div class="orientation-control">
          <span>Kierunek płytki</span>
          <button
            type="button"
            :disabled="!canRotate"
            @click="orientation = orientation === 'standard' ? 'rotated' : 'standard'"
          >
            <RotateCw :size="17" aria-hidden="true" />
            {{ orientation === 'standard' ? 'Obróć o 90°' : 'Przywróć kierunek' }}
          </button>
          <small v-if="!canRotate">Obrót nie zmieni układu kwadratowej płytki.</small>
        </div>
      </div>

      <p class="input-help">
        Podaj wymiary prostokątnej podłogi w metrach, od 0,01 do 1000 m. Podgląd obsługuje płytki od
        1 do 1000 cm.
      </p>

      <div v-if="area !== null" class="area-bridge">
        <div>
          <span>Z wymiarów wychodzi</span>
          <strong>{{ format(area) }} m²</strong>
          <small v-if="areaMatches">Taki sam metraż jest w kalkulatorze powyżej.</small>
          <small v-else>Kalkulator zakupu nadal używa metrażu wpisanego powyżej.</small>
        </div>
        <button v-if="!areaMatches" type="button" @click="applyArea">
          Użyj tego metrażu <ArrowUpRight :size="16" aria-hidden="true" />
        </button>
      </div>

      <div v-if="!area" class="preview-placeholder" role="status">
        Wpisz poprawną długość i szerokość podłogi, aby zobaczyć układ.
      </div>
      <div v-else-if="!layout" class="preview-placeholder" role="status">
        Sprawdź wymiary płytki w kalkulatorze powyżej. Podgląd działa dla formatu od 1 do 1000 cm.
      </div>
      <div v-else class="preview-content">
        <div class="preview-stats">
          <div>
            <span>Siatka</span
            ><strong>{{ formatCount(layout.columns) }} × {{ formatCount(layout.rows) }}</strong>
          </div>
          <div>
            <span>Pola z docinką</span><strong>{{ formatCount(layout.cutCells) }}</strong>
          </div>
          <div>
            <span>Kierunek płytki</span
            ><strong
              >{{ format(layout.tileLengthCm) }} × {{ format(layout.tileWidthCm) }} cm</strong
            >
          </div>
        </div>

        <div v-if="layout.tooDense" class="preview-placeholder" role="status">
          Przy tej skali siatka ma ponad 600 pól i byłaby nieczytelna. Zmień format płytki lub
          wymiary podłogi, aby zobaczyć rysunek. Liczba płytek do zakupu nadal wynika z kalkulatora
          powyżej.
        </div>
        <figure v-else class="layout-figure">
          <div class="drawing-surface">
            <svg
              class="layout-svg"
              :viewBox="`0 0 ${layout.roomLengthCm} ${layout.roomWidthCm}`"
              role="img"
              :aria-label="`Prosty układ ${layout.columns} kolumn na ${layout.rows} rzędów, ${layout.cutCells} pól z docinką`"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect
                v-for="(cell, index) in layout.cells"
                :key="index"
                :x="cell.x"
                :y="cell.y"
                :width="cell.width"
                :height="cell.height"
                :class="cell.cut ? 'cut-cell' : 'full-cell'"
                :stroke-width="
                  Math.max(0.15, Math.min(layout.tileLengthCm, layout.tileWidthCm) * 0.015)
                "
              />
              <rect
                x="0"
                y="0"
                :width="layout.roomLengthCm"
                :height="layout.roomWidthCm"
                fill="none"
                stroke="#2d5a40"
                :stroke-width="
                  Math.max(0.3, Math.min(layout.tileLengthCm, layout.tileWidthCm) * 0.035)
                "
              />
            </svg>
          </div>
          <figcaption>
            <span><i class="legend-full" aria-hidden="true"></i> Pełna płytka</span>
            <span><i class="legend-cut" aria-hidden="true"></i> Docinka przy krawędzi</span>
          </figcaption>
        </figure>

        <p v-if="layout.narrowRight || layout.narrowBottom" class="narrow-warning">
          <strong>Uwaga na wąską docinkę:</strong>
          <span v-if="layout.narrowRight">
            przy prawej ścianie około {{ format(layout.rightCutCm!) }} cm.</span
          >
          <span v-if="layout.narrowBottom">
            przy dolnej ścianie około {{ format(layout.bottomCutCm!) }} cm.</span
          >
          Rozważ inny punkt startu lub obrót płytki.
        </p>
        <p class="layout-note">
          To orientacyjna siatka dla prostego układu od narożnika, bez fug, przesunięcia, skosów i
          ponownego użycia odciętych fragmentów. Liczba pól na rysunku nie zastępuje wyliczenia
          płytek i kartonów z zapasem.
        </p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.tile-layout {
  margin-top: 1.25rem;
  padding: clamp(1.35rem, 3vw, 2rem);
  border: 1px solid #d9e5d4;
  border-radius: 22px;
  background: linear-gradient(130deg, #f7f9f1, #faf2e6);
}
.layout-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.heading-copy {
  max-width: 780px;
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #a7674c;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
h3 {
  margin-top: 0.45rem;
  color: #294e38;
  font-family: var(--font-heading);
  font-size: clamp(1.45rem, 2.5vw, 2rem);
  letter-spacing: -0.045em;
}
.heading-copy > p:last-child {
  margin-top: 0.7rem;
  color: #687d6c;
  font-size: 0.82rem;
  line-height: 1.65;
}
.heading-copy a {
  color: #2f6846;
  font-weight: 800;
}
.layout-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex: 0 0 auto;
  padding: 0.7rem 0.85rem;
  border: 1px solid #bcd2b9;
  border-radius: 11px;
  background: #fffefa;
  color: #315d42;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
}
.layout-toggle input {
  width: 18px;
  height: 18px;
  accent-color: #2e6044;
}
.layout-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem 2rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #dce6d7;
}
.dimension-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  width: min(100%, 380px);
}
.dimension-fields label,
.orientation-control > span {
  color: #365b43;
  font-size: 0.73rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #cbdaca;
  border-radius: 9px;
  background: #fffefa;
}
.input-wrap:focus-within {
  outline: 2px solid #5e9670;
  outline-offset: 2px;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #c97561;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #284b36;
  font: inherit;
  font-size: 0.95rem;
}
.input-wrap small {
  color: #768b79;
}
.orientation-control {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
}
.orientation-control button,
.area-bridge button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 41px;
  padding: 0.55rem 0.75rem;
  border: 1px solid #bfd2b9;
  border-radius: 9px;
  background: #fffefa;
  color: #315c42;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
}
.orientation-control button:hover:not(:disabled),
.area-bridge button:hover {
  background: #e9f2e5;
}
.orientation-control button:disabled {
  opacity: 0.58;
  cursor: default;
}
.orientation-control small,
.input-help {
  color: #718775;
  font-size: 0.69rem;
  line-height: 1.5;
}
.input-help {
  margin-top: 0.7rem;
}
.area-bridge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.2rem;
  padding: 0.9rem 1rem;
  border: 1px solid #caddc5;
  border-radius: 12px;
  background: #eaf3e5;
}
.area-bridge > div {
  display: grid;
  gap: 0.15rem;
}
.area-bridge span,
.area-bridge small {
  color: #5e7864;
  font-size: 0.72rem;
}
.area-bridge strong {
  color: #28553d;
  font-family: var(--font-heading);
  font-size: 1.3rem;
}
.preview-content {
  margin-top: 1.1rem;
}
.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.preview-stats > div {
  display: grid;
  gap: 0.3rem;
  padding: 0.75rem 0.9rem;
  border-radius: 11px;
  background: #fffefa;
}
.preview-stats span {
  color: #6d806d;
  font-size: 0.7rem;
}
.preview-stats strong {
  color: #315c42;
  font-size: 0.9rem;
}
.preview-placeholder {
  margin-top: 1.1rem;
  padding: 1.5rem;
  border: 1px dashed #c8d9c1;
  border-radius: 12px;
  background: #fffefa;
  color: #6d806d;
  font-size: 0.8rem;
  line-height: 1.6;
}
.layout-figure {
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid #c9d9c3;
  border-radius: 15px;
  background: #fdfdf7;
}
.drawing-surface {
  position: relative;
  height: clamp(230px, 34vw, 390px);
  background:
    radial-gradient(circle at 20% 20%, #dcebcf, transparent 50%),
    repeating-linear-gradient(0deg, transparent 0 23px, #a7bda71c 24px 25px), #eff5e8;
}
.layout-svg {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: block;
  width: calc(100% - 2rem);
  height: calc(100% - 2rem);
  overflow: visible;
  filter: drop-shadow(0 6px 10px #28503d30);
}
.layout-svg rect {
  stroke: #39704d;
}
.layout-svg .full-cell {
  fill: #f7fff0;
}
.layout-svg .cut-cell {
  fill: #efbf94;
  stroke: #a66b4a;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1.2rem;
  padding: 0.75rem 1rem;
  color: #607965;
  font-size: 0.72rem;
}
figcaption span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
figcaption i {
  width: 13px;
  height: 13px;
  border: 1px solid #39704d;
  border-radius: 2px;
}
.legend-full {
  background: #f7fff0;
}
.legend-cut {
  background: #efbf94;
}
.narrow-warning {
  margin-top: 0.95rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #fff0dc;
  color: #915a36;
  font-size: 0.75rem;
  line-height: 1.6;
}
.layout-note {
  margin-top: 0.9rem;
  color: #718674;
  font-size: 0.72rem;
  line-height: 1.6;
}
@media (max-width: 700px) {
  .layout-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 530px) {
  .dimension-fields {
    width: 100%;
  }
  .preview-stats {
    grid-template-columns: 1fr;
  }
  .drawing-surface {
    height: 260px;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BUILDINGS,
  SIZE,
  TERRAIN_NAMES,
  frontier,
  key,
  sectorOf,
  season,
  type Kingdom,
  type Point,
} from './engine'
import TileArt from './TileArt.vue'
import { forestStage, terrainAt, inForestRange } from './forestry'
import {
  depositCapacity,
  depositRemaining,
  planExtraction,
  extractor,
  inExtractionRange,
} from './deposits'
import BuildingUpgradePopover from './BuildingUpgradePopover.vue'
import { CELL, MIN_ZOOM, MAX_ZOOM, placeBuildingPopover } from './building-popover'
import { settlementDefinition, RELATIONS } from './neighbours'
import { RANKS } from './progression'
import { blocksBuilding, DISCOVERIES, discoveryStatus } from './discoveries'
const props = defineProps<{
  state: Kingdom
  selected: Point | null
  winter: boolean
  disabled?: boolean
  upgradePlan?: Point | null
  buildKind?: string | null
}>()
const emit = defineEmits<{ select: [Point]; explore: [Point]; upgrade: [Point] }>()
const host = ref<HTMLElement>(),
  width = ref(640),
  height = ref(450),
  zoom = ref(1),
  ox = ref(96),
  oy = ref(1)
const cursor = ref<Point>({ x: 3, y: 3 })
const popover = ref<HTMLElement>(),
  popoverHeight = ref(0),
  dismissed = ref(false)
const selectedBuilding = computed(() =>
  props.selected ? props.state.buildings[key(props.selected.x, props.selected.y)] : undefined,
)
const showPopover = computed(
  () => !dismissed.value && selectedBuilding.value && selectedBuilding.value.kind !== 'hall',
)
const extraction = computed(() => planExtraction(props.state))
const rangeKind = computed(() => selectedBuilding.value?.kind ?? props.buildKind)
const showRange = computed(
  () =>
    !!props.selected &&
    !!rangeKind.value &&
    (extractor(rangeKind.value) || rangeKind.value === 'forester'),
)
const placement = computed(() =>
  props.selected
    ? placeBuildingPopover(
        { width: width.value, height: height.value, zoom: zoom.value, ox: ox.value, oy: oy.value },
        props.selected,
        popoverHeight.value,
      )
    : null,
)
const popoverStyle = computed(() =>
  placement.value
    ? {
        left: `${placement.value.left}px`,
        top: `${placement.value.top}px`,
        width: `${placement.value.width}px`,
        '--arrow-left': `${placement.value.arrow}px`,
      }
    : {},
)
function fitPopover() {
  if (!showPopover.value || !placement.value) return
  const c = placement.value.camera
  ox.value = c.ox
  oy.value = c.oy
  zoom.value = c.zoom
}
function closePopover(focus = false) {
  dismissed.value = true
  if (focus) host.value?.focus({ preventScroll: true })
}
let popoverObserver: ResizeObserver | undefined
let popoverFrame: number | undefined, mapFrame: number | undefined
function revealPopover() {
  if (showPopover.value)
    popover.value?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
}
watch(popover, (el) => {
  popoverObserver?.disconnect()
  if (popoverFrame !== undefined) cancelAnimationFrame(popoverFrame)
  popoverFrame = undefined
  if (!el) return
  const measure = () => {
    popoverHeight.value = el.offsetHeight
    fitPopover()
  }
  measure()
  // Layout writes must run outside ResizeObserver delivery to avoid feedback-loop warnings.
  popoverObserver = new ResizeObserver(() => {
    if (popoverFrame !== undefined) return
    popoverFrame = requestAnimationFrame(() => {
      popoverFrame = undefined
      if (popover.value === el) measure()
    })
  })
  popoverObserver.observe(el)
})
watch(
  () => props.selected,
  async () => {
    dismissed.value = false
    await nextTick()
    fitPopover()
    await nextTick()
    revealPopover()
  },
)
const known = computed(() => new Set(props.state.sectors.map((p) => key(p.x, p.y))))
const edges = computed(() => frontier(props.state))
const contacts = computed(
  () => new Map(props.state.affairs.settlements.map((c) => [key(c.x, c.y), c])),
)
const visible = computed(() => {
  const result = []
  const left = Math.floor(-ox.value / (CELL * zoom.value)) - 1,
    top = Math.floor(-oy.value / (CELL * zoom.value)) - 1
  const right = Math.ceil((width.value - ox.value) / (CELL * zoom.value)) + 1,
    bottom = Math.ceil((height.value - oy.value) / (CELL * zoom.value)) + 1
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++) {
      const s = sectorOf({ x, y })
      if (!known.value.has(key(s.x, s.y))) continue
      const t = terrainAt(props.state, { x, y }),
        b = props.state.buildings[key(x, y)]
      const found = props.state.discoveries[key(x, y)],
        d = blocksBuilding(found) ? found : undefined
      const contact = contacts.value.get(key(x, y))
      const enemy = contact ? props.state.affairs.enemies[contact.id] : undefined
      const amount = depositRemaining(props.state, { x, y })
      const capacity = depositCapacity(props.state, { x, y })
      const growth = t === 'forest' ? forestStage(props.state, { x, y }) : undefined
      const idle =
        !!b &&
        extractor(b.kind) &&
        !b.damaged &&
        extraction.value.buildings[key(x, y)]?.amount === 0
      // Only visual adjacency: terrain generation and all gameplay remain in the engine.
      const waterEdges =
        t === 'water'
          ? [
              [0, -1],
              [1, 0],
              [0, 1],
              [-1, 0],
            ].reduce((mask, offset, i) => {
              const nx = x + offset[0]!,
                ny = y + offset[1]!
              const neighbourSector = sectorOf({ x: nx, y: ny })
              return known.value.has(key(neighbourSector.x, neighbourSector.y)) &&
                terrainAt(props.state, { x: nx, y: ny }) !== 'water'
                ? mask | (1 << i)
                : mask
            }, 0)
          : 0
      result.push({
        x,
        y,
        terrain: t,
        building: b,
        settlement: contact,
        enemy,
        amount,
        capacity,
        growth,
        idle,
        waterEdges,
        variant: Math.abs((x * 73856093) ^ (y * 19349663) ^ props.state.seed) % 6,
        discovery: d,
        label: `${x}, ${y}: ${contact ? settlementDefinition(contact.id).name + ', ' + RELATIONS[contact.relation] + (enemy ? ', wytrzymałość ' + enemy.health + '%' : '') : d ? DISCOVERIES[d.kind].name + ', ' + discoveryStatus(d) : b ? (b.kind === 'hall' ? 'Ratusz, ' + RANKS[props.state.rank]!.name : BUILDINGS[b.kind].name + ', poziom ' + b.level + (b.damaged ? ', uszkodzony' : '')) : TERRAIN_NAMES[t]}`,
      })
    }
  return result
})
const visibleEdges = computed(() =>
  edges.value.filter((p) => {
    const x = p.x * SIZE * CELL * zoom.value + ox.value,
      y = p.y * SIZE * CELL * zoom.value + oy.value,
      size = SIZE * CELL * zoom.value
    return x < width.value && y < height.value && x + size > 0 && y + size > 0
  }),
)
function center(p: Point = { x: 3, y: 3 }) {
  ox.value = width.value / 2 - (p.x + 0.5) * CELL * zoom.value
  oy.value = height.value / 2 - (p.y + 0.5) * CELL * zoom.value
}
function zoomAt(value: number, x = width.value / 2, y = height.value / 2) {
  closePopover()
  const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value)),
    ratio = z / zoom.value
  ox.value = x - (x - ox.value) * ratio
  oy.value = y - (y - oy.value) * ratio
  zoom.value = z
}
function locate(p: Point) {
  closePopover()
  cursor.value = p
  center(p)
}
function reveal(p: Point) {
  locate(p)
  host.value?.scrollIntoView({ block: 'center', behavior: 'instant' })
  host.value?.focus({ preventScroll: true })
}
defineExpose({ locate, reveal })
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    if (mapFrame !== undefined) cancelAnimationFrame(mapFrame)
    mapFrame = requestAnimationFrame(() => {
      mapFrame = undefined
      const dx = entry.contentRect.width - width.value,
        dy = entry.contentRect.height - height.value
      width.value = entry.contentRect.width
      height.value = entry.contentRect.height
      ox.value += dx / 2
      oy.value += dy / 2
      void nextTick(() => {
        fitPopover()
        void nextTick(revealPopover)
      })
    })
  })
  if (host.value) {
    width.value = host.value.clientWidth
    height.value = host.value.clientHeight
    zoom.value = Math.max(MIN_ZOOM, Math.min(1, (width.value - 20) / (7 * CELL)))
    center()
    observer.observe(host.value)
  }
  window.addEventListener('blur', cancel)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  popoverObserver?.disconnect()
  if (popoverFrame !== undefined) cancelAnimationFrame(popoverFrame)
  if (mapFrame !== undefined) cancelAnimationFrame(mapFrame)
  window.removeEventListener('blur', cancel)
  cancel()
})
const pointers = new Map<number, { x: number; y: number }>()
let origin = { x: 0, y: 0 },
  moved = false
function local(e: PointerEvent) {
  const r = host.value!.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}
function down(e: PointerEvent) {
  if (e.button !== 0) return
  const p = local(e)
  if (!pointers.size) {
    origin = p
    moved = false
  }
  pointers.set(e.pointerId, p)
  if (pointers.size > 1) {
    moved = true
    closePopover()
  }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  if (!prev) return
  const p = local(e)
  if (pointers.size === 2) {
    const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)![1]
    const before = Math.hypot(prev.x - other.x, prev.y - other.y),
      after = Math.hypot(p.x - other.x, p.y - other.y)
    const mid = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 }
    if (before > 0) zoomAt((zoom.value * after) / before, mid.x, mid.y)
    ox.value += (p.x - prev.x) / 2
    oy.value += (p.y - prev.y) / 2
  } else if (pointers.size === 1) {
    if (Math.hypot(p.x - origin.x, p.y - origin.y) > 6) {
      moved = true
      closePopover()
    }
    if (moved) {
      ox.value += p.x - prev.x
      oy.value += p.y - prev.y
    }
  }
  pointers.set(e.pointerId, p)
}
function choose(p: Point) {
  dismissed.value = false
  cursor.value = p
  const s = sectorOf(p)
  if (known.value.has(key(s.x, s.y))) emit('select', p)
  else if (edges.value.some((e) => e.x === s.x && e.y === s.y)) emit('explore', s)
}
function up(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  const p = local(e),
    tap = !moved && pointers.size === 1 && Math.hypot(p.x - origin.x, p.y - origin.y) <= 6
  pointers.delete(e.pointerId)
  if ((e.currentTarget as Element).hasPointerCapture(e.pointerId))
    (e.currentTarget as Element).releasePointerCapture(e.pointerId)
  if (tap)
    choose({
      x: Math.floor((p.x - ox.value) / (CELL * zoom.value)),
      y: Math.floor((p.y - oy.value) / (CELL * zoom.value)),
    })
}
function cancel() {
  pointers.clear()
  moved = true
}
function keyboard(e: KeyboardEvent) {
  const direction: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }
  const d = direction[e.key]
  if (d) {
    e.preventDefault()
    cursor.value = { x: cursor.value.x + d[0], y: cursor.value.y + d[1] }
    center(cursor.value)
    choose(cursor.value)
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    choose(cursor.value)
  }
  if (e.key === 'Home') {
    e.preventDefault()
    locate({ x: 3, y: 3 })
    choose(cursor.value)
  }
  if (e.key === 'Escape') {
    cancel()
    closePopover()
  }
}
function wheel(e: WheelEvent) {
  if (e.ctrlKey) {
    e.preventDefault()
    zoomAt(zoom.value * (e.deltaY > 0 ? 0.9 : 1.1))
  }
}
</script>
<template>
  <div class="kingdom-map-wrap">
    <div class="map-toolbar">
      <span
        >✧ {{ state.sectors.length }}
        {{ state.sectors.length === 1 ? 'odkryty sektor' : 'odkrytych sektorów' }}</span
      >
      <div>
        <button type="button" aria-label="Oddal mapę" @click="zoomAt(zoom / 1.2)">−</button
        ><button type="button" aria-label="Przybliż mapę" @click="zoomAt(zoom * 1.2)">+</button
        ><button type="button" @click="locate({ x: 3, y: 3 })">⌂ Ratusz</button>
      </div>
    </div>
    <div class="map-stage">
      <div
        ref="host"
        class="kingdom-map"
        :class="{ snowy: winter }"
        tabindex="0"
        role="group"
        aria-label="Mapa królestwa. Strzałki wybierają pola. Enter wybiera, Home wraca do ratusza. Przeciągnij, aby przesunąć mapę."
        @keydown="keyboard"
        @wheel="wheel"
      >
        <svg
          :viewBox="`0 0 ${width} ${height}`"
          @pointerdown="down"
          @pointermove="move"
          @pointerup="up"
          @pointercancel="cancel"
          @lostpointercapture="pointers.size && cancel()"
        >
          <defs>
            <pattern id="kingdom-dots" width="96" height="96" patternUnits="userSpaceOnUse">
              <path
                d="M0 24q24-14 48 0t48 0M0 32q24-14 48 0t48 0M0 80q24-14 48 0t48 0"
                fill="none"
                stroke="#82947b"
                stroke-width=".7"
                opacity=".14"
              />
              <path d="M22 55h6m-3-3v6M70 9h4m-2-2v4" stroke="#b8c7a2" opacity=".18" />
            </pattern>
          </defs>
          <rect :width="width" :height="height" fill="url(#kingdom-dots)" />
          <g :transform="`translate(${ox} ${oy}) scale(${zoom})`">
            <g
              v-for="s in visibleEdges"
              :key="`sector-${s.x},${s.y}`"
              :transform="`translate(${s.x * SIZE * 64} ${s.y * SIZE * 64})`"
            >
              <rect
                x="8"
                y="8"
                width="432"
                height="432"
                rx="10"
                fill="#9aaf8a"
                fill-opacity=".04"
                stroke="#a3b38c"
                stroke-dasharray="4 12"
                stroke-width="2"
              />
              <g transform="translate(224 192)" fill="none" stroke="#a9bb91">
                <circle r="27" stroke-opacity=".3" />
                <path d="M0-22 6-6 22 0 6 6 0 22-6 6-22 0-6-6Z" stroke-width="1.5" />
                <path d="M0-15 0 0 15 0" fill="#a9bb91" />
              </g>
              <text
                x="224"
                y="250"
                text-anchor="middle"
                fill="#d7dfc7"
                font-size="17"
                letter-spacing="1"
              >
                Odkryj ziemie
              </text>
            </g>
            <g
              v-for="p in visible"
              :key="key(p.x, p.y)"
              :data-tile="key(p.x, p.y)"
              :transform="`translate(${p.x * 64} ${p.y * 64})`"
              role="img"
              :aria-label="
                p.label +
                (p.capacity ? ', zasób ' + p.amount + ' / ' + p.capacity : '') +
                (p.growth ? ', etap lasu ' + p.growth + ' / 3' : '') +
                (p.idle ? ', przestój — brak dostępnego surowca' : '')
              "
            >
              <title>{{ p.label }}</title>
              <TileArt
                :rank="state.rank"
                :terrain="p.terrain"
                :building="p.building"
                :settlement="p.settlement"
                :enemy="p.enemy"
                :winter="winter"
                :season="season(state.turn)"
                :variant="p.variant"
                :water-edges="p.waterEdges"
                :deposit-remaining="p.capacity ? p.amount : undefined"
                :deposit-capacity="p.capacity"
                :forest-stage="p.growth"
                :idle="p.idle"
                :discovery="p.discovery"
              />
              <rect
                v-if="
                  showRange &&
                  selected &&
                  (rangeKind === 'forester'
                    ? inForestRange(selected, p)
                    : inExtractionRange(selected, p))
                "
                x="2"
                y="2"
                width="60"
                height="60"
                rx="4"
                fill="#ffe193"
                fill-opacity=".12"
                stroke="#ffe193"
                stroke-opacity=".65"
                stroke-dasharray="3 3"
                stroke-width="1.5"
                pointer-events="none"
                data-extraction-range="true"
              />
              <rect
                v-if="selected && Math.abs(selected.x - p.x) + Math.abs(selected.y - p.y) === 1"
                x="3"
                y="3"
                width="58"
                height="58"
                rx="8"
                fill="none"
                stroke="#f5ecc2"
                stroke-opacity=".9"
                stroke-dasharray="3 3"
                stroke-width="2"
              />
              <rect
                v-if="selected?.x === p.x && selected?.y === p.y"
                x="2"
                y="2"
                width="60"
                height="60"
                rx="9"
                fill="none"
                stroke="#ffe193"
                stroke-width="4"
              />
              <path
                v-if="selected?.x === p.x && selected?.y === p.y"
                d="M2 14V2h12m36 0h12v12m0 36v12H50m-36 0H2V50"
                fill="none"
                stroke="#fff3c3"
                stroke-width="3"
              />
            </g>
          </g>
        </svg>
      </div>
      <!-- HTML sibling of the gesture surface: buttons never pan or select SVG terrain. -->
      <div
        v-if="showPopover && selectedBuilding && selected"
        ref="popover"
        class="popover-anchor"
        :style="popoverStyle"
      >
        <BuildingUpgradePopover
          :state="state"
          :building="selectedBuilding"
          :disabled="!!disabled"
          :planned="upgradePlan?.x === selected.x && upgradePlan?.y === selected.y"
          @upgrade="emit('upgrade', { x: selected.x, y: selected.y })"
          @close="closePopover(true)"
        />
      </div>
    </div>
    <p class="map-hint">
      <template v-if="showRange"
        >{{
          rangeKind === 'forester'
            ? 'Zasięg sadzenia: 3 pola. Leśnik odnawia wycięty las i obsadza wolne łąki.'
            : 'Zasięg wydobycia: 3 pola w pionie i poziomie. Złoża są wspólne dla budynków.'
        }}<br
      /></template>
      Dotknij pola · przeciągnij mapę · rozsuń palce, aby przybliżyć. Sąsiadujące pola są
      obrysowane.
    </p>
  </div>
</template>
<style scoped>
.kingdom-map-wrap {
  min-width: 0;
  border: 1px solid #72805b;
  border-radius: 22px;
  overflow: hidden;
  background: #203f33;
  box-shadow:
    0 12px 36px #071e2026,
    inset 0 0 0 3px #c1b47b12;
}
.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  color: #d3ddc3;
  font-size: 12px;
  background: linear-gradient(110deg, #304d3d, #203c31);
  border-bottom: 1px solid #b8c19330;
}
.map-toolbar > div {
  display: flex;
  gap: 5px;
}
.map-toolbar button {
  border: 1px solid #6b7a58;
  border-radius: 9px;
  background: #304c3d;
  color: #f5ebc5;
  min-width: 42px;
  min-height: 44px;
  padding: 6px 9px;
  font: inherit;
  cursor: pointer;
}
.kingdom-map {
  height: 460px;
  overflow: hidden;
  touch-action: none;
  position: relative;
  background: radial-gradient(ellipse at center, #3e5a48, #20392f);
  cursor: grab;
}
.map-stage {
  position: relative;
}
.popover-anchor {
  position: absolute;
  z-index: 5;
  scroll-margin-top: calc(100px + env(safe-area-inset-top, 0px));
  scroll-margin-bottom: 12px;
}
.popover-anchor::after {
  content: '';
  position: absolute;
  left: var(--arrow-left);
  top: 100%;
  transform: translateX(-50%);
  border: 9px solid transparent;
  border-top-color: #f6eed8;
  pointer-events: none;
}
.kingdom-map:active {
  cursor: grabbing;
}
.kingdom-map.snowy {
  background: radial-gradient(ellipse, #547267, #294b46);
}
svg {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
}
.map-hint {
  margin: 0;
  padding: 13px 16px;
  color: #b7cbb3;
  font-size: 12px;
  line-height: 1.6;
  border-top: 1px solid #b8c19330;
}
button:focus-visible,
.kingdom-map:focus-visible {
  outline: 3px solid #ffe193;
  outline-offset: -3px;
}
@media (max-width: 600px) {
  .kingdom-map {
    height: 360px;
    height: clamp(300px, 50svh, 420px);
  }
  .map-toolbar {
    flex-wrap: wrap;
  }
  .map-toolbar span {
    font-size: 11px;
  }
}
</style>

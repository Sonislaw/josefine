<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BUILDINGS,
  SIZE,
  TERRAIN_NAMES,
  frontier,
  key,
  sectorOf,
  terrain,
  type Kingdom,
  type Point,
} from './engine'
import TileArt from './TileArt.vue'
import { settlementDefinition, RELATIONS } from './neighbours'
import { RANKS } from './progression'
import { blocksBuilding, DISCOVERIES, discoveryStatus } from './discoveries'
const props = defineProps<{ state: Kingdom; selected: Point | null; winter: boolean }>()
const emit = defineEmits<{ select: [Point]; explore: [Point] }>()
const host = ref<HTMLElement>(),
  width = ref(640),
  height = ref(450),
  zoom = ref(1),
  ox = ref(96),
  oy = ref(1)
const cursor = ref<Point>({ x: 3, y: 3 })
const CELL = 64
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
      const t = terrain(props.state.seed, x, y),
        b = props.state.buildings[key(x, y)]
      const found = props.state.discoveries[key(x, y)],
        d = blocksBuilding(found) ? found : undefined
      const contact = contacts.value.get(key(x, y))
      const enemy = contact ? props.state.affairs.enemies[contact.id] : undefined
      result.push({
        x,
        y,
        terrain: t,
        building: b,
        settlement: contact,
        enemy,
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
  const z = Math.max(0.45, Math.min(1.8, value)),
    ratio = z / zoom.value
  ox.value = x - (x - ox.value) * ratio
  oy.value = y - (y - oy.value) * ratio
  zoom.value = z
}
function locate(p: Point) {
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
    const dx = entry.contentRect.width - width.value,
      dy = entry.contentRect.height - height.value
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
    ox.value += dx / 2
    oy.value += dy / 2
  })
  if (host.value) {
    width.value = host.value.clientWidth
    height.value = host.value.clientHeight
    zoom.value = Math.max(0.45, Math.min(1, (width.value - 20) / (7 * CELL)))
    center()
    observer.observe(host.value)
  }
  window.addEventListener('blur', cancel)
})
onBeforeUnmount(() => {
  observer?.disconnect()
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
  if (pointers.size > 1) moved = true
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
    if (Math.hypot(p.x - origin.x, p.y - origin.y) > 6) moved = true
    if (moved) {
      ox.value += p.x - prev.x
      oy.value += p.y - prev.y
    }
  }
  pointers.set(e.pointerId, p)
}
function choose(p: Point) {
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
  if (e.key === 'Escape') cancel()
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
          <pattern id="kingdom-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#839777" opacity=".22" />
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
              rx="24"
              fill="#264c3b"
              fill-opacity=".12"
              stroke="#84997a"
              stroke-dasharray="8 10"
              stroke-width="2"
            />
            <text x="224" y="217" text-anchor="middle" fill="#c8d6a6" font-size="30">✧</text>
            <text x="224" y="250" text-anchor="middle" fill="#d7dfc7" font-size="18">
              Odkryj ziemie
            </text>
          </g>
          <g
            v-for="p in visible"
            :key="key(p.x, p.y)"
            :data-tile="key(p.x, p.y)"
            :transform="`translate(${p.x * 64} ${p.y * 64})`"
            role="img"
            :aria-label="p.label"
          >
            <title>{{ p.label }}</title>
            <TileArt
              :rank="state.rank"
              :terrain="p.terrain"
              :building="p.building"
              :settlement="p.settlement"
              :enemy="p.enemy"
              :winter="winter"
              :discovery="p.discovery"
            />
            <rect
              v-if="selected && Math.abs(selected.x - p.x) + Math.abs(selected.y - p.y) === 1"
              x="3"
              y="3"
              width="58"
              height="58"
              rx="8"
              fill="none"
              stroke="#fff7c5"
              stroke-opacity=".8"
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
          </g>
        </g>
      </svg>
    </div>
    <p class="map-hint">
      Dotknij pola · przeciągnij mapę · rozsuń palce, aby przybliżyć. Sąsiadujące pola są
      obrysowane.
    </p>
  </div>
</template>
<style scoped>
.kingdom-map-wrap {
  min-width: 0;
  border: 1px solid #4a6250;
  border-radius: 22px;
  overflow: hidden;
  background: #203f33;
}
.map-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  color: #d3ddc3;
  font-size: 12px;
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
  background: radial-gradient(ellipse at center, #35523d, #18362d);
  cursor: grab;
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

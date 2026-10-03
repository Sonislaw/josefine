<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ArrowUpRight, Ruler } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { parseDomNumber } from '../lib/calculations'
import { domPath } from '../seo/useDomSeo'

const dimensions = reactive({ length: '5', width: '4', height: '2,5' })

function parseDimension(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 && value <= 1000 ? value : null
}

const room = computed(() => {
  const length = parseDimension(dimensions.length)
  const width = parseDimension(dimensions.width)
  const height = parseDimension(dimensions.height)
  if (length === null || width === null || height === null) return null
  const floor = length * width
  const perimeter = 2 * (length + width)
  return { floor, perimeter, volume: floor * height, walls: perimeter * height }
})

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
const toQueryNumber = (value: number) => String(Number(value.toFixed(6)))

// Keep the existing calculators as the source of truth: only their declared input fields travel in links.
const nextSteps = computed(() => {
  if (!room.value) return []
  return [
    {
      title: 'Panele na podłogę',
      detail: `${format(room.value.floor)} m² podłogi`,
      to: {
        path: domPath('/liczba-paczek-paneli'),
        query: { area: toQueryNumber(room.value.floor) },
      },
    },
    {
      title: 'Listwy przypodłogowe',
      detail: `${format(room.value.perimeter)} m obwodu`,
      to: {
        path: domPath('/obwod-prostokata'),
        query: { length: dimensions.length, width: dimensions.width },
      },
    },
    {
      title: 'Płytki na podłogę',
      detail: `${format(room.value.floor)} m² podłogi`,
      to: { path: domPath('/liczba-plytek'), query: { area: toQueryNumber(room.value.floor) } },
    },
    {
      title: 'Farba na ściany',
      detail: `${format(room.value.walls)} m² ścian przed odjęciem otworów`,
      to: {
        path: domPath('/ilosc-farby'),
        query: {
          mode: 'room',
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          area: toQueryNumber(room.value.walls),
        },
      },
    },
  ]
})
</script>

<template>
  <section class="room-planner" aria-labelledby="room-planner-title">
    <div class="planner-heading">
      <div>
        <p class="eyebrow"><Ruler :size="15" aria-hidden="true" /> ZACZNIJ OD POMIARU</p>
        <h2 id="room-planner-title">Jeden pokój. Kilka przydatnych wyników.</h2>
        <p>
          Podaj wymiary prostokątnego pokoju, a potem przejdź do kalkulatora z już wpisanymi
          danymi.
        </p>
      </div>
      <span class="planner-mark" aria-hidden="true">m²</span>
    </div>

    <div class="planner-body">
      <div class="planner-inputs">
        <label
          v-for="field in ['length', 'width', 'height'] as const"
          :key="field"
          :for="`room-${field}`"
        >
          <span>{{
            field === 'length' ? 'Długość' : field === 'width' ? 'Szerokość' : 'Wysokość'
          }}</span>
          <span class="input-wrap"
            ><input
              :id="`room-${field}`"
              v-model="dimensions[field]"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="parseDimension(dimensions[field]) === null"
            /><small>m</small></span
          >
        </label>
        <p>
          Wpisz metry, np. 2,5. Każdy wymiar powinien być większy od zera i nie przekraczać 1000 m.
        </p>
      </div>
      <div class="planner-results" aria-live="polite">
        <div>
          <span>Podłoga</span
          ><strong>{{ room ? format(room.floor) : '—' }} <small>m²</small></strong>
        </div>
        <div>
          <span>Obwód</span
          ><strong>{{ room ? format(room.perimeter) : '—' }} <small>m</small></strong>
        </div>
        <div>
          <span>Kubatura</span
          ><strong>{{ room ? format(room.volume) : '—' }} <small>m³</small></strong>
        </div>
        <div>
          <span>Ściany</span
          ><strong>{{ room ? format(room.walls) : '—' }} <small>m²</small></strong>
        </div>
      </div>
    </div>

    <div class="planner-actions">
      <p>Co chcesz policzyć dalej?</p>
      <div v-if="room" class="action-list">
        <RouterLink v-for="step in nextSteps" :key="step.title" :to="step.to">
          <span
            ><strong>{{ step.title }}</strong
            ><small>{{ step.detail }}</small></span
          >
          <ArrowUpRight :size="19" aria-hidden="true" />
        </RouterLink>
      </div>
      <p v-else class="invalid-note">Popraw wymiary, aby przejść do kolejnego kalkulatora.</p>
      <small
        >Powierzchnia ścian nie uwzględnia drzwi, okien ani skosów. Przed zakupem materiałów odejmij
        otwory i sprawdź zalecany zapas.</small
      >
    </div>
  </section>
</template>

<style scoped>
.room-planner {
  width: min(100% - 2.5rem, 1280px);
  margin: 5rem auto 0;
  overflow: hidden;
  border: 1px solid #d8e5d6;
  border-radius: 28px;
  background: #fffefa;
  box-shadow: 0 22px 60px #2f563c12;
}
.planner-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem 2.2rem;
  background: linear-gradient(110deg, #eff5e9, #f8efe1);
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #a7634b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
h2 {
  max-width: 700px;
  margin-top: 0.55rem;
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 1.13;
}
.planner-heading p:last-child {
  max-width: 640px;
  margin-top: 0.8rem;
  color: #607566;
  font-size: 0.9rem;
  line-height: 1.65;
}
.planner-mark {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 112px;
  height: 112px;
  border: 2px solid #8cae90;
  border-radius: 18px;
  background:
    repeating-linear-gradient(0deg, transparent 0 20px, #84a88a22 21px 22px),
    repeating-linear-gradient(90deg, transparent 0 20px, #84a88a22 21px 22px), #e5f0e2;
  color: #315c42;
  font-family: var(--font-heading);
  font-size: 1.45rem;
  font-weight: 800;
  transform: rotate(7deg);
}
.planner-body {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 1.5rem;
  padding: 2rem 2.2rem;
}
.planner-inputs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  align-content: center;
}
.planner-inputs label span:first-child {
  display: block;
  margin-bottom: 0.5rem;
  color: #355b43;
  font-size: 0.75rem;
  font-weight: 800;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid #cbdccb;
  border-radius: 11px;
  background: white;
}
.input-wrap:focus-within {
  border-color: #508c62;
  box-shadow: 0 0 0 3px #508c6226;
}
.input-wrap:has(input[aria-invalid='true']) {
  border-color: #bd715c;
}
.input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #213a30;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 800;
}
.input-wrap small {
  color: #788b7a;
  font-weight: 800;
}
.planner-inputs > p {
  grid-column: 1 / -1;
  color: #758678;
  font-size: 0.75rem;
  line-height: 1.5;
}
.planner-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}
.planner-results > div {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.15rem;
  border-radius: 15px;
  background: #eaf2e7;
}
.planner-results > div:nth-child(2),
.planner-results > div:nth-child(3) {
  background: #f4eee2;
}
.planner-results span {
  color: #63806b;
  font-size: 0.75rem;
  font-weight: 800;
}
.planner-results strong {
  color: #28523c;
  font-family: var(--font-heading);
  font-size: clamp(1.3rem, 2.3vw, 1.9rem);
  line-height: 1.1;
}
.planner-results small {
  font-size: 0.65em;
}
.planner-actions {
  padding: 1.4rem 2.2rem 1.8rem;
  border-top: 1px solid #e3eadd;
}
.planner-actions > p:first-child {
  margin-bottom: 0.85rem;
  color: #365d44;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
}
.action-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}
.action-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border: 1px solid #d4e2d1;
  border-radius: 12px;
  background: #f9fbf5;
  color: #285b3e;
  text-decoration: none;
}
.action-list a:hover,
.action-list a:focus-visible {
  border-color: #6ea077;
  background: #eef5e9;
}
.action-list strong,
.action-list small {
  display: block;
}
.action-list strong {
  font-size: 0.81rem;
}
.action-list small {
  margin-top: 0.25rem;
  color: #738575;
  font-size: 0.69rem;
  line-height: 1.4;
}
.action-list svg {
  flex: 0 0 auto;
}
.planner-actions > small,
.invalid-note {
  display: block;
  margin-top: 1rem;
  color: #728475;
  font-size: 0.73rem;
  line-height: 1.55;
}
.invalid-note {
  color: #a75a48;
}
@media (max-width: 900px) {
  .planner-body {
    grid-template-columns: 1fr;
  }
  .action-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 650px) {
  .room-planner {
    margin-top: 3.5rem;
  }
  .planner-heading,
  .planner-body,
  .planner-actions {
    padding-inline: 1.25rem;
  }
  .planner-mark {
    display: none;
  }
  .planner-inputs {
    grid-template-columns: 1fr;
  }
  .planner-inputs > p {
    grid-column: auto;
  }
  .action-list {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { Kingdom, Point } from './engine'
import { RANKS } from './progression'
import {
  REQUESTS,
  REQUEST_IDS,
  availableRequests,
  requestOffer,
  requestProgress,
  type RequestCommand,
  type CompletedRequest,
} from './requests'
import ResidentPortrait from './ResidentPortrait.vue'
import { resourceList } from './format'
const props = defineProps<{ state: Kingdom; disabled: boolean; latest: CompletedRequest | null }>()
const emit = defineEmits<{
  command: [command: RequestCommand]
  locate: [point: Point]
  dismiss: []
}>()
const active = computed(() => props.state.requests.active)
const progress = computed(() =>
  active.value ? requestProgress(props.state, active.value.id) : null,
)
const offered = computed(() => requestOffer(props.state))
const available = computed(() => availableRequests(props.state))
const locked = computed(() => REQUEST_IDS.filter((id) => REQUESTS[id].minRank > props.state.rank))
</script>
<template>
  <section class="residents-section" aria-label="Głos mieszkańców">
    <div v-if="latest" class="request-announcement" role="status">
      <ResidentPortrait :id="latest.id" />
      <div>
        <small>{{ REQUESTS[latest.id].resident }} · DZIĘKUJĘ ZA POMOC!</small
        ><strong>{{ REQUESTS[latest.id].title }} — wykonano</strong>
        <p>Nagroda dodana do zapasów: {{ resourceList(REQUESTS[latest.id].reward) }}.</p>
      </div>
      <button type="button" aria-label="Zamknij podziękowanie mieszkańca" @click="emit('dismiss')">
        Zamknij
      </button>
    </div>
    <details class="residents-panel">
      <summary>
        Głos mieszkańców
        <span v-if="active"
          >{{ REQUESTS[active.id].title }} ·
          {{ progress?.complete ? 'Cel gotowy' : 'W trakcie' }}</span
        ><span v-else
          >{{ state.requests.completed.length }} / 12 wykonanych ·
          {{
            offered.length
              ? 'Wybierz prośbę'
              : locked.length
                ? 'Kolejne po awansie'
                : 'Wszystkie wykonane'
          }}</span
        >
      </summary>
      <p class="resident-intro">
        Małe sprawy, które tworzą osadę. Jedna prośba naraz, bez terminów i kar. Istniejąca zabudowa
        także się liczy.
      </p>
      <article v-if="active && progress" class="resident-active" :data-active-request="active.id">
        <div class="resident-heading">
          <ResidentPortrait :id="active.id" />
          <div>
            <span>{{ REQUESTS[active.id].resident }} · {{ REQUESTS[active.id].profession }}</span>
            <h2>{{ REQUESTS[active.id].title }}</h2>
          </div>
        </div>
        <blockquote>„{{ REQUESTS[active.id].quote }}”</blockquote>
        <p class="request-goal"><strong>Cel:</strong> {{ REQUESTS[active.id].goal }}</p>
        <div class="request-progress">
          <strong>{{ progress.value }} / {{ progress.required }}</strong
          ><span>{{ progress.complete ? '✓ Cel gotowy' : 'W trakcie' }}</span>
        </div>
        <progress
          :value="Math.min(progress.value, progress.required)"
          :max="progress.required"
          aria-label="Postęp aktywnej prośby"
        />
        <p>
          {{
            progress.complete
              ? 'Zatwierdź dowolną legalną turę, aby ukończyć prośbę. Warunek musi nadal być spełniony po tym ruchu.'
              : REQUESTS[active.id].hint
          }}
        </p>
        <p class="request-prize">
          Nagroda: <strong>{{ resourceList(REQUESTS[active.id].reward) }}</strong
          >.
        </p>
        <div class="resident-actions">
          <button v-if="progress.location" type="button" @click="emit('locate', progress.location)">
            Pokaż na mapie ↗</button
          ><button type="button" :disabled="disabled" @click="emit('command', { type: 'defer' })">
            Odłóż prośbę
          </button>
        </div>
      </article>
      <div v-else-if="offered.length" class="resident-offers">
        <article v-for="id in offered" :key="id" :data-request-card="id">
          <div class="resident-heading">
            <ResidentPortrait :id="id" />
            <div>
              <span>{{ REQUESTS[id].resident }} · {{ REQUESTS[id].profession }}</span>
              <h2>{{ REQUESTS[id].title }}</h2>
            </div>
          </div>
          <blockquote>„{{ REQUESTS[id].quote }}”</blockquote>
          <p class="request-goal">{{ REQUESTS[id].goal }}</p>
          <p class="request-prize">
            Nagroda: <strong>{{ resourceList(REQUESTS[id].reward) }}</strong
            >.
          </p>
          <button
            type="button"
            :disabled="disabled"
            :aria-label="`Przyjmij prośbę: ${REQUESTS[id].title}`"
            @click="emit('command', { type: 'accept', id })"
          >
            Pomogę →
          </button>
        </article>
      </div>
      <p v-else-if="locked.length" class="resident-empty">
        Na razie wykonano dostępne prośby. Kolejne odblokujesz wraz z rozwojem osady.
      </p>
      <p v-else class="resident-empty">
        ✓ Wszystkie 12 próśb wykonane. Mieszkańcy zapamiętają Twoją pomoc — możesz dalej rozwijać
        królestwo.
      </p>
      <button
        v-if="!active && available.length > 3"
        type="button"
        class="browse-requests"
        :disabled="disabled"
        @click="emit('command', { type: 'rotate' })"
      >
        Inne prośby ↻
      </button>
      <p class="resident-note">
        Wybór i odłożenie nie zużywają tury. Każdą nagrodę otrzymasz raz, po wyżywieniu mieszkańców
        i sprawdzeniu awansu.
      </p>
      <details v-if="locked.length" class="resident-locked">
        <summary>Prośby na później · {{ locked.length }}</summary>
        <ul>
          <li v-for="id in locked" :key="id">
            {{ REQUESTS[id].title }} <span>· od rangi {{ RANKS[REQUESTS[id].minRank]!.name }}</span>
          </li>
        </ul>
      </details>
      <details v-if="state.requests.completed.length" class="resident-history">
        <summary>Historia pomocy · {{ state.requests.completed.length }}</summary>
        <ol>
          <li v-for="c in [...state.requests.completed].reverse()" :key="c.id">
            ✓ {{ REQUESTS[c.id].title }}
            <span>{{ REQUESTS[c.id].resident }} · po turze {{ c.turn }}</span>
          </li>
        </ol>
      </details>
    </details>
  </section>
</template>
<style scoped>
.residents-section {
  margin: 0 0 18px;
}
.residents-panel {
  background: #263f31;
  border: 1px solid #7c8050;
  border-radius: 16px;
  padding: 14px 16px;
  color: #f5ebcf;
}
summary {
  cursor: pointer;
  min-height: 44px;
  font-size: 14px;
  padding: 8px 0;
}
summary > span {
  font-size: 12px;
  color: #c7d8ac;
  margin-left: 10px;
}
p {
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.8;
  color: #d3dbbf;
}
.resident-intro {
  margin: 10px 0 18px;
}
.resident-offers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.resident-offers article,
.resident-active {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #c9c89d;
  background: #ece5cf;
  color: #2e4837;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.resident-active {
  max-width: 780px;
}
.resident-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.resident-heading svg {
  width: 54px;
  flex-shrink: 0;
}
.resident-heading div {
  min-width: 0;
}
.resident-heading span {
  font-size: 10px;
  color: #61714f;
}
h2 {
  font:
    400 22px Georgia,
    serif;
  margin: 5px 0 0;
  line-height: 1.2;
}
blockquote {
  font:
    italic 14px/1.7 Georgia,
    serif;
  color: #65704e;
  margin: 16px 0 8px;
}
.resident-offers p,
.resident-active p {
  color: #4e624a;
}
.resident-offers .request-goal {
  flex: 1;
}
.request-prize {
  padding-top: 8px;
  border-top: 1px solid #c4caae;
}
button {
  min-height: 44px;
  border: 1px solid #718453;
  border-radius: 10px;
  padding: 10px 14px;
  font: inherit;
  font-size: 12px;
  background: #34523b;
  color: #fff0c5;
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
button:focus-visible,
summary:focus-visible {
  outline: 3px solid #d3a43b;
  outline-offset: 3px;
}
.resident-offers button {
  margin-top: 10px;
  text-align: left;
}
.resident-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}
.resident-actions button:last-child {
  background: transparent;
  color: #3c583d;
}
.request-progress {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin-top: 12px;
}
progress {
  width: 100%;
  height: 8px;
  margin: 10px 0;
  border: 0;
  border-radius: 8px;
  accent-color: #658953;
  background: #cad1b7;
}
progress::-webkit-progress-bar {
  background: #cad1b7;
  border-radius: 8px;
}
progress::-webkit-progress-value {
  background: #658953;
  border-radius: 8px;
}
progress::-moz-progress-bar {
  background: #658953;
  border-radius: 8px;
}
.browse-requests {
  margin-top: 14px;
}
.resident-note {
  margin-top: 16px;
  font-size: 11px;
}
.resident-history,
.resident-locked {
  margin-top: 12px;
  border-top: 1px solid #66774e;
  font-size: 12px;
}
ol,
ul {
  list-style: none;
  padding: 0;
  margin: 6px 0;
}
li {
  padding: 7px 0;
  line-height: 1.7;
}
li span {
  color: #bfcfa8;
}
.resident-history li span {
  display: block;
}
.request-announcement {
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #c2aa68;
  background: #3b4c32;
}
.request-announcement svg {
  width: 54px;
  flex-shrink: 0;
}
.request-announcement div {
  flex: 1;
  min-width: 0;
}
.request-announcement small,
.request-announcement strong {
  display: block;
}
.request-announcement small {
  font-size: 10px;
  color: #e6ce92;
  letter-spacing: 0.1em;
}
.request-announcement strong {
  font-size: 15px;
  line-height: 1.5;
  margin: 5px 0;
}
.request-announcement p {
  margin: 0;
}
@media (max-width: 800px) {
  .resident-offers {
    grid-template-columns: minmax(0, 1fr);
  }
  summary > span {
    display: block;
    margin: 6px 0 0 15px;
  }
}
@media (max-width: 600px) {
  .residents-panel {
    padding: 12px;
  }
  .request-announcement {
    flex-wrap: wrap;
  }
  .request-announcement button {
    margin-left: 68px;
  }
}
</style>

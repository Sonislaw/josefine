<script setup lang="ts">
import type { Terrain } from './engine'
import ForestGrowthArt from './ForestGrowthArt.vue'
// Cosmetic variants never consume the saved game's random generator.
withDefaults(
  defineProps<{
    terrain: Terrain
    season?: number
    variant?: number
    occupied?: boolean
    waterEdges?: number
    depleted?: boolean
    forestStage?: 1 | 2 | 3
  }>(),
  { season: 0, variant: 0, occupied: false, waterEdges: 15 },
)
const ground = ['#9cbb78', '#a6bc74', '#c3ac70', '#dbe5d8']
const canopy = ['#487749', '#507745', '#a77c3d', '#728e7c']
</script>
<template>
  <g aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
    <rect width="64" height="64" :fill="terrain === 'water' ? '#498f9a' : ground[season]" />
    <template v-if="terrain === 'water'">
      <path d="M0 12Q16 5 33 12T64 12V42Q47 34 31 42T0 42Z" fill="#5ca6ad" />
      <path d="M0 49Q18 42 35 49T64 49V64H0Z" fill="#377f8c" opacity=".45" />
      <!-- Neighbour-aware shores join water across tile boundaries. -->
      <g fill="none" stroke="#c8bb83" stroke-width="8">
        <path v-if="waterEdges & 1" d="M0 0H64" /><path v-if="waterEdges & 2" d="M64 0V64" />
        <path v-if="waterEdges & 4" d="M0 64H64" /><path v-if="waterEdges & 8" d="M0 0V64" />
      </g>
      <g fill="none" :stroke="season === 3 ? '#e8f4e8' : '#a9d6c9'" stroke-width="1.4" opacity=".8">
        <path :d="variant % 2 ? 'M14 18h13m5 2h6M27 44h15m-23 3h5' : 'M9 36h14m8-13h14M39 51h10'" />
        <path v-if="waterEdges & 1" d="M8 7h19m7 0h20" /><path
          v-if="waterEdges & 4"
          d="M9 57h17m9 0h17"
        />
      </g>
      <path
        v-if="season === 3"
        d="M7 8h16l8 7-12 9H7zm33 35 17-3v14H44l-7-5z"
        fill="#d4e8df"
        opacity=".65"
      />
      <g v-else-if="variant % 3 === 0" fill="#698e51" stroke="#386b56" stroke-width=".7"
        ><path d="M14 46a4 3 0 1 0 4-3l-1 3zM45 16a4 3 0 1 0 4-3l-1 3z"
      /></g>
    </template>
    <template v-else>
      <path
        :d="
          variant % 2
            ? 'M0 5Q16 1 23 14T52 20L64 25V0H0ZM8 64Q10 49 32 52T64 44V64Z'
            : 'M0 36Q17 24 35 36T64 28V54Q44 62 24 48T0 57Z'
        "
        :fill="season === 3 ? '#c2d3c6' : '#789859'"
        opacity=".17"
      />
      <g
        v-if="!occupied"
        :stroke="season === 3 ? '#acbfb0' : '#708b4d'"
        stroke-width="1"
        fill="none"
        opacity=".65"
      >
        <path d="m8 46 1-3 2 3m42-31 1-3 2 3M40 55l1-3 2 3M21 10l1 2 2-3" />
        <path v-if="variant % 2" d="m15 29 2-3 1 3m29 12 2-2" />
      </g>
      <g
        v-if="terrain === 'meadow' && !occupied && season !== 3"
        :fill="season === 2 ? '#eee0aa' : '#f5e9bb'"
      >
        <circle :cx="variant % 2 ? 24 : 45" cy="24" r="1.3" /><circle
          cx="13"
          cy="53"
          r="1"
        /><circle v-if="variant % 3 === 1" cx="42" cy="45" r="1.5" />
      </g>
      <ForestGrowthArt
        v-if="terrain === 'forest' && forestStage && forestStage < 3"
        :stage="forestStage as 1 | 2"
        :winter="season === 3"
      />
      <g v-else-if="terrain === 'forest' && !depleted" data-forest-stage="3">
        <ellipse cx="34" cy="48" rx="26" ry="12" fill="#395d41" opacity=".2" />
        <g
          v-for="(tree, i) in [
            [12, 8, 0.9],
            [35, 5, 0.95],
            [24, 22, 0.9],
          ]"
          :key="i"
          :transform="`translate(${tree[0]} ${tree[1]}) scale(${tree[2]})`"
        >
          <path d="M8 19v20l5 2V18" fill="#755b3f" /><path
            d="m10 30-5-5m6 0 5-6"
            fill="none"
            stroke="#755b3f"
            stroke-width="2"
          />
          <path
            d="M-1 20q-5-8 1-12-1-9 8-9 8-5 13 3 9 0 8 9 5 9-4 13-3 7-12 4-10 2-14-8"
            :fill="canopy[season]"
            stroke="#426341"
            stroke-width=".8"
          />
          <path
            d="M0 11q-1-9 9-9 7-4 11 4-11-2-13 7-4 6-7-2"
            :fill="season === 3 ? '#e4ecdc' : season === 2 ? '#d4ab55' : '#80a45b'"
          />
          <path d="M8 23q9 3 15-4" stroke="#315c41" stroke-width="2" fill="none" opacity=".5" />
        </g>
        <path d="m5 57 4-5 3 5m41 2 3-6 4 5" fill="none" stroke="#577c45" stroke-width="1.5" />
      </g>
      <g v-if="terrain === 'rock' && !depleted" stroke="#657f78" stroke-width=".8">
        <ellipse cx="33" cy="49" rx="26" ry="9" fill="#3f5b49" opacity=".18" stroke="none" />
        <path d="m6 43 8-20 12-5 10 26-13 9Z" fill="#91a297" /><path
          d="m14 23 12-5-4 23-16 2Z"
          fill="#c9d1bb"
        />
        <path d="m21 46 9-31 13-7 13 19 5 21-22 7Z" fill="#788e88" /><path
          d="m30 15 13-7-5 29-17 9Z"
          :fill="season === 3 ? '#eef1dd' : '#d1d4bc'"
        />
        <path d="m43 8 13 19-18 10Z" fill="#a9b8a7" /><path
          d="m38 37 9 8 14 3-22 7-18-9Z"
          fill="#647e78"
        />
        <path d="m15 53 5-5 7 2 2 7H17zm31 3 4-5 8 2-1 5Z" fill="#b9c4ad" /><path
          d="m32 24 5-6m9 15 5 2"
          stroke="#ebeed5"
          stroke-width="1.2"
        />
      </g>
    </template>
    <g v-if="depleted" data-depleted="true">
      <g v-if="terrain === 'forest'" stroke="#795f3c" stroke-width="1">
        <g
          v-for="(p, i) in [
            [16, 24],
            [43, 28],
            [29, 45],
          ]"
          :key="i"
          :transform="`translate(${p[0]} ${p[1]})`"
        >
          <path d="M-5 0v7l-4 3 8-1 8 1-3-4V0" fill="#927244" /><ellipse
            rx="5"
            ry="3"
            fill="#dfc48c"
          /><ellipse rx="2.5" ry="1.5" fill="none" stroke-width=".6" />
        </g>
      </g>
      <g v-else fill="#a7b3a0" stroke="#788b78" stroke-width="1">
        <ellipse cx="32" cy="35" rx="23" ry="15" fill="#83917b" opacity=".45" />
        <path d="m12 38 5-5 7 3-2 5Zm22 7 4-4 8 2-2 4Zm6-21 4-4 6 3-3 3Z" /><path
          d="M22 32q10-6 21 1m-18 7h12"
          fill="none"
        />
      </g>
    </g>
    <path d="M0 64V0H64" fill="none" stroke="#3b6146" stroke-opacity=".13" stroke-width=".8" />
  </g>
</template>

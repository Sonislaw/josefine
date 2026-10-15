<script setup lang="ts">
import type { Building, Terrain } from './engine'
import type { Discovery } from './discoveries'
import DiscoveryArt from './DiscoveryArt.vue'
import HallArt from './HallArt.vue'
import MilitaryArt from './MilitaryArt.vue'
import TerrainArt from './TerrainArt.vue'
import BuildingArt from './BuildingArt.vue'
import type { Settlement } from './neighbours'
import type { EnemyCampaign } from './campaign'
import { militaryBuilding } from './military'
import type { SettlementRank } from './progression'
withDefaults(
  defineProps<{
    terrain?: Terrain
    building?: Building
    winter?: boolean
    season?: number
    variant?: number
    waterEdges?: number
    depositRemaining?: number
    depositCapacity?: number
    forestStage?: 1 | 2 | 3
    idle?: boolean
    discovery?: Discovery
    rank?: SettlementRank
    settlement?: Settlement
    enemy?: EnemyCampaign
  }>(),
  { terrain: 'meadow', winter: false, season: 0, variant: 0, waterEdges: 15, rank: 0 },
)
</script>
<template>
  <g aria-hidden="true">
    <TerrainArt
      :terrain="terrain"
      :season="winter ? 3 : season"
      :variant="variant"
      :water-edges="waterEdges"
      :occupied="!!(building || settlement || discovery)"
      :depleted="depositRemaining === 0"
      :forest-stage="forestStage"
    />
    <g v-if="building || settlement" fill="none" stroke="#d5c293" stroke-linejoin="round">
      <path d="M27 64v-9h10v9" stroke-width="5" opacity=".7" />
      <rect
        x="7"
        y="14"
        width="50"
        height="43"
        rx="12"
        fill="#b9ac7e"
        fill-opacity=".3"
        stroke-opacity=".3"
      />
    </g>
    <DiscoveryArt v-if="discovery" :discovery="discovery" />
    <g v-if="building">
      <MilitaryArt
        v-if="militaryBuilding(building.kind)"
        :kind="building.kind"
        :level="building.level"
      />
      <HallArt v-else-if="building.kind === 'hall'" :rank="rank" />
      <BuildingArt v-else :building="building" :winter="winter" />
      <g v-if="building.level > 1" fill="#fff0b8" stroke="#725c38" stroke-width="1">
        <rect x="45" y="2" width="16" height="15" rx="5" />
        <text
          x="53"
          y="13"
          text-anchor="middle"
          font-size="10"
          font-family="system-ui"
          font-weight="700"
          fill="#55472b"
          stroke="none"
          >{{ building.level }}</text
        >
      </g>
    </g>
    <MilitaryArt
      v-if="settlement"
      :kind="settlement.relation === 'ruins' ? 'ruins' : 'settlement'"
      :hostile="settlement.relation === 'hostile'"
      :damaged="enemy && enemy.health < 50"
    />
    <g v-if="enemy && enemy.health > 0">
      <rect
        x="8"
        y="57"
        width="48"
        height="4"
        rx="2"
        fill="#374d42"
        stroke="#dfd5a6"
        stroke-width=".6"
      />
      <rect
        x="8"
        y="57"
        :width="(48 * enemy.health) / 100"
        height="4"
        rx="2"
        :fill="enemy.health < 40 ? '#dd8861' : '#f1ca78'"
      />
    </g>
    <g v-if="building?.damaged">
      <rect x="4" y="16" width="56" height="42" rx="8" fill="#433e37" opacity=".35" />
      <path d="m24 22 7 9-6 8 12 9-4 9" stroke="#3f392e" stroke-width="3" fill="none" />
      <path d="m10 55 6-5 6 7m21-2 5-5 6 7" fill="#8f8871" stroke="#575c4b" />
      <circle cx="53" cy="10" r="9" fill="#a04f34" stroke="#ffe0aa" />
      <text x="53" y="15" text-anchor="middle" font-size="13" font-weight="700" fill="#fff3d2"
        >!</text
      >
    </g>
    <g v-if="idle && !building?.damaged" data-extractor-idle="true">
      <title>Przestój — brak dostępnego surowca</title>
      <rect
        x="43"
        y="42"
        width="18"
        height="18"
        rx="5"
        fill="#825032"
        stroke="#ffe4a7"
        stroke-width="1.5"
      />
      <path d="M49 47v8m6-8v8" stroke="#fff0bf" stroke-width="2.5" />
    </g>
    <g v-if="forestStage && forestStage < 3" aria-hidden="true">
      <rect x="10" y="56" width="44" height="7" rx="3" fill="#344f39" />
      <circle
        v-for="n in 3"
        :key="n"
        :cx="18 + (n - 1) * 14"
        cy="59.5"
        r="2"
        :fill="n <= forestStage ? '#e6d98f' : '#7f9775'"
      />
    </g>
    <g v-else-if="depositRemaining !== undefined && depositCapacity" aria-hidden="true">
      <rect x="12" y="58" width="40" height="3" rx="1.5" fill="#405641" />
      <rect
        x="12"
        y="58"
        :width="(40 * depositRemaining) / depositCapacity"
        height="3"
        rx="1.5"
        :fill="terrain === 'forest' ? '#f0cd7e' : '#e1e3cc'"
      />
    </g>
  </g>
</template>

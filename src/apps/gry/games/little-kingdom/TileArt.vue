<script setup lang="ts">
import type { Building, Terrain } from './engine'
import type { Discovery } from './discoveries'
import DiscoveryArt from './DiscoveryArt.vue'
import HallArt from './HallArt.vue'
import MilitaryArt from './MilitaryArt.vue'
import type { Settlement } from './neighbours'
import { militaryBuilding } from './military'
import type { SettlementRank } from './progression'
withDefaults(
  defineProps<{
    terrain?: Terrain
    building?: Building
    winter?: boolean
    discovery?: Discovery
    rank?: SettlementRank
    settlement?: Settlement
  }>(),
  {
    terrain: 'meadow',
    winter: false,
    rank: 0,
  },
)
</script>
<template>
  <g aria-hidden="true">
    <rect
      x="1"
      y="1"
      width="62"
      height="62"
      rx="9"
      :fill="
        terrain === 'water'
          ? '#77bfc2'
          : terrain === 'rock'
            ? '#c2cbb7'
            : winter
              ? '#e0e9d9'
              : terrain === 'forest'
                ? '#9bb780'
                : '#bad19b'
      "
    />
    <path
      v-if="terrain === 'meadow' && !building"
      d="M12 47l2-4 2 4m29-28 2-4 2 4M39 52l2-4 2 4"
      stroke="#799665"
      fill="none"
      stroke-width="1.5"
    />
    <g
      v-if="terrain === 'water'"
      fill="none"
      stroke="#c7f1dc"
      stroke-width="2"
      stroke-linecap="round"
      ><path d="M9 22q7-5 14 0t14 0m-20 16q7-5 14 0t14 0M6 51q7-5 14 0"
    /></g>
    <g v-if="terrain === 'forest'" stroke="#557647" stroke-width="3"
      ><path d="M19 29v19m26-17v20m-12-4v10" /><g fill="#417253" stroke="none"
        ><path d="M5 34l14-26 14 26z" /><path d="M31 36L45 9l14 27z" /><path
          d="M16 48l16-30 16 30z" /></g
      ><path d="M10 28l9-16 9 16M37 28l8-14 8 14" stroke="#719872" stroke-width="2" fill="none"
    /></g>
    <g v-if="terrain === 'rock'"
      ><path d="M9 46l9-24 16-5 14 13 8 19z" fill="#738d84" /><path
        d="M18 22l11 13 5-18 14 13-10 8 18 11-47-3 20-11"
        fill="#9fb1a0" /><path d="M13 52h39" stroke="#60776e" stroke-width="2"
    /></g>
    <DiscoveryArt v-if="discovery" :discovery="discovery" />
    <g v-if="building" stroke-linejoin="round">
      <ellipse cx="33" cy="51" rx="23" ry="6" fill="#344e3e" opacity=".18" />
      <MilitaryArt
        v-if="militaryBuilding(building.kind)"
        :kind="building.kind"
        :level="building.level"
      />
      <g v-else-if="building.kind === 'farm'"
        ><rect x="10" y="16" width="44" height="36" rx="4" fill="#98704d" /><path
          d="M15 24h34M15 34h34M15 44h34"
          stroke="#dfbc60"
          stroke-width="5" /><path
          d="M19 19v9m12-9v9m12-9v9M24 29v9m12-9v9m12-9v9M19 39v9m12-9v9m12-9v9"
          stroke="#728e42"
          stroke-width="2" /><path d="M9 17h46" stroke="#f5db98" stroke-width="3"
      /></g>
      <g v-else-if="building.kind === 'orchard'"
        ><path d="M20 30v23m25-18v18" stroke="#825634" stroke-width="5" /><circle
          cx="20"
          cy="25"
          r="15"
          fill="#528957" /><circle cx="44" cy="30" r="15" fill="#67994e" /><g fill="#e99754"
          ><circle cx="15" cy="21" r="3" /><circle cx="26" cy="29" r="3" /><circle
            cx="40"
            cy="25"
            r="3" /><circle cx="49" cy="34" r="3" /></g
      ></g>
      <g v-else-if="building.kind === 'mill'"
        ><path d="M24 19h16l7 34H17z" fill="#f7e5b6" stroke="#9a845c" /><path
          d="M22 20l10-12 11 12"
          fill="#bd724a" /><path d="M29 53V41h7v12" fill="#5d6250" /><path
          d="M32 30L13 11m19 19 19 19M32 30l19-19M32 30 13 49"
          stroke="#6d7356"
          stroke-width="3" /><path
          d="M13 11l-3 8 13 8m28-16-8-3-8 13m16 28 3-8-13-8m-28 16 8 3 8-13"
          fill="#fdf3cf"
          stroke="#897753"
          stroke-width="1" /><circle cx="32" cy="30" r="4" fill="#d1955a"
      /></g>
      <g v-else-if="building.kind === 'market'"
        ><path d="M13 26v26m38-26v26" stroke="#705c40" stroke-width="3" /><rect
          x="11"
          y="41"
          width="42"
          height="10"
          rx="2"
          fill="#bf8e59" /><path d="M9 27l6-14h34l6 14z" fill="#f1d59b" /><path
          d="M20 13l-3 14h8l1-14m11 0 1 14h8l-3-14"
          fill="#bd6849" /><path
          d="M9 27q4 7 8 0 4 7 8 0 4 7 8 0 4 7 8 0 4 7 8 0 4 7 6 0"
          fill="#f1d59b" /><circle cx="23" cy="38" r="4" fill="#d88b50" /><circle
          cx="34"
          cy="38"
          r="4"
          fill="#80964a"
      /></g>
      <g v-else-if="building.kind === 'quarry'"
        ><path d="M8 48l9-19 18-6 19 25z" fill="#82938c" /><path
          d="M17 29l11 11 7-17 19 25H8"
          fill="#abb9a5" /><path d="M21 16l25 30" stroke="#845f3e" stroke-width="4" /><path
          d="M13 25q9-16 23-14"
          fill="none"
          stroke="#edf0d7"
          stroke-width="5"
      /></g>
      <HallArt v-else-if="building.kind === 'hall'" :rank="rank" />
      <g v-else>
        <rect x="15" y="27" width="35" height="25" rx="2" fill="#f7ebc9" />
        <path d="M9 29L32 9l25 20z" :fill="building.kind === 'sawmill' ? '#66806a' : '#c78754'" />
        <rect x="29" y="38" width="9" height="14" rx="2" fill="#617361" /><rect
          x="19"
          y="33"
          width="6"
          height="7"
          rx="1"
          fill="#83b8ac"
        /><rect x="41" y="33" width="6" height="7" rx="1" fill="#83b8ac" />
        <g v-if="building.kind === 'sawmill'" stroke="#795936" stroke-width="2"
          ><rect x="5" y="43" width="19" height="6" rx="3" fill="#c9a16a" /><rect
            x="8"
            y="50"
            width="19"
            height="6"
            rx="3"
            fill="#dbb782"
        /></g>
      </g>
      <g v-if="building.level > 1" fill="#fff2b8" stroke="#926e3a" stroke-width="1"
        ><circle cx="50" cy="10" r="8" /><text
          x="50"
          y="13"
          text-anchor="middle"
          font-size="9"
          font-family="system-ui"
          fill="#55472b"
          stroke="none"
          >{{ building.level }}</text
        ></g
      >
    </g>
    <MilitaryArt v-if="settlement" kind="settlement" :hostile="settlement.relation === 'hostile'" />
    <g v-if="building?.damaged"
      ><rect x="3" y="3" width="58" height="58" rx="8" fill="#4e4841" opacity=".45" /><path
        d="M22 8l8 16-8 8 16 10-5 14"
        stroke="#ffe0aa"
        stroke-width="4"
        fill="none"
      /><circle cx="52" cy="12" r="9" fill="#9e4b30" /><text
        x="52"
        y="16"
        text-anchor="middle"
        font-size="13"
        fill="white"
        >!</text
      ></g
    >
  </g>
</template>

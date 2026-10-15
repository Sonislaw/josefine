<script setup lang="ts">
import type { Building } from './engine'
defineProps<{ building: Building; winter?: boolean }>()
</script>
<template>
  <!-- Hand-drawn 2D silhouettes are reused by the map and building offer cards. -->
  <g aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="33" cy="53" rx="26" ry="6" fill="#36553f" opacity=".22" />
    <g v-if="building.kind === 'farm'">
      <path d="M5 24h41v32H5z" fill="#79543b" stroke="#5f4833" /><path
        d="M7 26h37v27H7z"
        fill="#a57845"
      />
      <path d="M11 28v23m8-23v23m8-23v23m8-23v23m7-23v23" stroke="#624e34" stroke-width="2" />
      <g :stroke="winter ? '#c1bc91' : '#dfc567'" stroke-width="1.7" fill="none">
        <path
          v-for="x in [11, 19, 27, 35]"
          :key="x"
          :d="`M${x} 48v-17m-3 2 3 3 3-3m-6 6 3 3 3-3m-6 6 3 3 3-3`"
        />
      </g>
      <path d="M39 18h18v22H39z" fill="#dfc58d" stroke="#775838" /><path
        d="m35 20 13-12 14 12Z"
        fill="#b4623e"
        stroke="#754a32"
      />
      <path d="m39 17 9-8 10 8" fill="none" stroke="#e2a366" stroke-width="2" /><path
        d="M45 40V28h7v12"
        fill="#604b34"
      />
      <path d="M4 22v35m43-12v12M3 55h47" stroke="#dfcfa0" stroke-width="2" />
      <g v-if="building.level > 1"
        ><path d="M51 45h9v12h-9z" fill="#d8bc75" stroke="#926b3e" /><path
          d="M51 49h9m-9 4h9"
          stroke="#ad874c"
      /></g>
      <path
        v-if="building.level === 3"
        d="M6 16h22m-20-3v7m18-7v7"
        stroke="#e8d6a3"
        stroke-width="2"
      />
    </g>
    <g v-else-if="building.kind === 'house' || building.kind === 'sawmill'">
      <path d="M13 28h37v26H13z" fill="#e6d2a1" stroke="#785c3f" /><path
        d="M15 30h33v6H15z"
        fill="#b79b6c"
        opacity=".5"
      />
      <path d="M17 26V13h7v9" fill="#9c7c5a" stroke="#6c5440" />
      <path
        d="M9 30 30 10h6l22 20Z"
        :fill="building.kind === 'sawmill' ? '#496e63' : '#ac5739'"
        stroke="#624e38"
        stroke-width="1.3"
      />
      <path
        d="m13 27 19-16 21 17"
        fill="none"
        :stroke="building.kind === 'sawmill' ? '#80a18a' : '#d98b55'"
        stroke-width="2.5"
      />
      <path
        d="M19 24h27m-22-5h16"
        :stroke="building.kind === 'sawmill' ? '#35584d' : '#884831'"
        stroke-width="1.2"
      />
      <path d="M14 34v20m35-20v20m-35-3h35" fill="none" stroke="#866443" stroke-width="2" />
      <path d="M28 54V39q5-4 10 0v15" fill="#5b5b41" stroke="#795838" /><path
        d="M33 39v14"
        stroke="#a18353"
      /><circle cx="36" cy="47" r=".9" fill="#e8cf81" />
      <path
        d="M18 36h7v9h-7zm23 0h6v9h-6z"
        fill="#edcb77"
        stroke="#795a39"
        stroke-width="1.5"
      /><path d="M21.5 36v9m22.5-9v9M18 40h7m16 0h6" stroke="#795a39" stroke-width=".8" />
      <path d="M26 56h15" stroke="#b8ac87" stroke-width="3" />
      <g v-if="building.kind === 'sawmill'">
        <path d="M4 46h18v5H4zm3 6h19v5H7" fill="#9c6b3d" stroke="#674c32" /><ellipse
          cx="5"
          cy="48.5"
          rx="3"
          ry="2.5"
          fill="#e5bd7a"
        /><ellipse cx="8" cy="54.5" rx="3" ry="2.5" fill="#e5bd7a" />
        <path d="m45 45 12-9 3 4-12 9Z" fill="#c8d3c7" stroke="#5c7266" /><path
          d="m55 35 5 5"
          stroke="#8c613e"
          stroke-width="3"
        />
      </g>
      <g v-else
        ><path d="M8 48h9v7H8" fill="#a36d43" /><path
          d="M8 48q-3-8 4-6 6-6 6 5"
          fill="#4f7f45" /><circle cx="12" cy="43" r="1.5" fill="#e4bb65"
      /></g>
      <path
        v-if="building.level > 1"
        d="M45 44h13v11H45V44l6-7 9 7Z"
        fill="#ceb784"
        stroke="#73583d"
      />
      <path
        v-if="building.level === 3"
        d="M27 22v-6l6-5 6 5v6Z"
        fill="#ead7ab"
        stroke="#6f533b"
      /><path v-if="building.level === 3" d="M31 17h4v5h-4z" fill="#6a8572" />
      <path v-if="winter" d="m12 27 20-17 22 18-9-3-13-10-12 10Z" fill="#edf1dd" />
    </g>
    <g v-else-if="building.kind === 'orchard'">
      <path d="M8 52h48M9 45v12m14-10v10m17-10v10m14-12v12" stroke="#c8b281" stroke-width="2" />
      <g
        v-for="(p, i) in [
          [17, 26],
          [43, 25],
          [30, 36],
        ]"
        :key="i"
        :transform="`translate(${p[0]} ${p[1]})`"
      >
        <path d="M0 0v17m0-9-5-6m5 3 5-5" fill="none" stroke="#73553a" stroke-width="2.5" />
        <path
          d="M-11 1q-5-10 4-14 7-7 13 0 9 1 7 11-3 9-12 7-9 2-12-4"
          :fill="winter ? '#8eaa8b' : '#4c824b'"
          stroke="#3f6940"
        />
        <path d="M-9-4q-1-9 8-10l7 5Q-5-10-9-4" :fill="winter ? '#e4eddb' : '#91b464'" />
        <g fill="#e7a34f" stroke="#a56439" stroke-width=".6"
          ><circle cx="-6" cy="0" r="2.3" /><circle cx="5" cy="-3" r="2.3" /><circle
            v-if="building.level > 1"
            cx="3"
            cy="3"
            r="2"
        /></g>
      </g>
      <path d="M45 49h11l-2 8h-7Z" fill="#b17a43" stroke="#795a35" /><path
        d="M46 52h9"
        stroke="#e5bd79"
      />
    </g>
    <g v-else-if="building.kind === 'mill'">
      <path d="m24 21-7 33h30l-7-33Z" fill="#e5d6ac" stroke="#81714f" /><path
        d="M35 23h5l7 31H35Z"
        fill="#b8a77c"
      />
      <path d="m20 22 12-15 13 15Z" fill="#a65f3d" stroke="#73533b" /><path
        d="m24 18 8-10 9 10"
        fill="none"
        stroke="#d89a5e"
        stroke-width="2"
      />
      <path d="M28 54V42q4-6 8 0v12" fill="#52624a" /><path
        d="M23 35h4m11 6h5m-22 7h4"
        stroke="#ad9870"
        stroke-width="1.5"
      />
      <g stroke="#79603e" stroke-width="1.2" fill="#f5e7b6">
        <path
          d="M30 29 11 9l-5 7 22 16ZM33 28 53 9l5 7-23 16ZM34 32l19 20 5-7-23-16ZM30 33 11 52l-5-7 22-16Z"
        />
        <path
          d="m12 14-3 4m8 1-3 4m8 1-3 4m31-14 3 4m-8 1 3 4m-8 1 3 4m8 16 3-4m-8-1 3-4m-8-1 3-4m-31 14-3-4m8-1-3-4m8-1-3-4"
          fill="none"
          stroke="#bea16a"
        />
      </g>
      <circle cx="32" cy="30" r="4" fill="#916b40" stroke="#e6c47e" stroke-width="1.5" /><path
        v-if="building.level > 1"
        d="M8 49h8v7H8m40-7h8v7h-8"
        fill="#cbb278"
        stroke="#8b7049"
      />
    </g>
    <g v-else-if="building.kind === 'market'">
      <path d="M8 53h48" stroke="#b2a078" stroke-width="5" /><path
        d="M13 24v29m38-29v29"
        stroke="#755235"
        stroke-width="3"
      />
      <path d="M8 27 16 12h32l9 15Z" fill="#f0dbaa" stroke="#8d613d" /><path
        d="m17 12-4 15h9l2-15m9 0v15h8l-2-15m8 0 5 15h5l-9-15"
        fill="#b65f44"
      />
      <path
        d="M8 27v4q4 5 7 0 4 5 8 0 4 5 8 0 4 5 8 0 4 5 8 0 5 5 10 0v-4"
        fill="#e7c890"
        stroke="#8d613d"
        stroke-width=".8"
      />
      <path d="M11 42h43v12H11Z" fill="#a97745" stroke="#705434" /><path
        d="M12 44h41M18 45v8m12-8v8m12-8v8"
        stroke="#d4ac6c"
      />
      <g stroke="#776d3b" stroke-width=".7"
        ><circle cx="20" cy="38" r="4" fill="#df9f49" /><circle
          cx="27"
          cy="38"
          r="3.5"
          fill="#87a251" /><path d="M35 34h10v8H35Z" fill="#e8d49a" /><path
          d="M40 34v8"
          stroke="#bfa56b"
      /></g>
      <path
        v-if="building.level > 1"
        d="M4 36h5v17H4m51-17h6v17h-6"
        fill="#c29b5e"
        stroke="#7d613b"
      /><path v-if="building.level === 3" d="M30 11V3l12 3-12 4" fill="#eed07c" stroke="#987343" />
    </g>
    <g v-else-if="building.kind === 'quarry'">
      <path d="M5 53 10 30l13-9 10 9 18-5 9 27Z" fill="#788c82" stroke="#536e66" /><path
        d="m10 30 13-9-3 25L5 53Zm23 0 18-5-8 18-17 5Z"
        fill="#c1c6ad"
      />
      <path d="M27 52V12h25M29 15l18 25" fill="none" stroke="#755839" stroke-width="3" /><path
        d="M49 13v24m-3 0 3 4 3-4"
        fill="none"
        stroke="#d7bc82"
        stroke-width="1.5"
      />
      <path d="M7 47h12v10H7zm16 4h13v7H23zm24-5h12v10H47Z" fill="#d3d4b8" stroke="#7d9081" /><path
        d="M8 50h10m7 4h10m14-5h9"
        stroke="#f0edd2"
      />
      <path
        v-if="building.level > 1"
        d="M5 40h13v6H5m35 6h7v8h-7"
        fill="#b7c4af"
        stroke="#738a7a"
      /><path v-if="winter" d="m9 31 14-10 8 9-10-4Z" fill="#edf0db" />
    </g>
  </g>
</template>

<script setup lang="ts">
import type { Discovery } from './discoveries'
defineProps<{ discovery: Discovery }>()
</script>
<template>
  <g aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="32" cy="53" rx="24" ry="6" fill="#294b3b" opacity=".2" />
    <g v-if="discovery.kind === 'ruins'">
      <path
        d="M12 51V22h8v-8h9v9h8V12h11v12h6v27z"
        fill="#c4b79a"
        stroke="#716b59"
        stroke-width="2"
      />
      <path d="M22 50V38q10-17 20 0v12" fill="#52695b" /><path
        d="M15 31h8m17 0h10M18 18v7m10 2h6m11-9v8"
        stroke="#eee0ba"
        stroke-width="3"
      />
      <path d="M11 39q10-3 10-18m-4 10-6-3m8-2 6-5" fill="none" stroke="#517c43" stroke-width="3" />
      <path d="M37 47h12v8H37z" fill="#a66d3f" stroke="#694b30" /><path
        d="M43 47v8"
        stroke="#f3d180"
        stroke-width="2"
      />
      <path d="m50 6 2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#fff0bb" />
    </g>
    <g v-else-if="discovery.kind === 'wagon'">
      <path d="m6 47 12-6m28 0 11 7" stroke="#6c5039" stroke-width="3" />
      <path d="M14 29h37l-3 18H18z" fill="#a97643" stroke="#674c35" stroke-width="2" />
      <path d="M19 24h23v15H19z" fill="#d7b772" stroke="#88693e" /><path
        d="m23 24 5 15m6-15 3 15"
        stroke="#a6864d"
      />
      <path d="M38 22q10-4 12 9l-2 9H34l-1-7z" fill="#eee0ac" stroke="#998957" /><path
        d="m39 24 7 1"
        stroke="#82704f"
        stroke-width="2"
      />
      <path d="M17 36h31m-29 7h27" stroke="#e0ae69" stroke-width="2" />
      <circle cx="22" cy="48" r="7" fill="#5c5941" stroke="#cfb780" stroke-width="2" /><circle
        cx="44"
        cy="48"
        r="7"
        fill="#5c5941"
        stroke="#cfb780"
        stroke-width="2"
      />
      <path d="M22 44v8m-4-4h8m18-4v8m-4-4h8" stroke="#a7a583" />
    </g>
    <g v-else-if="discovery.kind === 'spring'">
      <path
        d="M9 44q-2-14 11-17l4-12 14-4 8 16q13 5 10 17l-9 10H20z"
        fill="#809b84"
        stroke="#54765e"
        stroke-width="2"
      />
      <path d="m24 27 3-10 10-2 7 12" fill="#c5d2b2" /><path d="M30 21h6v14h-6z" fill="#3a665d" />
      <ellipse
        cx="33"
        cy="43"
        rx="18"
        ry="9"
        :fill="discovery.status === 'used' ? '#70d4cc' : '#5f9c87'"
      />
      <path
        d="M33 24v17m-11 2q10 7 22 0"
        fill="none"
        :stroke="discovery.status === 'used' ? '#e2ffef' : '#b1cba0'"
        stroke-width="3"
      />
      <g v-if="discovery.status === 'available'" fill="none" stroke="#466e42" stroke-width="3"
        ><path d="M11 52q12-16 2-28m4 10 7-8M49 52q-9-17 3-30m-4 13-7-6M25 12l9 9-4 12"
      /></g>
      <g v-else
        ><path
          d="m15 49 8 5h20l8-5M13 43l-1-5m41 5 1-5"
          fill="none"
          stroke="#e7dfbb"
          stroke-width="3" /><path d="m49 10 2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#f8efbc"
      /></g>
    </g>
    <g v-else>
      <path
        d="M15 49V27m33 22V27"
        :stroke="discovery.status === 'used' ? '#785938' : '#6b7360'"
        stroke-width="4"
      />
      <path
        :d="
          discovery.status === 'used'
            ? 'M10 27 19 14h26l10 13z'
            : 'M10 27 19 14h11l3 7 8-7h4l10 13z'
        "
        :fill="discovery.status === 'used' ? '#c77445' : '#989571'"
        stroke="#7b6649"
        stroke-width="2"
      />
      <path
        d="M20 15v11m12-11v11m12-11v11"
        :stroke="discovery.status === 'used' ? '#f4d593' : '#b7b58d'"
        stroke-width="4"
      />
      <path d="M13 42h37v10H13z" fill="#a57c4f" stroke="#72573c" stroke-width="2" /><path
        d="M18 47h26"
        stroke="#d9b67a"
      />
      <g v-if="discovery.status === 'used'"
        ><path d="M22 34h9v8h-9z" fill="#e6bb54" /><path
          d="M36 32q9-3 9 4v6H33v-6z"
          fill="#a3b376" /><circle cx="49" cy="9" r="6" fill="#f7d578" /><path
          d="M49 6v6"
          stroke="#a17a38"
          stroke-width="2"
      /></g>
      <g v-else fill="none" stroke="#526c41" stroke-width="3"
        ><path d="m10 51 9-13m-6 7-5-4m42 11-6-18m2 6 7-3"
      /></g>
    </g>
    <circle
      v-if="discovery.status === 'available'"
      cx="9"
      cy="9"
      r="7"
      fill="#f5e8bc"
      stroke="#9a7446"
    />
    <path
      v-if="discovery.status === 'available'"
      d="M9 5v5m0 3v.1"
      stroke="#79623e"
      stroke-width="2"
    />
  </g>
</template>

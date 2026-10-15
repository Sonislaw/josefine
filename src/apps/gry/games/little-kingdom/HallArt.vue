<script setup lang="ts">
import type { SettlementRank } from './progression'
defineProps<{ rank: SettlementRank }>()
</script>
<template>
  <!-- All four silhouettes fit the same 64×64 tile; rank is not a building level. -->
  <g :data-hall-rank="rank" aria-hidden="true" stroke-linejoin="round">
    <ellipse cx="33" cy="54" rx="28" ry="7" fill="#36553f" opacity=".2" />
    <path d="M9 52h46l4 7H5Z" fill="#b7ad87" stroke="#8e936f" stroke-width=".6" />
    <path d="M12 55h40m-34-3 2 6m10-6v7m11-7-2 7m10-7-2 7" stroke="#ded5b1" stroke-width=".7" />
    <g v-if="rank === 0">
      <rect x="15" y="27" width="35" height="25" rx="2" fill="#f2dfb1" />
      <path d="M9 29L32 9l25 20z" fill="#bc6b48" />
      <path
        d="m12 27 20-17 22 18m-36-4h29m-23-5h17"
        fill="none"
        stroke="#e1a166"
        stroke-width="1.5"
      />
      <path d="M16 30h33v5H16Z" fill="#ae8f61" opacity=".3" />
      <path d="M16 32v19m32-19v19m-32-2h32M27 31v20m12-20v20" stroke="#987247" stroke-width="1.8" />
      <path d="M29 52V39h8v13" fill="#617361" />
      <path d="M19 33h6v7h-6zm22 0h6v7h-6z" fill="#83b8ac" />
      <path d="M22 33v7m22-7v7" stroke="#f6deb0" /><path d="M30 51V40h5v11" fill="#725e40" /><circle
        cx="34"
        cy="46"
        r=".7"
        fill="#e5bc62"
      />
      <path d="M32 10V2" stroke="#86633d" stroke-width="2" />
      <path d="M33 2h13l-4 4 4 3H33z" fill="#eccd76" />
    </g>
    <g v-else-if="rank === 1">
      <path d="M9 31h46v22H9z" fill="#e9d7a6" stroke="#a48a5c" />
      <path d="M5 32l9-14h36l9 14z" fill="#ad6346" />
      <path
        d="M13 22h38m-41 5h44m-36-8-6 12m15-12-2 12m11-12 2 12m8-12 6 12"
        stroke="#d2905b"
        stroke-width="1"
      />
      <path d="M26 53V31h13v22" fill="#f7e9c1" />
      <path d="M23 31l9-10 10 10z" fill="#754f3e" />
      <path d="M29 53V41a4 4 0 0 1 8 0v12" fill="#4f6955" />
      <path d="M13 37h7v8h-7zm32 0h7v8h-7z" fill="#91c1b0" />
      <path d="M16 37v8m32-8v8m-38 3h13m18 0h13" stroke="#af9d70" stroke-width="1.2" />
      <path d="M24 34v18m17-18v18" stroke="#b49a68" stroke-width="2" />
      <path d="M32 21V4" stroke="#80623e" stroke-width="2" />
      <path d="M33 4h14l-4 4 4 4H33z" fill="#e8c669" />
      <path d="M10 51h12m20 0h12" stroke="#657f50" stroke-width="3" />
    </g>
    <g v-else-if="rank === 2">
      <path d="M8 30h48v24H8z" fill="#e2d4ae" stroke="#8a876b" />
      <path d="M4 31l9-13h38l9 13z" fill="#527970" />
      <path
        d="M12 23h40m-44 5h48m-35-9-5 10m28-10 5 10"
        fill="none"
        stroke="#8ba58a"
        stroke-width="1"
      />
      <path d="M25 15h14v39H25z" fill="#f3e7c9" stroke="#a2936b" />
      <path d="M22 16L32 3l10 13z" fill="#3c655a" />
      <circle cx="32" cy="24" r="5" fill="#f9d986" stroke="#9c7842" />
      <path d="M32 20v4l3 2" fill="none" stroke="#705233" />
      <path d="M28 54V42a4 4 0 0 1 8 0v12" fill="#53695a" />
      <path d="M12 35h6v8h-6zm34 0h6v8h-6z" fill="#85b8ad" />
      <path d="M10 48h12m20 0h12M25 33h6m3 4h5m-14-8h4m10 19h-3" stroke="#b6ac86" />
      <path d="M20 33v14h-3m27-14v14h3" fill="none" stroke="#bd8b43" stroke-width="2" />
      <path d="M21 55h22" stroke="#cfbd85" stroke-width="3" />
    </g>
    <g v-else>
      <path d="M8 25h48v29H8z" fill="#d5d4bc" stroke="#7f8b7c" />
      <path d="M16 26l7-12h18l7 12z" fill="#365d55" />
      <path d="M23 23h18v31H23z" fill="#f5e8bf" stroke="#a28e60" />
      <path d="M5 19h12v35H5zm42 0h12v35H47z" fill="#e4dfbf" stroke="#8c967e" />
      <path d="M3 20L11 7l8 13zm42 0L53 7l8 13z" fill="#487267" />
      <path d="m7 16 4-8 4 8m34 0 4-8 4 8" fill="none" stroke="#80a08a" stroke-width="1.5" />
      <path d="M22 23L32 10l10 13z" fill="#bc8553" />
      <path d="M27 54V42a5 5 0 0 1 10 0v12" fill="#456353" />
      <path d="M9 27h4v9H9zm42 0h4v9h-4z" fill="#83b8aa" />
      <path d="M28 28l2 3 2-4 2 4 2-3v7h-8z" fill="#d4a742" />
      <path d="M7 41h8m-8 6h8m34-6h8m-8 6h8m-32-8h5m10 0h5M8 24h6m36 0h6" stroke="#b0b295" />
      <path d="M18 30v15l3-2V30m22 0v15l3-2V30" fill="#be9650" />
      <path d="M32 10V1" stroke="#856a3f" stroke-width="2" />
      <path d="M33 1h12l-3 4 3 3H33z" fill="#eccb6b" />
      <path d="M20 55h24" stroke="#d5c48e" stroke-width="3" />
    </g>
    <g fill="#527747" stroke="#3e6040" stroke-width=".6"
      ><path d="M5 52q-4-6 2-7 5-4 7 2 4 5-9 5ZM49 52q-2-7 5-6 7-3 8 5Z"
    /></g>
  </g>
</template>

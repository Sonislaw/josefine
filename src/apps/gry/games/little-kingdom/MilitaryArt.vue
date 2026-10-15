<script setup lang="ts">
defineProps<{
  kind: 'barracks' | 'watchtower' | 'settlement' | 'ruins' | 'spearman' | 'archer' | 'shieldbearer'
  hostile?: boolean
  level?: number
  damaged?: boolean
}>()
</script>
<template>
  <g aria-hidden="true" stroke="#344c42" stroke-linejoin="round" stroke-width="1.5">
    <ellipse cx="32" cy="54" rx="24" ry="6" fill="#284436" opacity=".15" stroke="none" />
    <g v-if="kind === 'ruins'" data-castle-ruins="true">
      <ellipse cx="32" cy="51" rx="26" ry="9" fill="#73675a" stroke="none" />
      <path
        d="M7 52V30l7 4 4-10 5 8v20m18 0V27l6 8 5-5 5 7v15M21 52V39l9 5 9-6v14"
        fill="#817b6d"
        stroke="#504d43"
        stroke-width="2"
      />
      <path
        d="M11 31l4 11-5 7m39-18-6 12 5 9M25 45l8 7"
        fill="none"
        stroke="#45453c"
        stroke-width="2"
      />
      <path d="M14 56l6-5 8 4 6-4 10 5 8-3" fill="#554b40" stroke="none" />
      <path d="M26 51q-6-6 0-13 0 5 4 6 2-4 1-6 9 9 2 13z" fill="#d7803e" stroke="none" />
      <path
        d="M29 20q-9-9 1-16m7 23q10-9 2-17"
        fill="none"
        stroke="#73786d"
        opacity=".7"
        stroke-width="3"
      />
    </g>
    <g v-else-if="kind === 'spearman' || kind === 'archer' || kind === 'shieldbearer'">
      <path d="M22 42l-4 15h10l4-13 4 13h10l-5-18" fill="#5b665c" />
      <path d="M21 26h20l5 20H17z" :fill="hostile ? '#ac6047' : '#5b846e'" />
      <circle cx="31" cy="18" r="10" fill="#e5b98b" />
      <path d="M20 17a11 11 0 0122 0l-4-3H24z" fill="#aab6b0" />
      <path d="M27 21h2m6 0h2" />
      <g v-if="kind === 'spearman'"
        ><path d="M51 10v47" stroke="#8b643e" stroke-width="3" /><path
          d="M51 3l-5 12h10z"
          fill="#d2dad4" /><path d="M12 28h16v16l-8 7-8-7z" fill="#d7b761" /><path
          d="M20 31v15m-5-10h10"
      /></g>
      <g v-else-if="kind === 'archer'"
        ><path d="M45 15q22 18 0 35" fill="none" stroke="#ac7d45" stroke-width="3" /><path
          d="M45 15v35M39 32h22m-5-4 5 4-5 4"
          fill="none"
      /></g>
      <g v-else
        ><path d="M12 27h30v18l-15 13-15-13z" fill="#95b8ac" stroke-width="2" /><path
          d="M27 31v19m-10-11h20"
          stroke="#e4dfb7"
          stroke-width="3" /><path d="M49 23v24m-5-19h10" stroke="#b4c1bc" stroke-width="3"
      /></g>
    </g>
    <g v-else-if="kind === 'watchtower'">
      <path d="M18 23h28l4 32H14z" fill="#bac1a4" /><path
        d="M37 23h9l4 32H37z"
        fill="#899d8b"
        stroke="none"
      />
      <path d="M14 12h8v7h6v-7h8v7h6v-7h8v16H14z" fill="#dedbc0" />
      <path
        d="M16 27h32m-31 6h10m11 2h9m-30 7h8m13 4h10m-29 5h7"
        fill="none"
        stroke="#829480"
        stroke-width="1"
      />
      <path d="M28 55V43q4-7 8 0v12" fill="#485b4d" /><path d="M29 30h6v7h-6z" fill="#475d52" />
      <path d="M15 25h34M15 54h34" stroke="#e3ddba" stroke-width="2" /><path
        d="M30 43v10m3-11v11"
        stroke="#918660"
        stroke-width=".8"
      />
      <path d="M34 12V2l15 3-15 5" fill="#cead5e" />
    </g>
    <g v-else-if="kind === 'settlement'">
      <path d="M8 53h48l4 5H4Z" fill="#898c74" stroke="none" />
      <path d="M16 28h32v26H16Z" fill="#c3bea0" /><path d="M21 29V16h22v13" fill="#d6c9a5" />
      <path d="M18 18 32 5l14 13Z" :fill="hostile ? '#a14e38' : '#4e7968'" /><path
        d="m22 15 10-9 10 9"
        fill="none"
        :stroke="hostile ? '#d28658' : '#87a58a'"
      />
      <path d="M5 23h13v31H5zm41 0h13v31H46Z" fill="#b4bba1" />
      <path d="M5 23h5v31H5m41-31h5v31h-5" fill="#d6d4b7" stroke="none" />
      <path d="M3 16h5v5h4v-5h6v12H3zm42 0h5v5h4v-5h7v12H45Z" fill="#e0d9b9" />
      <path d="M24 54V40q8-12 16 0v14" fill="#3d5348" /><path
        d="M27 54V40q5-7 10 0v14"
        fill="#886d47"
        stroke="#b3a279"
      />
      <path d="M29 39v14m5-15v15m-7-7h10" stroke="#554e38" stroke-width=".8" />
      <path d="M10 32h3v8h-3zm41 0h3v8h-3zM29 21h6v7h-6Z" fill="#405d50" stroke="none" />
      <path d="M6 44h9m-9 5h9m33-5h9m-9 5h9m-37-15h6m19 0h5" stroke="#87977f" stroke-width="1" />
      <path
        d="M18 32v13l3-3 3 3V32m16 0v13l3-3 3 3V32"
        :fill="hostile ? '#ae573e' : '#cfa750'"
        stroke="none"
      />
      <path
        d="M11 16V4l12 3-12 5m42 4V4l9 3-9 5"
        :fill="hostile ? '#cb6b45' : '#e2bf69'"
        stroke-width="1"
      />
    </g>
    <g v-else>
      <path d="M10 28h44v26H10z" fill="#dfcba3" /><path
        d="M6 29l26-18 26 18z"
        :fill="hostile ? '#a65c48' : '#648875'"
      />
      <path d="M26 54V38q6-8 12 0v16" fill="#58634e" /><path
        d="M15 35h6v9h-6zm28 0h6v9h-6z"
        fill="#f9df8e"
      />
      <path
        v-if="kind === 'barracks'"
        d="M22 18l20 20m0-20L22 38"
        stroke="#e5e5cb"
        stroke-width="3"
      />
      <path d="M12 30h40M11 50h13m16 0h13M13 47V33m38 0v14" stroke="#aa9165" stroke-width="1" />
      <path d="M6 34v22m-3-18h6m46-4v22m-3-18h6" stroke="#73573a" stroke-width="2" />
      <path d="M3 40h7v9l-3 3-4-3zm51 0h7v9l-3 3-4-3z" fill="#d9b568" stroke-width=".8" />
    </g>
    <g v-if="(level ?? 1) > 1 && (kind === 'watchtower' || kind === 'barracks')"
      ><path d="M6 54V39h8v15m36 0V39h8v15" fill="#83988c" /><path
        v-if="level === 3"
        d="M7 38V25l13 3-13 5m46 5V25l10 3-10 5"
        fill="#ecd078"
    /></g>
    <path
      v-if="damaged && kind === 'settlement'"
      d="M18 26l8 9-4 8 10 10m18-28-7 8 5 7"
      fill="none"
      stroke="#744534"
      stroke-width="2.5"
    />
    <g v-if="damaged && kind === 'settlement'" fill="#7b7562" stroke="#575f50" stroke-width=".7"
      ><path d="m5 55 4-5 6 5-3 3zm35 0 4-6 8 7-3 3Z"
    /></g>
  </g>
</template>

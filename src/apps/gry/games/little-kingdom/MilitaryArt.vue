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
      <path d="M20 23h24l4 32H16z" fill="#bec5ae" /><path
        d="M16 12h7v7h6v-7h7v7h6v-7h7v16H16z"
        fill="#d9dfc4"
      />
      <path d="M28 55V42q4-7 8 0v13" fill="#485b4d" /><path d="M29 31h6v7h-6z" fill="#475d52" />
      <path d="M34 12V2l15 3-15 5" fill="#cead5e" />
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
      <g v-else
        ><path d="M6 37V23h10v31H6zm42-14h10v31H48z" fill="#b7c0a7" /><path
          d="M10 22V9l12 3-12 5m43 5V9l9 3-9 5"
          :fill="hostile ? '#bd6347' : '#e2bf69'"
      /></g>
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
  </g>
</template>

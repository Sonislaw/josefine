<script setup lang="ts">
defineProps<{
  kind: 'barracks' | 'watchtower' | 'settlement' | 'spearman' | 'archer'
  hostile?: boolean
}>()
</script>
<template>
  <g aria-hidden="true" stroke="#344c42" stroke-linejoin="round" stroke-width="1.5">
    <ellipse cx="32" cy="54" rx="24" ry="6" fill="#284436" opacity=".15" stroke="none" />
    <g v-if="kind === 'spearman' || kind === 'archer'">
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
      <g v-else
        ><path d="M45 15q22 18 0 35" fill="none" stroke="#ac7d45" stroke-width="3" /><path
          d="M45 15v35M39 32h22m-5-4 5 4-5 4"
          fill="none"
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
  </g>
</template>

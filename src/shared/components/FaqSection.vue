<script setup lang="ts">
defineProps<{ title?: string; items: Array<{ question: string; answer: string }> }>()
</script>
<template>
  <section class="mt-12 border-t border-[#e1e7e2] pt-9" aria-labelledby="faq-heading">
    <p class="text-sm font-bold uppercase tracking-[.16em] text-[#25815c]">Pytania i odpowiedzi</p>
    <h2 id="faq-heading" class="mt-2 text-2xl font-bold">{{ title ?? 'Najczęściej zadawane pytania' }}</h2>
    <div class="mt-5 divide-y divide-[#e1e7e2]"><details v-for="item in items" :key="item.question" class="group py-4"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{{ item.question }}<span class="text-xl text-[#25815c] group-open:rotate-45">+</span></summary><p class="mt-3 max-w-3xl text-sm leading-7 text-[#66736b]">{{ item.answer }}</p></details></div>
  </section>
</template>

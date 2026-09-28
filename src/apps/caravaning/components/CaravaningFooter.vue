<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Caravan } from '@lucide/vue'
</script>

<template>
  <footer id="o-projekcie" class="border-t border-border bg-muted/30">
    <div
      class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8"
    >
      <div class="max-w-lg">
        <RouterLink to="/karawaning/" class="mb-3 inline-flex items-center gap-2 font-heading font-bold">
          <Caravan class="size-4 text-primary" aria-hidden="true" />
          Caravaning Tools
        </RouterLink>
        <p class="text-sm leading-6 text-muted-foreground">
          Praktyczne narzędzia, które pomagają lepiej przygotować się do drogi i podróżować
          spokojniej.
        </p>
        <p class="mt-3 text-xs leading-5 text-muted-foreground">
          Dane wpisane do narzędzi są przetwarzane w przeglądarce. Stan checklisty może zostać
          zapisany lokalnie na Twoim urządzeniu.
        </p>
      </div>

      <nav aria-label="Linki w stopce" class="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <a href="mailto:kontakt@zgrana.pl" class="text-muted-foreground hover:text-foreground">
          Kontakt
        </a>
        <RouterLink to="/karawaning/polityka-prywatnosci" class="text-muted-foreground hover:text-foreground">
          Polityka prywatności
        </RouterLink>
      </nav>
    </div>
    <div class="border-t border-border/70">
      <p class="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {{ new Date().getFullYear() }} Caravaning Tools
      </p>
    </div>
  </footer>
</template>

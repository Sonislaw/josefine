<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'

const router = useRouter()
const privacyUrl = computed(() => router.resolve({ name: 'caravaning-privacy' }).href)

useCaravaningSeo('privacy', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Polityka Prywatności',
  description:
    'Informacje o prywatności i przetwarzaniu danych podczas korzystania z Caravaning Tools.',
  url: `${siteUrl}/polityka-prywatnosci`,
  inLanguage: 'pl-PL',
  isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
})
</script>

<template>
  <article class="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <RouterLink
      :to="{ name: 'caravaning' }"
      class="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Strona główna
    </RouterLink>

    <header class="border-b border-border pb-8">
      <p class="text-sm font-semibold text-primary">Caravaning Tools</p>
      <h1 class="mt-2 font-heading text-3xl font-bold tracking-normal sm:text-4xl">
        Polityka Prywatności
      </h1>
      <p class="mt-3 text-sm text-muted-foreground">
        Data obowiązywania:
        <time datetime="2026-09-28">28 września 2026 r.</time>
      </p>
    </header>

    <div class="divide-y divide-border">
      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">1. Informacje ogólne</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Niniejsza Polityka Prywatności określa zasady korzystania ze strony internetowej
          caravaning.zgrana.pl oraz sposób przetwarzania informacji związanych z jej użytkowaniem.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Administrator dokłada należytej staranności, aby chronić prywatność użytkowników
          odwiedzających serwis.
        </p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">
          2. Zakres przetwarzanych danych
        </h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Podczas korzystania ze strony mogą być przetwarzane podstawowe informacje techniczne
          związane z wyświetlaniem strony internetowej, takie jak:
        </p>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>adres odwiedzanej strony,</li>
          <li>data i godzina wizyty,</li>
          <li>informacje o urządzeniu i przeglądarce,</li>
          <li>informacje o wydajności i czasie ładowania strony,</li>
          <li>kraj, z którego nastąpiło połączenie.</li>
        </ul>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Dane te wykorzystywane są wyłącznie do celów statystycznych, analitycznych oraz poprawy
          działania serwisu.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Checklista przed wyjazdem może zapisać odznaczone punkty w pamięci lokalnej przeglądarki
          (localStorage) na urządzeniu użytkownika. Dane te nie są przesyłane na serwer i można je
          usunąć, czyszcząc listę w narzędziu lub dane witryny w przeglądarce.
        </p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">3. Odbiorcy danych</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">Dostawcą usług technicznych może być podmiot hostujący serwis. Serwis nie korzysta z Google Analytics ani z plików cookie analitycznych.</p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">4. Bezpieczeństwo</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Administrator stosuje środki techniczne i organizacyjne mające na celu ochronę serwisu
          przed nieuprawnionym dostępem, utratą danych lub innymi zagrożeniami.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Połączenie ze stroną realizowane jest z wykorzystaniem szyfrowania HTTPS.
        </p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">
          5. Zmiany Polityki Prywatności
        </h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Polityka Prywatności może być aktualizowana w przypadku zmian funkcjonalności serwisu,
          zmian prawnych lub zmian dostawców usług wykorzystywanych przez stronę.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Aktualna wersja dokumentu jest zawsze publikowana pod adresem:
        </p>
        <a
          :href="privacyUrl"
          class="mt-2 inline-flex break-all text-sm font-medium text-primary underline underline-offset-4"
        >
          {{ privacyUrl }}
        </a>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">6. Kontakt</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          W sprawach związanych z funkcjonowaniem serwisu można skontaktować się z administratorem
          za pośrednictwem danych kontaktowych publikowanych w serwisie.
        </p>
      </section>
    </div>
  </article>
</template>

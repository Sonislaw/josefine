<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { siteName, siteUrl, useCaravaningSeo } from '@/apps/caravaning/seo/useCaravaningSeo'

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
      to="/karawaning/"
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
        <h2 class="font-heading text-xl font-semibold tracking-normal">3. Google Analytics</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Za Twoją zgodą serwis korzysta z Google Analytics 4, dostarczanego przez Google. Narzędzie
          pomaga administratorowi analizować korzystanie ze strony i ulepszać jej działanie.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Skrypt Google Analytics nie jest ładowany przed wyrażeniem zgody na pliki cookie
          analityczne. Po akceptacji Google Analytics może wykorzystywać pliki cookie i przetwarzać
          informacje techniczne, takie jak adres IP, informacje o urządzeniu i przeglądarce oraz
          sposób korzystania z serwisu.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Dane statystyczne służą do analizy popularności treści i jakości działania serwisu.
          Więcej informacji o przetwarzaniu danych przez Google znajduje się w
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" class="font-medium text-primary underline underline-offset-4">polityce prywatności Google</a>.
        </p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">4. Pliki cookies</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Serwis prosi o zgodę przed użyciem plików cookie analitycznych Google Analytics. Możesz
          zaakceptować lub odrzucić analitykę w pasku zgody. Wybór jest zapisywany lokalnie w
          przeglądarce, aby nie wyświetlać pytania przy każdej wizycie.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Możesz zmienić wybór przez usunięcie danych witryny w ustawieniach przeglądarki. Po
          ponownym otwarciu strony pasek zgody pojawi się ponownie.
        </p>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">5. Odbiorcy danych</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">Dostawcami usług technicznych mogą być podmiot hostujący serwis oraz, po wyrażeniu zgody analitycznej, Google.</p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Informacje dotyczące sposobu przetwarzania danych przez Google można znaleźć na
          stronie:
        </p>
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          class="mt-2 inline-flex break-all text-sm font-medium text-primary underline underline-offset-4"
        >
          https://policies.google.com/privacy
        </a>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">6. Bezpieczeństwo</h2>
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
          7. Zmiany Polityki Prywatności
        </h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Polityka Prywatności może być aktualizowana w przypadku zmian funkcjonalności serwisu,
          zmian prawnych lub zmian dostawców usług wykorzystywanych przez stronę.
        </p>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          Aktualna wersja dokumentu jest zawsze publikowana pod adresem:
        </p>
        <a
          href="/karawaning/polityka-prywatnosci"
          class="mt-2 inline-flex break-all text-sm font-medium text-primary underline underline-offset-4"
        >
          /karawaning/polityka-prywatnosci
        </a>
      </section>

      <section class="py-7">
        <h2 class="font-heading text-xl font-semibold tracking-normal">8. Kontakt</h2>
        <p class="mt-3 text-sm leading-7 text-muted-foreground">
          W sprawach związanych z funkcjonowaniem serwisu można skontaktować się z administratorem
          za pośrednictwem danych kontaktowych publikowanych w serwisie.
        </p>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { legalContact } from '@/config/legal'

defineProps<{ applicationName: string; siteUrl: string; homeTo: string }>()
</script>

<template>
  <article class="mx-auto max-w-4xl px-5 py-10 lg:px-8">
    <RouterLink :to="homeTo" class="inline-flex items-center gap-2 text-sm font-medium text-[#52606d] hover:text-[#172033]"><ArrowLeft class="size-4"/> Strona główna</RouterLink>
    <header class="mt-8 border-b border-[#dce5f0] pb-8"><p class="text-sm font-semibold text-[#24578f]">{{ applicationName }}</p><h1 class="mt-2 text-4xl font-bold">Polityka prywatności</h1><p class="mt-3 text-sm text-[#64748b]">Data obowiązywania: <time datetime="2026-09-30">30 września 2026 r.</time></p></header>
    <div class="divide-y divide-[#dce5f0] text-sm leading-7 text-[#405064]">
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">1. Administrator i kontakt</h2><p class="mt-3">Administratorem danych osobowych jest {{ legalContact.administratorName }}. W sprawach prywatności skontaktuj się pod adresem <a :href="`mailto:${legalContact.contactEmail}`" class="font-medium text-[#24578f] underline">{{ legalContact.contactEmail }}</a>.</p></section>
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">2. Jakie dane i w jakim celu przetwarzamy</h2><p class="mt-3">Dane wpisywane do kalkulatorów są przeliczane lokalnie w przeglądarce i nie są zapisywane przez serwis. Niektóre narzędzia mogą zachować ich stan w pamięci lokalnej przeglądarki (localStorage); dane te pozostają na urządzeniu użytkownika. Dostawcy infrastruktury mogą przetwarzać dane techniczne połączenia, takie jak adres IP, data żądania, adres strony, informacje o przeglądarce i urządzeniu — aby dostarczyć serwis, zapewnić bezpieczeństwo oraz diagnozować błędy.</p><p class="mt-3">Serwis korzysta z Google Analytics, aby mierzyć ruch i sposób korzystania ze strony. Usługa może wykorzystywać pliki cookie lub podobne identyfikatory. Podstawą przetwarzania jest prawnie uzasadniony interes administratora polegający na rozwijaniu i zabezpieczaniu serwisu (art. 6 ust. 1 lit. f RODO).</p></section>
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">3. Odbiorcy i przekazywanie danych</h2><p class="mt-3">Odbiorcami danych mogą być dostawcy hostingu i infrastruktury oraz Google LLC w związku z Google Analytics. Przetwarzanie przez Google może obejmować transfer danych poza Europejski Obszar Gospodarczy; szczegóły opisuje <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" class="font-medium text-[#24578f] underline">polityka prywatności Google</a>.</p></section>
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">4. Okres przechowywania</h2><p class="mt-3">Dane techniczne są przechowywane przez okres wynikający z ustawień dostawców infrastruktury i nie dłużej, niż jest to konieczne dla bezpieczeństwa oraz działania serwisu. Dane analityczne są przechowywane zgodnie z konfiguracją Google Analytics.</p></section>
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">5. Twoje prawa</h2><p class="mt-3">Masz prawo żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia danych oraz wnieść sprzeciw wobec przetwarzania opartego na uzasadnionym interesie. Masz również prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.</p></section>
      <section class="py-7"><h2 class="text-xl font-bold text-[#172033]">6. Pozostałe informacje</h2><p class="mt-3">Podanie danych kontaktowych jest dobrowolne, lecz może być potrzebne do udzielenia odpowiedzi. Serwis nie podejmuje decyzji wobec użytkowników wyłącznie w sposób zautomatyzowany ani nie prowadzi profilowania wywołującego skutki prawne.</p><p class="mt-3">Polityka może być aktualizowana wraz ze zmianą sposobu działania serwisu lub przepisów.</p></section>
    </div>
  </article>
</template>

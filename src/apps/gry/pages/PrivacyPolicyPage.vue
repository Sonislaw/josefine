<script setup lang="ts">
import PrivacyPolicyContent from '@/shared/components/PrivacyPolicyContent.vue'
import { gryPath, grySiteUrl, useGrySeo } from '../seo/useGrySeo'
useGrySeo('privacy')
</script>
<template>
  <div class="games-privacy">
    <PrivacyPolicyContent
      application-name="Gry — Zgrana"
      :site-url="grySiteUrl"
      :home-to="gryPath('/')"
    />
    <section class="local-data">
      <h2>Dane rozgrywki</h2>
      <p>
        Nocny ekspres zapisuje całą sieć kolejową, pociągi, pasażerów, rozwój miasta, wynik i
        ustawienia lokalnie pod kluczem „zgrana:gry:nocny-ekspres:v1”. Podczas nieobecności czas gry
        nie płynie. Zapis nie trafia na serwer ani nie jest synchronizowany między urządzeniami.
        Możesz zastąpić go nową grą lub usunąć, czyszcząc dane witryny w przeglądarce.
      </p>
      <p>
        Ostatnia latarnia przechowuje lokalnie odblokowanych bohaterów, rekord czasu i pokonanych
        przeciwników, liczbę zwycięstw oraz preferencję dźwięku pod kluczem
        „zgrana:gry:ostatnia-latarnia:v1”. Trwającej wyprawy nie zapisujemy. Dane te nie są wysyłane
        na serwer ani synchronizowane między urządzeniami. Usuniesz je, czyszcząc dane witryny.
      </p>
      <p>
        Małe królestwo zapisuje mapę, budynki, odkryte miejsca i ich wykorzystanie, zasoby,
        mieszkańców, turę, ofertę budynków, rangę osady, historię awansów i stan wskazówek pod kluczem
        „zgrana:gry:male-krolestwo:v3” w localStorage tej przeglądarki. Przy aktualizacji
        odczytujemy starszy zapis v2 lub v1 i zachowujemy oryginały jako kopie. Zapis
        nie jest wysyłany na serwer ani synchronizowany między urządzeniami. Możesz go zastąpić nową
        osadą lub usunąć, czyszcząc dane witryny. Czas gry nie płynie podczas przerwy.
      </p>
      <p>
        Warcaby działają lokalnie na Twoim urządzeniu. W localStorage pod kluczem „arena-xp”
        zapisujemy wyłącznie sumę punktów doświadczenia. Możesz ją usunąć, czyszcząc dane witryny w
        przeglądarce. Bieżącej planszy nie zapisujemy ani nie wysyłamy na serwer. Pobrany plik gry
        działa offline i nie zawiera analityki.
      </p>
      <p>
        „Jeszcze jeden kryształ” zachowuje lokalnie rekord pod kluczem „crystal-rush-best” oraz
        preferencję dźwięku pod „crystal-rush-sound”. Bieżąca runda nie jest zapisywana. Rekord nie
        jest przesyłany na serwer ani synchronizowany między urządzeniami. Czyszczenie danych
        witryny usuwa również te ustawienia.
      </p>
      <p>
        Klocki zapisują planszę, pozostałe kształty, wynik, rekord i ustawienie dźwięku lokalnie pod
        kluczem „zgrana:gry:klocki:v1”. Pozwala to kontynuować rundę po powrocie do tej samej
        przeglądarki. Zapis nie jest przesyłany na serwer ani synchronizowany między urządzeniami.
        Możesz go usunąć, czyszcząc dane witryny; nowa runda zastępuje planszę, ale zachowuje
        rekord.
      </p>
    </section>
  </div>
</template>
<style scoped>
.games-privacy {
  background: #f7f9f3;
  color: #17221a;
  min-height: 70vh;
  padding-bottom: 60px;
}
.local-data {
  max-width: 56rem;
  margin: auto;
  padding: 0 2rem;
  font-size: 14px;
  line-height: 1.8;
}
.local-data h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
}
</style>

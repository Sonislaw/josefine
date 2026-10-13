# Ostatnia latarnia

Niezależny survival w module Gry: lokalnie `/gry/ostatnia-latarnia`, na subdomenie
`https://gry.zgrana.pl/ostatnia-latarnia`. Bez kont, backendu i zapisu trwającej wyprawy.

## Podział odpowiedzialności

- `model.ts`, `config.ts`: jawny stan świata i konfiguracja balansu.
- `engine.ts`, `spawner.ts`, `upgrades.ts`, `space.ts`: reguły bez Vue, DOM i zegara przeglądarki.
  Silnik mutuje własny stan w stałym kroku 1/60 s i przyjmuje generator losowy.
- `clock.ts`: akumulator kroków; menu, pauza i wybór kart nie przesuwają czasu.
  Przerwa klatki powyżej 250 ms wymaga wznowienia zamiast nadrabiania ukrytej rozgrywki.
- `renderer.ts`: Canvas 2D, kamera, buforowane sylwetki, DPR maksymalnie 2.
  Zmiana rozmiaru zmienia wyłącznie widok, nie współrzędne świata.
- `input.ts`: klawiatura i joystick pierwszego wskaźnika; anulowanie gestu czyści ruch.
- `audio.ts`: opcjonalne dźwięki syntezowane, domyślnie wyłączone.
- `storage.ts`: walidacja i scalanie odblokowań, rekordów oraz ustawień.
- `useLighthouse.ts`: jedna pętla RAF, cykl życia, obsługa przerw i lekkie migawki HUD.
  Tablice przeciwników nie są reaktywne. Restart nie uruchamia następnej pętli.
- `LighthouseGame.vue`: dostępne przyciski HTML, menu, ulepszenia, pomoc i wyposażenie.

Gra nie importuje silników innych gier. Współdzieli layout, dialog, PWA i mechanizm SEO.
Integrację zapewniają `manifest.ts`, `seo/site-config.json` oraz `pages/LighthousePage.vue`.
Instrukcje i FAQ są prerenderowane; grafika kafelka to autorski SVG,
a `public/og/last-lighthouse.png` ma 1200 × 630. Można ją odtworzyć poleceniem
`node scripts/generate-lighthouse-art.mjs` (Playwright/Chrome).

## Reguły i zapis

Trzech bohaterów, cztery bronie i cztery zdolności pasywne. Jedna wyprawa pozwala wybrać
trzy bronie (poziomy 1–4) i trzy rodzaje pasywów (poziomy 1–3). Ewolucja wymaga broni na
poziomie 4 i przypisanego pasywu na poziomie 2; zajmuje miejsce dotychczasowej broni.
Oferty powstają wyłącznie z legalnych kart. Po wyczerpaniu rozwoju pozostaje leczenie.

Elity pojawiają się po 3 i 6 minutach. Po 10 minutach przestają pojawiać się zwykli wrogowie
i przychodzi boss z zapowiadaną szarżą oraz falą. Pozostali przeciwnicy nie znikają.
Jednoczesna śmierć bohatera i bossa oznacza porażkę. Latarnia jest punktem orientacyjnym,
nie obiektem do obrony.

Klucz `zgrana:gry:ostatnia-latarnia:v1` przechowuje tylko wersję, odblokowanych bohaterów,
rekord czasu i pokonanych wrogów, liczbę zwycięstw i ustawienie dźwięku. Odblokowanie
zapisuje się natychmiast; rekord zakończonej wyprawy raz. Niedostępna pamięć wyświetla
ostrzeżenie i nie blokuje gry. Zmiana bohatera nie modyfikuje bieżącej wyprawy.

## Testowanie

```sh
npm run test:gry
npm run type-check
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
node scripts/benchmark-lighthouse.mjs
```

W PowerShell można wskazać systemowy Chrome: `$env:PLAYWRIGHT_CHANNEL='chrome'`.
Testy przeglądarkowe uruchamiają Vite na 5175. Osobny `tests/gry/lighthouse-harness.html`
wstrzykuje deterministyczny generator i stan przez Vue InjectionKey. Nie jest stroną
produkcyjną ani publicznym interfejsem gry; test produkcyjny wymaga dla niego odpowiedzi 404.

Testy obejmują celowanie, obrażenia i nietykalność, pule kart, ewolucje, zachowanie XP,
limity obiektów, finał, zapis, gesty, zmianę rozmiaru, restart i usuwanie RAF po opuszczeniu
strony. Pełna symulacja 600 sekund używa nietykalności wyłącznie w fixture testowym:
sprawdza mechanikę i limity, nie dowodzi łatwości wygrania. Pierwsza ewolucja w tej
symulacji następuje przed bossem. Pięć krótkich prób bez nietykalności (automat zbierający
XP, ziarna 1, 5, 23, 47, 123) daje pierwszy awans po 23–30 sekundach.

## Wydajność

Przestrzenna siatka ogranicza wyszukiwanie celów i kolizji. Limity: 180 zwykłych wrogów,
osobne miejsca na dwie elity i bossa, 250 pocisków i 200 efektów. Pominięte spawny nie
kumulują się. Przy 140 znacznikach kolejne XP łączymy z najbliższym, zachowując sumę.

Benchmark zapisuje środowisko, średnią i p95 do `test-results/lighthouse-performance.json`.
Utrzymuje 183 przeciwników, 250 pocisków i 200 efektów, rozgrzewa 30 klatek i mierzy 120.
Mierzy czas CPU jednego kroku oraz wysłania poleceń Canvas, nie prezentację GPU ani FPS.
Pomiar z 13.10.2026: Windows 10.0.26200, Intel i5-11400H 2,70 GHz (12 logicznych CPU),
32 GB RAM, headless Chrome 153.0.8010.48:

| Canvas / DPR | Symulacja: średnia / p95 | Renderer: średnia / p95 |
| --- | --- | --- |
| 900 × 600 / 1 | 1,977 / 3,4 ms | 1,398 / 2,7 ms |
| 312 × 485 / 2 | 3,187 / 4,9 ms | 2,528 / 4,0 ms |

Wynik z desktopowego Chrome z emulowanym małym viewportem nie opisuje fizycznego telefonu.
Ręczne testy na urządzeniach i strojenie poziomu trudności nadal są wartościowe; Safari
i Firefox wymagają osobnej weryfikacji.

## Wdrożenie

Bez nowego projektu Cloudflare: `npm run build:site -- gry`, następnie
`npx wrangler deploy --name josefine-gry`. Ta zmiana nie publikuje automatycznie kodu.

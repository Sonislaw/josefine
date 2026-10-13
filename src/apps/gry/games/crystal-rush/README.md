# Jeszcze jeden kryształ

Jednoosobowa gra arcade aplikacji Gry. Zbieraj kryształy, utrzymuj serię, przebijaj meteory zrywem i wybieraj ulepszenia. Gra nie ma ostatniej fali ani limitu aktywnych meteorów.

## Uruchomienie i wdrożenie

- `npm run dev` → `/gry/jeszcze-jeden-krysztal`.
- `npm run build:site -- gry` → osobny, prerenderowany `dist/jeszcze-jeden-krysztal.html`.
- Po wdrożeniu istniejącego Workera Gry: `https://gry.zgrana.pl/jeszcze-jeden-krysztal`.
- Cloudflare pozostaje bez zmian: build `npm run build:site -- gry`, deploy `npx wrangler deploy --name josefine-gry`. Nie twórz osobnego projektu dla tej gry.

Wpis w `../../manifest.ts` tworzy kafelek i leniwie ładowaną trasę. Strona w `../../pages/CrystalRushPage.vue` odpowiada za integrację z SEO i strukturą Josefine. `../../seo/site-config.json` dostarcza osobny tytuł, opis, canonical, PNG OG i wpis mapy witryny. Korzystamy z istniejącego layoutu, PWA i warstwy prywatności. Katalog gier nie pobiera silnika przed wejściem na podstronę.

## Podział odpowiedzialności

| Plik                                | Odpowiedzialność                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `config.ts`, `model.ts`, `arena.ts` | Balans, typy danych, profile areny i wspólne przeliczenie współrzędnych rysowania oraz dotyku.          |
| `engine.ts`                         | Ruch, punkty, kolizje, XP, ulepszenia i stany rundy; bez DOM i Vue.                                     |
| `spawner.ts`                        | Całkowany budżet narodzin, kryształy, trwałe warianty meteorów. Jedyny właściciel czasu aktywnej rundy. |
| `collisions.ts`                     | Przecięcie względnych torów ruchu; zryw nie przelatuje przez meteor bez kolizji.                        |
| `clock.ts`                          | Stały krok 1/120 s, akumulator, jawna pauza po przerwie ponad 250 ms.                                   |
| `input.ts`                          | WASD/strzałki, klawiatura, skalowanie wskaźnika, przechwytywanie i czyszczenie dotyku.                  |
| `renderer.ts`                       | Canvas 2D, bufor do DPR 2, cache 12 sylwetek, ograniczenie efektów przy reduced-motion.                 |
| `useCrystalRush.ts`                 | Cykl życia: pojedynczy RAF, nasłuchy, audio, pamięć i lekkie migawki HUD.                               |
| `CrystalRushGame.vue`               | Dostępne kontrolki HTML, menu, pauza, karty ulepszeń, ekran wyniku i responsywność.                     |
| `storage.ts`, `audio.ts`            | Lokalny rekord i opcjonalny dźwięk; błędy tych usług nie przerywają gry.                                |

Stan symulacji jest mutowalny i **nie jest reaktywny**. Vue otrzymuje tylko migawki HUD, nie tablicę meteorów. Reset tworzy stan rundy, a nie nową pętlę animacji. Opuszczenie strony usuwa wszystkie nasłuchy, obserwator rozmiaru, RAF i kontekst audio. Nie dodajemy stanu gry do globalnego store ani zależności od kalkulatorów.

Generator integruje `0.45 + 0.025 × czas` narodzin/s, przechowując resztę budżetu. Nie stosuje TTL, limitu puli, fal ani górnego progu częstości. Liczba łącznych narodzin bez usuwania to około 72 / 234 / 1260 / 4770 po 60 / 120 / 300 / 600 s. Limity dotyczą wyłącznie kryształów (18), cząsteczek dekoracyjnych (240) i głosów audio (6), nigdy meteorów.

## Sterowanie i dane

Desktop zachowuje świat 900 × 600. Na ekranie do 600 px nowa runda używa pionowego świata 450 × 600, dzięki czemu statek, kryształy i meteory są większe bez rozbieżności między grafiką a kolizjami. Wszystkie obiekty i punkty narodzin korzystają z wymiarów tej samej areny. Profil wybieramy przy starcie rundy; zmiana szerokości/obrót nie resetuje gry ani nie przenosi obiektów. Zasady punktacji i generator meteorów pozostają bez zmian.

Mobilna wysokość areny korzysta z `svh`, zostawiając miejsce na przyciski. Menu i ulepszenia mają wysokość wynikającą z treści, bez wewnętrznego scrolla ani obcinania przycisków. Przy większym tekście przewijana jest zwyczajnie strona. Po starcie przewijamy widok do areny, aby sterowanie było od razu pod ręką.

- Ruch: WASD, strzałki albo przytrzymanie/przeciąganie palca lub myszy na arenie.
- Zryw: spacja lub przycisk „ZRYW”; drugi palec może go nacisnąć bez przerywania ruchu pierwszego.
- Pauza: P, Escape lub przycisk. Zmiana karty/utrata fokusu pauzuje rundę; powrót jej sam nie wznawia.
- Dźwięk domyślnie wyłączony. Włączenie wymaga działania użytkownika.
- Rekord: `crystal-rush-best`; preferencja dźwięku: `crystal-rush-sound`. Wyłącznie localStorage, bez serwera i synchronizacji. Trwającej rundy nie zapisujemy.

## Weryfikacja

```sh
npm run test:gry
npm run type-check
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
```

Na komputerze bez Chromium Playwright można użyć systemowego Chrome: PowerShell `$env:PLAYWRIGHT_CHANNEL='chrome'`.

20 testów silnika obejmuje m.in. granice obu aren, mapowanie dotyku, normalizację ruchu, wynik pierwszych pięciu kryształów, zryw i jego dokładny koniec, jednoczesne obrażenia, priorytet porażki, awanse, energię, zegar i generator powyżej 5000 obiektów. Testy przeglądarkowe obejmują pełną rundę, szerokości 360/390/800/1440 px, widoczność przycisków i brak scrolla nakładek na telefonach 360×640, 390×844 i 430×932, zachowanie rundy po obrocie, dotyk dwoma palcami, blokadę pamięci i pojedynczy RAF po 20 restartach. `tests/gry/crystal-harness.html` to izolowany harness testowy, nie element produkcyjnego builda. Na produkcji nie ma globalnego API do modyfikowania rundy ani trybu nieśmiertelności.

Sprawdzono systemowy Chrome, w tym emulację dotyku i zrzuty desktop/mobile. Nie sprawdzono fizycznego telefonu, Safari ani Firefox. Canvas wymaga JavaScript; tytuł, instrukcje i menu są obecne w HTML także przed uruchomieniem JS.

## Pomiar wydajności — 13.10.2026

Uruchom Vite na `127.0.0.1:5175`, następnie `node scripts/benchmark-crystal.mjs`. Wynik trafia do ignorowanego `test-results/crystal-performance.json`.

Warunki: Windows 10.0.26200, Intel i5-11400H @ 2.70 GHz, 12 procesorów logicznych, 32 GB RAM, headless Chrome 153.0.8010.48. Canvas 900 × 600, DPR 1; dla każdego rozmiaru 30 próbek rozgrzewki + 120 pomiarów, jedna próbka na RAF. W harnessie wyłączono obrażenia, aby nie przerwać testu. Wszystkie meteory pozostają aktywne i są aktualizowane.

| Meteory | Aktualizacja 1/120 s: średnia / p95 | Render: średnia / p95 |
| ------- | ----------------------------------- | --------------------- |
| 100     | 0,164 / 0,3 ms                      | 1,207 / 1,6 ms        |
| 500     | 0,188 / 0,3 ms                      | 3,949 / 5,4 ms        |
| 1000    | 0,363 / 0,5 ms                      | 8,053 / 10,3 ms       |
| 5000    | 1,114 / 1,4 ms                      | 68,965 / 83,7 ms      |

To czas CPU aktualizacji i wydawania komend Canvas, bez oczekiwania na RAF; **nie jest to pomiar końcowego FPS ani test telefonu**. Przy 5000 meteorów render przekracza budżet 16,7 ms klatki 60 Hz. Nie ukrywamy tego limitem obiektów. Zastosowano cache sylwetek, liniowe usuwanie i ograniczenie efektów. Przy bardzo długich rundach wydajność pozostaje zależna od urządzenia; spadek nie zatrzymuje generatora, a długa przerwa animacji powoduje jawną pauzę.

Grafika kafelka jest autorskim SVG. PNG OG można odtworzyć poleceniem `node scripts/generate-crystal-art.mjs`. Nie dodano zewnętrznych grafik, plików dźwiękowych ani nowych zależności produkcyjnych.

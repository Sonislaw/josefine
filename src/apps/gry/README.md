# Gry / Zgrana

Moduł Josefine przeznaczony na niezależne gry przeglądarkowe. Nie przenosi zasad gry do wspólnych kalkulatorów ani do globalnego store.

## Uruchomienie

```sh
npm install
npm run dev
```

- Katalog lokalnie: `http://localhost:5173/gry`
- Warcaby lokalnie: `http://localhost:5173/gry/warcaby-arena-mocy`
- Jeszcze jeden kryształ lokalnie: `http://localhost:5173/gry/jeszcze-jeden-krysztal`
- Klocki lokalnie: `http://localhost:5173/gry/klocki`
- Docelowo: `https://gry.zgrana.pl/` i `/warcaby-arena-mocy`
- Prywatność: `/polityka-prywatnosci` (lokalnie z prefiksem `/gry`).

Wymagania Node pozostają zgodne z głównym projektem; dla CI zalecany aktualny Node 24 LTS zgodny z `package.json`.

## Architektura

```text
src/apps/gry/
  manifest.ts                 # lekki katalog: metadane + dynamic import strony gry
  routes.ts                   # wspólne trasy katalogu, gry, prywatności i 404
  GryLayout.vue               # nawigacja, instalacja PWA, stopka
  components/                 # komponenty współdzielone wyłącznie przez gry
    GameCards.vue
    GameDialog.vue
  pages/                      # integracja gry z routerem i SEO
  seo/                        # statyczne metadata każdej podstrony
  pwa/manifest.json
  games/warcaby/
    engine.ts                 # czyste reguły + minimax alpha-beta
    session.ts                # historia, PD, misja, remisy
    useArena.ts               # interakcje, audio, storage, cykl życia AI
    ai.worker.ts              # wyszukiwanie poza głównym wątkiem
    powers.ts                 # polskie opisy czterech mocy
    WarcabyGame.vue            # interfejs niezależny od routera
    standalone.ts             # punkt wejścia wersji jednoplikowej
    engine.test.mjs
```

Wspólne dla całej platformy pozostają: rejestr domen, SEO manager, analityka, komunikat cookies, wskazówka instalacji PWA i mechanizm SSG/sitemap. Warcaby nie importują kalkulatorów ani store innej aplikacji.

Silnik przyjmuje i zwraca dane, nie mutuje wejścia. `getLegalMoves` jest źródłem prawdy zarówno dla człowieka, jak i AI. `applyMove` ponownie sprawdza legalność. `getCompleteTurns` rozwija całe łańcuchy bić przed przekazaniem pozycji do minimax. UI nalicza PD wyłącznie za rzeczywiste ruchy. AI jest anulowane przez zakończenie workera i identyfikator generacji przy restarcie, zmianie kontrolera i opuszczeniu strony.

Plansza ma stałą orientację; jasne zaczynają. To wariant warcabów amerykańskich z krótką damką i biciem pionków tylko do przodu, a nie warcaby polskie. Remisy są uproszczonymi zasadami tej aplikacji. Nie zapisujemy planszy — jedynie kosmetyczne PD w `arena-xp`.

## Dodanie następnej gry

1. Utwórz niezależny katalog `games/<nazwa>/`. Reguły trzymaj w czystym module, UI w komponentach. Nie dopisuj nowej gry do silnika warcabów.
2. Dodaj stronę w `pages/`, wywołaj `useGrySeo('<id>')` i zamontuj komponent gry.
3. Dodaj wpis w `manifest.ts`, z unikalnym `id`, własną ilustracją `cover` i `loadPage: () => import(...)`. Kafel i trasa powstaną automatycznie.
4. Dodaj stronę o tym samym `id` i ścieżce w `seo/site-config.json`. Build wykorzysta ją do metadanych i mapy witryny. Dodaj poprawny PNG OG (1200 × 630) albo użyj ogólnej grafiki Gry.
5. Dopisz testy reguł i przeglądarkowe. Każda gra może mieć własne zasady, kontroler i format zapisu.

Nie rejestruj każdej gry jako osobnej aplikacji Josefine lub osobnej domeny.

## Jeszcze jeden kryształ

Druga gra ma własny katalog `games/crystal-rush/`: silnik symulacji, renderer Canvas, sterowanie, zegar, zapis rekordu i komponent Vue. Nie korzysta z silnika Warcabów. Kafelek, lazy routing, SSG, sitemap i SEO powstają przez ten sam manifest oraz konfigurację co pozostałe gry.

[Dokumentacja gry](games/crystal-rush/README.md) opisuje architekturę, sterowanie, testy i pomiar dla 100–5000 meteorów. Po wdrożeniu istniejącego projektu Gry podstrona będzie dostępna pod `/jeszcze-jeden-krysztal`; nie wymaga osobnej konfiguracji Cloudflare.

## Klocki — jeszcze jeden ruch

Klocki są osobną grą w `games/blocks/` z własnym silnikiem, lokalnym zapisem całej rundy i sterowaniem dotykowym. Szczegóły: [dokumentacja Klocków](games/blocks/README.md). Nie wymagają nowej domeny ani projektu Cloudflare.

## Jednoplikowe Warcaby

Link „Pobierz grę · HTML + JS” pobiera `/games/warcaby-arena-mocy.html`.

Plugin `scripts/gry-download-plugin.mjs` kompiluje **ten sam komponent i silnik** wraz z Vue oraz osadzonym workerem. Wynik ma CSS i JS wewnątrz HTML, bez CDN, serwera, analityki i żądań sieciowych. Otwórz pobrany plik przez `file://` w nowoczesnej przeglądarce. Zawsze startuje nowa partia; zachowanie localStorage dla lokalnych plików zależy od przeglądarki, a jego niedostępność nie zatrzymuje gry.

W development plik jest generowany na żądanie i unieważniany po zmianach w module. W buildzie Gry i platformy trafia do `dist/games/`. Build innych subdomen go nie generuje. Nie trzeba commitować wygenerowanego HTML ani utrzymywać drugiej implementacji gry.

## Testy

```sh
npm run test:gry
npm run type-check
npm run check:og
npx playwright install chromium
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
```

Testy przeglądarkowe uruchamiają osobny dev server na porcie 5175. Można użyć systemowego Chrome zamiast pobierać Chromium: w PowerShell `$env:PLAYWRIGHT_CHANNEL='chrome'`, a następnie `npm run test:gry:browser`.

`tests/gry/harness.html` służy wyłącznie testowaniu cyklu życia kontrolera; nie jest trasą aplikacji ani elementem builda produkcyjnego. Zrzuty ekranów i ślady testów trafiają do ignorowanego `test-results/`.

Grafika OG oraz PNG instalacyjne są wersjami rastrowymi autorskich, kodowych grafik wektorowych. Można odtworzyć je przez `node scripts/generate-gry-art.mjs` z zainstalowaną przeglądarką Playwright lub ustawionym `PLAYWRIGHT_CHANNEL`.

### Wynik weryfikacji wdrożenia modułu

- 52 testy silników i sesji: zaliczone (21 Warcabów, 20 gry Jeszcze jeden kryształ i 11 Klocków), w tym pełne symulowane rozgrywki Warcabów i Klocków.
- 39 testów przeglądarkowych w systemowym Chrome: zaliczone (12 Warcabów, 15 gry Jeszcze jeden kryształ i 12 Klocków), w tym responsywność, sterowanie dotykowe, przeciąganie, zapis rundy, pełna runda arcade, cykl życia po restartach, AI, PD oraz jednoplikowe Warcaby przy wyłączonej sieci i niedostępnym localStorage.
- Build `npm run build:site -- gry`, kontrola typów, lint nowych plików i kontrola grafik OG: zaliczone.
- Kontrola artefaktów `check-gry-build.mjs`: zaliczona. HTML katalogu nie ładuje pakietu samej gry.
- Test zbudowanej strony w przeglądarce: brak błędów hydratacji, działające czyste URL-e i AI, treść dostępna bez JavaScript, odpowiedź 404 dla nieistniejącej strony.
- Widoki desktop/mobile sprawdzone na zrzutach w przeglądarce. Nie testowano na fizycznym telefonie ani w Safari/Firefox. Publikacja w Cloudflare pozostaje po stronie właściciela.

Oddzielna uwaga o istniejących zależnościach repozytorium: `npm audit` zgłosił 6 podatności (5 high, 1 critical), m.in. `shell-quote`, `source-map-js` oraz łańcuch zależności konfiguracji ESLint. Nie pochodzą z dodanych pakietów Playwright. Nie wykonywano automatycznego `audit fix` ani zmian wersji narzędzi innych aplikacji; to osobne zadanie utrzymaniowe.

## Cloudflare Workers — nowy projekt

1. Dodaj nowy Worker połączony z tym samym repozytorium i produkcyjną gałęzią.
2. Root directory: `/`.
3. Build command: `npm run build:site -- gry`.
4. Deploy command: `npx wrangler deploy --name josefine-gry`.
5. W Domains & Routes dodaj Custom Domain: `gry.zgrana.pl`.
6. Użyj wersji Node spełniającej wymagania projektu (Node 24 LTS).

Nie zmieniaj nazwy w głównym `wrangler.jsonc` — obsługuje inne wdrożenia. Argument `--name` kieruje ten build do właściwego Workera. Katalog assetów pozostaje `dist`. Każdy projekt CF ma osobny build, więc nie nadpisuje produkcji innych aplikacji.

Po publikacji sprawdź źródło HTML `/` i `/warcaby-arena-mocy`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/og/gry.png`, pobranie HTML i status 404 nieistniejącego adresu. Wrangler zachowuje istniejące `html_handling: drop-trailing-slash` i `not_found_handling: 404-page`. Nie stosuj SPA fallback dla wszystkich adresów — podstrony mają własny prerenderowany HTML.

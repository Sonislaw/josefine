# Małe królestwo

Samodzielna strategia turowa: `/gry/male-krolestwo` lokalnie, `/male-krolestwo` na `gry.zgrana.pl`.

## Podział odpowiedzialności

- `engine.ts`: czyste typy i reguły, deterministyczna mapa, oferta, gospodarka i sezonowość. `resolveTurn(state, action)` zwraca nowy stan, koszt, produkcję, bilans oraz zmianę populacji. Nigdy nie mutuje wejścia. Ten sam wynik służy prognozie i zatwierdzeniu.
- `storage.ts`: wersjonowany format `{ version: 1, state, tutorialDismissed }`, walidacja i obsługa braku pamięci. Klucz `zgrana:gry:male-krolestwo:v1`. Uszkodzony zapis jest chroniony do jawnego potwierdzenia nowej osady.
- `useKingdom.ts`: stan Vue, wybór akcji, interakcje z pamięcią dopiero po mount. Stan SSR jest stały; nie korzysta z `window`, losowego ziarna ani zapisu gracza.
- `KingdomBoard.vue`: kamera, gesty, wybór pola i klawiatura. Renderuje tylko komórki przecinające viewport z marginesem. Nie nalicza zasobów ani nie wykonuje tur.
- `TileArt.vue`, `BuildingOffer.vue`, `ResourceBar.vue`: ilustracje SVG i prezentacja. `KingdomGame.vue` składa ekran, instrukcję i FAQ.

Gra nie współdzieli silnika ani zapisu z Warcabami, Klockami i Kryształem. Wspólny pozostaje katalog, routing, `GameDialog`, layout i infrastruktura Josefine. Brak nowych zależności.

## Reguły

Jedna zatwierdzona akcja = jedna tura. Koszt → akcja → produkcja (również nowego budynku) → wyżywienie → niedobór → przyrost ludności → następna tura. Oferta zawiera farmę i dwa różne inne budynki; zmienia się tylko po budowie. Stan generatora i oferta są zapisywane.

Rok ma 12 tur, każda pora roku 3. Na końcu pory roku przybywa jedna osoba, jeśli jest miejsce, nie było niedoboru i po wyżywieniu zostały zapasy >= 2 × populacja. Pierwszy kolejny niedobór ostrzega, następne odbierają po jednej osobie; pełne wyżywienie zeruje serię.

**Konsekwencja przyjętego balansu:** ratusz jest niewyburzalny i produkuje 2 żywności, więc niedobór nie zmniejszy legalnej osady poniżej 2 osób. Stan `gameover` dla populacji 0 i ekran końca są obsługiwane defensywnie, ale zwykła rozgrywka według tych reguł do niego nie dochodzi. Nie wprowadzamy ukrytej katastrofy ani nie zmieniamy produkcji ratusza, aby wymusić porażkę. Test terminalny sprawdza izolowany silnik; symulacje prawidłowych osad sprawdzają możliwość odbudowy.

Sąsiedztwo to 4 krawędzie. Premie młynów (2 × poziom młyna) sumują się, bonus wody to raz +1, całość plonów farmy mnożymy przez jej poziom i zimą dzielimy przez 2, zaokrąglając w dół. Tartak/kamieniołom/targ mnożą przez poziom całość swojej produkcji. Dom daje 3 miejsca na poziom.

Koszt ulepszenia to koszt podstawowy × poziom docelowy, maksymalnie poziom 3. Wyburzenie zwraca połowę kosztu podstawowego (nie ulepszeń), w dół. Blokujemy wyburzenie domu, które zmniejszyłoby pojemność poniżej bieżącej populacji.

Sektory 7×7 zapisujemy jako współrzędne, nie tablicę nieograniczonego świata. Typ terenu wyliczamy z ziarna i współrzędnych; co najmniej 21 łąk i wszystkie typy terenu są gwarantowane. Pierwsza eksploracja: 10 drewna, 5 kamienia, 5 monet; każda następna +5/+3/+3. Można odkrywać tylko przy wspólnej krawędzi.

## Sterowanie i zapis

Dotknięcie wybiera pole. Przeciąganie przesuwa mapę; dwa palce lub przyciski zmieniają skalę. Anulowanie gestu, utrata fokusu i drugi palec nie wykonują akcji. Strzałki wybierają pola, Enter/Spacja potwierdza wybór pola, Home wraca do ratusza; tura wymaga oddzielnego przycisku. Ctrl + kółko zmienia skalę, zwykłe kółko przewija stronę.

Zapis po każdej turze jest synchroniczny; nie zapisujemy zaznaczenia, kamery ani rozpoczętych gestów. Zamknięcie strony nie zmienia gospodarki. Gra działa bez storage, ale bez gwarancji wznowienia. Karty przeglądarki nie są synchronizowane — ostatni zapis wygrywa. Zapis ma ograniczenia pojemności localStorage; błąd zapisu jest widoczny, a rozgrywka trwa w pamięci.

## Weryfikacja i publikacja

```sh
npm run test:gry
npm run type-check
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
```

`tests/gry/kingdom.spec.mjs`: mobile od 360 px, zgodność prognozy, budowanie/ulepszanie/wyburzenie, odkrywanie, odtworzenie zapisu, uszkodzony/niedostępny storage, mysz, klawiatura, dotyk/pinch, anulowanie gestów, mapa 100 sektorów. Testy silnika obejmują m.in. 20-letnie rozgrywki oraz granice sezonów i produkcję. Grafika OG 1200×630 pochodzi z autorskiego SVG; odtworzenie: `node scripts/generate-kingdom-art.mjs` (Playwright, opcjonalnie `PLAYWRIGHT_CHANNEL=chrome`).

Cloudflare pozostaje bez zmian: build `npm run build:site -- gry`, deploy `npx wrangler deploy --name josefine-gry`. Gra korzysta z istniejącej domeny i mechanizmu SSG. Nie publikujemy automatycznie i nie dodajemy osobnego Workera.

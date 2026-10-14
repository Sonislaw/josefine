# Małe królestwo

Samodzielna strategia turowa: `/gry/male-krolestwo` lokalnie, `/male-krolestwo` na `gry.zgrana.pl`.

## Podział odpowiedzialności

- `engine.ts`: czyste typy i reguły, oferta, gospodarka i sezonowość. `resolveTurn(state, action)` zwraca nowy stan, koszt, produkcję, jednorazową nagrodę, nowe odkrycie, bilans oraz zmianę populacji. Nigdy nie mutuje wejścia. Ten sam wynik służy prognozie i zatwierdzeniu.
- `terrain.ts`: dotychczasowy, niezmieniony generator terenu. Wspólny dla silnika i odkryć, bez cyklicznych importów reguł.
- `discoveries.ts`: definicje miejsc, koszty, nagrody, rozmieszczenie i premie. Osobne hashe nie zużywają RNG oferty budynków.
- `storage.ts`: wersjonowany format `{ version: 4, state, tutorialDismissed }`, walidacja i obsługa braku pamięci. Klucz `zgrana:gry:male-krolestwo:v4`. Uszkodzony zapis jest chroniony do jawnego potwierdzenia nowej osady.
- `progression.ts`: definicje rang, wymagania, prezenty i czyste sprawdzanie awansu. `ProgressionPanel.vue` pokazuje postęp, a `HallArt.vue` cztery sylwetki ratusza w tym samym polu mapy.
- `requests.ts`: 12 jednorazowych próśb, postęp i polecenia wyboru/odłożenia/przeglądania. `ResidentsPanel.vue` składa panel, a `ResidentPortrait.vue` rysuje portrety SVG.
- `useKingdom.ts`: stan Vue, wybór akcji, interakcje z pamięcią dopiero po mount. Stan SSR jest stały; nie korzysta z `window`, losowego ziarna ani zapisu gracza.
- `KingdomBoard.vue`: kamera, gesty, wybór pola i klawiatura. Renderuje tylko komórki przecinające viewport z marginesem. Nie nalicza zasobów ani nie wykonuje tur.
- `TileArt.vue`, `BuildingOffer.vue`, `ResourceBar.vue`: ilustracje SVG i prezentacja. `KingdomGame.vue` składa ekran, instrukcję i FAQ.
- `DiscoveryArt.vue`: cztery ilustracje wektorowe, z wariantami przed/po odnowieniu. `DiscoveryJournal.vue`: zwijana lista, filtry, po 10 wpisów i lokalizacja bez wykonywania tury.

Gra nie współdzieli silnika ani zapisu z Warcabami, Klockami i Kryształem. Wspólny pozostaje katalog, routing, `GameDialog`, layout i infrastruktura Josefine. Brak nowych zależności.

## Ziemie pełne tajemnic

Każdy nowo odkrywany sektor poza startowym ma jedno deterministyczne miejsce na łące.
Typ i położenie zależą wyłącznie od ziarna i współrzędnych sektora. Cztery typy mają
równy udział w generatorze, mogą się powtarzać. Odkrycie nie daje automatycznie nagrody.
Trwałe miejsca mają przynajmniej jedną sąsiednią łąkę w tym samym sektorze, aby
można było rzeczywiście skorzystać z premii bez zmieniania naturalnego terenu.

| Miejsce              | Koszt obsłużenia      | Efekt                                  |
| -------------------- | --------------------- | -------------------------------------- |
| Ruiny strażnicy      | 4 drewna              | Jednorazowo 10 kamienia i 6 monet      |
| Porzucony wóz        | Bez zasobów           | Jednorazowo 12 drewna i 6 żywności     |
| Zarośnięte źródło    | 8 drewna, 6 kamienia  | +1 żywności sąsiadujących farm i sadów |
| Dawny punkt handlowy | 12 drewna, 8 kamienia | +1 moneta sąsiadujących targów         |

Akcja `landmark` zajmuje jedną zatwierdzoną turę. Po odjęciu kosztu odbieramy nagrodę
albo aktywujemy miejsce, następnie liczymy produkcję, wyżywienie i rozwój osady.
Nagroda (`reward`) jest oddzielona od produkcji (`produced`); bilans zawiera obie.
Miejsce ma status `available`/`used` oraz numer tury odkrycia i wykorzystania.

Nieobsłużone miejsce blokuje budowę. Zbadane ruiny i opróżniony wóz zwalniają łąkę,
ale ich historia pozostaje w dzienniku. Trwałe miejsca pozostają na mapie; nie można
ich ulepszać ani wyburzać. Bonus działa już w turze odnowienia, przy wspólnej krawędzi,
raz na budynek, bez mnożenia przez poziom i liczbę źródeł/punktów handlowych.
Żywność dodajemy po premiach wody, młynów i poziomu, lecz przed zimowym dzieleniem przez 2.

Dziennik sortuje od najnowszego odkrycia, pokazuje znalezione/wykorzystane miejsca
i pozwala wrócić do wskazanego pola. Nawigacja nie wykonuje tury ani nie przygotowuje
budowy z poprzednio wybraną kartą. Rysujemy tylko widoczne odkrycia.

## Od osady do miasteczka

| Ranga | Populacja / budynki / rodzaje / sektory / wykorzystane odkrycia | Prezent: drewno / kamień / żywność / monety |
| --- | --- | --- |
| Osada | Ranga początkowa | — |
| Wioska | 6 / 4 / 3 / 2 / 0 | 10 / 5 / 0 / 5 |
| Miasteczko | 12 / 8 / 5 / 4 / 1 | 20 / 12 / 10 / 12 |
| Małe królestwo | 20 / 12 / 6 / 7 / 3 | 35 / 25 / 20 / 25 |

Liczymy aktualną populację i zabudowę bez ratusza. Poziom nie zwiększa liczby budynków.
Odkrycia muszą mieć status `used`; sektor startowy się liczy. Wszystkie wymagania
muszą być spełnione jednocześnie. `Kingdom.rank` (0–3) jest oddzielny od poziomu
ratusza, a `promotions` zapisuje kolejne rangi i numery zakończonych tur.

Po produkcji, wyżywieniu, zmianie populacji i zwiększeniu numeru tury sprawdzamy
najbliższy awans. Maksymalnie jeden na turę; nigdy nie cofamy rangi. `TurnResult`
zwraca `promotion` i `promotionGift`, osobno od `produced` i nagrody odkrycia `reward`.
Prezent dodajemy na samym końcu: nie ratuje niedoboru ani nie uruchamia przyrostu w tej
samej turze. Końcowy bilans zawiera prezent. Nie ma nowych akcji ani zmian w ofercie RNG.

Zwijany panel pokazuje wymagania, podpowiedzi, prezent i historię. Po ostatnim awansie
gra trwa dalej. Komunikat można zamknąć; nie blokuje mapy i nie pojawia się ponownie
po odświeżeniu. Ratusz zmienia tylko wygląd, nie produkcję i pojemność.

## Głos mieszkańców

Trzy prośby odblokowują się na każdej randze. Gracz wybiera jedną z maksymalnie trzech
widocznych; „Inne prośby” przegląda pozostałe w stałej kolejności, bez RNG i zmiany kart
budynków. Nie ma terminów, kar ani nowych zasobów. Każde zlecenie można ukończyć raz.

| Ranga | Prośba / cel | Nagroda |
| --- | --- | --- |
| Osada | Pole przy strumieniu: farma przy wodzie | 4 drewna, 2 monety |
| Osada | Drewno z sąsiedztwa: tartak przy lesie | 3 kamienia, 2 monety |
| Osada | Solidny fundament: kamieniołom przy skałach | 4 drewna, 2 monety |
| Wioska | Mąka dla sąsiadów: jeden młyn przy dwóch farmach | 6 żywności, 4 monety |
| Wioska | Targ blisko domu: jeden targ przy dwóch domach | 6 drewna, 4 monety |
| Wioska | Jesień pachnąca jabłkami: dwa sady | 6 żywności, 4 monety |
| Miasteczko | Dom na lata: dom poziomu 3 | 6 kamienia, 6 monet |
| Miasteczko | Gospodarstwo z rozmachem: farma poziomu 3 | 8 żywności, 6 monet |
| Miasteczko | Przywrócone wspomnienie: odnowione źródło lub punkt handlowy | 6 drewna, 4 kamienia, 6 monet |
| Małe królestwo | Ogród wokół źródła: farma lub sad przy odnowionym źródle | 10 żywności, 8 monet |
| Małe królestwo | Ożywiony szlak: targ przy odnowionym punkcie handlowym | 8 drewna, 8 monet |
| Małe królestwo | Dobrze przygotowana spiżarnia: młyn poziomu ≥2 przy dwóch farmach poziomu ≥2 | 6 kamienia, 10 żywności, 8 monet |

Sąsiedztwo to wyłącznie cztery krawędzie; naturalny teren musi być odkryty. Liczymy
obecną zabudowę, również istniejącą przed przyjęciem prośby. Dwie farmy/domki muszą
sąsiadować z tym samym młynem/targiem. Nie sumujemy kilku osobnych układów.

`Kingdom.requests` zawiera `active` (`id`, `acceptedTurn`), `completed` (`id`,
`acceptedTurn`, `turn`) i kursor przeglądania. `manageRequest` to czyste polecenia
bez tury i bez zasobów; kontroler zapisuje wynik od razu. Odłożenie pozwala wybrać
inną prośbę, a gotowy cel czeka na następną zatwierdzoną legalną turę. Wyburzenie
budynku w tej turze może usunąć spełniony warunek. Żadna nagroda nie jest przyznawana
podczas wyboru, migracji, lokalizacji na mapie ani samego odświeżenia.

`resolveTurn` sprawdza cel po wyżywieniu, zmianie populacji i awansie osady. Zwraca
`completedRequest` i `requestReward` osobno od produkcji, znaleziska i prezentu za
rangę. Bilans obejmuje wszystkie nagrody; zasoby prośby nie ratują wcześniejszego
niedoboru ani nie uruchamiają przyrostu w tej samej turze. Jedna aktywna prośba daje
maksymalnie jedno wykonanie na turę. Cała kolekcja daje łącznie 28 drewna, 19 kamienia,
40 żywności i 60 monet. Po 12 wykonaniach gra trwa dalej.

Panel jest zwijany, ma portrety, cytaty mieszkańców, cel, wskazówki, postęp, nagrodę,
lokalizację istniejącego budynku/miejsca i historię. Komunikat podziękowania można
zamknąć. Nowe prośby po odświeżeniu nie zastępują aktywnego celu.

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

Odczytujemy kolejno v4 → v3 → v2 → v1, wyłącznie przy braku nowszego klucza. Poprawny
starszy zapis migrujemy do v4, zachowując oryginalne bajty kopii. Dodajemy pusty stan
próśb, bez nagród ani zmiany zasobów, tury, budynków, terenu i oferty. Z v3 zachowujemy
rangę i historię awansów. W v1/v2 ustawiamy rangę Osada i pustą historię awansów;
z v1 dodatkowo tworzymy pustą kolekcję odkryć. Duża istniejąca osada może zdobywać
kolejne rangi w następnych zatwierdzonych turach. Uszkodzony nowszy zapis zawsze
blokuje cofnięcie do starszej kopii. Błąd zapisu migracji pozwala grać w pamięci
z ostrzeżeniem. Potwierdzony restart zastępuje v4; stare kopie pozostają.

Walidacja sprawdza rodzaj, deterministyczne położenie, odkryty sektor, unikalność
miejsca w sektorze, chronologię tur oraz zakaz zabudowy zajętego miejsca. Historia
awansów musi zawierać dokładnie kolejne rangi 1…rank z rosnącymi turami, nie z przyszłości.
Nie sprawdzamy dawnych progów względem obecnej populacji — osiągnięć nie odbieramy.
Prośby mają znane identyfikatory, jedną aktywną pozycję, unikalną historię najwyżej
12 wykonań, poprawne rangi i chronologię przyjęcia/wykonania. Brak lub uszkodzenie
stanu próśb w v4 nie jest cicho naprawiane, aby nie umożliwiać ponownego odbioru nagród.

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

`discoveries.test.mjs` obejmuje deterministyczność, nagrody, nielegalne akcje,
zimę, kumulację, odnowienie i migrację. `tests/gry/kingdom-discoveries.spec.mjs`
sprawdza cztery miejsca w rzeczywistym UI, prognozę, klawiaturę, przywrócenie zapisu,
v1/v2, błędy pamięci oraz dziennik na mapie 100 sektorów. Testy mobilne są emulacją
przeglądarki desktopowej, nie pomiarem fizycznego telefonu.

Cloudflare pozostaje bez zmian: build `npm run build:site -- gry`, deploy `npx wrangler deploy --name josefine-gry`. Gra korzysta z istniejącej domeny i mechanizmu SSG. Nie publikujemy automatycznie i nie dodajemy osobnego Workera.

`progression.test.mjs` obejmuje progi, kolejność rozliczeń, pojedyncze nagrody,
migracje v1/v2 → v3 oraz osiągnięcie wszystkich rang legalnymi ruchami od nowej osady
dla trzech ziaren. `tests/gry/kingdom-progression.spec.mjs` sprawdza prognozę, zapis,
cztery warianty ratusza, klawiaturę, mobile, restart i błędy pamięci. Fixture jest
wyłącznie w katalogu testów; nie dodajemy interfejsu testowego do produkcji.

`requests.test.mjs` sprawdza wszystkie cele, sąsiedztwo, wybór i odłożenie, nagrody,
wspólne rozliczenie z awansem, komplet 12 wykonań oraz migracje v1/v2/v3 → v4.
`tests/gry/kingdom-requests.spec.mjs` sprawdza portrety, postęp, prognozę i odbiór,
mapę, odświeżenie, odłożenie, restart, pamięć i historię na mobile/desktop.

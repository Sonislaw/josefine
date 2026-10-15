# Małe królestwo

Samodzielna strategia turowa: `/gry/male-krolestwo` lokalnie, `/male-krolestwo` na `gry.zgrana.pl`.

## Podział odpowiedzialności

- `balance.ts`: koszty budynków i ulepszeń, ograniczenia produkcji, limity zapasów, utrzymanie wojska i parametry strat. Zmiany balansu nie tworzą drugiego silnika ani osobnego poziomu trudności.
- `engine.ts`: czyste typy i reguły, katalog budynków, gospodarka i sezonowość. `resolveTurn(state, action)` zwraca nowy stan, koszt, produkcję, jednorazową nagrodę, nowe odkrycie, bilans oraz zmianę populacji. Nigdy nie mutuje wejścia. Ten sam wynik służy prognozie i zatwierdzeniu.
- `terrain.ts`: wersjonowany, deterministyczny generator terenu. Skupiska lasów i skał oraz rzadsze, większe jeziora. Wspólny dla silnika, odkryć i sąsiadów, bez cyklicznych importów reguł.
- `discoveries.ts`: definicje miejsc, koszty, nagrody, rozmieszczenie i premie. Rozmieszczenie wynika z osobnych hashy współrzędnych i ziarna.
- `storage.ts`: wersjonowany format `{ version: 11, state, tutorialDismissed }`, walidacja i obsługa braku pamięci. Klucz `zgrana:gry:male-krolestwo:v11`. Uszkodzony zapis jest chroniony do jawnego potwierdzenia nowej osady.
- `campaign.ts`, `campaign-storage.ts`: niezależne garnizony, odbudowa, najazdy, przewaga, pokój i migracja. Cała symulacja pozostaje czysta i bez zegara przeglądarki.
- `military.ts`, `neighbours.ts`, `battle.ts`: konfiguracja wojska, kontakty i czysta prognoza walki. `DefencePanel.vue`, `BattleSummary.vue`, `MilitaryArt.vue`: panele oraz własne SVG.
- `progression.ts`: definicje rang, wymagania, prezenty i czyste sprawdzanie awansu. `ProgressionPanel.vue` pokazuje postęp, a `HallArt.vue` cztery sylwetki ratusza w tym samym polu mapy.
- `requests.ts`: 12 jednorazowych próśb, postęp i polecenia wyboru/odłożenia/przeglądania. `ResidentsPanel.vue` składa panel, a `ResidentPortrait.vue` rysuje portrety SVG.
- `useKingdom.ts`: stan Vue, wybór akcji, interakcje z pamięcią dopiero po mount. Stan SSR jest stały; nie korzysta z `window`, losowego ziarna ani zapisu gracza.
- `KingdomBoard.vue`: kamera, gesty, wybór pola i klawiatura. Renderuje tylko komórki przecinające viewport z marginesem. Nie nalicza zasobów ani nie wykonuje tur.
- `TileArt.vue`: składa warstwy ilustracji 2D, poziomy, stan uszkodzenia i wytrzymałość zamku. `TerrainArt.vue` rysuje ciągły teren z sezonami i brzegami wody, a `BuildingArt.vue` budynki gospodarcze z detalami poziomów. Te same ilustracje są używane na mapie i kartach `BuildingOffer.vue`. Wariant terenu wynika ze współrzędnych i ziarna; brzegi wody uwzględniają wyłącznie odkrytych sąsiadów. Nie zapisujemy danych dekoracyjnych. `ResourceBar.vue` prezentuje zasoby, a `KingdomGame.vue` składa ekran, instrukcję i FAQ.
- `DiscoveryArt.vue`: cztery ilustracje wektorowe, z wariantami przed/po odnowieniu. `DiscoveryJournal.vue`: zwijana lista, filtry, po 10 wpisów i lokalizacja bez wykonywania tury.
- `ResourceIcon.vue`, `ResourceAmount.vue`, `ResourceList.vue`: wspólne ikony SVG i zwarte wartości dla kosztów, produkcji, nagród i dyplomacji. Liczby z ikonami mają pełne polskie etykiety dla czytników ekranu i podpowiedzi przy najechaniu; `format.ts` odmienia nazwy wyłącznie na potrzeby tych opisów.
- `SettlementStatus.vue`: pora roku, rok i tura, mieszkańcy, ranga, produkcja oraz wyżywienie w slocie przyklejonego `ResourceBar.vue`. Pasek mierzy swoją wysokość przez `ResizeObserver`; odziedziczona zmienna CSS dopasowuje odstępy przewijania przycisków i dymków, również po zmianie szerokości i przy odczycie zapisu.

Gra nie współdzieli silnika ani zapisu z Warcabami, Klockami i Kryształem. Wspólny pozostaje katalog, routing, `GameDialog`, layout i infrastruktura Josefine. Brak nowych zależności.

Przycisk „Zbierz zapasy” natychmiast rozlicza jedną turę przez `useKingdom.gatherNow`,
korzystając z tego samego `commit`, taktyki, raportów i zapisu co pozostałe akcje.
Zastępuje niezrealizowany plan budowy, ale go nie wykonuje. Zablokowana lub zakończona
rozgrywka nie przyjmuje tej akcji; pozostałe decyzje nadal wymagają osobnego zatwierdzenia.
Po wykonaniu zbierania przycisk rozświetla się na 550 ms i pokazuje krótki pasek postępu.
Każde kliknięcie ponawia wyłącznie animację CSS, bez blokowania sterowania i opóźniania tury.
Przy `prefers-reduced-motion` pozostaje krótkie podświetlenie bez ruchomego paska.

## Skupiska terenu (zapis v11)

Generator terenu v2 wyznacza skupiska we współrzędnych świata, a nie losuje rodzaju
każdego pola osobno. Lasy i skały tworzą zwarte obszary, również przez granice sektorów.
Rzadsze jeziora mają wspólny, ciągły akwen zamiast pojedynczych pól wody.
Zachowujemy przynajmniej 20 łąk w sektorze oraz startową polanę z dostępem do lasu,
skał i wody. Ograniczony cache 512 sektorów nie wpływa na deterministyczność.

`landscape.version` wybiera generator; `landscape.legacySectors` zachowuje teren
już odkryty przed migracją. Zapisy v1–v10 otrzymują generator v2 dla przyszłych
eksploracji, ale wszystkie znane sektory pozostają na v1. Nie przesuwamy budynków,
odkryć, zamków ani złóż i nie zmieniamy zasobów czy tury. Oryginalne zapisy pozostają.
`baseTerrain` jest wspólnym źródłem terenu dla gospodarki i walidacji; `terrainAt`
dodaje do niego nasadzenia leśników. Nowa osada od razu korzysta z v2.
Jawny v1 jest zachowany dla kompatybilności i geometrycznych fixture'ów regresji.
`terrain.test.mjs` sprawdza spójność skupisk, powierzchnię jezior, dostęp do surowców,
migrację oraz eksplorację; symulacje rozwoju korzystają z aktualnego generatora.

## Stały katalog budynków (v10)

`ECONOMY_BUILDINGS` pochodzi z definicji `BUILDINGS`. Każdy budynek gospodarczy można
wybrać w każdej turze, bez losowania i odświeżania kart. Zakładka „Obrona” nadal wymaga
Wioski i pozwala mieć po jednych koszarach i wieży. Koszty, wymagania rang, legalność
pola i oddzielne zatwierdzenie tury pozostają sprawdzane przez silnik.

Stan osady nie zawiera już `offer` ani `rng`; wybór budynku nie jest częścią zapisu.
Migracja v9 i starszych do v10 waliduje stare pola, następnie je usuwa, zachowując
zasoby, budynki, lasy, postęp leśników, historię i turę. Oryginalne zapisy pozostają
pod dawnymi kluczami. `catalog.test.mjs` oraz `kingdom-catalog.spec.mjs` sprawdzają
swobodny wybór w kolejnych turach i kontynuację starej osady.

## Wyczerpywalne złoża (v8)

`deposits.ts` konfiguruje zasoby: las 60 drewna, skały 80 kamienia, zasięg Manhattan ≤ 3. Uwzględnia wyłącznie odkryte pola. Wydajność to 1/2/3 na poziomach 1–3 plus jedna jednostka za każde z maksymalnie dwóch dostępnych złóż; bez złóż wynosi zero. Wspólna alokacja przydziela po jednej jednostce na rundę każdemu budynkowi, najbliższe źródła pierwsze, remisy według y, x. Jeden pozyskany surowiec zużywa jedną jednostkę złoża. Uszkodzone budynki nie wydobywają. Nowa budowa, naprawa i ulepszenie działają już w tej turze.

`production`, raport budynku i zatwierdzenie korzystają z tego samego planu. `TurnResult.extraction` zawiera zużycie i wyczerpane pola. Stan `deposits` przechowuje tylko zmienione ilości, również zera. Pnie i wyrobiska pozostają naturalnym terenem bez samoczynnej regeneracji i zabudowy; leśnik może odnowić wycięty las. Mapa pokazuje zapasy, zasięg i ikonę przestoju; prognoza ostrzega o wyczerpaniu. Nadprodukcja poza magazynem nadal przepada, również po wydobyciu. Ratusz i zbieranie zapasów działają niezależnie od złóż.

Migracja v7 i starszych do v8 dodaje pełne złoża bez zmiany zasobów i tury, zachowując oryginalne kopie. Uszkodzony v8 nigdy nie uruchamia starszej osady. Walidacja sprawdza ilości, teren, odkrycie i współrzędne. `deposits.test.mjs` sprawdza współdzielenie, koszty zasobów, przestój, naprawy, zgodność prognozy i migrację. `kingdom-deposits.spec.mjs` obejmuje mapę, zapis i widok mobilny.

## Domek leśnika i trzy etapy lasu (v9)

`forestry.ts` zawiera zasięg Manhattan ≤ 3, okres sadzenia 4/3/2 tury dla poziomów 1–3,
etapy wzrostu i deterministyczny wybór pola. Domek jest zwykłym budynkiem gospodarczym
w ofercie, kosztuje 24 drewna, 10 kamienia i 8 monet; ulepszenia i naprawy korzystają
ze wspólnych reguł. Uszkodzenie zatrzymuje sadzenie, ale już posadzone drzewa rosną dalej.

Leśnik najpierw odnawia wycięty las, następnie obsadza pustą łąkę; w każdej grupie wybiera
najbliższe pole, potem y i x. Omija nieodkryte sektory, budynki, wszystkie odkrycia i osady,
wodę, skały, rosnące drzewa oraz niewycięty las. Kilku leśników nie sadzi na tym samym polu.
Brak miejsca zatrzymuje licznik na progu; kolejna tura ponawia próbę bez gromadzenia zapasu sadzonek.

Nowe drzewka mają wiek 0 (etap 1), po 3 turach młody las (etap 2), po 6 turach dojrzały
las (etap 3). Zima ani brak domku nie zatrzymują wzrostu. Wiek jest ograniczony do 6,
a nasadzenie daje przyszły zapas 60 drewna, niedostępny dla tartaków w etapach 1 i 2.
Kolejność: akcja i bitwa → wzrost i sadzenie → wydobycie i produkcja → pozostałe rozliczenia.
Tartak może korzystać z lasu już w turze dojrzenia. Wyczerpane pole może zostać ponownie obsadzone.

`Kingdom.forests` to nakładka na stały generator terenu, a `terrainAt` wspólnie obsługuje
budowanie, wydobycie, prośby i mapę. Posadzony las blokuje budowę na łące. Licznik sadzenia
jest zapisany przy budynku; wybór budynku pozostaje niezależny od leśnictwa. `TurnResult.forestry`
pokazuje pola posadzone i dojrzałe. `ForestGrowthArt.vue` rysuje sadzonki i młode drzewa,
`TerrainArt.vue` dojrzałe korony, a `ForesterArt.vue` domek na mapie i karcie.

Migracja v8 → v9 dodaje pustą kolekcję nasadzeń, zachowując wyczerpanie złóż, budynki,
zasoby i turę. Nie obsadza wcześniejszych pól i zachowuje oryginał zapisu v8.
Uszkodzony v9 blokuje cofnięcie do starszego zapisu; błędy pamięci pozwalają grać bez zapisu.
`forestry.test.mjs` sprawdza wzrost, wycinkę, cykl odnowienia, kolizje, poziomy, uszkodzenia,
zgodność prognozy oraz migrację. Test przeglądarkowy obejmuje trzy grafiki, zasięg, prognozę i odświeżenie.

## Zamki, łupy i trwałe zgliszcza

- Po pierwszych trzech kontaktach każdy kolejny sektor odkrywany od Wioski ma deterministyczną szansę 1/3 na dodatkowy wrogi zamek. Nie ma limitu liczby kontaktów. Nie dokładamy zamków do wcześniej odkrytych terenów.
- `affairs.enemies[id]` przechowuje odrębną armię, kampanię, przewagę, terminy ochrony i pokoju, wytrzymałość oraz skarbiec. Polecenia wojenne muszą zawierać `enemyId`. Wybranie innego pola na mapie nie zmienia przygotowanej wyprawy.
- Wytrzymałość zaczyna od 100%. Zwycięska zwykła wyprawa odbiera 26 punktów procentowych, lub 35 przy przynajmniej dwukrotnej przewadze. Kolejny atak na ten sam garnizon można rozliczyć po 2 turach. Stary, zapisany termin dostępności wyprawy pozostaje zachowany podczas migracji.
- Na końcu tury bez ataku dany zamek odzyskuje 3 punkty procentowe, do 100%. W turze wyprawy nie ma odbudowy. Przegrana nie daje łupów ani uszkodzeń; przechwycenie dotyczy oddziału poza zamkiem i nie uszkadza murów.
- Skarbiec zaczyna od 24 drewna, 18 kamienia, 16 żywności i 20 monet. Wygrana zabiera do 8/6/4/6, wyłącznie ze stanu skarbca. Po 6 turach bez ataku odnawia się najwyżej 2/2/1/2, do pojemności; nie ma darmowej pełnej nagrody za każdy klik.
- Przy 0% wyprawa zabiera pozostały skarbiec, usuwa garnizon i zapisuje turę zniszczenia oraz relację `ruins`. Wytrzymałość, skarbiec i wojsko nie wracają. Własne SVG zgliszczy pozostaje na mapie, a pole nie jest dostępne pod budowę.
- Pokój i rozejm dotyczą wybranego sąsiada. Jeden wspólny nadchodzący najazd oraz 12 tur globalnej ochrony po jego zakończeniu zapobiegają równoczesnym bitwom. Następny uprawniony wróg ma najstarszy termin ochrony, następnie najniższy ID — starszy zamek nie monopolizuje kolejki.
- Łupy, szkody i końcowa wytrzymałość są częścią tego samego `resolveTurn` w prognozie i zatwierdzeniu. Łupy trafiają do osady po wyżywieniu i żołdzie; nie płacą wstecz za utrzymanie armii. Limity magazynów nadal obowiązują.
- Panel sąsiadów pokazuje po 5 kontaktów, z opcją „Pokaż więcej osad”. Plansza nadal renderuje tylko widoczne pola; lokalizację osad indeksujemy po współrzędnych.

Migracja v6 → v7 najpierw waliduje stary model. Zachowuje gospodarkę, rangi, prośby, armię, garnizon, terminy najazdu i pokoju. Dotychczasowy wróg staje się wpisem o ID 2; jego zamek zaczyna ze 100% wytrzymałości i pełnym skarbcem, bez przyznania zasobów graczowi. Istniejący najazd otrzymuje ID 2. Oryginalne bajty v6 pozostają; uszkodzony v7 nigdy nie uruchamia starszego zapisu. Nowi wrogowie pojawiają się dopiero podczas kolejnych eksploracji.

`castles.ts` jest źródłem parametrów murów i skarbców; `EnemyCastlePanel.vue` ma osobny wybór oddziału dla każdego przeciwnika. `legacy-campaign-storage.ts` obsługuje stary pojedynczy model wyłącznie podczas odczytu starych wersji.

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

| Ranga          | Populacja / budynki / rodzaje / sektory / wykorzystane odkrycia | Prezent: drewno / kamień / żywność / monety |
| -------------- | --------------------------------------------------------------- | ------------------------------------------- |
| Osada          | Ranga początkowa                                                | —                                           |
| Wioska         | 8 / 6 / 4 / 2 / 1                                               | 6 / 3 / 0 / 3                               |
| Miasteczko     | 14 / 10 / 5 / 4 / 2                                             | 12 / 6 / 6 / 6                              |
| Małe królestwo | 22 / 16 / 7 / 7 / 4                                             | 20 / 12 / 12 / 12                           |

Liczymy aktualną populację i zabudowę bez ratusza. Poziom nie zwiększa liczby budynków.
Odkrycia muszą mieć status `used`; sektor startowy się liczy. Wszystkie wymagania
muszą być spełnione jednocześnie. `Kingdom.rank` (0–3) jest oddzielny od poziomu
ratusza, a `promotions` zapisuje kolejne rangi i numery zakończonych tur.

Po produkcji, wyżywieniu, zmianie populacji i zwiększeniu numeru tury sprawdzamy
najbliższy awans. Maksymalnie jeden na turę; nigdy nie cofamy rangi. `TurnResult`
zwraca `promotion` i `promotionGift`, osobno od `produced` i nagrody odkrycia `reward`.
Prezent dodajemy na samym końcu: nie ratuje niedoboru ani nie uruchamia przyrostu w tej
samej turze. Końcowy bilans zawiera prezent. Nie ma nowych akcji ani zmian w katalogu budynków.

Zwijany panel pokazuje wymagania, podpowiedzi, prezent i historię. Po ostatnim awansie
gra trwa dalej. Komunikat można zamknąć; nie blokuje mapy i nie pojawia się ponownie
po odświeżeniu. Ratusz zmienia tylko wygląd, nie produkcję i pojemność.

## Głos mieszkańców

Trzy prośby odblokowują się na każdej randze. Gracz wybiera jedną z maksymalnie trzech
widocznych; „Inne prośby” przegląda pozostałe w stałej kolejności, bez losowania i zmiany katalogu
budynków. Nie ma terminów, kar ani nowych zasobów. Każde zlecenie można ukończyć raz.

| Ranga          | Prośba / cel                                                                 | Nagroda                          |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| Osada          | Pole przy strumieniu: farma przy wodzie                                      | 4 drewna, 2 monety               |
| Osada          | Drewno z sąsiedztwa: tartak przy lesie                                       | 3 kamienia, 2 monety             |
| Osada          | Solidny fundament: kamieniołom przy skałach                                  | 4 drewna, 2 monety               |
| Wioska         | Mąka dla sąsiadów: jeden młyn przy dwóch farmach                             | 6 żywności, 4 monety             |
| Wioska         | Targ blisko domu: jeden targ przy dwóch domach                               | 6 drewna, 4 monety               |
| Wioska         | Jesień pachnąca jabłkami: dwa sady                                           | 6 żywności, 4 monety             |
| Miasteczko     | Dom na lata: dom poziomu 3                                                   | 6 kamienia, 6 monet              |
| Miasteczko     | Gospodarstwo z rozmachem: farma poziomu 3                                    | 8 żywności, 6 monet              |
| Miasteczko     | Przywrócone wspomnienie: odnowione źródło lub punkt handlowy                 | 6 drewna, 4 kamienia, 6 monet    |
| Małe królestwo | Ogród wokół źródła: farma lub sad przy odnowionym źródle                     | 10 żywności, 8 monet             |
| Małe królestwo | Ożywiony szlak: targ przy odnowionym punkcie handlowym                       | 8 drewna, 8 monet                |
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

Jedna zatwierdzona akcja = jedna tura. Gospodarka rozlicza koszt, akcję, produkcję (również nowego budynku), wyżywienie, niedobór i przyrost ludności. Pełna kolejność z bitwą i utrzymaniem wojska jest opisana poniżej. Wszystkie budynki gospodarcze są dostępne w stałym katalogu w każdej turze.

Rok ma 12 tur, każda pora roku 3. Na końcu pory roku przybywa jedna osoba, jeśli jest miejsce, nie było niedoboru i po wyżywieniu zostały zapasy >= 2 × populacja. Pierwszy kolejny niedobór ostrzega, następne odbierają po jednej osobie; pełne wyżywienie zeruje serię.

Ratusz produkuje 2 żywności, więc sam niedobór nie zmniejszy legalnej osady poniżej 2 osób. Najazd może jednak odebrać ostatniego mieszkańca. Stan `gameover` blokuje kolejne akcje i przyrost ludności w końcowej turze.

Sąsiedztwo to 4 krawędzie. Farma produkuje 3/5/7 żywności na poziomach 1/2/3. Woda daje raz +1; młyny dodają po 1 za poziom, łącznie najwyżej +3. Premie nie są ponownie mnożone przez poziom farmy. Tartak i kamieniołom dają 1/2/3 surowca oraz najwyżej +2 od terenu. Targ daje 1/2/3 monety oraz najwyżej +2 od domów. Sad daje 2/3/4 żywności, jesienią dwa razy więcej. Premię źródła dodajemy przed zimowym dzieleniem całej produkcji farmy/sadu przez 2, w dół. Dom nadal daje 3 miejsca na poziom.

Koszt ulepszenia to koszt podstawowy ×3 na poziom 2 oraz ×6 na poziom 3. Budynki gospodarcze wymagają odpowiednio Wioski i Miasteczka; wojskowe Miasteczka i Małego królestwa. Wyburzenie zwraca połowę kosztu podstawowego (nie ulepszeń), w dół. Blokujemy wyburzenie domu, które zmniejszyłoby pojemność poniżej bieżącej populacji. Awaryjne zbieranie daje 1 drewna, 1 kamienia i 2 żywności; kamień zapobiega zablokowaniu nowej osady przed pojawieniem się kamieniołomu w ofercie.

Sektory 7×7 zapisujemy jako współrzędne, nie tablicę nieograniczonego świata. Typ terenu wyliczamy z ziarna i współrzędnych; co najmniej 21 łąk i wszystkie typy terenu są gwarantowane. Pierwsza eksploracja: 18 drewna, 10 kamienia, 8 monet; każda następna +8/+5/+5. Można odkrywać tylko przy wspólnej krawędzi.

### Zapasy i zgodność wcześniejszych osad

| Ranga          | Drewno | Kamień | Żywność | Monety |
| -------------- | ------ | ------ | ------- | ------ |
| Osada          | 120    | 120    | 80      | 80     |
| Wioska         | 200    | 200    | 140     | 140    |
| Miasteczko     | 320    | 320    | 240     | 220    |
| Małe królestwo | 480    | 480    | 360     | 320    |

Limit sprawdzamy na końcu tury, po wszystkich nagrodach i awansie, z uwzględnieniem nowej rangi. `TurnResult.storageLoss` pokazuje niezmagazynowaną nadwyżkę, również w prognozie. Produkcja bieżącej tury może wyżywić ludzi i wojsko, zanim ograniczymy magazyn.

Format zapisu to v11. Nie kasujemy istniejących zasobów, budynków, poziomów ani osiągniętych rang. Gdy zapasy sprzed aktualizacji przekraczają limit, dozwolony stan końcowy to większa z wartości: limit i zapasy na początku tury. Dzięki temu stare bogactwo pozostaje dostępne, ale nie może już rosnąć ponad limit. Wyższe ceny i nowa produkcja obowiązują od następnej akcji. Walidacja dopuszcza dawny licznik odbudowy wroga równy 2; następna tura rozlicza go według nowego okresu, bez cofania zapisu.

## Sterowanie i zapis

Kliknięcie budynku otwiera kompaktowy dymek ponad jego polem: poziom, koszt i ranga wymagana do ulepszenia. Przycisk „Ulepsz” tylko przygotowuje akcję; nadal trzeba osobno zatwierdzić turę. Naprawa i wyburzenie pozostają pod mapą. Dymek zamykamy przyciskiem, Escape, przesunięciem lub skalowaniem mapy. Jego HTML nie skaluje się wraz z SVG i nie przechwytuje gestów planszy. Pozycjonowanie w `building-popover.ts` jest czyste i testowane osobno; `BuildingUpgradePopover.vue` korzysta z kosztów oraz walidacji istniejącego silnika.

Dotknięcie wybiera pole. Przeciąganie przesuwa mapę; dwa palce lub przyciski zmieniają skalę. Anulowanie gestu, utrata fokusu i drugi palec nie wykonują akcji. Strzałki wybierają pola, Enter/Spacja potwierdza wybór pola, Home wraca do ratusza; tura wymaga oddzielnego przycisku. Ctrl + kółko zmienia skalę, zwykłe kółko przewija stronę.

Zapis po każdej turze jest synchroniczny; nie zapisujemy zaznaczenia, kamery ani rozpoczętych gestów. Zamknięcie strony nie zmienia gospodarki. Gra działa bez storage, ale bez gwarancji wznowienia. Karty przeglądarki nie są synchronizowane — ostatni zapis wygrywa. Zapis ma ograniczenia pojemności localStorage; błąd zapisu jest widoczny, a rozgrywka trwa w pamięci.

Odczytujemy kolejno v11 → v10 → v9 → v8 → v7 → v6 → v5 → v4 → v3 → v2 → v1, wyłącznie przy braku nowszego klucza. Poprawny
starszy zapis migrujemy do v11, zachowując oryginalne bajty kopii. Z v5 zachowujemy wojsko, kontakty, uszkodzenia i terminy najazdów;
dodajemy zero tarczowników i stan kampanii. Starszym zapisom dodajemy pustą armię,
brak kontaktów i najazdu. Z v4 zachowujemy prośby; starszym wersjom dodajemy pusty stan
próśb, bez nagród ani zmiany zasobów, tury, budynków i terenu. Z v3 zachowujemy
rangę i historię awansów. W v1/v2 ustawiamy rangę Osada i pustą historię awansów;
z v1 dodatkowo tworzymy pustą kolekcję odkryć. Duża istniejąca osada może zdobywać
kolejne rangi w następnych zatwierdzonych turach. Uszkodzony nowszy zapis zawsze
blokuje cofnięcie do starszej kopii. Błąd zapisu migracji pozwala grać w pamięci
z ostrzeżeniem. Potwierdzony restart zastępuje v11; stare kopie pozostają.

Walidacja sprawdza rodzaj, deterministyczne położenie, odkryty sektor, unikalność
miejsca w sektorze, chronologię tur oraz zakaz zabudowy zajętego miejsca. Historia
awansów musi zawierać dokładnie kolejne rangi 1…rank z rosnącymi turami, nie z przyszłości.
Nie sprawdzamy dawnych progów względem obecnej populacji — osiągnięć nie odbieramy.
Prośby mają znane identyfikatory, jedną aktywną pozycję, unikalną historię najwyżej
12 wykonań, poprawne rangi i chronologię przyjęcia/wykonania. Brak lub uszkodzenie
stanu próśb w v4/v5/v6/v7 nie jest cicho naprawiane, aby nie umożliwiać ponownego odbioru nagród.

## Wojna na pograniczu — reguły

Po Wiosce trzy kolejne eksploracje poznają Brzeziny (dar 8 żywności/4 monety),
Kamienny Bród (10 drewna/5 kamienia za przyjaźń i 12 monet) i Czerwone Wzgórze.
Przyjazne wymiany są jednorazowe i zajmują turę. Położenie osad jest deterministyczne,
poza miejscem specjalnym oraz jego sąsiednimi polami; nie zmienia katalogu budynków. Kolejne eksploracje mogą odkryć następne zamki, według reguł opisanych powyżej.

Wojsko wroga jest rzeczywiste. Docelowa armia zależy od rangi:
Wioska 4 włóczników/3 łuczników/1 tarczownik; Miasteczko 5/4/2; Małe królestwo 6/5/3.
Co dwie legalne tury (także podczas pokoju) rekrutuje najwyżej jedną brakującą jednostkę,
w obrotowej kolejności włócznik/łucznik/tarczownik, pomijając pełne limity typów.
Limit obejmuje garnizon i wysłany najazd. Awans nie tworzy armii natychmiast.
Garnizon zmienia taktykę co cztery tury konfliktu, kolejno szyk/ostrzał/szturm.
Długi pokój zatrzymuje licznik; krótki rozejm daje ochronę, ale kampania trwa dalej.

Po 12 turach od poznania wróg może ogłosić najazd, jeśli ma co najmniej 3 jednostki.
Na koniec tury N oddzielamy ceil(2/3) armii, maksymalnie 10 żołnierzy, w kolejności
naprzemiennej między typami. Partia odchodzi z garnizonu, taktyka zostaje zapisana.
Atak po akcji N+4 daje pełne cztery tury przygotowań. Po zakończeniu najazdu lub
rozejmie obowiązuje 12 tur ochrony. Ocalali z najazdu wracają do garnizonu; nie są kopiowani.
Zwykła wyprawa nie wydłuża ochrony.

Koszary kosztują 30 drewna/20 kamienia/16 monet; wieża 24 drewna/30 kamienia/12 monet.
Poziomy koszar dają limit 6/9/12, wieży premię obrony 4/6/8.
Ulepszenie kosztuje podstawowy koszt ×3/×6; poziom 2 wymaga
Miasteczka, poziom 3 Małego królestwa. Po jednym budynku; bez wpływu na katalog
gospodarcze i wymagania awansów. Koszar nie wyburzamy z armią.

Włócznik: 6 drewna/3 kamienia/2 żywności/6 monet, siła 4. Łucznik: 8 drewna/2 kamienia/3 żywności/8 monet, siła 3.
Tarczownik: 5 drewna/7 kamienia/2 żywności/9 monet, siła 2; trzech zmniejsza straty oddziału o 1.
Jedna rekrutacja lub rozwiązanie zajmuje turę. Najemnicy nie zajmują domów i populacji.
Utrzymanie ceil(liczba/2) żywności i ceil(liczba/4) monet po cywilach; przy niepełnej racji lub żołdzie odchodzi jedna
jednostka w kolejności włócznik/łucznik/tarczownik.

Obie strony walczą według tych samych zasad. Szyk daje +2/włócznik oraz +1/tarczownik,
ostrzał +2/łucznik, szturm floor(50% siły bazowej). Remis wygrywa obrońca, wieża
pomaga tylko własnej obronie osady. Garnizon wroga ma dodatkowo +4/+6/+8 siły zależnie od rangi gracza; premia nie towarzyszy najazdowi. Zwycięzca traci ceil(liczebność / 3 × min(1, siła przeciwnika / własna siła)); przy trzykrotnej przewadze podstawowe straty wynoszą 0. Przegrany traci ceil(60%). Skalowanie strat zwycięzcy zapobiega osłabianiu dużego garnizonu przez powtarzane wyprawy pojedynczego taniego żołnierza.
Najpierw odliczamy floor(tarczownicy/3) od strat (minimum 0), potem dodajemy 1 za szturm,
do liczebności oddziału. Straty obu stron są rzeczywiste, w kolejności typów powyżej.
Taktyka „none” służy wyłącznie staremu najazdowi w migracji i daje zerowy bonus.

Przechwycenie to jednorazowa wyprawa przeciw nadchodzącemu oddziałowi, bez wieży.
Zwycięstwo odwołuje najazd; porażka zachowuje jego datę i osłabia partię, bez szkód cywilnych.
Dostępne do przedostatniej tury ostrzeżenia: w ostatniej wróg jest już pod osadą.
To zapobiega drugiej bitwie w tej samej turze. Zwykła wyprawa na garnizon jest dostępna
bez najazdu, co 2 tury: jeśli pierwsza zakończyła się w turze T, kolejna może zakończyć
się w T+2. Wyprawa grabi dostępne zasoby, uszkadza zamek i nie przyznaje automatycznego rozejmu.

Przewaga 0–2: wygrana obrona/przechwycenie/wyprawa +1; porażka -1.
Krótki rozejm kosztuje 24 monety, zwraca żywy najazd i nie zeruje przewagi.
Przy przewadze 2 negocjacje za 40 monet/24 żywności zajmują turę i dają 36 tur pokoju,
także odwołując najazd. Bez najazdu można wymusić pokój bitwą przeciw garnizonowi.
Zwycięstwo daje 36 tur pokoju i raz na kampanię 12 kamienia/15 monet; przegrana
zmniejsza przewagę, bez szkód własnej osady i bez dodatkowej ochrony.
Podczas pokoju wojsko wraca i wróg rekrutuje do limitu. Po zakończeniu tury T+36
zaczyna się kolejna kampania (numer +1, przewaga i licznik taktyki 0), a nowy najazd
może być ogłoszony z czteroturowym ostrzeżeniem. Gra nie tworzy przy tym nowych żołnierzy.

Przegrany najazd odbiera cywila, grabi do 10 drewna/6 kamienia/8 żywności/6 monet
i wyłącza pierwszy działający budynek gospodarczy w porządku y,x. Ratusz, domy i wojsko
są chronione. Uszkodzenie wyłącza produkcję, premie, prośby i nowe awanse.
Naprawa zachowuje poziom, kosztuje ceil(połowa podstawowego kosztu) i turę; działa
przed produkcją. Wyburzenie uszkodzonego budynku nie zwraca materiałów.

Kolejność: koszt/akcja → bitwa → produkcja → cywile → utrzymanie wojska → niedobór/przyrost
→ awans/prośba → łupy/dary → odbudowa wroga/zmiana kampanii/nowe ostrzeżenie.
Na samym końcu ograniczamy magazyn. Późne dary i łupy nie płacą wstecz za wcześniejsze wyżywienie lub żołd.
Nowy rekrut wroga nie uczestniczy we wcześniejszej bitwie. Nowy własny rekrut lub wieża
walczą już w turze budowy. Śmierć ostatniego cywila blokuje przyrost i kończy grę.

Migracja v5: staremu najazdowi zachowujemy datę i dokładnie 3 włóczników/2 łuczników,
taktykę none i jedną próbę przechwycenia. Garnizon migracji to dawny oddział 4/2
pomniejszony o najazd, więc nie dublujemy żołnierzy. Dawny trwały pokój zastępujemy
36 turami od zapisanej tury, bez zmiany zasobów i zegara. Starsze kopie pozostają.

## Weryfikacja aktualizacji

`castles.test.mjs` obejmuje dodatkowych wrogów, niezależne kampanie, szkody 26/35 pp., odbudowę, skarbce, jednokrotne łupy, trwałe zgliszcza, kolejkę najazdów i migrację v6 → v7. `tests/gry/kingdom-castles.spec.mjs` sprawdza rzeczywisty wybór celu, prognozę i zatwierdzenie, łupy, odbudowę, zniszczenie, klawiaturę, odświeżenie oraz 100 odkrytych zamków na mobile. To obciążenie przygotowanego zapisu, nie deklaracja czasu osiągnięcia go przez gracza.

`balance.test.mjs` sprawdza trudniejszy start, ceny, limity premii i magazynów, żołd, dezerterów, obronę garnizonu oraz zgodność wcześniejszych zapisów. `tests/gry/kingdom-balance.spec.mjs` sprawdza te informacje i prognozę nadwyżek w UI na 360/390/1440 px.

`tests/gry/kingdom-balance-simulation.mjs` prowadzi osadę legalnymi akcjami i budynkami z pełnego katalogu, bez dopisywania zasobów. Sprawdza osiągalność wszystkich rang na ziarnach 1/42/183; nie określa czasu rozgrywki człowieka.

Aktualizacja „Wojna na pograniczu” jest pokryta przez `war.test.mjs` i `kingdom-war.spec.mjs`:
kontakty, najazdy, taktyki obu stron, odbudowa, przechwycenia, rozejmy, czasowy pokój, migracja v5 → v6, pamięć
bez możliwości zapisu oraz widoki 360/390/1440 px. Fixture pozostaje wyłącznie w testach.

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
wspólne rozliczenie z awansem, komplet 12 wykonań oraz migracje v1/v2/v3 do bieżącego formatu.
`tests/gry/kingdom-requests.spec.mjs` sprawdza portrety, postęp, prognozę i odbiór,
mapę, odświeżenie, odłożenie, restart, pamięć i historię na mobile/desktop.

# Klocki — jeszcze jeden ruch

Samodzielna gra logiczna wewnątrz aplikacji Gry. Bez nowych zależności, backendu, globalnego store ani połączenia z silnikami Warcabów i Kryształów.

## Uruchomienie

- `npm run dev` → `/gry/klocki`.
- `npm run build:site -- gry` → prerenderowany `dist/klocki.html` i lazy-loaded strona gry.
- Po wdrożeniu istniejącego Workera: `https://gry.zgrana.pl/klocki`.
- Cloudflare bez zmian: build `npm run build:site -- gry`, deploy `npx wrangler deploy --name josefine-gry`.

Wpis w manifeście Gry tworzy kafelek i trasę. Konfiguracja SEO dostarcza osobny title, description, canonical, PNG OG i wpis sitemapy. Strona dokłada JSON-LD VideoGame. Korzystamy ze wspólnego layoutu, PWA, analityki, komunikatu cookies i komponentu dialogu. Katalog Gry nie ładuje silnika Klocków przed wejściem na podstronę.

## Zasady

- Plansza 8×8, trzy losowane kształty spośród 19 wariantów. Bez obracania i cofania.
- Kształty można wykorzystać w dowolnej kolejności. Nowe trzy pojawiają się dopiero po zużyciu całej paczki.
- Zajęcie pola daje 1 punkt. Pełne wiersze i kolumny usuwamy jednocześnie; skrzyżowanie to dwie linie, ale każde pole znika tylko raz. Pozostałe klocki nie opadają.
- Bonus: `10 × liczba linii² × seria`. Seria rośnie przy kolejnych ruchach z kasowaniem; ruch bez linii zeruje serię.
- Po skasowaniu linii i ewentualnym rozdaniu sprawdzamy wszystkie pozostałe kształty na całej planszy. Brak choć jednego legalnego ruchu kończy rundę. Nie ma zegara ani wymuszonej długości sesji.
- Losowanie nie gwarantuje rozwiązania każdej paczki. Rekord jest lokalny, bez rankingu online.

## Architektura

- `engine.ts`: katalog kształtów, czyste funkcje legalności, wykrywania linii, punktacji i końca gry. `place` zwraca nowy stan oraz zdarzenie ruchu; nie mutuje wejścia.
- `storage.ts`: wersjonowany odczyt i zapis. Walidacja planszy, identyfikatorów kształtów i liczników; stan porażki jest wyliczany, a nie bezwarunkowo odczytywany z zapisu.
- `useBlocks.ts`: sterowanie, migawki stanu Vue, fokus, komunikaty, zapis i krótki efekt usuwania. Bez pętli RAF; aktualizacje tylko przy działaniach użytkownika.
- `BlocksGame.vue`, `BlockShape.vue`: plansza HTML, kształty SVG, podgląd, menu, instrukcja i responsywny układ.
- `audio.ts`: opcjonalne krótkie dźwięki Web Audio, domyślnie wyłączone; błędy nie przerywają ruchów.

Przeciąganie obsługuje jeden pointerId z przechwytywaniem. Podgląd dotykowy jest uniesiony o 68 px ponad palec; legalny cel na planszy jest podświetlany. Drugi palec nie przejmuje kształtu. Wyjście poza legalne pole, anulowanie dotyku, utrata fokusu i opuszczenie strony nie układają klocka. Kliknięcie po zakończonym przeciąganiu nie wykonuje drugiej akcji.

Alternatywa: wybierz kształt, a następnie pole odpowiadające lewemu górnemu narożnikowi podglądu. Klawiatura: Enter na kształcie, strzałki na planszy, Enter/spacja do zatwierdzenia, Escape do anulowania wyboru. Pola mają etykiety A1–H8. Zmiany wyniku ogłaszamy po ruchu, nie w pętli animacji. Ustawienie reduced-motion wyłącza animację znikania.

## Zapis

Klucz `zgrana:gry:klocki:v1` zawiera `{ version: 1, round, best, sound }`. Plansza, niewykorzystane kształty, wynik, liczba linii/ruchów i seria zapisują się natychmiast po zatwierdzonym ruchu, przed końcem efektu wizualnego. Nie zapisujemy podglądu przeciągania ani bieżącego zaznaczenia.

Powrót odtwarza grę automatycznie; nowa runda wymaga potwierdzenia, jeśli zastępuje rozpoczętą, niezakończoną rozgrywkę. Nie obniża rekordu. Uszkodzony/nieznany zapis oznacza nową grę; zablokowana pamięć daje komunikat i grę tylko na czas tej sesji. Nie ma synchronizacji między urządzeniami. Jednoczesne karty dzielą zapis i ostatni zatwierdzony ruch nadpisuje rundę; przy zapisie zachowujemy większy znaleziony rekord.

## Weryfikacja

```sh
npm run test:gry
npm run type-check
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
```

Można użyć systemowego Chrome: PowerShell `$env:PLAYWRIGHT_CHANNEL='chrome'`.

11 testów silnika/zapisu obejmuje legalność, niezmienność wejścia, przecinające się linie, serie, uzupełnianie paczki, porażkę, walidację i 10 pełnych symulowanych rund z serializacją po każdym ruchu. Testy przeglądarkowe sprawdzają układy 360×640, 390×844, 430×932, 800×1024 i 1440×1000, mysz, dotyk z drugim palcem, anulowanie przeciągania, klawiaturę, odtworzenie rundy, restart i blokadę localStorage. Sprawdzamy również produkcyjny HTML i hydratację.

Weryfikacja dotyku to emulacja w Chrome, nie test fizycznego telefonu. Safari i Firefox nie zostały zweryfikowane. Kodowa ilustracja SVG znajduje się w `public/games/blocks-cover.svg`; PNG OG odtwarza `node scripts/generate-blocks-art.mjs`. Nie ma instalowania pakietów ani zmian infrastruktury wymaganych wyłącznie przez tę grę.

# Nocny ekspres

Niekończąca się gra logistyczna: stacje, tory, ręczne rozjazdy i stała flota. Lokalnie
`/gry/nocny-ekspres`, w module Gry `/nocny-ekspres`. Bez backendu i nowych zależności.

## Podział odpowiedzialności

- `model.ts`, `config.ts`: serializowalny stan oraz jedno miejsce strojenia balansu.
- `world.ts`: ziarno, generator losowy i deterministyczna rozbudowa sąsiednich dzielnic.
- `network.ts`, `geometry.ts`: graf, składowe połączone, przebieg rozjazdów i geometria.
  Cache topologii jest poza zapisem, unieważniany przez rewizję sieci.
- `commands.ts`: publiczne `validate` i `execute`. Podgląd i zatwierdzenie używają tej
  samej walidacji; odrzucone polecenie nie modyfikuje stanu. Podział toru zachowuje
  łączną wartość zwrotu, żeby nie produkować darmowych materiałów.
- `engine.ts`: krok symulacji, przewozy, kolejki, rozwój, punktacja i kolizje.
  Silnik nie zna Vue, Canvas, zegara ściennego ani localStorage. Kolizje sprawdzają
  cały przebyty odcinek, a połączona grupa uczestników stanowi jedno zdarzenie.
- `clock.ts`: stały krok 1/60 s. Pauza nie nalicza czasu; długa przerwa RAF wymaga wznowienia.
- `renderer.ts`: własna grafika Canvas, DPR do 2, cache maksymalnie 24 dekoracji dzielnic,
  odrzucanie niewidocznych obiektów oraz uproszczony widok przy dużym oddaleniu.
- `input.ts`: przesuwanie, pinch i klawiatura. Anulowanie gestu nie wykonuje polecenia;
  przeciągnięcie połączenia tworzy tylko podgląd.
- `useExpress.ts`: pojedynczy RAF, lekki HUD co 150 ms, kamera, pamięć, pauza przy
  opuszczeniu okna i sprzątanie obserwatorów, wejścia oraz audio.
- `NightExpressGame.vue`: semantyczne przyciski, panele i FAQ. Wybór widocznego punktu
  i obu końców połączenia jest dostępny również bez obsługi wskaźnika.
- `storage.ts`: walidacja wersji, referencji, limitów i struktury całego zapisu.

Nie importujemy zasad innych gier. Manifest, lazy routing, SEO, PWA, dialogi,
analityka i hosting są istniejącymi mechanizmami modułu Gry/platformy.

## Zasady i sterowanie

Początek to zatrzymana sieć Y, trzy stacje, dwa pociągi i 48 jednostek torów.
Wznów ruch, wybierz rozjazd, aby zmienić aktywną parę, albo stację, aby wstrzymać
odjazdy. Zajętego rozjazdu nie można przełączyć. Perony są bezpieczne, lecz sygnał
odjazdu nie zabezpiecza całego odcinka przed innym pociągiem.

Budowa zawsze zatrzymuje czas. Połącz punkty, dodaj węzeł, podziel pusty odcinek
lub usuń pusty tor; każda zmiana wymaga osobnego zatwierdzenia. Długość pojedynczego
odcinka to 72–900 jednostek świata; dalsze trasy prowadź przez dodatkowe węzły.
Puste węzły nic nie kosztują. Tory nie przecinają się poza węzłami.

Dotyk/przeciąganie tła przesuwa mapę, dwa palce i przyciski zmieniają skalę.
Na aktywnej planszy strzałki przesuwają kamerę, Enter wybiera jej środek,
`+`/`−` skalują, Home wraca do zajezdni, P/Escape pauzuje. Listy HTML pozwalają
wybrać stację/rozjazd i połączyć punkty klawiaturą. Minimapę można dotknąć;
osobne przyciski prowadzą do zajezdni i najnowszej dzielnicy.

Każde 120 aktywnych sekund przynosi wybór rozwoju, każde 180 nową dzielnicę
z dwiema stacjami i torami. Nowe stacje mają minutę na podłączenie. Limity floty
to 16 składów i 12 miejsc. Trzecia kolizja kończy zmianę; przepełnienie kolejki
obniża tylko wynik. Pasażerów na peronach obsługujemy FIFO; cel musi należeć do
tej samej składowej grafu, niezależnie od chwilowego ustawienia zwrotnic.

## Zapis

Klucz `zgrana:gry:nocny-ekspres:v1` przechowuje sieć, pociągi i pasażerów,
czas aktywny, RNG, szanse, zasoby, rekord oraz dźwięk i wskazówki. Dostępne
ulepszenia wynikają ze stanu floty, więc oferta nie zmienia się po odświeżeniu.
Zapis następuje po zmianach, rozwoju, kolizjach i pauzie oraz co 5 sekund symulacji.
Odtworzenie trwającej gry zawsze pauzuje ruch. Nie ma czasu offline.

Uszkodzony zapis pozostaje nietknięty, dopóki użytkownik nie potwierdzi nowej gry.
Brak dostępu/limit pamięci daje ostrzeżenie, nie blokuje zabawy. Nie synchronizujemy
aktywnej sieci między kilkoma kartami; do jednej rozgrywki używaj jednej karty.

## Weryfikacja

```sh
npm run test:gry
npm run type-check
npm run test:gry:browser
npm run build:site -- gry
node scripts/check-gry-build.mjs
node tests/gry/production.mjs
```

Nowa gra ma 17 testów silnika i 14 przeglądarkowych: walidację, przewozy,
rozjazdy, grupowanie kolizji, 3 szanse, deterministyczność, 10 minut symulacji,
100 dzielnic, limity floty, zapis, dotyk/pinch/cancel, pauzę, restart i sprzątanie RAF.
Widoki 360×640, 390×844, 800×1024 i 1440×1000 nie przewijają strony poziomo.
Osobny `tests/gry/express-harness.html` wstrzykuje fixture przez Vue injection;
nie trafia do produkcji i nie tworzy publicznego API testowego w grze.

### Pomiar obciążenia

Przy dev serverze na porcie 5175: `node scripts/benchmark-express.mjs`.
Opcjonalnie `GRY_BASE_URL`; w PowerShell systemowy Chrome wybiera
`$env:PLAYWRIGHT_CHANNEL='chrome'`. Wynik trafia do ignorowanego
`test-results/express-performance.json`.

Pomiar 2026-10-13: Windows 11 (10.0.26200), Intel i5-11400H, 12 wątków,
31,8 GiB RAM, Chrome 153.0.8010.48. 100 dzielnic, 201 stacji, 16 jadących składów,
kolejki początkowo pełne (24 osoby), 30 klatek rozgrzewki i 180 próbek.

| Widok                     | Symulacja średnio / p95 | Rysowanie średnio / p95 |
| ------------------------- | ----------------------- | ----------------------- |
| 900×560, DPR 1, zoom 0,6  | 0,062 / 0,2 ms          | 0,518 / 0,8 ms          |
| 900×560, DPR 1, zoom 0,18 | 0,064 / 0,2 ms          | 1,260 / 1,9 ms          |
| 336×435, DPR 2, zoom 0,6  | 0,077 / 0,2 ms          | 0,391 / 0,6 ms          |

To czas CPU kroku i zgłaszania poleceń Canvas, bez zakończenia pracy GPU/kompozycji.
Emulacja mobilnego viewportu nie jest pomiarem fizycznego telefonu. Pociągi w tym
pomiarze kursują po 16 niezależnych trasach, aby kolizja nie zatrzymała próbek.
Nie testowano fizycznego telefonu ani Safari/Firefox.

## Grafika i publikacja

Oryginalna ilustracja: `public/games/night-express-cover.svg`. Generator
`node scripts/generate-express-art.mjs` odtwarza `public/og/night-express.png`
(1200×630). Strona ma własny prerenderowany opis/FAQ, canonical i `VideoGame`;
sitemapę generuje wspólna konfiguracja SEO.

Cloudflare bez zmian: `npm run build:site -- gry` oraz
`npx wrangler deploy --name josefine-gry`. Nie tworzymy nowej domeny ani Workera.

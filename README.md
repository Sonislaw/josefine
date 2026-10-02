# Josefine

Platforma Vue 3 z niezależnymi modułami. Lokalnie `npm run dev` udostępnia moduły pod prefiksami (`/karawaning`, `/praca`, `/pieniadze`, `/czas`, `/jednostki`, `/dom`, `/motoryzacja`). Produkcyjny build pojedynczej aplikacji używa czystych adresów na jej subdomenie.

## Uruchomienie

```sh
npm install
npm run dev
```

Przykład: `http://localhost:5173/motoryzacja/spalanie-paliwa`.

## Build i Cloudflare Workers

Każda subdomena ma własny build statycznego HTML, sitemapę i manifest PWA. Dla Motoryzacji:

```sh
npm run build:site -- motoryzacja
npx wrangler deploy --name josefine-motoryzacja
```

W projekcie Cloudflare Workers ustaw te same polecenia jako Build command i Deploy command oraz przypisz domenę `motoryzacja.zgrana.pl`. Nie współdziel katalogu `dist` między równolegle uruchomionymi buildami w jednym katalogu roboczym — każdy projekt Cloudflare buduje własną kopię repozytorium.

## Dodawanie modułu

1. Dodaj `src/apps/<id>/` z `manifest.ts`, `routes.ts`, layoutem, stronami, `seo/site-config.json`, `seo/use...Seo.ts` i `pwa/manifest.json`.
2. Zarejestruj moduł w `src/apps/registry.ts` i jego domenę w `src/config/domains.ts`.
3. Dodaj `.env.<id>` z `VITE_DEPLOYMENT_HOST`, `VITE_PUBLIC_SITE_URL` i `VITE_SEO_MODULE`.
4. Dodaj kartę do `src/views/HomeView.vue`, ikonę PWA do `public/pwa/` i obraz społecznościowy do `public/og/`.
5. Każdej trasie przeznaczonej do indeksowania dodaj wpis w `seo/site-config.json`; build wygeneruje jej HTML i doda ją do sitemapy.

Wspólna polityka prywatności znajduje się w `src/shared/components/PrivacyPolicyContent.vue`. Google Analytics jest podłączone raz w `src/App.vue` i działa także w nowych modułach.

## Udostępnianie wyników kalkulatorów

Każdy kalkulator deklaruje pola wejściowe w `useShareableCalculator` z `src/shared/composables`. Funkcja odczytuje poprawne parametry URL po uruchomieniu strony i buduje link z aktualnymi danymi formularza. Wynik jest obliczany ponownie przez kalkulator, więc nie trzeba zapisywać go w adresie. `ShareResultButton` z `src/shared/components` kopiuje link i wyświetla potwierdzenie; przycisk należy umieścić przy wyniku i zablokować, gdy formularz nie ma poprawnego wyniku.

```ts
const amount = ref<number | string>('')
const { buildShareUrl, canShareInputs } = useShareableCalculator([
  numberShareField('kwota', amount, { min: 0 }),
])
```

```vue
<ShareResultButton :get-url="buildShareUrl" :disabled="result === null || !canShareInputs" />
```

Dostępne typy pól: `numberShareField`, `textShareField`, `choiceShareField` i `booleanShareField`. Dodając kalkulator, deklaruj tylko jego własne pola; warstwa wspólna zachowuje zarówno lokalny prefiks modułu, jak i czystą ścieżkę na subdomenie. Nieznane lub niepoprawne parametry URL są ignorowane. Adres kanoniczny SEO pozostaje bez parametrów.

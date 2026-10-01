# Josefine

Platforma Vue 3 z niezależnymi modułami. Lokalnie `npm run dev` udostępnia moduły pod prefiksami (`/karawaning`, `/praca`, `/pieniadze`, `/czas`, `/jednostki`, `/dom`). Produkcyjny build pojedynczej aplikacji używa czystych adresów na jej subdomenie.

## Uruchomienie

```sh
npm install
npm run dev
```

Przykład: `http://localhost:5173/dom/powierzchnia-prostokata`.

## Build i Cloudflare Workers

Każda subdomena ma własny build statycznego HTML, sitemapę i manifest PWA. Dla Dom:

```sh
npm run build:site -- dom
npx wrangler deploy --name josefine-dom
```

W projekcie Cloudflare Workers ustaw te same polecenia jako Build command i Deploy command oraz przypisz domenę `dom.zgrana.pl`. Nie współdziel katalogu `dist` między równolegle uruchomionymi buildami w jednym katalogu roboczym — każdy projekt Cloudflare buduje własną kopię repozytorium.

## Dodawanie modułu

1. Dodaj `src/apps/<id>/` z `manifest.ts`, `routes.ts`, layoutem, stronami, `seo/site-config.json`, `seo/use...Seo.ts` i `pwa/manifest.json`.
2. Zarejestruj moduł w `src/apps/registry.ts` i jego domenę w `src/config/domains.ts`.
3. Dodaj `.env.<id>` z `VITE_DEPLOYMENT_HOST`, `VITE_PUBLIC_SITE_URL` i `VITE_SEO_MODULE`.
4. Dodaj kartę do `src/views/HomeView.vue`, ikonę PWA do `public/pwa/` i obraz społecznościowy do `public/og/`.
5. Każdej trasie przeznaczonej do indeksowania dodaj wpis w `seo/site-config.json`; build wygeneruje jej HTML i doda ją do sitemapy.

Wspólna polityka prywatności znajduje się w `src/shared/components/PrivacyPolicyContent.vue`. Google Analytics jest podłączone raz w `src/App.vue` i działa także w nowych modułach.

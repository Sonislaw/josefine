import { useHead } from '@unhead/vue'

// One project-wide property: every independently deployed Josefine module uses this identifier.
export const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-C3FLEN9P6J'

/** Renders the Google tag into SSR/SSG HTML and keeps a single source of truth for future modules. */
export function useGoogleAnalytics(): void {
  useHead({
    script: [
      {
        key: 'google-tag-loader',
        async: true,
        src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`,
      },
      {
        key: 'google-tag-config',
        innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_MEASUREMENT_ID}');`,
      },
    ],
  })
}

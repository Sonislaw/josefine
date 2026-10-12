import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

export const gryPath = (path: string) => getModulePath('gry', path)
export const grySiteUrl =
  import.meta.env.VITE_PUBLIC_SITE_URL ??
  (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export function useGrySeo(key: string, structuredData?: Record<string, unknown>) {
  const page = siteConfig.pages.find((page) => page.key === key)
  if (!page) throw new Error(`Missing Gry SEO page: ${key}`)
  useSeoManager(
    {
      title: page.title,
      description: page.description,
      siteName: siteConfig.siteName,
      canonicalUrl: new URL(gryPath(page.path), grySiteUrl).href,
      imageUrl: new URL(page.socialImage, grySiteUrl).href,
      imageAlt: page.socialImageAlt,
    },
    structuredData,
  )
}

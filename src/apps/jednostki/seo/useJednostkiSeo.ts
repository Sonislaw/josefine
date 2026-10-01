import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

export type JednostkiSeoKey = (typeof siteConfig.pages)[number]['key']
export const jednostkiSiteName = siteConfig.siteName
export const jednostkiSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const jednostkiPath = (path: string) => getModulePath('jednostki', path)

export function useJednostkiSeo(key: JednostkiSeoKey, structuredData?: Record<string, unknown>): void {
  const page = siteConfig.pages.find((item) => item.key === key)
  if (!page) throw new Error(`Missing Jednostki SEO page: ${key}`)
  useSeoManager({
    title: page.title,
    description: page.description,
    canonicalUrl: new URL(jednostkiPath(page.path), jednostkiSiteUrl).href,
    siteName: jednostkiSiteName,
    imageUrl: new URL(page.socialImage, jednostkiSiteUrl).href,
    imageAlt: page.socialImageAlt,
  }, structuredData)
}

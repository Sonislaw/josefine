import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

export type DomSeoKey = (typeof siteConfig.pages)[number]['key']
export const domSiteName = siteConfig.siteName
export const domSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const domPath = (path: string) => getModulePath('dom', path)

export function useDomSeo(key: DomSeoKey, structuredData?: Record<string, unknown>): void {
  const page = siteConfig.pages.find((item) => item.key === key)
  if (!page) throw new Error(`Missing Dom SEO page: ${key}`)
  useSeoManager({
    title: page.title,
    description: page.description,
    canonicalUrl: new URL(domPath(page.path), domSiteUrl).href,
    siteName: domSiteName,
    imageUrl: new URL(page.socialImage, domSiteUrl).href,
    imageAlt: page.socialImageAlt,
  }, structuredData)
}

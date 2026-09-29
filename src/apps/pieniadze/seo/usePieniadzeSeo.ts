import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'
type Page = (typeof siteConfig.pages)[number]
export type PieniadzeSeoKey = Page['key']
export const pieniadzeSiteName = siteConfig.siteName
export const pieniadzeSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const pieniadzePath = (path: string) => getModulePath('pieniadze', path)
export function usePieniadzeSeo(key: PieniadzeSeoKey, structuredData?: Record<string, unknown>) {
  const page = siteConfig.pages.find((item) => item.key === key)
  if (!page) throw new Error(`Missing Pieniądze SEO page: ${key}`)
  useSeoManager({ title: page.title, description: page.description, canonicalUrl: new URL(pieniadzePath(page.path), pieniadzeSiteUrl).href, siteName: pieniadzeSiteName, imageUrl: new URL(page.socialImage, pieniadzeSiteUrl).href, imageAlt: page.socialImageAlt }, structuredData)
}

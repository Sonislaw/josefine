import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

export type CaravaningSeoPageKey = 'home' | 'dmc' | 'consumption' | 'checklist' | 'privacy'
interface SitePageSeo { key: CaravaningSeoPageKey; path: string; title: string; description: string; socialImage: string; socialImageAlt: string }
export type JsonLdValue = string | number | boolean | JsonLdObject | JsonLdValue[]
export interface JsonLdObject { [key: string]: JsonLdValue }

const pages = siteConfig.pages as SitePageSeo[]
// The platform can be deployed to any domain; metadata follows the current origin.
export const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const siteName = siteConfig.siteName

export function useCaravaningSeo(pageKey: CaravaningSeoPageKey, structuredData: JsonLdObject) {
  const page = pages.find(({ key }) => key === pageKey)
  if (!page) throw new Error(`Missing Caravaning SEO configuration for page: ${pageKey}`)
  const canonicalUrl = new URL(getModulePath('caravaning', page.path), siteUrl).href
  const socialImageUrl = new URL(page.socialImage, siteUrl).href
  useSeoManager({
    title: page.title,
    description: page.description,
    canonicalUrl,
    siteName,
    imageUrl: socialImageUrl,
    imageAlt: page.socialImageAlt,
  }, structuredData)
}

import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

type Page = (typeof siteConfig.pages)[number]
export type PracaSeoPageKey = Page['key']
export const pracaSiteName = siteConfig.siteName
export const pracaSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)

export function pracaPath(path: string): string {
  return getModulePath('praca', path)
}

export function usePracaSeo(key: PracaSeoPageKey, structuredData?: Record<string, unknown>): void {
  const page = siteConfig.pages.find((item) => item.key === key)
  if (!page) throw new Error(`Missing Praca SEO configuration for page: ${key}`)
  const canonicalUrl = new URL(pracaPath(page.path), pracaSiteUrl).href
  useSeoManager({ title: page.title, description: page.description, canonicalUrl, siteName: pracaSiteName, imageUrl: new URL(page.socialImage, pracaSiteUrl).href, imageAlt: page.socialImageAlt }, structuredData)
}

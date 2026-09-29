import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'
type Page = (typeof siteConfig.pages)[number]
export type CzasSeoKey = Page['key']
export const czasSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const czasPath = (path: string) => getModulePath('czas', path)
export function useCzasSeo(key: CzasSeoKey, data?: Record<string, unknown>) { const page = siteConfig.pages.find((item) => item.key === key); if (!page) throw new Error(`Missing Czas SEO: ${key}`); useSeoManager({ title: page.title, description: page.description, canonicalUrl: new URL(czasPath(page.path), czasSiteUrl).href, siteName: siteConfig.siteName, imageUrl: new URL(page.socialImage, czasSiteUrl).href, imageAlt: page.socialImageAlt }, data) }

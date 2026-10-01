import siteConfig from './site-config.json'
import { getModulePath } from '@/config/domains'
import { useSeoManager } from '@/shared/seo/SeoManager'

export type MotoryzacjaSeoKey = (typeof siteConfig.pages)[number]['key']
export const motoryzacjaSiteName = siteConfig.siteName
export const motoryzacjaSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? (typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
export const motoryzacjaPath = (path: string) => getModulePath('motoryzacja', path)

export function useMotoryzacjaSeo(key: MotoryzacjaSeoKey, structuredData?: Record<string, unknown>): void {
  const page = siteConfig.pages.find((item) => item.key === key)
  if (!page) throw new Error(`Missing Motoryzacja SEO page: ${key}`)
  useSeoManager({
    title: page.title,
    description: page.description,
    canonicalUrl: new URL(motoryzacjaPath(page.path), motoryzacjaSiteUrl).href,
    siteName: motoryzacjaSiteName,
    imageUrl: new URL(page.socialImage, motoryzacjaSiteUrl).href,
    imageAlt: page.socialImageAlt,
  }, structuredData)
}

import { useHead, useSeoMeta } from '@unhead/vue'

export interface SeoPageMeta {
  title: string
  description: string
  canonicalUrl: string
  siteName: string
  imageUrl?: string
  imageAlt?: string
  robots?: string
}

/**
 * Shared, host-agnostic SEO writer. Modules provide their own content and canonical route,
 * while this layer consistently renders standard social and robots metadata.
 */
export function useSeoManager(meta: SeoPageMeta, structuredData?: Record<string, unknown>): void {
  const robots = meta.robots ?? 'index,follow,max-image-preview:large'

  useSeoMeta({
    title: meta.title,
    description: meta.description,
    robots,
    ogTitle: meta.title,
    ogDescription: meta.description,
    ogType: 'website',
    ogUrl: meta.canonicalUrl,
    ogSiteName: meta.siteName,
    ogLocale: 'pl_PL',
    ogImage: meta.imageUrl,
    ogImageAlt: meta.imageAlt,
    ogImageWidth: meta.imageUrl ? '1200' : undefined,
    ogImageHeight: meta.imageUrl ? '630' : undefined,
    twitterCard: meta.imageUrl ? 'summary_large_image' : 'summary',
    twitterTitle: meta.title,
    twitterDescription: meta.description,
    twitterImage: meta.imageUrl,
    twitterImageAlt: meta.imageAlt,
  })

  useHead({
    link: [{ rel: 'canonical', href: meta.canonicalUrl }],
    script: structuredData
      ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData).replace(/</g, '\\u003c') }]
      : [],
  })
}

import type { ModuleId } from '@/apps/registry'
import iconConfig from './site-icons.json'

interface SiteIcons {
  favicon: string
  type: string
  appleTouchIcon: string
}

// Keep every registered module explicit; a new module without icons fails type-checking.
export const siteIcons: Record<ModuleId | 'platform', SiteIcons> = iconConfig

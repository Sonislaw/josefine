import type { ModuleId } from '@/apps/registry'

/** Exact production hostname → module mapping. Keep this as the single domain registry. */
export const domains = {
  'karawaning.zgrana.pl': 'caravaning',
} as const satisfies Record<string, ModuleId>

export function getModuleForHostname(hostname: string): ModuleId | null {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '')
  return domains[normalizedHostname as keyof typeof domains] ?? null
}

/** Produces clean subdomain URLs and prefixed URLs on the platform host/local development. */
export function getModulePath(moduleId: ModuleId, path: string, hostname = window.location.hostname): string {
  if (getModuleForHostname(hostname) === moduleId) return path
  return `/${moduleId}${path === '/' ? '' : path}`
}

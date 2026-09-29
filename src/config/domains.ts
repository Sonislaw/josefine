import type { ModuleId } from '@/apps/registry'

/** Exact production hostname → module mapping. Keep this as the single domain registry. */
export const domains = {
  'karawaning.zgrana.pl': 'caravaning',
  'praca.zgrana.pl': 'praca',
} as const satisfies Record<string, ModuleId>

export function getModuleForHostname(hostname: string): ModuleId | null {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '')
  return domains[normalizedHostname as keyof typeof domains] ?? null
}

/** Works in the browser and during an SSG build targeted at a specific subdomain. */
export function getRuntimeHostname(): string {
  const deploymentHost = import.meta.env.VITE_DEPLOYMENT_HOST
  if (deploymentHost) return deploymentHost
  return typeof window === 'undefined' ? '' : window.location.hostname
}

/** Produces clean subdomain URLs and prefixed URLs on the platform host/local development. */
export function getModulePath(moduleId: ModuleId, path: string, hostname = getRuntimeHostname()): string {
  if (getModuleForHostname(hostname) === moduleId) return path
  return `/${moduleId}${path === '/' ? '' : path}`
}

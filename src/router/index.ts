import type { RouteRecordRaw } from 'vue-router'

import { moduleRegistry } from '@/apps/registry'
import type { ModuleId } from '@/apps/registry'
import type { RouteMode } from '@/apps/types'
import { getModuleForHostname, getRuntimeHostname } from '@/config/domains'
import AppLayout from '@/layouts/AppLayout.vue'

const activeModuleId = getModuleForHostname(getRuntimeHostname())

// Attach the module identity once at its route root. Shared UI can then discover
// the current module without duplicating a hostname/path table for every app.
function createModuleRoutes(moduleId: ModuleId, mode: RouteMode): RouteRecordRaw[] {
  return moduleRegistry[moduleId].createRoutes(mode).map((route) => ({
    ...route,
    meta: { ...route.meta, moduleId },
  }))
}

// A subdomain registers only its module's clean routes. Localhost remains the platform router.
const platformRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [{ path: '', name: 'home', component: () => import('@/views/HomeView.vue') }],
  },
  ...(Object.keys(moduleRegistry) as ModuleId[]).flatMap((moduleId) =>
    createModuleRoutes(moduleId, 'platform'),
  ),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

export const routes = activeModuleId
  ? createModuleRoutes(activeModuleId, 'subdomain')
  : platformRoutes

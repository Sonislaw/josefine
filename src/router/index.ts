import type { RouteRecordRaw } from 'vue-router'

import { moduleRegistry } from '@/apps/registry'
import { getModuleForHostname, getRuntimeHostname } from '@/config/domains'
import AppLayout from '@/layouts/AppLayout.vue'

const activeModuleId = getModuleForHostname(getRuntimeHostname())

// A subdomain registers only its module's clean routes. Localhost remains the platform router.
const platformRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
    ],
  },
  ...Object.values(moduleRegistry).flatMap((module) => module.createRoutes('platform')),
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

export const routes = activeModuleId
  ? moduleRegistry[activeModuleId].createRoutes('subdomain')
  : platformRoutes

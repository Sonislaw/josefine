import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { moduleRegistry } from '@/apps/registry'
import { getModuleForHostname } from '@/config/domains'
import AppLayout from '@/layouts/AppLayout.vue'

const activeModuleId = getModuleForHostname(window.location.hostname)

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

const routes = activeModuleId
  ? moduleRegistry[activeModuleId].createRoutes('subdomain')
  : platformRoutes

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { caravaningRoutes } from '@/apps/caravaning/routes'
import { pracaRoutes } from '@/apps/praca/routes'
import AppLayout from '@/layouts/AppLayout.vue'

// Feature modules own their child routes. The central router only composes them.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
      ...caravaningRoutes,
      ...pracaRoutes,
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

export default router

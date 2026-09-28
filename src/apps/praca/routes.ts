import type { RouteRecordRaw } from 'vue-router'

// This module can grow without changing the central router.
export const pracaRoutes: RouteRecordRaw[] = [
  { path: 'praca', name: 'praca', component: () => import('./pages/PracaHomePage.vue') },
  { path: 'praca/ile-na-reke-uop', name: 'praca-uop-net', component: () => import('./pages/UopNetCalculatorPage.vue') },
  { path: 'praca/ile-na-reke-b2b', name: 'praca-b2b-net', component: () => import('./pages/B2bNetCalculatorPage.vue') },
  { path: 'praca/b2b-vs-uop', name: 'praca-b2b-vs-uop', component: () => import('./pages/B2bVsUopPage.vue') },
]

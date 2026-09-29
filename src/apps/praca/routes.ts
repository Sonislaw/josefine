import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'

// One route definition supports local platform URLs and clean subdomain URLs.
export function createPracaRoutes(mode: RouteMode): RouteRecordRaw[] {
  const basePath = mode === 'subdomain' ? '/' : '/praca'
  return [{
    path: basePath,
    component: () => import('./PracaLayout.vue'),
    children: [
      { path: '', name: 'praca', component: () => import('./pages/PracaHomePage.vue') },
      { path: 'ile-na-reke-uop', name: 'praca-uop-net', component: () => import('./pages/UopNetCalculatorPage.vue') },
      { path: 'ile-na-reke-b2b', name: 'praca-b2b-net', component: () => import('./pages/B2bNetCalculatorPage.vue') },
      { path: 'b2b-vs-uop', name: 'praca-b2b-vs-uop', component: () => import('./pages/B2bVsUopPage.vue') },
      { path: 'polityka-prywatnosci', name: 'praca-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      { path: ':pathMatch(.*)*', name: 'praca-not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  }]
}

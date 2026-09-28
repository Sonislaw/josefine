import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'

// One definition creates prefixed platform paths and clean paths for the assigned subdomain.
export function createCaravaningRoutes(mode: RouteMode): RouteRecordRaw[] {
  const basePath = mode === 'subdomain' ? '/' : '/karawaning'

  return [{
    path: basePath,
    component: () => import('./CaravaningLayout.vue'),
    children: [
      { path: '', name: 'caravaning', component: () => import('./pages/CaravaningLandingPage.vue') },
      { path: 'kalkulator-dmc', name: 'caravaning-dmc', component: () => import('./pages/DmcToolPage.vue') },
      { path: 'kalkulator-kosztow-podrozy', name: 'caravaning-fuel', component: () => import('./pages/FuelCalculatorPage.vue') },
      { path: 'checklista-przed-wyjazdem', name: 'caravaning-checklist', component: () => import('./pages/DepartureChecklistPage.vue') },
      { path: 'polityka-prywatnosci', name: 'caravaning-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      // Preserve the former Caravaning Tools URL after moving the canonical address.
      { path: 'kalkulator-spalania', redirect: { name: 'caravaning-fuel' } },
      { path: ':pathMatch(.*)*', name: 'caravaning-not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  }]
}

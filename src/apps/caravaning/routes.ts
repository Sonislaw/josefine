import type { RouteRecordRaw } from 'vue-router'

// Every page uses a dynamic import so an unrelated module is never bundled eagerly.
export const caravaningRoutes: RouteRecordRaw[] = [
  { path: 'karawaning', name: 'caravaning', component: () => import('./pages/CaravaningHomePage.vue') },
  { path: 'karawaning/checklista-przed-wyjazdem', name: 'caravaning-checklist', component: () => import('./pages/PreTripChecklistPage.vue') },
  { path: 'karawaning/kalkulator-dmc', name: 'caravaning-dmc', component: () => import('./pages/DmcCalculatorPage.vue') },
  { path: 'karawaning/kalkulator-kosztow-podrozy', name: 'caravaning-trip-costs', component: () => import('./pages/TripCostsCalculatorPage.vue') },
]

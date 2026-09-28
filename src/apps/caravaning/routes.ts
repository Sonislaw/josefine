import type { RouteRecordRaw } from 'vue-router'

// A migrated module may bring its own visual shell. It stays isolated from the platform layout.
export const caravaningRoutes: RouteRecordRaw[] = [
  {
    path: '/karawaning',
    component: () => import('./CaravaningLayout.vue'),
    children: [
      { path: '', name: 'caravaning', component: () => import('./pages/CaravaningLandingPage.vue') },
      { path: 'kalkulator-dmc', name: 'caravaning-dmc', component: () => import('./pages/DmcToolPage.vue') },
      { path: 'kalkulator-spalania', name: 'caravaning-fuel', component: () => import('./pages/FuelCalculatorPage.vue') },
      { path: 'checklista-przed-wyjazdem', name: 'caravaning-checklist', component: () => import('./pages/DepartureChecklistPage.vue') },
      { path: 'polityka-prywatnosci', name: 'caravaning-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      // Compatibility with the previously planned Josefine URL.
      { path: 'kalkulator-kosztow-podrozy', redirect: { name: 'caravaning-fuel' } },
    ],
  },
]

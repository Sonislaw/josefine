import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import { motoryzacjaTools } from './manifest'

/** One route definition supports prefixed development URLs and clean subdomain URLs. */
export function createMotoryzacjaRoutes(mode: RouteMode): RouteRecordRaw[] {
  return [{
    path: mode === 'subdomain' ? '/' : '/motoryzacja',
    component: () => import('./MotoryzacjaLayout.vue'),
    children: [
      { path: '', name: 'motoryzacja', component: () => import('./pages/MotoryzacjaHomePage.vue') },
      ...motoryzacjaTools.map((tool) => ({
        path: tool.id,
        name: `motoryzacja-${tool.id}`,
        component: () => import('./pages/MotoryzacjaToolPage.vue'),
        props: { toolId: tool.id },
      })),
      { path: 'polityka-prywatnosci', name: 'motoryzacja-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      { path: ':pathMatch(.*)*', name: 'motoryzacja-not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  }]
}

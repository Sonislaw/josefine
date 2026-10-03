import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import { domTools } from './manifest'

/** The same routes serve /dom locally and clean paths on the Dom subdomain. */
export function createDomRoutes(mode: RouteMode): RouteRecordRaw[] {
  return [{
    path: mode === 'subdomain' ? '/' : '/dom',
    component: () => import('./DomLayout.vue'),
    children: [
      { path: '', name: 'dom', component: () => import('./pages/DomHomePage.vue') },
      ...domTools.map((tool) => ({
        path: tool.id,
        name: `dom-${tool.id}`,
        component: () => import('./pages/DomToolPage.vue'),
        props: { toolId: tool.id },
      })),
      { path: 'moj-remont', name: 'dom-shopping-list', component: () => import('./pages/DomShoppingListPage.vue') },
      { path: 'polityka-prywatnosci', name: 'dom-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      { path: ':pathMatch(.*)*', name: 'dom-not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  }]
}

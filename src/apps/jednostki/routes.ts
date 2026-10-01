import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import { jednostkiTools } from './manifest'

/** Domain mode uses clean URLs; the platform keeps the /jednostki prefix. */
export function createJednostkiRoutes(mode: RouteMode): RouteRecordRaw[] {
  return [{
    path: mode === 'subdomain' ? '/' : '/jednostki',
    component: () => import('./JednostkiLayout.vue'),
    children: [
      { path: '', name: 'jednostki', component: () => import('./pages/JednostkiHomePage.vue') },
      ...jednostkiTools.map((tool) => ({
        path: tool.id,
        name: `jednostki-${tool.id}`,
        component: () => import('./pages/JednostkiToolPage.vue'),
        props: { toolId: tool.id },
      })),
      { path: 'polityka-prywatnosci', name: 'jednostki-privacy', component: () => import('./pages/PrivacyPolicyPage.vue') },
      { path: ':pathMatch(.*)*', name: 'jednostki-not-found', component: () => import('@/views/NotFoundView.vue') },
    ],
  }]
}

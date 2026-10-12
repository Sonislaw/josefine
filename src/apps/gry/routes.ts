import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import { games } from './manifest'

export function createGryRoutes(mode: RouteMode): RouteRecordRaw[] {
  return [
    {
      path: mode === 'subdomain' ? '/' : '/gry',
      component: () => import('./GryLayout.vue'),
      children: [
        { path: '', name: 'gry', component: () => import('./pages/GryHomePage.vue') },
        ...games.map((game) => ({
          path: game.id,
          name: `gry-${game.id}`,
          component: game.loadPage,
        })),
        {
          path: 'polityka-prywatnosci',
          name: 'gry-privacy',
          component: () => import('./pages/PrivacyPolicyPage.vue'),
        },
        {
          path: ':pathMatch(.*)*',
          name: 'gry-not-found',
          component: () => import('@/views/NotFoundView.vue'),
        },
      ],
    },
  ]
}

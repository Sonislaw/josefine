import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import type { PieniadzeToolId } from './manifest'

const tools: PieniadzeToolId[] = ['brutto-netto', 'netto-brutto', 'procent-z-liczby', 'zmiana-procentowa', 'rabat', 'podwyzka', 'marza', 'narzut', 'cena-jednostkowa', 'podzial-rachunku', 'napiwek']
export function createPieniadzeRoutes(mode: RouteMode): RouteRecordRaw[] {
  const basePath = mode === 'subdomain' ? '/' : '/pieniadze'
  return [{ path: basePath, component: () => import('./PieniadzeLayout.vue'), children: [
    { path: '', name: 'pieniadze', component: () => import('./pages/PieniadzeHomePage.vue') },
    ...tools.map((id) => ({ path: id, name: `pieniadze-${id}`, component: () => import('./pages/PieniadzeToolPage.vue'), props: { toolId: id } })),
    { path: ':pathMatch(.*)*', name: 'pieniadze-not-found', component: () => import('@/views/NotFoundView.vue') },
  ] }]
}

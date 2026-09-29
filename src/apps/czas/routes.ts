import type { RouteRecordRaw } from 'vue-router'
import type { RouteMode } from '../types'
import type { CzasToolId } from './manifest'
const tools: CzasToolId[] = ['roznica-miedzy-datami', 'data-za-liczbe-dni', 'wiek', 'czas-pracy', 'godziny-na-minuty', 'minuty-na-godziny', 'odliczanie-do-daty']
export function createCzasRoutes(mode: RouteMode): RouteRecordRaw[] { const base = mode === 'subdomain' ? '/' : '/czas'; return [{ path: base, component: () => import('./CzasLayout.vue'), children: [{ path: '', name: 'czas', component: () => import('./pages/CzasHomePage.vue') }, ...tools.map((id) => ({ path: id, name: `czas-${id}`, component: () => import('./pages/CzasToolPage.vue'), props: { toolId: id } })), { path: ':pathMatch(.*)*', name: 'czas-not-found', component: () => import('@/views/NotFoundView.vue') }] }] }

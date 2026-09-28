import type { RouteRecordRaw } from 'vue-router'

export type RouteMode = 'platform' | 'subdomain'

/** A module owns both URL variants; the router decides which one to register. */
export interface JosefineModule {
  id: string
  createRoutes: (mode: RouteMode) => RouteRecordRaw[]
}

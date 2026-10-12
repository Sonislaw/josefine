import type { Component } from 'vue'

export interface GameDefinition {
  id: string
  title: string
  description: string
  category: string
  players: string
  symbol: string
  cover: string
  loadPage: () => Promise<{ default: Component }>
}

/** Metadata stays light. A game's UI, rules and AI are loaded only on its route.
 * Future games own a folder under games/; never import their engines into this catalog. */
export const games = [
  {
    id: 'warcaby-arena-mocy',
    title: 'Warcaby — Arena Mocy',
    description:
      'Znana plansza, zupełnie nowe możliwości. Cztery jednorazowe moce i jedna dobra strategia. Albo pojedynek w klasycznym stylu.',
    category: 'Strategia',
    players: '1–2 graczy',
    symbol: '✧',
    cover: '/games/warcaby-cover.svg',
    loadPage: () => import('./pages/WarcabyPage.vue'),
  },
] satisfies GameDefinition[]

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
    id: 'male-krolestwo',
    title: 'Małe królestwo',
    description:
      'Pierwsza chata to dopiero początek. Buduj osadę, przygotuj zapasy na zimę i odkrywaj ziemie za horyzontem. Spokojna strategia, do której wracasz we własnym tempie.',
    category: 'Strategia',
    players: '1 gracz',
    symbol: '♜',
    cover: '/games/little-kingdom-cover.svg',
    loadPage: () => import('./pages/KingdomPage.vue'),
  },
  {
    id: 'klocki',
    title: 'Klocki — jeszcze jeden ruch',
    description:
      'Bez pośpiechu, za to z satysfakcją. Układaj kształty, kasuj linie i zrób miejsce na jeszcze jeden dobry ruch. Twoja plansza poczeka, kiedy potrzebujesz przerwy.',
    category: 'Logiczna',
    players: '1 gracz',
    symbol: '▦',
    cover: '/games/blocks-cover.svg',
    loadPage: () => import('./pages/BlocksPage.vue'),
  },
  {
    id: 'jeszcze-jeden-krysztal',
    title: 'Jeszcze jeden kryształ',
    description:
      'Mały statek, wielki apetyt na rekord. Zbieraj kryształy, przebijaj się zrywem przez meteory i ulepszaj statek. Napływ zagrożeń nigdy nie ustaje.',
    category: 'Zręcznościowa',
    players: '1 gracz',
    symbol: '◈',
    cover: '/games/crystal-rush-cover.svg',
    loadPage: () => import('./pages/CrystalRushPage.vue'),
  },
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

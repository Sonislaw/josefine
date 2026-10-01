/** Shared metadata for the dashboard, route table and individual tool pages. */
export const motoryzacjaTools = [
  { id: 'spalanie-paliwa', title: 'Spalanie paliwa', description: 'Oblicza średnie spalanie w litrach na 100 km.', category: 'Paliwo', symbol: 'l/100 km', accent: 'lime' },
  { id: 'koszt-przejazdu', title: 'Koszt przejazdu', description: 'Oblicza koszt paliwa na podanej trasie.', category: 'Koszty', symbol: 'zł/km', accent: 'peach' },
  { id: 'zasieg-na-paliwie', title: 'Zasięg na paliwie', description: 'Szacuje dystans możliwy do przejechania na dostępnej ilości paliwa.', category: 'Paliwo', symbol: 'km', accent: 'blue' },
  { id: 'predkosc-srednia', title: 'Prędkość średnia', description: 'Oblicza średnią prędkość z dystansu i czasu jazdy.', category: 'Podróż', symbol: 'km/h', accent: 'sand' },
  { id: 'czas-podrozy', title: 'Czas podróży', description: 'Oblicza czas przejazdu z dystansu i średniej prędkości.', category: 'Podróż', symbol: 'h:min', accent: 'lilac' },
] as const

export type MotoryzacjaToolId = (typeof motoryzacjaTools)[number]['id']

export const motoryzacjaModule = {
  name: 'Motoryzacja',
  description: 'Kalkulatory spalania, kosztów paliwa, zasięgu, prędkości i czasu podróży.',
  tools: motoryzacjaTools.map((tool) => ({ ...tool, to: `/motoryzacja/${tool.id}` })),
}

import type { Power } from './engine'
export const powerInfo: Record<Power, { name: string; symbol: string; description: string }> = {
  sprint: {
    name: 'Sprint',
    symbol: 'ϟ',
    description: 'Dwa pola po skosie do przodu. Pole po drodze i cel muszą być puste.',
  },
  retreat: {
    name: 'Odskok',
    symbol: '↶',
    description: 'Jedno pole po skosie do tyłu. Czasem warto zrobić krok wstecz.',
  },
  slide: {
    name: 'Unik',
    symbol: '↔',
    description: 'Dwa pola w bok, na puste pole. Zawartość pola pomiędzy nie ma znaczenia.',
  },
  vault: {
    name: 'Przeskok',
    symbol: '⌁',
    description: 'Przeskocz własny pionek po skosie w dowolną stronę. Niczego nie zbijasz.',
  },
}

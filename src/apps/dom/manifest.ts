/** Shared metadata for cards, route registration and page headings. */
export const domTools = [
  {
    id: 'powierzchnia-prostokata',
    title: 'Powierzchnia prostokąta',
    description:
      'Oblicza powierzchnię z długości i szerokości albo z kilku dodawanych i odejmowanych fragmentów.',
    category: 'Wymiary',
    symbol: 'm²',
    accent: 'sage',
  },
  {
    id: 'obwod-prostokata',
    title: 'Obwód prostokąta',
    description: 'Oblicza łączną długość czterech boków.',
    category: 'Wymiary',
    symbol: '4 ×',
    accent: 'sand',
  },
  {
    id: 'objetosc-pomieszczenia',
    title: 'Objętość pomieszczenia',
    description: 'Oblicza objętość z długości, szerokości i wysokości.',
    category: 'Wymiary',
    symbol: 'm³',
    accent: 'blue',
  },
  {
    id: 'koszt-pradu',
    title: 'Koszt prądu',
    description: 'Oblicza koszt pracy urządzenia z jego mocy, czasu pracy i ceny energii.',
    category: 'Rachunki',
    symbol: 'kWh',
    accent: 'peach',
  },
  {
    id: 'koszt-wody',
    title: 'Koszt wody',
    description: 'Oblicza koszt zużytej wody z liczby metrów sześciennych i ceny.',
    category: 'Rachunki',
    symbol: 'm³',
    accent: 'blue',
  },
  {
    id: 'ilosc-farby',
    title: 'Ilość farby',
    description:
      'Oblicza ilość farby z metrażu lub wymiarów pokoju, z uwzględnieniem okien i drzwi.',
    category: 'Remont',
    symbol: 'L',
    accent: 'peach',
  },
  {
    id: 'liczba-plytek',
    title: 'Liczba płytek',
    description: 'Oblicza liczbę płytek potrzebnych na daną powierzchnię.',
    category: 'Remont',
    symbol: '▦',
    accent: 'sand',
  },
  {
    id: 'liczba-paczek-paneli',
    title: 'Liczba paczek paneli',
    description: 'Oblicza liczbę paczek z powierzchni i wydajności paczki.',
    category: 'Remont',
    symbol: '▤',
    accent: 'sage',
  },
  {
    id: 'liczba-rolek-tapety',
    title: 'Liczba rolek tapety',
    description: 'Oblicza liczbę pełnych rolek z wymiarów ścian, pasów, raportu wzoru i zapasu.',
    category: 'Remont',
    symbol: '▥',
    accent: 'blue',
  },
] as const

export type DomToolId = (typeof domTools)[number]['id']
export type DomBasicToolId = Exclude<DomToolId, 'liczba-rolek-tapety'>

export const domModule = {
  name: 'Dom',
  description: 'Kalkulatory wymiarów, rachunków i materiałów do domowych projektów.',
  tools: domTools.map((tool) => ({ ...tool, to: `/dom/${tool.id}` })),
}

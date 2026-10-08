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
    description: 'Oblicza kubaturę jednego pokoju lub sumę objętości kilku pomieszczeń.',
    category: 'Wymiary',
    symbol: 'm³',
    accent: 'blue',
  },
  {
    id: 'koszt-pradu',
    title: 'Koszt prądu',
    description: 'Oblicza koszt pracy urządzenia i pozwala porównać koszty dwóch urządzeń.',
    category: 'Rachunki',
    symbol: 'kWh',
    accent: 'peach',
  },
  {
    id: 'koszt-wody',
    title: 'Koszt wody',
    description: 'Oblicza koszt zużycia z jednej stawki lub osobnych cen wody i ścieków.',
    category: 'Rachunki',
    symbol: 'm³',
    accent: 'blue',
  },
  {
    id: 'ilosc-farby',
    title: 'Ilość farby',
    description:
      'Oblicza ilość farby z metrażu lub wymiarów pokoju, także dla ściany w innym kolorze.',
    category: 'Remont',
    symbol: 'L',
    accent: 'peach',
  },
  {
    id: 'plytki-na-podloge',
    title: 'Płytki na podłogę',
    description: 'Oblicza liczbę płytek i kartonów na podłogę oraz pokazuje orientacyjny układ.',
    category: 'Remont',
    symbol: '▦',
    accent: 'sand',
  },
  {
    id: 'plytki-na-sciane',
    title: 'Płytki na ścianę',
    description: 'Oblicza płytki na wybrane ściany z uwzględnieniem wysokości, drzwi i okien.',
    category: 'Remont',
    symbol: '▦',
    accent: 'sand',
  },
  {
    id: 'kalkulator-fugi',
    title: 'Kalkulator fugi',
    description: 'Szacuje zużycie fugi oraz liczbę pełnych opakowań dla wybranych płytek i spoin.',
    category: 'Remont',
    symbol: '▦',
    accent: 'blue',
  },
  {
    id: 'klej-do-plytek',
    title: 'Klej do płytek',
    description: 'Szacuje zużycie kleju oraz liczbę worków osobno na podłogę i ściany.',
    category: 'Remont',
    symbol: 'kg',
    accent: 'sage',
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
    id: 'kalkulator-wylewki',
    title: 'Kalkulator wylewki',
    description: 'Oblicza objętość warstwy, ilość mieszanki, liczbę worków i koszt zakupu.',
    category: 'Remont',
    symbol: 'mm',
    accent: 'sand',
  },
  {
    id: 'liczba-rolek-tapety',
    title: 'Liczba rolek tapety',
    description:
      'Oblicza liczbę pełnych rolek na cały pokój lub jedną ścianę z uwzględnieniem wzoru i zapasu.',
    category: 'Remont',
    symbol: '▥',
    accent: 'blue',
  },
] as const

export type DomToolId = (typeof domTools)[number]['id']
export type DomBasicToolId = Exclude<
  DomToolId,
  | 'liczba-rolek-tapety'
  | 'kalkulator-fugi'
  | 'klej-do-plytek'
  | 'plytki-na-sciane'
  | 'kalkulator-wylewki'
>

export const domModule = {
  name: 'Dom',
  description: 'Kalkulatory wymiarów, rachunków i materiałów do domowych projektów.',
  tools: domTools.map((tool) => ({ ...tool, to: `/dom/${tool.id}` })),
}

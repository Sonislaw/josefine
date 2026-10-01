import type { DomToolId } from '../manifest'

export interface InputField {
  id: string
  label: string
  unit: string
  defaultValue: string
  /** Divisors and dimensions that must be greater than zero. */
  positive?: boolean
  integer?: boolean
  hint?: string
}

export interface ResultRow {
  label: string
  value: number
  unit: string
  kind?: 'money' | 'integer'
}

interface CalculatorDefinition {
  fields: InputField[]
  formula: string
  example: string
  note: string
}

export const domCalculators: Record<DomToolId, CalculatorDefinition> = {
  'powierzchnia-prostokata': {
    fields: [{ id: 'length', label: 'Długość', unit: 'm', defaultValue: '5', positive: true }, { id: 'width', label: 'Szerokość', unit: 'm', defaultValue: '4', positive: true }],
    formula: 'długość × szerokość', example: '5 m × 4 m = 20 m²', note: 'Podaj oba wymiary w metrach. Wynik otrzymasz w metrach kwadratowych.',
  },
  'obwod-prostokata': {
    fields: [{ id: 'length', label: 'Długość', unit: 'm', defaultValue: '5', positive: true }, { id: 'width', label: 'Szerokość', unit: 'm', defaultValue: '4', positive: true }],
    formula: '2 × (długość + szerokość)', example: '2 × (5 m + 4 m) = 18 m', note: 'Obwód to suma długości wszystkich czterech boków.',
  },
  'objetosc-pomieszczenia': {
    fields: [{ id: 'length', label: 'Długość', unit: 'm', defaultValue: '5', positive: true }, { id: 'width', label: 'Szerokość', unit: 'm', defaultValue: '4', positive: true }, { id: 'height', label: 'Wysokość', unit: 'm', defaultValue: '2,5', positive: true }],
    formula: 'długość × szerokość × wysokość', example: '5 m × 4 m × 2,5 m = 50 m³', note: 'Kalkulator zakłada pomieszczenie o kształcie prostopadłościanu.',
  },
  'koszt-pradu': {
    fields: [{ id: 'power', label: 'Moc urządzenia', unit: 'W', defaultValue: '1000', positive: true }, { id: 'hours', label: 'Łączny czas pracy', unit: 'h', defaultValue: '3', positive: true }, { id: 'price', label: 'Cena energii', unit: 'zł/kWh', defaultValue: '1,20', positive: true, hint: 'Wpisz cenę jednostkową z rachunku za energię.' }],
    formula: '(moc w W ÷ 1 000) × czas w h × cena za kWh', example: '1 000 W × 3 h × 1,20 zł/kWh = 3,60 zł', note: 'To szacunek dla podanej mocy i łącznego czasu pracy. Rzeczywiste zużycie urządzenia może się zmieniać.',
  },
  'koszt-wody': {
    fields: [{ id: 'volume', label: 'Zużycie wody', unit: 'm³', defaultValue: '5', positive: true }, { id: 'price', label: 'Cena za 1 m³', unit: 'zł/m³', defaultValue: '12', positive: true, hint: 'Jeśli chcesz uwzględnić ścieki, wpisz łączną cenę za m³.' }],
    formula: 'zużycie w m³ × cena za 1 m³', example: '5 m³ × 12 zł/m³ = 60 zł', note: 'Wynik obejmuje tylko składniki zawarte we wpisanej cenie jednostkowej.',
  },
  'ilosc-farby': {
    fields: [{ id: 'area', label: 'Powierzchnia do malowania', unit: 'm²', defaultValue: '40', positive: true }, { id: 'coats', label: 'Liczba warstw', unit: 'warstwy', defaultValue: '2', positive: true, integer: true }, { id: 'coverage', label: 'Wydajność farby', unit: 'm²/l', defaultValue: '10', positive: true, hint: 'Sprawdź wydajność na opakowaniu wybranej farby.' }],
    formula: '(powierzchnia × liczba warstw) ÷ wydajność', example: '(40 m² × 2) ÷ 10 m²/l = 8 l', note: 'Rzeczywiste zużycie zależy od chłonności podłoża i sposobu nakładania farby.',
  },
  'liczba-plytek': {
    fields: [{ id: 'area', label: 'Powierzchnia do ułożenia', unit: 'm²', defaultValue: '12', positive: true }, { id: 'tileLength', label: 'Długość płytki', unit: 'cm', defaultValue: '60', positive: true }, { id: 'tileWidth', label: 'Szerokość płytki', unit: 'cm', defaultValue: '60', positive: true }, { id: 'waste', label: 'Zapas na docinki', unit: '%', defaultValue: '10', hint: 'Możesz ustawić 0%, jeśli nie chcesz doliczać zapasu.' }],
    formula: '⌈powierzchnia × (1 + zapas/100) ÷ powierzchnia płytki⌉', example: '12 m², płytka 60 × 60 cm, 10% zapasu → 37 płytek', note: 'Liczba płytek jest zaokrąglana w górę. Kalkulator nie uwzględnia szerokości fug ani układu wzoru.',
  },
  'liczba-paczek-paneli': {
    fields: [{ id: 'area', label: 'Powierzchnia podłogi', unit: 'm²', defaultValue: '25', positive: true }, { id: 'packCoverage', label: 'Wydajność jednej paczki', unit: 'm²/paczka', defaultValue: '2,2', positive: true }, { id: 'waste', label: 'Zapas na docinki', unit: '%', defaultValue: '10', hint: 'Możesz ustawić 0%, jeśli nie chcesz doliczać zapasu.' }],
    formula: '⌈powierzchnia × (1 + zapas/100) ÷ wydajność paczki⌉', example: '25 m², 2,2 m²/paczkę, 10% zapasu → 13 paczek', note: 'Paczek nie kupuje się na części, dlatego wynik jest zaokrąglany w górę.',
  },
}

/** Accept Polish decimal commas and spaces as thousands separators. */
export function parseDomNumber(raw: string): number | null {
  const normalized = raw.trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function calculateDom(toolId: DomToolId, values: Record<string, number>): ResultRow[] {
  const { length = 0, width = 0, height = 0, power = 0, hours = 0, price = 0, volume = 0, area = 0, coats = 0, coverage = 0, tileLength = 0, tileWidth = 0, waste = 0, packCoverage = 0 } = values
  switch (toolId) {
    case 'powierzchnia-prostokata': return [{ label: 'Powierzchnia', value: length * width, unit: 'm²' }]
    case 'obwod-prostokata': return [{ label: 'Obwód', value: 2 * (length + width), unit: 'm' }]
    case 'objetosc-pomieszczenia': { const cubicMeters = length * width * height; return [{ label: 'Objętość', value: cubicMeters, unit: 'm³' }, { label: 'W litrach', value: cubicMeters * 1000, unit: 'l' }] }
    case 'koszt-pradu': { const energy = power / 1000 * hours; return [{ label: 'Szacowany koszt', value: energy * price, unit: 'zł', kind: 'money' }, { label: 'Zużyta energia', value: energy, unit: 'kWh' }] }
    case 'koszt-wody': return [{ label: 'Szacowany koszt', value: volume * price, unit: 'zł', kind: 'money' }, { label: 'Zużycie w litrach', value: volume * 1000, unit: 'l' }]
    case 'ilosc-farby': { const liters = area * coats / coverage; return [{ label: 'Potrzebna farba', value: liters, unit: 'l' }, { label: 'Z zapasem 10%', value: liters * 1.1, unit: 'l' }] }
    case 'liczba-plytek': { const tileArea = tileLength * tileWidth / 10_000; return [{ label: 'Płytki z zapasem', value: Math.ceil(area * (1 + waste / 100) / tileArea), unit: 'szt.', kind: 'integer' }, { label: 'Bez zapasu', value: Math.ceil(area / tileArea), unit: 'szt.', kind: 'integer' }] }
    case 'liczba-paczek-paneli': { const count = Math.ceil(area * (1 + waste / 100) / packCoverage); return [{ label: 'Potrzebne paczki', value: count, unit: 'paczek', kind: 'integer' }, { label: 'Zakupiona powierzchnia', value: count * packCoverage, unit: 'm²' }] }
  }
}

export function formatDomResult(row: ResultRow): string {
  if (!Number.isFinite(row.value)) return '—'
  if (row.kind === 'money') return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.value)
  if (row.kind === 'integer') return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(row.value)
  if (row.value !== 0 && Math.abs(row.value) < 0.000001) return new Intl.NumberFormat('pl-PL', { notation: 'scientific', maximumSignificantDigits: 6 }).format(row.value)
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 6 }).format(row.value)
}

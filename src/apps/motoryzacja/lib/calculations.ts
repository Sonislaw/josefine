import type { MotoryzacjaToolId } from '../manifest'

export interface InputField {
  id: string
  label: string
  unit: string
  defaultValue: string
  positive?: boolean
  integer?: boolean
  max?: number
  hint?: string
}

export interface ResultRow {
  label: string
  value: number
  unit: string
  kind?: 'money' | 'duration'
}

interface CalculatorDefinition {
  fields: InputField[]
  formula: string
  example: string
  note: string
}

export const motoryzacjaCalculators: Record<MotoryzacjaToolId, CalculatorDefinition> = {
  'spalanie-paliwa': {
    fields: [
      { id: 'fuel', label: 'Zużyte paliwo', unit: 'l', defaultValue: '32', positive: true },
      { id: 'distance', label: 'Przejechany dystans', unit: 'km', defaultValue: '400', positive: true },
    ],
    formula: '(zużyte litry ÷ przejechane kilometry) × 100',
    example: '32 l ÷ 400 km × 100 = 8 l/100 km',
    note: 'Średnia dotyczy wpisanego odcinka. Rzeczywiste spalanie zależy od warunków i stylu jazdy.',
  },
  'koszt-przejazdu': {
    fields: [
      { id: 'distance', label: 'Dystans trasy', unit: 'km', defaultValue: '250', positive: true },
      { id: 'consumption', label: 'Średnie spalanie', unit: 'l/100 km', defaultValue: '7', positive: true },
      { id: 'price', label: 'Cena paliwa', unit: 'zł/l', defaultValue: '6,50', positive: true },
    ],
    formula: '(dystans ÷ 100) × spalanie × cena za litr',
    example: '250 km, 7 l/100 km i 6,50 zł/l → 113,75 zł',
    note: 'Szacunek obejmuje paliwo. Opłaty drogowe, parking i zmienność spalania nie są doliczane.',
  },
  'zasieg-na-paliwie': {
    fields: [
      { id: 'fuel', label: 'Dostępne paliwo', unit: 'l', defaultValue: '40', positive: true },
      { id: 'consumption', label: 'Średnie spalanie', unit: 'l/100 km', defaultValue: '8', positive: true },
    ],
    formula: '(dostępne litry ÷ spalanie) × 100',
    example: '40 l ÷ 8 l/100 km × 100 = 500 km',
    note: 'Zasięg jest orientacyjny. Zachowaj rezerwę paliwa, bo realne spalanie może się zmienić.',
  },
  'predkosc-srednia': {
    fields: [
      { id: 'distance', label: 'Przejechany dystans', unit: 'km', defaultValue: '150', positive: true },
      { id: 'hours', label: 'Czas jazdy — godziny', unit: 'godz.', defaultValue: '2', integer: true },
      { id: 'minutes', label: 'Czas jazdy — minuty', unit: 'min', defaultValue: '30', integer: true, max: 59 },
    ],
    formula: 'dystans ÷ (godziny + minuty/60)',
    example: '150 km ÷ 2,5 godz. = 60 km/h',
    note: 'Wpisz łączny czas przejazdu. Jeśli uwzględnisz postoje, wynik pokaże średnią dla całej podróży.',
  },
  'czas-podrozy': {
    fields: [
      { id: 'distance', label: 'Dystans trasy', unit: 'km', defaultValue: '180', positive: true },
      { id: 'speed', label: 'Przewidywana średnia prędkość', unit: 'km/h', defaultValue: '60', positive: true },
    ],
    formula: 'dystans ÷ średnia prędkość',
    example: '180 km ÷ 60 km/h = 3 godz.',
    note: 'Wynik zakłada stałą średnią prędkość. Uwzględnij postoje i warunki drogowe w planie podróży.',
  },
}

/** Users can enter a Polish comma, a dot, or spaces as thousands separators. */
export function parseMotoryzacjaNumber(raw: string): number | null {
  const normalized = raw.trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function calculateMotoryzacja(toolId: MotoryzacjaToolId, values: Record<string, number>): ResultRow[] {
  const { fuel = 0, distance = 0, consumption = 0, price = 0, hours = 0, minutes = 0, speed = 0 } = values
  switch (toolId) {
    case 'spalanie-paliwa': return [{ label: 'Średnie spalanie', value: fuel / distance * 100, unit: 'l/100 km' }]
    case 'koszt-przejazdu': {
      const liters = distance / 100 * consumption
      return [{ label: 'Koszt paliwa', value: liters * price, unit: 'zł', kind: 'money' }, { label: 'Potrzebne paliwo', value: liters, unit: 'l' }]
    }
    case 'zasieg-na-paliwie': return [{ label: 'Szacowany zasięg', value: fuel / consumption * 100, unit: 'km' }]
    case 'predkosc-srednia': return [{ label: 'Średnia prędkość', value: distance / (hours + minutes / 60), unit: 'km/h' }, { label: 'Czas jazdy', value: hours * 60 + minutes, unit: '', kind: 'duration' }]
    case 'czas-podrozy': {
      const durationHours = distance / speed
      return [{ label: 'Szacowany czas', value: durationHours * 60, unit: '', kind: 'duration' }, { label: 'Czas w godzinach', value: durationHours, unit: 'godz.' }]
    }
  }
}

export function formatMotoryzacjaResult(row: ResultRow): string {
  if (!Number.isFinite(row.value)) return '—'
  if (row.kind === 'money') return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.value)
  if (row.kind === 'duration') {
    if (row.value < 0.5) return 'mniej niż 1 min'
    const totalMinutes = Math.round(row.value)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours && minutes === 0) return `${hours} godz.`
    return hours ? `${hours} godz. ${minutes} min` : `${minutes} min`
  }
  if (row.value !== 0 && Math.abs(row.value) < 0.000001) return new Intl.NumberFormat('pl-PL', { notation: 'scientific', maximumSignificantDigits: 6 }).format(row.value)
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 }).format(row.value)
}

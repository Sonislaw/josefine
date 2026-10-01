import type { JednostkiToolId } from '../manifest'

export interface Unit {
  id: string
  label: string
  symbol: string
}

interface Conversion {
  units: readonly Unit[]
  defaultValue: string
  /** Convert through a shared base unit, so each pair works in both directions. */
  toBase: (value: number, unitId: string) => number
  fromBase: (value: number, unitId: string) => number
  formula: string
  example: string
}

const scale = (units: readonly Unit[], factors: Record<string, number>, defaultValue: string, formula: string, example: string): Conversion => ({
  units,
  defaultValue,
  toBase: (value, unitId) => value * factors[unitId]!,
  fromBase: (value, unitId) => value / factors[unitId]!,
  formula,
  example,
})

export const conversions: Record<JednostkiToolId, Conversion> = {
  'centymetry-cale': scale(
    [{ id: 'cm', label: 'Centymetry', symbol: 'cm' }, { id: 'in', label: 'Cale', symbol: 'in' }],
    { cm: 1, in: 2.54 }, '30', '1 cal = 2,54 cm', '30 cm ≈ 11,81 cala',
  ),
  'kilometry-mile': scale(
    [{ id: 'km', label: 'Kilometry', symbol: 'km' }, { id: 'mi', label: 'Mile', symbol: 'mi' }],
    { km: 1, mi: 1.609344 }, '10', '1 mila = 1,609344 km', '10 km ≈ 6,21 mili',
  ),
  'kilogramy-funty': scale(
    [{ id: 'kg', label: 'Kilogramy', symbol: 'kg' }, { id: 'lb', label: 'Funty', symbol: 'lb' }],
    { kg: 1, lb: 0.45359237 }, '5', '1 funt = 0,45359237 kg', '5 kg ≈ 11,02 funta',
  ),
  'litry-galony': scale(
    [{ id: 'l', label: 'Litry', symbol: 'l' }, { id: 'gal', label: 'Galony amerykańskie', symbol: 'gal (US)' }],
    { l: 1, gal: 3.785411784 }, '20', '1 galon amerykański = 3,785411784 l', '20 l ≈ 5,28 galona US',
  ),
  'celsjusz-fahrenheit': {
    units: [{ id: 'c', label: 'Stopnie Celsjusza', symbol: '°C' }, { id: 'f', label: 'Stopnie Fahrenheita', symbol: '°F' }],
    defaultValue: '20',
    toBase: (value, unitId) => unitId === 'f' ? (value - 32) * 5 / 9 : value,
    fromBase: (value, unitId) => unitId === 'f' ? value * 9 / 5 + 32 : value,
    formula: '°F = (°C × 9/5) + 32',
    example: '20°C = 68°F',
  },
  'metry-kwadratowe-ary-hektary': scale(
    [{ id: 'm2', label: 'Metry kwadratowe', symbol: 'm²' }, { id: 'a', label: 'Ary', symbol: 'a' }, { id: 'ha', label: 'Hektary', symbol: 'ha' }],
    { m2: 1, a: 100, ha: 10_000 }, '1000', '1 ar = 100 m² · 1 hektar = 10 000 m²', '1 000 m² = 10 a = 0,1 ha',
  ),
  'metry-szescienne-litry': scale(
    [{ id: 'm3', label: 'Metry sześcienne', symbol: 'm³' }, { id: 'l', label: 'Litry', symbol: 'l' }],
    { m3: 1, l: 0.001 }, '1', '1 m³ = 1 000 l', '1 m³ = 1 000 l',
  ),
}

export function parsePolishNumber(raw: string): number | null {
  const normalized = raw.trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function convert(toolId: JednostkiToolId, value: number, from: string, to: string): number {
  const conversion = conversions[toolId]
  if (!conversion.units.some((unit) => unit.id === from) || !conversion.units.some((unit) => unit.id === to)) {
    throw new Error(`Unknown unit in ${toolId}: ${from} → ${to}`)
  }
  return conversion.fromBase(conversion.toBase(value, from), to)
}

export function formatResult(value: number): string {
  // Scientific notation prevents a non-zero conversion from being displayed as zero.
  if (value !== 0 && (Math.abs(value) < 1e-8 || Math.abs(value) >= 1e12)) {
    return new Intl.NumberFormat('pl-PL', { notation: 'scientific', maximumSignificantDigits: 6 }).format(value)
  }
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 10 }).format(value)
}

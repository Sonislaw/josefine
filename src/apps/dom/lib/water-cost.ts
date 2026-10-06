import { parseDomNumber } from './calculations'
import { calculateSplitWaterCost } from './practical'

export type WaterPricingMode = 'combined' | 'split'

/** Opłata dotyczy dokładnie rachunku, dla którego użytkownik podaje zużycie. */
export function parseFixedCharge(raw: string): number | null {
  if (raw.trim() === '') return 0
  const value = parseDomNumber(raw)
  const normalized = raw
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
  return value !== null && value <= 100_000 && /^\d+(?:\.\d{0,2})?$/.test(normalized) ? value : null
}

export function calculateWaterBill(input: {
  volume: number | null
  mode: WaterPricingMode
  combinedRate: number | null
  waterRate: number | null
  sewageRate: number | null
  fixedCharge: number | null
}) {
  const { volume, mode, combinedRate, waterRate, sewageRate, fixedCharge } = input
  if (
    volume === null ||
    !Number.isFinite(volume) ||
    volume <= 0 ||
    fixedCharge === null ||
    !Number.isFinite(fixedCharge) ||
    fixedCharge < 0 ||
    fixedCharge > 100_000
  )
    return null

  let waterCents: number
  let sewageCents = 0
  let unitRate: number
  if (mode === 'split') {
    const split = calculateSplitWaterCost(volume, waterRate, sewageRate)
    if (!split || waterRate === null || sewageRate === null) return null
    waterCents = Math.round(split.waterCost * 100)
    sewageCents = Math.round(split.sewageCost * 100)
    unitRate = waterRate + sewageRate
  } else {
    if (
      combinedRate === null ||
      !Number.isFinite(combinedRate) ||
      combinedRate <= 0 ||
      combinedRate > 100_000
    )
      return null
    waterCents = Math.round(volume * combinedRate * 100)
    unitRate = combinedRate
  }
  const fixedCents = Math.round(fixedCharge * 100)
  const totalCents = waterCents + sewageCents + fixedCents
  if (![waterCents, sewageCents, fixedCents, totalCents].every(Number.isSafeInteger)) return null
  return {
    variableCost: (waterCents + sewageCents) / 100,
    waterCost: waterCents / 100,
    sewageCost: sewageCents / 100,
    fixedCharge: fixedCents / 100,
    totalCost: totalCents / 100,
    unitRate,
  }
}

function utcDay(raw: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [year, month, day] = raw.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null
  return date.getTime() / 86_400_000
}

/** Daty liczymy w UTC, aby zmiana czasu letniego nie zmieniała liczby dni. */
export function calculateWaterPeriod(
  usage: number | null,
  from: string,
  to: string,
  unitRate: number | null,
) {
  const startDay = utcDay(from)
  const endDay = utcDay(to)
  if (
    usage === null ||
    !Number.isFinite(usage) ||
    usage < 0 ||
    startDay === null ||
    endDay === null ||
    endDay <= startDay
  )
    return null
  const days = endDay - startDay
  const litersPerDay = (usage * 1000) / days
  const volume30Days = (usage * 30) / days
  const cost30Days =
    unitRate !== null && Number.isFinite(unitRate) && unitRate >= 0
      ? Math.round(volume30Days * unitRate * 100) / 100
      : null
  if (
    ![litersPerDay, volume30Days].every(Number.isFinite) ||
    (cost30Days !== null && !Number.isSafeInteger(Math.round(cost30Days * 100)))
  )
    return null
  return { days, litersPerDay, volume30Days, cost30Days }
}

export function parseDailyWaterSavings(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value <= 100_000 ? value : null
}

/** Symulacja dotyczy tylko części zmiennej, nie opłaty stałej. */
export function calculateWaterSavings(litersPerDay: number | null, unitRate: number | null) {
  if (
    litersPerDay === null ||
    unitRate === null ||
    !Number.isFinite(litersPerDay) ||
    !Number.isFinite(unitRate) ||
    litersPerDay < 0 ||
    litersPerDay > 100_000 ||
    unitRate < 0 ||
    unitRate > 200_000
  )
    return null
  const volume30Days = (litersPerDay * 30) / 1000
  const cents = Math.round(volume30Days * unitRate * 100)
  return Number.isSafeInteger(cents) ? { volume30Days, cost30Days: cents / 100 } : null
}

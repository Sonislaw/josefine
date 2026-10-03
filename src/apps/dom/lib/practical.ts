import { parseDomNumber } from './calculations'

export function parseDailyHours(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 && value <= 24 ? value : null
}

export function parseDaysPerWeek(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 7 ? value : null
}

/** An average month is one twelfth of a year; this is a forecast, not a billing period. */
export function calculateEnergyProjection(
  power: number | null,
  price: number | null,
  hoursPerDay: number | null,
  daysPerWeek: number | null,
) {
  if (
    power === null ||
    power <= 0 ||
    price === null ||
    price <= 0 ||
    hoursPerDay === null ||
    daysPerWeek === null
  )
    return null
  const energyPerUseDay = (power / 1000) * hoursPerDay
  const costPerUseDay = energyPerUseDay * price
  const annualUseDays = (365 * daysPerWeek) / 7
  const annualEnergy = energyPerUseDay * annualUseDays
  const annualCost = annualEnergy * price
  if (![energyPerUseDay, costPerUseDay, annualEnergy, annualCost].every(Number.isFinite))
    return null
  return {
    energyPerUseDay,
    costPerUseDay,
    monthlyEnergy: annualEnergy / 12,
    monthlyCost: annualCost / 12,
    annualEnergy,
    annualCost,
  }
}

/** Meter readings may contain fractions of a cubic metre; round only the subtraction noise. */
export function calculateMeterUsage(previousRaw: string, currentRaw: string): number | null {
  const previous = parseDomNumber(previousRaw)
  const current = parseDomNumber(currentRaw)
  if (previous === null || current === null || current < previous) return null
  return Number((current - previous).toFixed(6))
}

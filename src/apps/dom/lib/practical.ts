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

export function parseComparisonPower(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 && value <= 1_000_000 ? value : null
}

export function parseComparisonPrice(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 && value <= 100_000 ? value : null
}

/** Both devices use one schedule and tariff; costs are rounded before comparing visible amounts. */
export function calculateEnergyComparison(
  powerA: number | null,
  powerB: number | null,
  price: number | null,
  hoursPerDay: number | null,
  daysPerWeek: number | null,
) {
  if (
    powerA === null ||
    powerB === null ||
    price === null ||
    ![powerA, powerB].every((power) => Number.isFinite(power) && power > 0 && power <= 1_000_000) ||
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 100_000 ||
    hoursPerDay === null ||
    !Number.isFinite(hoursPerDay) ||
    hoursPerDay <= 0 ||
    hoursPerDay > 24 ||
    daysPerWeek === null ||
    !Number.isInteger(daysPerWeek) ||
    daysPerWeek < 1 ||
    daysPerWeek > 7
  )
    return null

  const projectionA = calculateEnergyProjection(powerA, price, hoursPerDay, daysPerWeek)
  const projectionB = calculateEnergyProjection(powerB, price, hoursPerDay, daysPerWeek)
  if (!projectionA || !projectionB) return null

  const periods = [
    {
      label: 'Dzień używania',
      costA: projectionA.costPerUseDay,
      costB: projectionB.costPerUseDay,
      energyA: projectionA.energyPerUseDay,
      energyB: projectionB.energyPerUseDay,
    },
    {
      label: 'Średni miesiąc',
      costA: projectionA.monthlyCost,
      costB: projectionB.monthlyCost,
      energyA: projectionA.monthlyEnergy,
      energyB: projectionB.monthlyEnergy,
    },
    {
      label: 'Rok',
      costA: projectionA.annualCost,
      costB: projectionB.annualCost,
      energyA: projectionA.annualEnergy,
      energyB: projectionB.annualEnergy,
    },
  ]

  let allSafe = true
  const rounded = periods.map((period) => {
    const centsA = Math.round(period.costA * 100)
    const centsB = Math.round(period.costB * 100)
    if (
      !Number.isSafeInteger(centsA) ||
      !Number.isSafeInteger(centsB) ||
      !Number.isSafeInteger(centsA - centsB) ||
      !Number.isFinite(period.energyA) ||
      !Number.isFinite(period.energyB)
    )
      allSafe = false
    return {
      label: period.label,
      costA: centsA / 100,
      costB: centsB / 100,
      difference: (centsA - centsB) / 100,
      energyA: period.energyA,
      energyB: period.energyB,
    }
  })
  return allSafe ? rounded : null
}

/** Meter readings may contain fractions of a cubic metre; round only the subtraction noise. */
export function calculateMeterUsage(previousRaw: string, currentRaw: string): number | null {
  const previous = parseDomNumber(previousRaw)
  const current = parseDomNumber(currentRaw)
  if (previous === null || current === null || current < previous) return null
  return Number((current - previous).toFixed(6))
}

/** Separate water/sewage rates may be zero, but cannot be negative or implausibly large. */
export function parseWaterRate(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value <= 100_000 ? value : null
}

/** Round each bill line to grosze before summing, so displayed parts match the total. */
export function calculateSplitWaterCost(
  volume: number | null,
  waterRate: number | null,
  sewageRate: number | null,
) {
  if (
    volume === null ||
    !Number.isFinite(volume) ||
    volume <= 0 ||
    waterRate === null ||
    sewageRate === null ||
    ![waterRate, sewageRate].every((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100_000)
  )
    return null

  const waterCents = Math.round(volume * waterRate * 100)
  const sewageCents = Math.round(volume * sewageRate * 100)
  const totalCents = waterCents + sewageCents
  if (![waterCents, sewageCents, totalCents].every(Number.isSafeInteger)) return null
  return {
    waterCost: waterCents / 100,
    sewageCost: sewageCents / 100,
    totalCost: totalCents / 100,
  }
}

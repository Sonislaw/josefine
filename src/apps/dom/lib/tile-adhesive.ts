export interface TileAdhesiveInput {
  area: number // actual tiled m², before adhesive reserve
  consumptionKgPerM2: number // use the selected product's declared consumption
  reservePercent: number
  bagWeightKg: number
  bagPrice: number | null
}

export interface TileAdhesiveResult {
  baseKg: number
  requiredKg: number
  bagCount: number
  purchasedKg: number
  remainingKg: number
  estimatedCost: number | null
}

/** A product-specific kg/m² figure is required; no universal adhesive usage is assumed. */
export function calculateTileAdhesive(input: TileAdhesiveInput): TileAdhesiveResult | null {
  const { area, consumptionKgPerM2, reservePercent, bagWeightKg, bagPrice } = input
  if (
    ![area, consumptionKgPerM2, reservePercent, bagWeightKg].every(Number.isFinite) ||
    area <= 0 ||
    area > 4_000_000 ||
    consumptionKgPerM2 <= 0 ||
    consumptionKgPerM2 > 100 ||
    reservePercent < 0 ||
    reservePercent > 100 ||
    bagWeightKg <= 0 ||
    bagWeightKg > 1000 ||
    (bagPrice !== null && (!Number.isFinite(bagPrice) || bagPrice < 0 || bagPrice > 100_000))
  )
    return null

  const baseKg = area * consumptionKgPerM2
  const requiredKg = baseKg * (1 + reservePercent / 100)
  const bagCount = Math.ceil(requiredKg / bagWeightKg)
  const purchasedKg = bagCount * bagWeightKg
  const priceCents = bagPrice === null ? null : Math.round(bagPrice * 100)
  const costCents = priceCents === null ? null : bagCount * priceCents
  if (
    !Number.isFinite(requiredKg) ||
    !Number.isSafeInteger(bagCount) ||
    bagCount <= 0 ||
    !Number.isFinite(purchasedKg) ||
    (costCents !== null && !Number.isSafeInteger(costCents))
  )
    return null

  return {
    baseKg,
    requiredKg,
    bagCount,
    purchasedKg,
    remainingKg: Math.max(0, purchasedKg - requiredKg),
    estimatedCost: costCents === null ? null : costCents / 100,
  }
}

export interface GroutInput {
  area: number // m²
  tileLength: number // cm
  tileWidth: number // cm
  jointWidth: number // mm
  jointDepth: number // mm
  density: number // kg/dm³ of mixed grout
  reserve: number // percent
  packageWeight: number // kg
  packagePrice: number | null // PLN
}

export interface GroutResult {
  kgPerSquareMeter: number
  neededKg: number
  neededWithReserveKg: number
  packageCount: number
  purchasedKg: number
  surplusKg: number
  estimatedCost: number | null
}

/**
 * Regular-grid estimate from the manufacturer's joint-volume formula.
 * Tile sides are converted to mm; density in kg/dm³ is numerically the
 * kg/m² coefficient after applying the 1 m² / 1 dm³ unit conversion.
 */
export function calculateGrout(input: GroutInput): GroutResult | null {
  const {
    area,
    tileLength,
    tileWidth,
    jointWidth,
    jointDepth,
    density,
    reserve,
    packageWeight,
    packagePrice,
  } = input
  if (
    ![area, tileLength, tileWidth, jointWidth, jointDepth, density, reserve, packageWeight].every(
      Number.isFinite,
    ) ||
    area <= 0 ||
    area > 100_000 ||
    tileLength < 0.1 ||
    tileLength > 300 ||
    tileWidth < 0.1 ||
    tileWidth > 300 ||
    jointWidth < 0.1 ||
    jointWidth > 30 ||
    jointDepth < 0.1 ||
    jointDepth > 30 ||
    density < 0.1 ||
    density > 5 ||
    reserve < 0 ||
    reserve > 100 ||
    packageWeight < 0.1 ||
    packageWeight > 100 ||
    jointWidth >= Math.min(tileLength, tileWidth) * 10 ||
    (packagePrice !== null &&
      (!Number.isFinite(packagePrice) || packagePrice < 0 || packagePrice > 100_000))
  )
    return null

  const lengthMm = tileLength * 10
  const widthMm = tileWidth * 10
  const kgPerSquareMeter =
    ((lengthMm + widthMm) / (lengthMm * widthMm)) * jointWidth * jointDepth * density
  const neededKg = area * kgPerSquareMeter
  const neededWithReserveKg = neededKg * (1 + reserve / 100)
  const ratio = neededWithReserveKg / packageWeight
  const nearestInteger = Math.round(ratio)
  const almostInteger =
    nearestInteger >= 1 &&
    Math.abs(ratio - nearestInteger) <= Number.EPSILON * 16 * Math.max(1, ratio)
  const packageCount = almostInteger ? nearestInteger : Math.ceil(ratio)
  const purchasedKg = packageCount * packageWeight
  const surplusKg = Math.max(0, purchasedKg - neededWithReserveKg)
  const estimatedCost =
    packagePrice === null ? null : Math.round(packageCount * packagePrice * 100) / 100
  if (
    ![kgPerSquareMeter, neededKg, neededWithReserveKg, purchasedKg, surplusKg].every(
      Number.isFinite,
    ) ||
    !Number.isSafeInteger(packageCount) ||
    packageCount <= 0 ||
    (estimatedCost !== null && !Number.isSafeInteger(Math.round(estimatedCost * 100)))
  )
    return null

  return {
    kgPerSquareMeter,
    neededKg,
    neededWithReserveKg,
    packageCount,
    purchasedKg,
    surplusKg,
    estimatedCost,
  }
}

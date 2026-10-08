export interface MaterialPackageInput {
  baseKg: number
  reservePercent: number
  packageWeightKg: number
  packagePrice: number | null
}

export interface MaterialPackageResult {
  baseKg: number
  requiredKg: number
  packageCount: number
  purchasedKg: number
  remainingKg: number
  estimatedCost: number | null
}

/** Wspólne zaokrąglenie zakupu do pełnych worków lub wiader. */
export function calculateMaterialPackages(
  input: MaterialPackageInput,
): MaterialPackageResult | null {
  const { baseKg, reservePercent, packageWeightKg, packagePrice } = input
  if (
    ![baseKg, reservePercent, packageWeightKg].every(Number.isFinite) ||
    baseKg <= 0 ||
    reservePercent < 0 ||
    reservePercent > 100 ||
    packageWeightKg <= 0 ||
    packageWeightKg > 1000 ||
    (packagePrice !== null &&
      (!Number.isFinite(packagePrice) || packagePrice < 0 || packagePrice > 100_000))
  )
    return null

  const requiredKg = baseKg * (1 + reservePercent / 100)
  const packageRatio = requiredKg / packageWeightKg
  // Granica całego opakowania nie powinna przeskoczyć o 1 przez błąd IEEE-754.
  const packageCount = Math.ceil(packageRatio - Number.EPSILON * Math.max(1, packageRatio) * 8)
  const purchasedKg = packageCount * packageWeightKg
  const priceCents = packagePrice === null ? null : Math.round(packagePrice * 100)
  const costCents = priceCents === null ? null : packageCount * priceCents
  if (
    ![requiredKg, purchasedKg].every(Number.isFinite) ||
    !Number.isSafeInteger(packageCount) ||
    packageCount <= 0 ||
    (costCents !== null && !Number.isSafeInteger(costCents))
  )
    return null

  return {
    baseKg,
    requiredKg,
    packageCount,
    purchasedKg,
    remainingKg: Math.max(0, purchasedKg - requiredKg),
    estimatedCost: costCents === null ? null : costCents / 100,
  }
}

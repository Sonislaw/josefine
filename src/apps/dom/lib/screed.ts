export interface ScreedInput {
  areaM2: number
  thicknessMm: number
  consumptionKgPerM2Mm: number
  reservePercent: number
  bagWeightKg: number
  bagPrice: number | null
}

export interface ScreedResult {
  volumeM3: number
  baseKg: number
  requiredKg: number
  bagCount: number
  purchasedKg: number
  remainingKg: number
  estimatedCost: number | null
}

/** Zużycie i dopuszczalną grubość warstwy użytkownik sprawdza na wybranym produkcie. */
export function calculateScreed(input: ScreedInput): ScreedResult | null {
  const { areaM2, thicknessMm, consumptionKgPerM2Mm, reservePercent, bagWeightKg, bagPrice } = input
  if (
    ![areaM2, thicknessMm, consumptionKgPerM2Mm, reservePercent, bagWeightKg].every(
      Number.isFinite,
    ) ||
    areaM2 <= 0 ||
    areaM2 > 10_000 ||
    thicknessMm < 0.1 ||
    thicknessMm > 500 ||
    consumptionKgPerM2Mm < 0.1 ||
    consumptionKgPerM2Mm > 10 ||
    reservePercent < 0 ||
    reservePercent > 100 ||
    bagWeightKg < 1 ||
    bagWeightKg > 1000 ||
    (bagPrice !== null && (!Number.isFinite(bagPrice) || bagPrice < 0 || bagPrice > 100_000))
  )
    return null

  const volumeM3 = (areaM2 * thicknessMm) / 1000
  const baseKg = areaM2 * thicknessMm * consumptionKgPerM2Mm
  const requiredKg = baseKg * (1 + reservePercent / 100)
  const bagCount = Math.ceil(requiredKg / bagWeightKg)
  const purchasedKg = bagCount * bagWeightKg
  const priceCents = bagPrice === null ? null : Math.round(bagPrice * 100)
  const costCents = priceCents === null ? null : bagCount * priceCents
  if (
    ![volumeM3, baseKg, requiredKg, purchasedKg].every(Number.isFinite) ||
    !Number.isSafeInteger(bagCount) ||
    bagCount <= 0 ||
    (costCents !== null && !Number.isSafeInteger(costCents))
  )
    return null

  return {
    volumeM3,
    baseKg,
    requiredKg,
    bagCount,
    purchasedKg,
    remainingKg: Math.max(0, purchasedKg - requiredKg),
    estimatedCost: costCents === null ? null : costCents / 100,
  }
}

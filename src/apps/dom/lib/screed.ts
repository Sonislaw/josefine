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
  const packages = calculateMaterialPackages({
    baseKg,
    reservePercent,
    packageWeightKg: bagWeightKg,
    packagePrice: bagPrice,
  })
  if (!Number.isFinite(volumeM3) || !packages) return null

  return {
    volumeM3,
    baseKg: packages.baseKg,
    requiredKg: packages.requiredKg,
    bagCount: packages.packageCount,
    purchasedKg: packages.purchasedKg,
    remainingKg: packages.remainingKg,
    estimatedCost: packages.estimatedCost,
  }
}
import { calculateMaterialPackages } from './material-packages'

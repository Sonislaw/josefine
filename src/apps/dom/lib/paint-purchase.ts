import { parseDomNumber } from './calculations'

export interface PaintPurchaseResult {
  canCount: number
  purchasedLiters: number
  surplusLiters: number
  estimatedCost: number | null
}

export function parsePaintCanSize(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 ? value : null
}

export function isValidOptionalPaintCanPrice(raw: string): boolean {
  return raw.trim() === '' || parseDomNumber(raw) !== null
}

/** One chosen can size keeps the first purchase plan predictable; mixed sizes can be added later. */
export function calculatePaintPurchase(
  requiredLiters: number,
  canSizeLiters: number,
  canPrice: number | null,
): PaintPurchaseResult | null {
  if (
    !Number.isFinite(requiredLiters) ||
    requiredLiters <= 0 ||
    !Number.isFinite(canSizeLiters) ||
    canSizeLiters <= 0 ||
    (canPrice !== null && (!Number.isFinite(canPrice) || canPrice < 0))
  )
    return null

  const ratio = requiredLiters / canSizeLiters
  const nearestInteger = Math.round(ratio)
  // Avoid buying one extra can only because a decimal calculation produced 2.0000000000000004.
  const almostInteger =
    nearestInteger >= 1 &&
    Math.abs(ratio - nearestInteger) <= Number.EPSILON * 16 * Math.max(1, ratio)
  const canCount = almostInteger ? nearestInteger : Math.ceil(ratio)
  const purchasedLiters = canCount * canSizeLiters
  const estimatedCost = canPrice === null ? null : canCount * canPrice
  if (
    !Number.isSafeInteger(canCount) ||
    !Number.isFinite(purchasedLiters) ||
    (estimatedCost !== null && !Number.isFinite(estimatedCost))
  )
    return null

  return {
    canCount,
    purchasedLiters,
    surplusLiters: Math.max(0, purchasedLiters - requiredLiters),
    estimatedCost,
  }
}

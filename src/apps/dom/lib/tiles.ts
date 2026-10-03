/** Opcjonalny plan zakupu; podstawowy kalkulator nadal podaje liczbę pojedynczych płytek. */
export function calculateTilePurchase(
  tilesNeeded: number,
  tilesPerBox: number,
  boxPrice: number | null,
) {
  if (
    !Number.isSafeInteger(tilesNeeded) ||
    tilesNeeded <= 0 ||
    !Number.isSafeInteger(tilesPerBox) ||
    tilesPerBox <= 0 ||
    (boxPrice !== null && (!Number.isFinite(boxPrice) || boxPrice < 0))
  )
    return null

  const boxCount = Math.ceil(tilesNeeded / tilesPerBox)
  const purchasedTiles = boxCount * tilesPerBox
  const spareTiles = purchasedTiles - tilesNeeded
  const estimatedCost = boxPrice === null ? null : boxCount * boxPrice
  if (
    !Number.isSafeInteger(purchasedTiles) ||
    (estimatedCost !== null && !Number.isFinite(estimatedCost))
  )
    return null

  return { boxCount, purchasedTiles, spareTiles, estimatedCost }
}

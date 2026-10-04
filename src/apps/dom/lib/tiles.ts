/** Shared piece-count formula for floor and wall tools; callers validate their own inputs. */
export function calculateTileCounts(
  area: number,
  tileLengthCm: number,
  tileWidthCm: number,
  wastePercent: number,
) {
  const tileArea = (tileLengthCm * tileWidthCm) / 10_000
  return {
    withoutReserve: Math.ceil(area / tileArea),
    tileCount: Math.ceil((area * (1 + wastePercent / 100)) / tileArea),
  }
}

/** Full-carton purchase, shared by the floor and wall calculators. */
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

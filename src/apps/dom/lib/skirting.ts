export interface SkirtingInput {
  perimeter: number
  openings: number
  boardLength: number
  reserve: number
  boardPrice: number | null
}

/** Szacunek na podstawie łącznej długości; nie rozkłada cięć na poszczególne ściany. */
export function calculateSkirtingPlan(input: SkirtingInput) {
  const { perimeter, openings, boardLength, reserve, boardPrice } = input
  if (
    !Number.isFinite(perimeter) ||
    perimeter <= 0 ||
    !Number.isFinite(openings) ||
    openings < 0 ||
    openings >= perimeter ||
    !Number.isFinite(boardLength) ||
    boardLength <= 0 ||
    !Number.isFinite(reserve) ||
    reserve < 0 ||
    (boardPrice !== null && (!Number.isFinite(boardPrice) || boardPrice < 0))
  )
    return null

  const netLength = perimeter - openings
  const requiredLength = netLength * (1 + reserve / 100)
  const boardCount = Math.ceil(requiredLength / boardLength)
  const purchasedLength = boardCount * boardLength
  const surplusLength = Math.max(0, purchasedLength - requiredLength)
  const estimatedCost = boardPrice === null ? null : boardCount * boardPrice
  if (
    !Number.isSafeInteger(boardCount) ||
    boardCount <= 0 ||
    ![netLength, requiredLength, purchasedLength, surplusLength].every(Number.isFinite) ||
    (estimatedCost !== null && !Number.isFinite(estimatedCost))
  )
    return null

  return { netLength, requiredLength, boardCount, purchasedLength, surplusLength, estimatedCost }
}

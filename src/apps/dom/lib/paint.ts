export const PAINT_RESERVE_RATE = 0.1

export interface PaintRoomInput {
  length: number
  width: number
  height: number
  doors: number
  windows: number
  ceiling: boolean
  coats: number
  coverage: number
}

export interface PaintRoomResult {
  grossWalls: number
  openings: number
  netWalls: number
  ceilingArea: number
  paintArea: number
  coatedArea: number
  liters: number
  litersWithReserve: number
}

export type AccentWall = 'length' | 'width'

export interface PaintAccentInput {
  room: PaintRoomInput
  wall: AccentWall
  openings: number
  coats: number
  coverage: number
}

export interface PaintAccentResult {
  accentGrossArea: number
  accentArea: number
  mainArea: number
  mainLiters: number
  mainLitersWithReserve: number
  accentLiters: number
  accentLitersWithReserve: number
}

/** The room mode is an estimate for a rectangular room; product-specific coverage stays editable. */
export function calculatePaintRoom(input: PaintRoomInput): PaintRoomResult | null {
  const { length, width, height, doors, windows, ceiling, coats, coverage } = input
  if (
    ![length, width, height, doors, windows, coats, coverage].every(Number.isFinite) ||
    length <= 0 ||
    width <= 0 ||
    height <= 0 ||
    length > 1000 ||
    width > 1000 ||
    height > 1000 ||
    doors < 0 ||
    windows < 0 ||
    !Number.isSafeInteger(coats) ||
    coats <= 0 ||
    coverage <= 0
  )
    return null

  const grossWalls = 2 * (length + width) * height
  const openings = doors + windows
  const tolerance = Number.EPSILON * Math.max(1, grossWalls) * 16
  if (openings > grossWalls + tolerance) return null

  const netWalls = Math.max(0, grossWalls - openings)
  const ceilingArea = ceiling ? length * width : 0
  const paintArea = netWalls + ceilingArea
  if (paintArea <= tolerance) return null

  const coatedArea = paintArea * coats
  const liters = coatedArea / coverage
  const litersWithReserve = liters * (1 + PAINT_RESERVE_RATE)
  if (
    ![grossWalls, openings, netWalls, ceilingArea, coatedArea, liters, litersWithReserve].every(
      Number.isFinite,
    )
  )
    return null

  return {
    grossWalls,
    openings,
    netWalls,
    ceilingArea,
    paintArea,
    coatedArea,
    liters,
    litersWithReserve,
  }
}

/** Split one wall from the room total; its openings are a subset of the already-entered openings. */
export function calculatePaintAccent(input: PaintAccentInput): PaintAccentResult | null {
  const roomResult = calculatePaintRoom(input.room)
  const { wall, openings, coats, coverage } = input
  if (
    !roomResult ||
    (wall !== 'length' && wall !== 'width') ||
    !Number.isFinite(openings) ||
    openings < 0 ||
    !Number.isSafeInteger(coats) ||
    coats <= 0 ||
    !Number.isFinite(coverage) ||
    coverage <= 0
  )
    return null

  const accentGrossArea = input.room[wall] * input.room.height
  const tolerance = Number.EPSILON * Math.max(1, roomResult.grossWalls) * 16
  const otherOpenings = roomResult.openings - openings
  if (
    openings > roomResult.openings + tolerance ||
    openings > accentGrossArea + tolerance ||
    otherOpenings > roomResult.grossWalls - accentGrossArea + tolerance
  )
    return null

  const accentArea = Math.max(0, accentGrossArea - openings)
  const mainArea = Math.max(0, roomResult.paintArea - accentArea)
  if (accentArea <= tolerance || mainArea <= tolerance) return null

  const mainLiters = (mainArea * input.room.coats) / input.room.coverage
  const accentLiters = (accentArea * coats) / coverage
  const mainLitersWithReserve = mainLiters * (1 + PAINT_RESERVE_RATE)
  const accentLitersWithReserve = accentLiters * (1 + PAINT_RESERVE_RATE)
  if (
    ![
      accentGrossArea,
      accentArea,
      mainArea,
      mainLiters,
      accentLiters,
      mainLitersWithReserve,
      accentLitersWithReserve,
    ].every(Number.isFinite)
  )
    return null

  return {
    accentGrossArea,
    accentArea,
    mainArea,
    mainLiters,
    mainLitersWithReserve,
    accentLiters,
    accentLitersWithReserve,
  }
}

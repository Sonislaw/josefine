import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'
import { calculateTileCounts, calculateTilePurchase } from './tiles'

export interface TileSurfaceInput {
  tileLength: number // cm
  tileWidth: number // cm
  waste: number // percent
  tilesPerBox: number
  boxPrice: number | null
}

export interface TileSurfaceResult {
  area: number
  tileCount: number
  withoutReserve: number
  boxCount: number
  purchasedTiles: number
  spareTiles: number
  estimatedCost: number | null
  tileLength: number
  tileWidth: number
  tilesPerBox: number
}

export const tileRoomWallSides = ['lengthA', 'lengthB', 'widthA', 'widthB'] as const
export type TileRoomWallSide = (typeof tileRoomWallSides)[number]

export interface TileWallCoverage {
  sides: readonly TileRoomWallSide[]
  height: number // m, measured from the floor; never greater than room height
}

export type TileOpeningKind = 'door' | 'window'

export interface TileWallOpening {
  kind: TileOpeningKind
  side: TileRoomWallSide
  width: number // m, along the wall
  height: number // m
  bottom: number // m from floor to the opening's lower edge
}

export interface TileWallOpeningDeduction {
  opening: TileWallOpening
  tiledHeight: number
  area: number
  onSelectedWall: boolean
}

export interface TileWallBreakdown {
  side: TileRoomWallSide
  selected: boolean
  wallLength: number
  grossArea: number
  openingArea: number | null // null when only an unassigned manual total is known
  netArea: number | null
}

export interface TileRoomPlanInput {
  room: RoomDimensions
  openings: number // manual m²; ignored when detailedOpenings is provided
  floor: TileSurfaceInput | null
  walls: TileSurfaceInput | null
  wallCoverage?: TileWallCoverage // omitted means every wall up to full room height
  detailedOpenings?: readonly TileWallOpening[]
}

export interface TileRoomPlanResult {
  floor: TileSurfaceResult | null
  walls: TileSurfaceResult | null
  grossWalls: number
  openings: number
  openingDetails: readonly TileWallOpeningDeduction[] | null
  wallBreakdown: readonly TileWallBreakdown[] | null
  netWalls: number
  knownCost: number
  missingPriceCount: number
}

/** Two walls have the room length, the other two have its width. */
export function calculateTiledWallArea(
  room: RoomDimensions,
  coverage?: TileWallCoverage,
): number | null {
  if (!calculateRoomMetrics(room)) return null
  const sides = coverage?.sides ?? tileRoomWallSides
  const height = coverage?.height ?? room.height
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    height > room.height ||
    !Array.isArray(sides) ||
    sides.length === 0 ||
    sides.length > tileRoomWallSides.length ||
    new Set(sides).size !== sides.length ||
    !sides.every((side) => tileRoomWallSides.includes(side))
  )
    return null

  const totalLength = sides.reduce(
    (sum, side) => sum + (side === 'lengthA' || side === 'lengthB' ? room.length : room.width),
    0,
  )
  return totalLength * height
}

/** Only the intersection with the tiled height on a selected wall is deducted. */
export function calculateTiledWallOpenings(
  room: RoomDimensions,
  openings: readonly TileWallOpening[],
  coverage?: TileWallCoverage,
): { totalArea: number; details: TileWallOpeningDeduction[] } | null {
  const wallArea = calculateTiledWallArea(room, coverage)
  if (wallArea === null || !Array.isArray(openings) || openings.length > 12) return null

  const selectedSides = coverage?.sides ?? tileRoomWallSides
  const tiledHeight = coverage?.height ?? room.height
  const details: TileWallOpeningDeduction[] = []
  let totalArea = 0
  for (const opening of openings) {
    if (!opening || !tileRoomWallSides.includes(opening.side)) return null
    const wallLength =
      opening.side === 'lengthA' || opening.side === 'lengthB' ? room.length : room.width
    if (
      (opening.kind !== 'door' && opening.kind !== 'window') ||
      ![opening.width, opening.height, opening.bottom].every(Number.isFinite) ||
      opening.width <= 0 ||
      opening.width > wallLength ||
      opening.height <= 0 ||
      opening.bottom < 0 ||
      opening.bottom + opening.height > room.height + 1e-9
    )
      return null

    const onSelectedWall = selectedSides.includes(opening.side)
    const overlapHeight = onSelectedWall
      ? Math.max(0, Math.min(tiledHeight, opening.bottom + opening.height) - opening.bottom)
      : 0
    const area = opening.width * overlapHeight
    totalArea += area
    details.push({ opening, tiledHeight: overlapHeight, area, onSelectedWall })
  }
  return Number.isFinite(totalArea) ? { totalArea, details } : null
}

/** Manual opening totals cannot be honestly attributed to individual walls. */
export function calculateTileWallBreakdown(
  room: RoomDimensions,
  coverage?: TileWallCoverage,
  openingDetails: readonly TileWallOpeningDeduction[] | null = null,
  manualOpenings = 0,
): TileWallBreakdown[] | null {
  if (
    calculateTiledWallArea(room, coverage) === null ||
    !Number.isFinite(manualOpenings) ||
    manualOpenings < 0 ||
    (openingDetails &&
      openingDetails.some(
        (detail) =>
          !tileRoomWallSides.includes(detail.opening.side) ||
          !Number.isFinite(detail.area) ||
          detail.area < 0,
      ))
  )
    return null

  const selectedSides = coverage?.sides ?? tileRoomWallSides
  const height = coverage?.height ?? room.height
  return tileRoomWallSides.map((side) => {
    const selected = selectedSides.includes(side)
    const wallLength = side === 'lengthA' || side === 'lengthB' ? room.length : room.width
    const grossArea = selected ? wallLength * height : 0
    const openingArea = !selected
      ? 0
      : openingDetails
        ? openingDetails
            .filter((detail) => detail.opening.side === side)
            .reduce((sum, detail) => sum + detail.area, 0)
        : manualOpenings === 0
          ? 0
          : null
    const remainingArea = openingArea === null ? null : grossArea - openingArea
    return {
      side,
      selected,
      wallLength,
      grossArea,
      openingArea,
      netArea:
        remainingArea !== null && remainingArea < 0 && remainingArea > -1e-9 ? 0 : remainingArea,
    }
  })
}

function calculateSurface(area: number, input: TileSurfaceInput): TileSurfaceResult | null {
  const { tileLength, tileWidth, waste, tilesPerBox, boxPrice } = input
  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    ![tileLength, tileWidth, waste].every(Number.isFinite) ||
    tileLength <= 0 ||
    tileLength > 300 ||
    tileWidth <= 0 ||
    tileWidth > 300 ||
    waste < 0 ||
    waste > 100 ||
    !Number.isSafeInteger(tilesPerBox) ||
    tilesPerBox <= 0 ||
    (boxPrice !== null && (!Number.isFinite(boxPrice) || boxPrice < 0 || boxPrice > 100_000))
  )
    return null

  const { withoutReserve, tileCount } = calculateTileCounts(area, tileLength, tileWidth, waste)
  const purchase = calculateTilePurchase(tileCount, tilesPerBox, boxPrice)
  if (
    !Number.isSafeInteger(withoutReserve) ||
    !purchase ||
    (purchase.estimatedCost !== null &&
      !Number.isSafeInteger(Math.round(purchase.estimatedCost * 100)))
  )
    return null

  return {
    area,
    tileCount,
    withoutReserve,
    ...purchase,
    tileLength,
    tileWidth,
    tilesPerBox,
  }
}

/** Independent products are never mixed into a single tile or carton count. */
export function calculateTileRoomPlan(input: TileRoomPlanInput): TileRoomPlanResult | null {
  const metrics = calculateRoomMetrics(input.room)
  const tiledWallArea = input.walls ? calculateTiledWallArea(input.room, input.wallCoverage) : null
  const detailed =
    input.walls && input.detailedOpenings !== undefined
      ? calculateTiledWallOpenings(input.room, input.detailedOpenings, input.wallCoverage)
      : null
  const openings = input.walls ? (detailed?.totalArea ?? input.openings) : 0
  const wallBreakdown = input.walls
    ? calculateTileWallBreakdown(
        input.room,
        input.wallCoverage,
        detailed?.details ?? null,
        detailed ? 0 : openings,
      )
    : null
  if (
    !metrics ||
    (!input.floor && !input.walls) ||
    (input.walls && input.detailedOpenings !== undefined && !detailed) ||
    !Number.isFinite(openings) ||
    openings < 0 ||
    (input.walls &&
      (tiledWallArea === null ||
        openings >= tiledWallArea ||
        wallBreakdown === null ||
        wallBreakdown.some((wall) => wall.netArea !== null && wall.netArea < -1e-9)))
  )
    return null

  const grossWalls = tiledWallArea ?? metrics.walls
  const netWalls = grossWalls - openings
  const floor = input.floor ? calculateSurface(metrics.floor, input.floor) : null
  const walls = input.walls ? calculateSurface(netWalls, input.walls) : null
  if ((input.floor && !floor) || (input.walls && !walls)) return null

  const prices = [floor?.estimatedCost, walls?.estimatedCost].filter(
    (value): value is number | null => value !== undefined,
  )
  const knownCents = prices.reduce<number>(
    (cents, price) => cents + Math.round((price ?? 0) * 100),
    0,
  )
  if (!Number.isSafeInteger(knownCents)) return null
  const knownCost = knownCents / 100
  return {
    floor,
    walls,
    grossWalls,
    openings,
    openingDetails: detailed?.details ?? null,
    wallBreakdown,
    netWalls,
    knownCost,
    missingPriceCount: prices.filter((price) => price === null).length,
  }
}

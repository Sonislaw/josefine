import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'
import { calculateTilePurchase } from './tiles'

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

export interface TileRoomPlanInput {
  room: RoomDimensions
  openings: number // m² of openings inside the selected tiled wall area only
  floor: TileSurfaceInput | null
  walls: TileSurfaceInput | null
  wallCoverage?: TileWallCoverage // omitted means every wall up to full room height
}

export interface TileRoomPlanResult {
  floor: TileSurfaceResult | null
  walls: TileSurfaceResult | null
  grossWalls: number
  openings: number
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

  const tileArea = (tileLength * tileWidth) / 10_000
  const withoutReserve = Math.ceil(area / tileArea)
  const tileCount = Math.ceil((area * (1 + waste / 100)) / tileArea)
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
  if (
    !metrics ||
    (!input.floor && !input.walls) ||
    !Number.isFinite(input.openings) ||
    input.openings < 0 ||
    (input.walls && (tiledWallArea === null || input.openings >= tiledWallArea))
  )
    return null

  const openings = input.walls ? input.openings : 0
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
    netWalls,
    knownCost,
    missingPriceCount: prices.filter((price) => price === null).length,
  }
}

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

export interface TileRoomPlanInput {
  room: RoomDimensions
  openings: number // m² of wall openings only
  floor: TileSurfaceInput | null
  walls: TileSurfaceInput | null
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
  if (
    !metrics ||
    (!input.floor && !input.walls) ||
    !Number.isFinite(input.openings) ||
    input.openings < 0 ||
    (input.walls && input.openings >= metrics.walls)
  )
    return null

  const openings = input.walls ? input.openings : 0
  const netWalls = metrics.walls - openings
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
    grossWalls: metrics.walls,
    openings,
    netWalls,
    knownCost,
    missingPriceCount: prices.filter((price) => price === null).length,
  }
}

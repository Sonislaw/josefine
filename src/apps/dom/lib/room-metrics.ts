import { parseDomNumber } from './calculations'

export interface RoomDimensions {
  length: number
  width: number
  height: number
}

export interface RoomMetrics {
  floor: number
  perimeter: number
  walls: number
  volume: number
}

export function parseRoomDimension(raw: string): number | null {
  const value = parseDomNumber(raw)
  return value !== null && value > 0 && value <= 1000 ? value : null
}

export function isRoomDimensions(value: unknown): value is RoomDimensions {
  if (!value || typeof value !== 'object') return false
  const dimensions = value as Partial<RoomDimensions>
  return (
    typeof dimensions.length === 'number' &&
    typeof dimensions.width === 'number' &&
    typeof dimensions.height === 'number' &&
    calculateRoomMetrics(dimensions as RoomDimensions) !== null
  )
}

/** One rectangular-room model is shared by the homepage planner and saved rooms. */
export function calculateRoomMetrics(dimensions: RoomDimensions): RoomMetrics | null {
  const { length, width, height } = dimensions
  if (
    ![length, width, height].every((value) => Number.isFinite(value) && value > 0 && value <= 1000)
  )
    return null

  const floor = length * width
  const perimeter = 2 * (length + width)
  return { floor, perimeter, walls: perimeter * height, volume: floor * height }
}

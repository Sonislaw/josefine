import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'

export interface WallpaperInput {
  room: RoomDimensions
  rollWidthCm: number
  rollLengthM: number
  trimCm: number
  repeatCm: number
  reservePercent: number
}

export interface WallpaperResult {
  wallArea: number
  longWallStrips: number
  shortWallStrips: number
  strips: number
  stripsWithReserve: number
  cutLengthM: number
  stripsPerRoll: number
  rolls: number
  spareStrips: number
}

const ceilMeasured = (value: number) => Math.ceil(value - 1e-10)
const floorMeasured = (value: number) => Math.floor(value + 1e-10)

/**
 * Count full-height drops on each rectangular wall. One roll yields only whole drops;
 * an area-only division would incorrectly reuse pieces shorter than the wall.
 * The repeat assumes a straight-match pattern; offset/half-drop products need a separate plan.
 */
export function calculateWallpaper(input: WallpaperInput): WallpaperResult | null {
  const { room, rollWidthCm, rollLengthM, trimCm, repeatCm, reservePercent } = input
  const metrics = calculateRoomMetrics(room)
  if (
    !metrics ||
    !Number.isFinite(rollWidthCm) ||
    rollWidthCm <= 0 ||
    rollWidthCm > 500 ||
    !Number.isFinite(rollLengthM) ||
    rollLengthM <= 0 ||
    rollLengthM > 1000 ||
    !Number.isFinite(trimCm) ||
    trimCm < 0 ||
    trimCm > 100 ||
    !Number.isFinite(repeatCm) ||
    repeatCm < 0 ||
    repeatCm > 500 ||
    !Number.isFinite(reservePercent) ||
    reservePercent < 0 ||
    reservePercent > 100
  )
    return null

  const rawCutCm = room.height * 100 + trimCm
  const cutLengthCm =
    repeatCm > 0 ? Math.max(1, ceilMeasured(rawCutCm / repeatCm)) * repeatCm : rawCutCm
  const cutLengthM = cutLengthCm / 100
  const stripsPerRoll = floorMeasured(rollLengthM / cutLengthM)
  if (!Number.isSafeInteger(stripsPerRoll) || stripsPerRoll < 1) return null

  const longWallStrips = Math.max(1, ceilMeasured((room.length * 100) / rollWidthCm))
  const shortWallStrips = Math.max(1, ceilMeasured((room.width * 100) / rollWidthCm))
  const strips = 2 * (longWallStrips + shortWallStrips)
  const stripsWithReserve = ceilMeasured(strips * (1 + reservePercent / 100))
  const rolls = Math.ceil(stripsWithReserve / stripsPerRoll)
  const spareStrips = rolls * stripsPerRoll - stripsWithReserve
  if (
    ![longWallStrips, shortWallStrips, strips, stripsWithReserve, rolls, spareStrips].every(
      Number.isSafeInteger,
    ) ||
    strips < 1 ||
    rolls < 1
  )
    return null

  return {
    wallArea: metrics.walls,
    longWallStrips,
    shortWallStrips,
    strips,
    stripsWithReserve,
    cutLengthM,
    stripsPerRoll,
    rolls,
    spareStrips,
  }
}

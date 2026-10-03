import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'

export type WallpaperSurface =
  { kind: 'room'; room: RoomDimensions } | { kind: 'wall'; widthM: number; heightM: number }

export interface WallpaperInput {
  surface: WallpaperSurface
  rollWidthCm: number
  rollLengthM: number
  trimCm: number
  repeatCm: number
  reservePercent: number
}

export interface WallpaperResult {
  wallArea: number
  stripRows: { label: string; wallCount: number; stripsPerWall: number }[]
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
 * Count full-height drops on each chosen wall. One roll yields only whole drops;
 * an area-only division would incorrectly reuse pieces shorter than the wall.
 * The repeat assumes a straight-match pattern; offset/half-drop products need a separate plan.
 */
export function calculateWallpaper(input: WallpaperInput): WallpaperResult | null {
  const { surface, rollWidthCm, rollLengthM, trimCm, repeatCm, reservePercent } = input
  if (
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

  let wallArea: number
  let wallHeight: number
  let stripRows: WallpaperResult['stripRows']
  if (surface.kind === 'room') {
    const metrics = calculateRoomMetrics(surface.room)
    if (!metrics) return null
    wallArea = metrics.walls
    wallHeight = surface.room.height
    stripRows = [
      {
        label: 'Dwie ściany (długość)',
        wallCount: 2,
        stripsPerWall: ceilMeasured((surface.room.length * 100) / rollWidthCm),
      },
      {
        label: 'Dwie ściany (szerokość)',
        wallCount: 2,
        stripsPerWall: ceilMeasured((surface.room.width * 100) / rollWidthCm),
      },
    ]
  } else {
    const { widthM, heightM } = surface
    if (![widthM, heightM].every((value) => Number.isFinite(value) && value > 0 && value <= 1000))
      return null
    wallArea = widthM * heightM
    wallHeight = heightM
    stripRows = [
      {
        label: 'Wybrana ściana',
        wallCount: 1,
        stripsPerWall: ceilMeasured((widthM * 100) / rollWidthCm),
      },
    ]
  }

  const rawCutCm = wallHeight * 100 + trimCm
  const cutLengthCm =
    repeatCm > 0 ? Math.max(1, ceilMeasured(rawCutCm / repeatCm)) * repeatCm : rawCutCm
  const cutLengthM = cutLengthCm / 100
  const stripsPerRoll = floorMeasured(rollLengthM / cutLengthM)
  if (!Number.isSafeInteger(stripsPerRoll) || stripsPerRoll < 1) return null

  const strips = stripRows.reduce((sum, row) => sum + row.wallCount * row.stripsPerWall, 0)
  const stripsWithReserve = ceilMeasured(strips * (1 + reservePercent / 100))
  const rolls = Math.ceil(stripsWithReserve / stripsPerRoll)
  const spareStrips = rolls * stripsPerRoll - stripsWithReserve
  if (
    ![
      ...stripRows.map((row) => row.stripsPerWall),
      strips,
      stripsWithReserve,
      rolls,
      spareStrips,
    ].every(Number.isSafeInteger) ||
    strips < 1 ||
    rolls < 1
  )
    return null

  return {
    wallArea,
    stripRows,
    strips,
    stripsWithReserve,
    cutLengthM,
    stripsPerRoll,
    rolls,
    spareStrips,
  }
}

export type TileOrientation = 'standard' | 'rotated'

export interface TileLayoutCell {
  x: number
  y: number
  width: number
  height: number
  cut: boolean
}

export interface TileLayoutPreview {
  roomLengthCm: number
  roomWidthCm: number
  tileLengthCm: number
  tileWidthCm: number
  columns: number
  rows: number
  cutCells: number
  rightCutCm: number | null
  bottomCutCm: number | null
  narrowRight: boolean
  narrowBottom: boolean
  tooDense: boolean
  cells: TileLayoutCell[]
}

const maxPreviewCells = 600
const tolerance = 1e-7

/** Draws a straight, corner-start layout. This is a visual aid, not a purchase algorithm. */
export function calculateTileLayoutPreview(input: {
  roomLengthM: number
  roomWidthM: number
  tileLengthCm: number
  tileWidthCm: number
  orientation: TileOrientation
}): TileLayoutPreview | null {
  const { roomLengthM, roomWidthM, orientation } = input
  const [tileLengthCm, tileWidthCm] =
    orientation === 'rotated'
      ? [input.tileWidthCm, input.tileLengthCm]
      : [input.tileLengthCm, input.tileWidthCm]
  if (
    ![roomLengthM, roomWidthM, tileLengthCm, tileWidthCm].every(Number.isFinite) ||
    roomLengthM < 0.01 ||
    roomWidthM < 0.01 ||
    roomLengthM > 1000 ||
    roomWidthM > 1000 ||
    tileLengthCm < 1 ||
    tileWidthCm < 1 ||
    tileLengthCm > 1000 ||
    tileWidthCm > 1000 ||
    (orientation !== 'standard' && orientation !== 'rotated')
  )
    return null

  const roomLengthCm = roomLengthM * 100
  const roomWidthCm = roomWidthM * 100
  const columns = Math.ceil(roomLengthCm / tileLengthCm - tolerance)
  const rows = Math.ceil(roomWidthCm / tileWidthCm - tolerance)
  const lastWidth = roomLengthCm - (columns - 1) * tileLengthCm
  const lastHeight = roomWidthCm - (rows - 1) * tileWidthCm
  const rightCutCm = lastWidth < tileLengthCm - tolerance ? lastWidth : null
  const bottomCutCm = lastHeight < tileWidthCm - tolerance ? lastHeight : null
  const fullColumns = columns - (rightCutCm === null ? 0 : 1)
  const fullRows = rows - (bottomCutCm === null ? 0 : 1)
  const cutCells = columns * rows - fullColumns * fullRows
  const tooDense = columns * rows > maxPreviewCells
  const cells: TileLayoutCell[] = []

  if (!tooDense) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        cells.push({
          x: column * tileLengthCm,
          y: row * tileWidthCm,
          width: column === columns - 1 ? lastWidth : tileLengthCm,
          height: row === rows - 1 ? lastHeight : tileWidthCm,
          cut:
            (column === columns - 1 && rightCutCm !== null) ||
            (row === rows - 1 && bottomCutCm !== null),
        })
      }
    }
  }

  return {
    roomLengthCm,
    roomWidthCm,
    tileLengthCm,
    tileWidthCm,
    columns,
    rows,
    cutCells,
    rightCutCm,
    bottomCutCm,
    narrowRight: rightCutCm !== null && rightCutCm / tileLengthCm < 0.25,
    narrowBottom: bottomCutCm !== null && bottomCutCm / tileWidthCm < 0.25,
    tooDense,
    cells,
  }
}

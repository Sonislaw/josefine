// Each rate belongs to a concrete measurement already available for a saved room.
export const roomLaborTasks = [
  { id: 'painting', label: 'Malowanie ścian i sufitu', unit: 'm²' },
  { id: 'flooring', label: 'Układanie paneli', unit: 'm²' },
  { id: 'skirting', label: 'Montaż listew', unit: 'm' },
  { id: 'tilingFloor', label: 'Układanie płytek na podłodze', unit: 'm²' },
  { id: 'tilingWalls', label: 'Układanie płytek na ścianach', unit: 'm²' },
] as const

export type RoomLaborKind = (typeof roomLaborTasks)[number]['id']
export type RoomLaborRates = Partial<Record<RoomLaborKind, number>>

export interface RoomLaborLine {
  id: RoomLaborKind
  label: string
  quantity: number
  unit: string
  rate: number
  cost: number
}

export interface RoomLaborSummary {
  lines: RoomLaborLine[]
  total: number
}

export interface RoomTilingAreas {
  floor: number
  walls: number
  missingAreaCount: number
}

export interface RoomPanelAreas {
  area: number
  missingAreaCount: number
}

export interface RoomSkirtingLengths {
  length: number
  missingLengthCount: number
}

export interface RoomPaintingAreas {
  walls: number
  ceiling: number
  missingAreaCount: number
}

interface SkirtingLengthItem {
  kind: string
  skirtingLengthM?: number
}

/** Purchased board length (with reserve) is not the length charged for installation. */
export function calculateRoomSkirtingLengths(
  items: readonly SkirtingLengthItem[],
): RoomSkirtingLengths {
  const result: RoomSkirtingLengths = { length: 0, missingLengthCount: 0 }
  for (const item of items) {
    if (item.kind !== 'skirting') continue
    if (
      typeof item.skirtingLengthM === 'number' &&
      Number.isFinite(item.skirtingLengthM) &&
      item.skirtingLengthM > 0
    )
      result.length += item.skirtingLengthM
    else result.missingLengthCount++
  }
  return result
}

interface PaintingAreaItem {
  kind: string
  paintWallAreaM2?: number
  paintCeilingAreaM2?: number
}

/** Each saved paint colour covers a separate surface; never infer area from can count. */
export function calculateRoomPaintingAreas(items: readonly PaintingAreaItem[]): RoomPaintingAreas {
  const result: RoomPaintingAreas = { walls: 0, ceiling: 0, missingAreaCount: 0 }
  for (const item of items) {
    if (item.kind !== 'paintCans') continue
    const walls = item.paintWallAreaM2
    const ceiling = item.paintCeilingAreaM2
    const validWalls = typeof walls === 'number' && Number.isFinite(walls) && walls > 0
    const validCeiling = typeof ceiling === 'number' && Number.isFinite(ceiling) && ceiling > 0
    if (!validWalls && !validCeiling) result.missingAreaCount++
    if (validWalls) result.walls += walls
    if (validCeiling) result.ceiling += ceiling
  }
  return result
}

interface PanelAreaItem {
  kind: string
  panelAreaM2?: number
}

/** Purchase quantities and waste never become labor coverage. */
export function calculateRoomPanelAreas(items: readonly PanelAreaItem[]): RoomPanelAreas {
  const result: RoomPanelAreas = { area: 0, missingAreaCount: 0 }
  for (const item of items) {
    if (item.kind !== 'panels') continue
    if (
      typeof item.panelAreaM2 === 'number' &&
      Number.isFinite(item.panelAreaM2) &&
      item.panelAreaM2 > 0
    )
      result.area += item.panelAreaM2
    else result.missingAreaCount++
  }
  return result
}

interface TilingAreaItem {
  kind: string
  tileSurface?: 'floor' | 'walls'
  tiledAreaM2?: number
}

/** Stored tile purchases carry the measured coverage, independent of carton count. */
export function calculateRoomTilingAreas(items: readonly TilingAreaItem[]): RoomTilingAreas {
  const result: RoomTilingAreas = { floor: 0, walls: 0, missingAreaCount: 0 }
  for (const item of items) {
    if (item.kind !== 'tilePieces' && item.kind !== 'tileBoxes') continue
    if (
      (item.tileSurface === 'floor' || item.tileSurface === 'walls') &&
      typeof item.tiledAreaM2 === 'number' &&
      Number.isFinite(item.tiledAreaM2) &&
      item.tiledAreaM2 > 0
    )
      result[item.tileSurface] += item.tiledAreaM2
    else result.missingAreaCount++
  }
  return result
}

const maximumRate = 1_000_000

function isLaborRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximumRate
}

export function isRoomLaborRates(value: unknown): value is RoomLaborRates {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(
    ([key, rate]) => roomLaborTasks.some((task) => task.id === key) && isLaborRate(rate),
  )
}

/** Empty means "not included"; undefined signals an invalid PLN amount. */
export function parseOptionalLaborRate(raw: string): number | null | undefined {
  const normalized = raw
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
  if (!normalized) return null
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined
  const value = Number(normalized)
  return isLaborRate(value) ? value : undefined
}

/** Round each included task to grosze before adding it to the room budget. */
export function calculateRoomLabor(
  rates: RoomLaborRates | undefined,
  tiling: RoomTilingAreas = { floor: 0, walls: 0, missingAreaCount: 0 },
  panels: RoomPanelAreas = { area: 0, missingAreaCount: 0 },
  skirting: RoomSkirtingLengths = { length: 0, missingLengthCount: 0 },
  painting: RoomPaintingAreas = { walls: 0, ceiling: 0, missingAreaCount: 0 },
): RoomLaborSummary {
  if (!rates) return { lines: [], total: 0 }
  const quantities: Record<RoomLaborKind, number | null> = {
    painting: painting.walls + painting.ceiling > 0 ? painting.walls + painting.ceiling : null,
    flooring: panels.area > 0 ? panels.area : null,
    skirting: skirting.length > 0 ? skirting.length : null,
    tilingFloor: tiling.floor > 0 ? tiling.floor : null,
    tilingWalls: tiling.walls > 0 ? tiling.walls : null,
  }
  const lines = roomLaborTasks.flatMap((task) => {
    const rate = rates[task.id]
    const quantity = quantities[task.id]
    if (rate === undefined || quantity === null || quantity <= 0) return []
    const cost = Math.round(quantity * Math.round(rate * 100)) / 100
    return [{ id: task.id, label: task.label, quantity, unit: task.unit, rate, cost }]
  })
  return {
    lines,
    total: lines.reduce((cents, line) => cents + Math.round(line.cost * 100), 0) / 100,
  }
}

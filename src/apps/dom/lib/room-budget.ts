import type { RoomMetrics } from './room-metrics'

// Each rate belongs to a concrete measurement already available for a saved room.
export const roomLaborTasks = [
  { id: 'painting', label: 'Malowanie pozostałych ścian', unit: 'm²' },
  { id: 'flooring', label: 'Układanie pozostałej podłogi', unit: 'm²' },
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
  metrics: RoomMetrics | null,
  rates: RoomLaborRates | undefined,
  tiling: RoomTilingAreas = { floor: 0, walls: 0, missingAreaCount: 0 },
): RoomLaborSummary {
  if (!rates) return { lines: [], total: 0 }
  const quantities: Record<RoomLaborKind, number | null> = {
    painting: metrics ? Math.max(0, metrics.walls - tiling.walls) : null,
    flooring: metrics ? Math.max(0, metrics.floor - tiling.floor) : null,
    skirting: metrics?.perimeter ?? null,
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

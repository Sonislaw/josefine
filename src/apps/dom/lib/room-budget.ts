import type { RoomMetrics } from './room-metrics'

// Each rate belongs to a concrete measurement already available for a saved room.
export const roomLaborTasks = [
  { id: 'painting', label: 'Malowanie ścian', metric: 'walls', unit: 'm²' },
  { id: 'flooring', label: 'Układanie podłogi', metric: 'floor', unit: 'm²' },
  { id: 'skirting', label: 'Montaż listew', metric: 'perimeter', unit: 'm' },
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
): RoomLaborSummary {
  if (!metrics || !rates) return { lines: [], total: 0 }
  const lines = roomLaborTasks.flatMap((task) => {
    const rate = rates[task.id]
    if (rate === undefined) return []
    const quantity = metrics[task.metric]
    const cost = Math.round(quantity * Math.round(rate * 100)) / 100
    return [{ id: task.id, label: task.label, quantity, unit: task.unit, rate, cost }]
  })
  return {
    lines,
    total: lines.reduce((cents, line) => cents + Math.round(line.cost * 100), 0) / 100,
  }
}

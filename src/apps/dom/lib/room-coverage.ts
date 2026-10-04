import type { RoomMetrics } from './room-metrics'
import type {
  RoomPaintingAreas,
  RoomPanelAreas,
  RoomSkirtingLengths,
  RoomTilingAreas,
} from './room-budget'

export interface RoomCoveragePart {
  label: string
  value: number
}

export interface RoomCoverageRow {
  id: 'floor' | 'walls' | 'ceiling' | 'skirting'
  label: string
  unit: 'm²' | 'm'
  available: number | null
  planned: number
  unallocated: number | null
  excess: number
  parts: RoomCoveragePart[]
}

export interface RoomCoverageAudit {
  rows: RoomCoverageRow[]
  missingMeasurements: { label: string; count: number }[]
}

function makeRow(
  id: RoomCoverageRow['id'],
  label: string,
  unit: RoomCoverageRow['unit'],
  available: number | null,
  parts: RoomCoveragePart[],
): RoomCoverageRow {
  const planned = parts.reduce((total, part) => total + part.value, 0)
  const difference = available === null ? null : available - planned
  return {
    id,
    label,
    unit,
    available,
    planned,
    // A positive difference is only unallocated space, not an automatically missing task.
    unallocated: difference === null ? null : Math.max(0, difference),
    excess: difference !== null && difference < -0.000001 ? -difference : 0,
    parts,
  }
}

/** Audit measurements only; it never creates purchases or adds labor to the budget. */
export function calculateRoomCoverage(
  metrics: RoomMetrics | null,
  panels: RoomPanelAreas,
  tiling: RoomTilingAreas,
  painting: RoomPaintingAreas,
  skirting: RoomSkirtingLengths,
): RoomCoverageAudit {
  const rows = [
    makeRow('floor', 'Podłoga', 'm²', metrics?.floor ?? null, [
      { label: 'Panele', value: panels.area },
      { label: 'Płytki', value: tiling.floor },
    ]),
    makeRow('walls', 'Ściany', 'm²', metrics?.walls ?? null, [
      { label: 'Malowanie', value: painting.walls },
      { label: 'Płytki', value: tiling.walls },
    ]),
    makeRow('ceiling', 'Sufit', 'm²', metrics?.floor ?? null, [
      { label: 'Malowanie', value: painting.ceiling },
    ]),
    makeRow('skirting', 'Listwy', 'm', metrics?.perimeter ?? null, [
      { label: 'Montaż', value: skirting.length },
    ]),
  ]
  const missingMeasurements = [
    { label: 'panele', count: panels.missingAreaCount },
    { label: 'płytki', count: tiling.missingAreaCount },
    { label: 'farba', count: painting.missingAreaCount },
    { label: 'listwy', count: skirting.missingLengthCount },
  ].filter((entry) => entry.count > 0)
  return { rows, missingMeasurements }
}

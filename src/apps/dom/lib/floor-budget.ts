import type { ShoppingItem } from '../stores/shoppingList'
import type { MaterialBudgetLine } from './material-budget'
import { makeMaterialBudgetLine, summarizeMaterialBudget } from './material-budget'
import type { RoomLaborLine, RoomLaborSummary, RoomTilingAreas } from './room-budget'
import type { RoomMetrics } from './room-metrics'

export type FloorMaterialId = 'panels' | 'underlay' | 'skirting'

export interface FloorBudgetSummary {
  materials: MaterialBudgetLine<FloorMaterialId>[]
  laborLines: RoomLaborLine[]
  knownTotal: number
  hasKnownCost: boolean
  missingPriceCount: number
  remainingFloorArea: number | null
  roomPerimeter: number | null
  hasPanels: boolean
  hasUnderlay: boolean
  hasSkirting: boolean
  missingDimensions: boolean
  missingFloorRate: boolean
  missingSkirtingRate: boolean
  floorFullyTiled: boolean
  unknownTileAreaCount: number
}

const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)

/** Floor work remains separate from tiling: only the untiled floor enters the flooring rate. */
export function calculateFloorBudget(
  items: readonly ShoppingItem[],
  labor: RoomLaborSummary,
  tiling: RoomTilingAreas,
  metrics: RoomMetrics | null,
): FloorBudgetSummary | null {
  const panelItems = items.filter((item) => item.kind === 'panels')
  const underlayItems = items.filter((item) => item.kind === 'underlay')
  const skirtingItems = items.filter((item) => item.kind === 'skirting')
  if (!panelItems.length && !underlayItems.length && !skirtingItems.length) return null

  const materials: MaterialBudgetLine<FloorMaterialId>[] = [
    makeMaterialBudgetLine(
      'panels',
      'Panele',
      '/liczba-paczek-paneli',
      panelItems,
      panelItems.length
        ? `${formatCount(panelItems.reduce((sum, item) => sum + item.quantity, 0))} pacz.`
        : '',
    ),
    makeMaterialBudgetLine(
      'underlay',
      'Podkład',
      '/liczba-paczek-paneli',
      underlayItems,
      underlayItems.length
        ? `${formatCount(underlayItems.reduce((sum, item) => sum + item.quantity, 0))} opak.`
        : '',
    ),
    makeMaterialBudgetLine(
      'skirting',
      'Listwy',
      '/obwod-prostokata',
      skirtingItems,
      skirtingItems.length
        ? `${formatCount(skirtingItems.reduce((sum, item) => sum + item.quantity, 0))} szt.`
        : '',
    ),
  ]
  // A rate without its corresponding purchase stays in the main budget, not this material view.
  const laborLines = labor.lines.filter(
    (line) =>
      (line.id === 'flooring' && panelItems.length > 0) ||
      (line.id === 'skirting' && skirtingItems.length > 0),
  )
  const remainingFloorArea = metrics ? Math.max(0, metrics.floor - tiling.floor) : null
  const costs = summarizeMaterialBudget(materials, laborLines)

  return {
    materials,
    laborLines,
    ...costs,
    remainingFloorArea,
    roomPerimeter: metrics?.perimeter ?? null,
    hasPanels: panelItems.length > 0,
    hasUnderlay: underlayItems.length > 0,
    hasSkirting: skirtingItems.length > 0,
    missingDimensions: metrics === null && (panelItems.length > 0 || skirtingItems.length > 0),
    missingFloorRate:
      panelItems.length > 0 &&
      remainingFloorArea !== null &&
      remainingFloorArea > 0 &&
      !laborLines.some((line) => line.id === 'flooring'),
    missingSkirtingRate:
      skirtingItems.length > 0 &&
      metrics !== null &&
      !laborLines.some((line) => line.id === 'skirting'),
    floorFullyTiled: panelItems.length > 0 && remainingFloorArea === 0,
    unknownTileAreaCount: tiling.missingAreaCount,
  }
}

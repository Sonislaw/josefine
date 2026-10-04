import type { ShoppingItem } from '../stores/shoppingList'
import type { RoomLaborLine, RoomLaborSummary, RoomTilingAreas } from './room-budget'
import type { RoomMetrics } from './room-metrics'
import {
  makeMaterialBudgetLine,
  summarizeMaterialBudget,
  type MaterialBudgetLine,
} from './material-budget'

export type TilingMaterialId = 'tiles' | 'adhesive' | 'grout'

export type TilingMaterialLine = MaterialBudgetLine<TilingMaterialId>

export interface TilingBudgetSummary {
  materials: TilingMaterialLine[]
  laborLines: RoomLaborLine[]
  knownTotal: number
  hasKnownCost: boolean
  missingPriceCount: number
  missingAreaCount: number
  missingLaborRateFloor: boolean
  missingLaborRateWalls: boolean
  floorArea: number
  wallArea: number
  exceedsFloor: boolean
  exceedsWalls: boolean
}

const formatCount = (value: number) => new Intl.NumberFormat('pl-PL').format(value)

/** This is a breakdown of the existing room budget, never an additional charge. */
export function calculateTilingBudget(
  items: readonly ShoppingItem[],
  labor: RoomLaborSummary,
  tiling: RoomTilingAreas,
  metrics: RoomMetrics | null,
): TilingBudgetSummary | null {
  const tileItems = items.filter((item) => item.kind === 'tilePieces' || item.kind === 'tileBoxes')
  const adhesiveItems = items.filter((item) => item.kind === 'tileAdhesiveBags')
  const groutItems = items.filter((item) => item.kind === 'groutPacks')
  if (!tileItems.length && !adhesiveItems.length && !groutItems.length) return null

  const boxes = tileItems
    .filter((item) => item.kind === 'tileBoxes')
    .reduce((sum, item) => sum + item.quantity, 0)
  const pieces = tileItems
    .filter((item) => item.kind === 'tilePieces')
    .reduce((sum, item) => sum + item.quantity, 0)
  const tileQuantity = [
    boxes ? `${formatCount(boxes)} kart.` : '',
    pieces ? `${formatCount(pieces)} szt.` : '',
  ]
    .filter(Boolean)
    .join(' + ')
  const adhesiveQuantity = adhesiveItems.reduce((sum, item) => sum + item.quantity, 0)
  const groutQuantity = groutItems.reduce((sum, item) => sum + item.quantity, 0)

  const materials: TilingMaterialLine[] = [
    makeMaterialBudgetLine('tiles', 'Płytki', '/plytki-na-podloge', tileItems, tileQuantity),
    makeMaterialBudgetLine(
      'adhesive',
      'Klej',
      '/klej-do-plytek',
      adhesiveItems,
      adhesiveQuantity ? `${formatCount(adhesiveQuantity)} work.` : '',
    ),
    makeMaterialBudgetLine(
      'grout',
      'Fuga',
      '/kalkulator-fugi',
      groutItems,
      groutQuantity ? `${formatCount(groutQuantity)} opak.` : '',
    ),
  ]
  const laborLines = labor.lines.filter(
    (line) => line.id === 'tilingFloor' || line.id === 'tilingWalls',
  )
  const costs = summarizeMaterialBudget(materials, laborLines)

  return {
    materials,
    laborLines,
    ...costs,
    missingAreaCount: tiling.missingAreaCount,
    missingLaborRateFloor:
      tiling.floor > 0 && !laborLines.some((line) => line.id === 'tilingFloor'),
    missingLaborRateWalls:
      tiling.walls > 0 && !laborLines.some((line) => line.id === 'tilingWalls'),
    floorArea: tiling.floor,
    wallArea: tiling.walls,
    exceedsFloor: metrics !== null && tiling.floor > metrics.floor + 0.000001,
    exceedsWalls: metrics !== null && tiling.walls > metrics.walls + 0.000001,
  }
}

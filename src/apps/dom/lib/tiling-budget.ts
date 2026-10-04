import type { ShoppingItem } from '../stores/shoppingList'
import type { RoomLaborLine, RoomLaborSummary, RoomTilingAreas } from './room-budget'
import type { RoomMetrics } from './room-metrics'

export type TilingMaterialId = 'tiles' | 'adhesive' | 'grout'

export interface TilingMaterialLine {
  id: TilingMaterialId
  label: string
  path: string
  itemCount: number
  quantityLabel: string
  pricedCount: number
  missingPriceCount: number
  knownCost: number
}

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

  const materialLine = (
    id: TilingMaterialId,
    label: string,
    path: string,
    group: ShoppingItem[],
    quantityLabel: string,
  ): TilingMaterialLine => ({
    id,
    label,
    path,
    itemCount: group.length,
    quantityLabel,
    pricedCount: group.filter((item) => item.cost !== null).length,
    missingPriceCount: group.filter((item) => item.cost === null).length,
    knownCost:
      group.reduce(
        (cents, item) => cents + (item.cost === null ? 0 : Math.round(item.cost * 100)),
        0,
      ) / 100,
  })

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

  const materials = [
    materialLine('tiles', 'Płytki', '/liczba-plytek', tileItems, tileQuantity),
    materialLine(
      'adhesive',
      'Klej',
      '/klej-do-plytek',
      adhesiveItems,
      adhesiveQuantity ? `${formatCount(adhesiveQuantity)} work.` : '',
    ),
    materialLine(
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
  const knownCents =
    materials.reduce((cents, line) => cents + Math.round(line.knownCost * 100), 0) +
    laborLines.reduce((cents, line) => cents + Math.round(line.cost * 100), 0)

  return {
    materials,
    laborLines,
    knownTotal: knownCents / 100,
    hasKnownCost: materials.some((line) => line.pricedCount > 0) || laborLines.length > 0,
    missingPriceCount: materials.reduce((count, line) => count + line.missingPriceCount, 0),
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

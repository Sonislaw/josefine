import type { ShoppingItem } from '../stores/shoppingList'
import type { RoomLaborLine } from './room-budget'

/** Dom work summaries reuse the same priced-purchase math as the room budget. */
export interface MaterialBudgetLine<Id extends string> {
  id: Id
  label: string
  path: string
  itemCount: number
  quantityLabel: string
  pricedCount: number
  missingPriceCount: number
  knownCost: number
}

export function makeMaterialBudgetLine<Id extends string>(
  id: Id,
  label: string,
  path: string,
  items: readonly ShoppingItem[],
  quantityLabel: string,
): MaterialBudgetLine<Id> {
  return {
    id,
    label,
    path,
    itemCount: items.length,
    quantityLabel,
    pricedCount: items.filter((item) => item.cost !== null).length,
    missingPriceCount: items.filter((item) => item.cost === null).length,
    knownCost:
      items.reduce(
        (cents, item) => cents + (item.cost === null ? 0 : Math.round(item.cost * 100)),
        0,
      ) / 100,
  }
}

/** A breakdown is a subset of existing costs; it must never be added again to the room total. */
export function summarizeMaterialBudget(
  materials: readonly MaterialBudgetLine<string>[],
  laborLines: readonly RoomLaborLine[],
) {
  const knownCents =
    materials.reduce((cents, line) => cents + Math.round(line.knownCost * 100), 0) +
    laborLines.reduce((cents, line) => cents + Math.round(line.cost * 100), 0)
  return {
    knownTotal: knownCents / 100,
    hasKnownCost: materials.some((line) => line.pricedCount > 0) || laborLines.length > 0,
    missingPriceCount: materials.reduce((count, line) => count + line.missingPriceCount, 0),
  }
}

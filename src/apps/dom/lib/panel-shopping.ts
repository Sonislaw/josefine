import type { ShoppingDraft } from '../stores/shoppingList'
import type { calculatePanelPurchase } from './panels'

type PanelPurchase = NonNullable<ReturnType<typeof calculatePanelPurchase>>

/** The underlay card must never save another copy of the already planned panels. */
export function createPanelShoppingDrafts(
  purchase: PanelPurchase,
  area: number,
  includeUnderlay: boolean,
  onlyUnderlay: boolean,
): ShoppingDraft[] {
  const drafts: ShoppingDraft[] = []
  if (!onlyUnderlay)
    drafts.push({
      kind: 'panels',
      quantity: purchase.panels.packCount,
      cost: purchase.panelCost,
      // Labor covers the laid floor, not the purchased area with cutting reserve.
      panelAreaM2: area,
    })
  if (includeUnderlay && purchase.underlayCount !== null)
    drafts.push({
      kind: 'underlay',
      quantity: purchase.underlayCount,
      cost: purchase.underlayCost,
    })
  return drafts
}

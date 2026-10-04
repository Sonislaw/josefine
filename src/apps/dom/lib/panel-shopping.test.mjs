import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculatePanelPurchase } = jiti('./panels.ts')
const { createPanelShoppingDrafts } = jiti('./panel-shopping.ts')

test('the underlay-only flow does not duplicate panel purchases', () => {
  const purchase = calculatePanelPurchase({
    area: 12,
    packCoverage: 2,
    waste: 10,
    packPrice: 149,
    underlay: { coverage: 10, packPrice: 49 },
  })
  assert.ok(purchase)
  assert.deepEqual(
    createPanelShoppingDrafts(purchase, 12, true, true).map((item) => item.kind),
    ['underlay'],
  )
  assert.deepEqual(
    createPanelShoppingDrafts(purchase, 12, true, false).map((item) => item.kind),
    ['panels', 'underlay'],
  )
  assert.deepEqual(
    createPanelShoppingDrafts(purchase, 12, false, false).map((item) => item.kind),
    ['panels'],
  )
})

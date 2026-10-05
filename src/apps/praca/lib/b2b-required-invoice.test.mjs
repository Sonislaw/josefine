import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { findRequiredB2bInvoice } = jiti('./b2b-required-invoice.ts')
const { calcB2bYear } = jiti('./b2b-year.ts')
const { calcUopYear } = jiti('./uop-year.ts')

const settings = {
  costs: 1_000,
  form: 'linear',
  rate: 12,
  zus: 'full',
  sickness: false,
}

test('finds the lowest whole-PLN invoice meeting the annual UoP net target', () => {
  const target = calcUopYear({ gross: 15_000, under26: false, elevatedKup: false, ppk: false })
    .totals.net
  const result = findRequiredB2bInvoice(target, settings)
  assert.ok(result)
  assert.equal(
    result.annualNet,
    calcB2bYear({ ...settings, invoice: result.invoice }).netAfterHealthSettlement,
  )
  assert.ok(result.annualNet >= target)
  assert.ok(
    calcB2bYear({ ...settings, invoice: result.invoice - 1 }).netAfterHealthSettlement < target,
  )
  assert.equal(result.differenceToTarget, Math.round((result.annualNet - target) * 100) / 100)
})

test('checks the lower feasible range before the 60k lump-sum health jump', () => {
  const lumpSettings = { ...settings, costs: 0, form: 'lump', zus: 'start' }
  const target = calcB2bYear({ ...lumpSettings, invoice: 5_210 }).netAfterHealthSettlement
  assert.equal(calcB2bYear({ ...lumpSettings, invoice: 5_210 }).annualLumpHealthBracket, 0)
  assert.equal(calcB2bYear({ ...lumpSettings, invoice: 5_211 }).annualLumpHealthBracket, 1)
  assert.ok(calcB2bYear({ ...lumpSettings, invoice: 5_211 }).netAfterHealthSettlement < target)
  assert.equal(findRequiredB2bInvoice(target, lumpSettings)?.invoice, 5_210)
})

test('checks the lower feasible range before the 300k lump-sum health jump', () => {
  const lumpSettings = { ...settings, costs: 0, form: 'lump', zus: 'start' }
  const target = calcB2bYear({ ...lumpSettings, invoice: 25_210 }).netAfterHealthSettlement
  assert.equal(calcB2bYear({ ...lumpSettings, invoice: 25_210 }).annualLumpHealthBracket, 1)
  assert.equal(calcB2bYear({ ...lumpSettings, invoice: 25_211 }).annualLumpHealthBracket, 2)
  assert.ok(calcB2bYear({ ...lumpSettings, invoice: 25_211 }).netAfterHealthSettlement < target)
  assert.equal(findRequiredB2bInvoice(target, lumpSettings)?.invoice, 25_210)
})

test('reports an unreachable target and rejects invalid input', () => {
  assert.equal(findRequiredB2bInvoice(2_000_000_000, settings), null)
  assert.throws(() => findRequiredB2bInvoice(-1, settings), RangeError)
  assert.throws(() => findRequiredB2bInvoice(100_000, { ...settings, costs: -1 }), RangeError)
})

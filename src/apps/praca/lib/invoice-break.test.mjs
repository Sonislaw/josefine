import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculateInvoiceAfterBreak } = jiti('./invoice-break.ts')
const { calcWorkYearComparison } = jiti('./work-year-comparison.ts')

const base = { baseInvoice: 18_000, billing: 'daily', contractDays: 20, nonBillableDays: 5 }

test('prorates an invoice only for the supplied non-billable contract days', () => {
  assert.deepEqual(calculateInvoiceAfterBreak(base), { invoice: 13_500, reduction: 4_500 })
  assert.deepEqual(calculateInvoiceAfterBreak({ ...base, nonBillableDays: 20 }), {
    invoice: 0,
    reduction: 18_000,
  })
  assert.deepEqual(calculateInvoiceAfterBreak({ ...base, nonBillableDays: 0 }), {
    invoice: 18_000,
    reduction: 0,
  })
})

test('a fixed monthly invoice is unaffected by the break', () => {
  assert.deepEqual(calculateInvoiceAfterBreak({ ...base, billing: 'fixed' }), {
    invoice: 18_000,
    reduction: 0,
  })
})

test('rounds the final invoice to grosze without changing the base amount', () => {
  assert.deepEqual(
    calculateInvoiceAfterBreak({
      baseInvoice: 1_000,
      billing: 'daily',
      contractDays: 21,
      nonBillableDays: 1,
    }),
    { invoice: 952.38, reduction: 47.62 },
  )
})

test('rejects invalid days, amounts and billing modes', () => {
  assert.equal(calculateInvoiceAfterBreak({ ...base, contractDays: 0 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, contractDays: 32 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, nonBillableDays: 21 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, nonBillableDays: -1 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, nonBillableDays: 1.5 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, baseInvoice: -1 }), null)
  assert.equal(calculateInvoiceAfterBreak({ ...base, billing: 'other' }), null)
})

test('the proposed invoice can be used for one month of the annual comparison', () => {
  const proposal = calculateInvoiceAfterBreak(base)
  const uop = { gross: 15_000, under26: false, elevatedKup: false, ppk: false }
  const b2b = {
    invoice: base.baseInvoice,
    costs: 1_000,
    form: 'linear',
    rate: 12,
    zus: 'full',
    sickness: false,
  }
  const invoices = Array(12).fill(base.baseInvoice)
  invoices[6] = proposal.invoice
  const result = calcWorkYearComparison(uop, b2b, 2026, invoices)
  const unchanged = calcWorkYearComparison(uop, b2b)
  assert.equal(result.months[6].b2b.invoice, proposal.invoice)
  assert.equal(result.months[5].b2b.invoice, base.baseInvoice)
  assert.equal(result.b2b.totals.invoice, unchanged.b2b.totals.invoice - proposal.reduction)
  assert.ok(result.differenceAfterHealthSettlement < unchanged.differenceAfterHealthSettlement)
})

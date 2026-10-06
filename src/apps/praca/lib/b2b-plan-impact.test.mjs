import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calcB2bYear, calcB2bYearFromPlan } = jiti('./b2b-year.ts')
const { calcB2bPlanImpact } = jiti('./b2b-plan-impact.ts')

const input = {
  invoice: 18_000,
  costs: 1_000,
  form: 'linear',
  rate: 12,
  zus: 'full',
  sickness: false,
}

test('an unchanged twelve-month plan has no invoice or net difference', () => {
  const baseline = calcB2bYear(input)
  const impact = calcB2bPlanImpact(input, baseline)
  assert.deepEqual(impact.changedMonths, [])
  assert.equal(impact.invoiceDifference, 0)
  assert.equal(impact.netDifference, 0)
})

test('one reduced invoice changes only the plan, not the baseline', () => {
  const invoices = Array(12).fill(input.invoice)
  invoices[6] = 13_500
  const planned = calcB2bYearFromPlan({ ...input, invoices })
  const impact = calcB2bPlanImpact(input, planned)
  assert.deepEqual(impact.changedMonths, [7])
  assert.equal(impact.baseline.totals.invoice, input.invoice * 12)
  assert.equal(impact.planned.totals.invoice, input.invoice * 12 - 4_500)
  assert.equal(impact.invoiceDifference, -4_500)
  assert.equal(
    impact.netDifference,
    Math.round(
      (planned.netAfterHealthSettlement - impact.baseline.netAfterHealthSettlement) * 100,
    ) / 100,
  )
  assert.ok(impact.netDifference < 0)
})

test('same annual invoices in different months are not assumed to have identical net', () => {
  const invoices = Array(12).fill(input.invoice)
  invoices[0] -= 5_000
  invoices[11] += 5_000
  const planned = calcB2bYearFromPlan({ ...input, invoices })
  const impact = calcB2bPlanImpact(input, planned)
  assert.deepEqual(impact.changedMonths, [1, 12])
  assert.equal(impact.invoiceDifference, 0)
  assert.equal(
    impact.netDifference,
    Math.round(
      (planned.netAfterHealthSettlement - impact.baseline.netAfterHealthSettlement) * 100,
    ) / 100,
  )
})

test('annual lump-sum health settlement is included once in each scenario', () => {
  const lumpInput = { ...input, invoice: 5_300, costs: 0, zus: 'start', form: 'lump' }
  const invoices = Array(12).fill(lumpInput.invoice)
  invoices[5] = 0
  const planned = calcB2bYearFromPlan({ ...lumpInput, invoices })
  const impact = calcB2bPlanImpact(lumpInput, planned)
  assert.notEqual(impact.baseline.annualLumpHealthBracket, impact.planned.annualLumpHealthBracket)
  assert.equal(
    impact.netDifference,
    Math.round(
      (planned.netAfterHealthSettlement - impact.baseline.netAfterHealthSettlement) * 100,
    ) / 100,
  )
  assert.throws(() => calcB2bPlanImpact(input, { ...planned, year: 2027 }), RangeError)
})

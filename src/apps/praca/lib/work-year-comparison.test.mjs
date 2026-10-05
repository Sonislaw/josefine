import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calcWorkYearComparison } = jiti('./work-year-comparison.ts')

const uop = { gross: 15_000, under26: false, elevatedKup: false, ppk: false }
const b2b = {
  invoice: 18_000,
  costs: 1_000,
  form: 'linear',
  rate: 12,
  zus: 'full',
  sickness: false,
}
const cents = (amount) => Math.round(amount * 100) / 100

test('comparison combines twelve annual simulations instead of multiplying one month', () => {
  const result = calcWorkYearComparison(uop, b2b)
  assert.equal(result.year, 2026)
  assert.equal(result.months.length, 12)
  assert.equal(result.months[0].month, 1)
  assert.equal(result.months[11].month, 12)
  assert.equal(result.b2b.healthSettlement, 0)
  assert.equal(result.monthlyDifferenceTotal, cents(result.b2b.totals.net - result.uop.totals.net))
  assert.equal(result.differenceAfterHealthSettlement, result.monthlyDifferenceTotal)
  assert.equal(
    result.monthlyDifferenceTotal,
    cents(result.months.reduce((sum, month) => sum + month.difference, 0)),
  )
  assert.notEqual(result.differenceAfterHealthSettlement, cents(result.months[0].difference * 12))
})

test('lump-sum annual health catch-up is subtracted once, outside monthly rows', () => {
  const result = calcWorkYearComparison(
    { ...uop, gross: 0 },
    { ...b2b, invoice: 6_000, costs: 0, form: 'lump', zus: 'start' },
  )
  assert.equal(result.b2b.healthSettlement, 3322.3)
  assert.equal(result.uop.totals.net, 0)
  assert.equal(result.monthlyDifferenceTotal, result.b2b.totals.net)
  assert.equal(
    result.differenceAfterHealthSettlement,
    cents(result.monthlyDifferenceTotal - result.b2b.healthSettlement),
  )
  assert.equal(result.months[11].difference, result.months[11].b2b.net)
  assert.ok(result.months[6].b2b.events.includes('zus-transition'))
})

test('each side retains its own cumulative events and input validation', () => {
  const result = calcWorkYearComparison(
    { ...uop, gross: 30_000, ppk: true },
    { ...b2b, invoice: 30_000, costs: 0, zus: 'start', form: 'lump' },
  )
  assert.ok(result.months.some((month) => month.uop.events.includes('social-base')))
  assert.ok(result.months.some((month) => month.b2b.events.includes('health-300k')))
  assert.throws(() => calcWorkYearComparison({ ...uop, gross: -1 }, b2b), RangeError)
  assert.throws(() => calcWorkYearComparison(uop, { ...b2b, invoice: Infinity }), RangeError)
  assert.throws(() => calcWorkYearComparison(uop, b2b, 2027), RangeError)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calcUopYear } = jiti('./uop-year.ts')
const { rules2026 } = jiti('./rules/2026.ts')

const baseInput = { gross: 12_000, under26: false, elevatedKup: false, ppk: false }

test('2026 annual limits are versioned and match the published PIT/ZUS figures', () => {
  assert.equal(rules2026.uop.youngReliefLimit, 85_528)
  assert.equal(rules2026.scale.annualThreshold, 120_000)
  assert.equal(rules2026.uop.pensionDisabilityAnnualBaseLimit, 282_600)
})

test('annual take-home is the sum of twelve independently calculated months', () => {
  const year = calcUopYear(baseInput)
  assert.equal(year.months.length, 12)
  assert.equal(year.months[0].tax, 913)
  assert.equal(year.months[0].net, 8509.87)
  assert.equal(year.months[11].tax, 1165)
  assert.deepEqual(year.months[11].events, ['pit-threshold'])
  assert.equal(year.totals.net, 101_866.44)
  assert.equal(
    year.totals.net,
    Math.round(year.months.reduce((sum, month) => sum + month.net, 0) * 100) / 100,
  )
  assert.notEqual(year.totals.net, year.months[0].net * 12)
})

test('PIT-0 uses only the annual relief limit and taxation starts at the boundary month', () => {
  const year = calcUopYear({ ...baseInput, gross: 10_000, under26: true })
  assert.equal(year.months[7].tax, 0)
  assert.equal(year.months[8].exemptRevenue, 5528)
  assert.deepEqual(year.months[8].events, ['young-relief'])
  assert.equal(year.months[8].tax, 133)
  assert.equal(year.totals.exemptRevenue, 85_528)
  assert.equal(year.months[9].exemptRevenue, 0)
})

test('PIT-0 reaching its limit exactly does not prematurely tax that month', () => {
  const year = calcUopYear({ ...baseInput, gross: 8552.8, under26: true })
  assert.equal(year.months[9].exemptRevenue, 8552.8)
  assert.equal(year.months[9].tax, 0)
  assert.deepEqual(year.months[9].events, ['young-relief'])
  assert.equal(year.months[10].exemptRevenue, 0)
})

test('pension/disability stop at the 30-times base limit while sickness and PPK continue', () => {
  const year = calcUopYear({ ...baseInput, gross: 30_000, ppk: true })
  assert.equal(year.months[8].pensionDisabilityBase, 30_000)
  assert.equal(year.months[9].pensionDisabilityBase, 12_600)
  assert.equal(year.months[10].pensionDisabilityBase, 0)
  assert.deepEqual(
    year.months[9].events.filter((event) => event === 'social-base'),
    ['social-base'],
  )
  assert.equal(year.months[10].ppkEmployee, 600)
  assert.equal(year.months[10].ppkEmployer, 450)
  assert.equal(
    year.months.reduce((sum, month) => sum + month.pensionDisabilityBase, 0),
    282_600,
  )
  assert.ok(year.months[10].social < year.months[8].social)
})

test('zero salary and unsupported data never create fictitious taxes', () => {
  const year = calcUopYear({ ...baseInput, gross: 0 })
  assert.equal(year.totals.net, 0)
  assert.equal(year.totals.tax, 0)
  assert.ok(year.months.every((month) => month.events.length === 0))
  assert.throws(() => calcUopYear({ ...baseInput, gross: -1 }), RangeError)
  assert.throws(() => calcUopYear(baseInput, 2027), RangeError)
})

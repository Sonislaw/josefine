import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calcB2bYear } = jiti('./b2b-year.ts')
const { rules2026 } = jiti('./rules/2026.ts')

const baseInput = {
  invoice: 20_000,
  costs: 1_000,
  form: 'linear',
  rate: 12,
  zus: 'full',
  sickness: false,
}

test('annual B2B uses 2026 social and health deduction limits', () => {
  assert.equal(rules2026.b2b.linearHealthDeductionLimit, 14_100)
  assert.deepEqual(rules2026.b2b.health.lumpThresholds, [60_000, 300_000])
  assert.equal(calcB2bYear(baseInput).months.length, 12)
})

test('tax advances on scale are cumulative and cross the 120k threshold once', () => {
  const result = calcB2bYear({
    ...baseInput,
    invoice: 20_000,
    costs: 0,
    zus: 'start',
    form: 'scale',
  })
  assert.equal(result.months[0].tax, 0)
  assert.equal(result.months[1].tax, 1200)
  assert.deepEqual(result.months[6].events, ['zus-transition', 'pit-threshold'])
  assert.equal(result.months[6].tax, 6265)
  assert.equal(result.totals.tax, 48_392)
  assert.notEqual(result.totals.net, result.months[0].net * 12)
  assert.equal(
    result.totals.net,
    Math.round(result.months.reduce((sum, month) => sum + month.net, 0) * 100) / 100,
  )
})

test('lump-sum health threshold changes only after 60k and annual catch-up is separate', () => {
  const result = calcB2bYear({ ...baseInput, invoice: 6_000, costs: 0, zus: 'start', form: 'lump' })
  assert.equal(result.months[9].health, 498.35)
  assert.deepEqual(result.months[9].events, [])
  assert.equal(result.months[10].health, 830.58)
  assert.deepEqual(result.months[10].events, ['health-60k'])
  assert.equal(result.healthSettlement, 3322.3)
  assert.equal(
    result.netAfterHealthSettlement,
    Math.round((result.totals.net - result.healthSettlement) * 100) / 100,
  )
})

test('lump-sum health recognizes the 300k threshold and social contributions reduce revenue', () => {
  const result = calcB2bYear({
    ...baseInput,
    invoice: 30_000,
    costs: 0,
    zus: 'start',
    form: 'lump',
  })
  assert.equal(result.months[9].health, 830.58)
  assert.deepEqual(result.months[10].events, ['health-300k'])
  assert.equal(result.months[10].health, 1495.04)
  const withSocial = calcB2bYear({ ...baseInput, invoice: 5_200, costs: 0, form: 'lump' })
  assert.ok(withSocial.months.every((month) => month.health === 498.35))
  assert.equal(withSocial.healthSettlement, 0)
})

test('linear tax deducts health only up to its annual limit', () => {
  const result = calcB2bYear({ ...baseInput, invoice: 30_000, costs: 0, zus: 'start' })
  assert.equal(result.months[0].health, 1470)
  assert.equal(result.totals.health, 17_516.28)
  assert.equal(result.totals.tax, 65_241)
  assert.equal(result.healthSettlement, 0)
})

test('start-up relief lasts six months, then preferential social contributions apply', () => {
  const result = calcB2bYear({ ...baseInput, zus: 'start' })
  assert.equal(result.months[5].zusVariant, 'start')
  assert.equal(result.months[5].social, 0)
  assert.equal(result.months[6].zusVariant, 'preferential')
  assert.equal(result.months[6].social, 420.86)
  assert.ok(result.months[6].events.includes('zus-transition'))
  assert.equal(result.totals.social, 2525.16)
})

test('costs do not reduce lump-sum tax but do reduce cash remaining', () => {
  const noCosts = calcB2bYear({ ...baseInput, form: 'lump', zus: 'start', costs: 0 })
  const withCosts = calcB2bYear({ ...baseInput, form: 'lump', zus: 'start', costs: 1_000 })
  assert.equal(withCosts.totals.tax, noCosts.totals.tax)
  assert.equal(withCosts.totals.net, noCosts.totals.net - 12_000)
})

test('zero income and invalid data remain explicit', () => {
  const zero = calcB2bYear({ ...baseInput, invoice: 0, costs: 0, zus: 'start' })
  assert.equal(zero.totals.tax, 0)
  assert.equal(zero.months[0].net, -314.96)
  assert.equal(
    zero.totals.net,
    Math.round(-(zero.totals.health + zero.totals.social) * 100) / 100,
  )
  assert.throws(() => calcB2bYear({ ...baseInput, invoice: -1 }), RangeError)
  assert.throws(() => calcB2bYear({ ...baseInput, costs: Infinity }), RangeError)
  assert.throws(() => calcB2bYear({ ...baseInput, form: 'lump', rate: 99 }), RangeError)
  assert.throws(() => calcB2bYear(baseInput, 2027), RangeError)
})

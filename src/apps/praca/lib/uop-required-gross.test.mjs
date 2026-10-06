import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { findRequiredUopGross } = jiti('./uop-required-gross.ts')
const { calcUopYear } = jiti('./uop-year.ts')

const settings = { under26: false, elevatedKup: false, ppk: false }
const lowestNet = (result) => Math.min(...result.months.map((month) => month.net))

test('average goal finds the earliest valid whole-PLN gross despite PIT rounding dips', () => {
  const target = 2_506.49
  const result = findRequiredUopGross(target, 'average', settings)
  assert.ok(result)
  assert.equal(result.gross, 3_192)
  assert.equal(result.annualNet, calcUopYear({ ...settings, gross: result.gross }).totals.net)
  assert.ok(result.annualNet >= target * 12)
  assert.ok(calcUopYear({ ...settings, gross: result.gross + 1 }).totals.net < target * 12)
  for (let gross = 0; gross < result.gross; gross++) {
    assert.ok(calcUopYear({ ...settings, gross }).totals.net < target * 12)
  }
})

test('every-month goal does not discard an earlier salary when the minimum later dips', () => {
  const target = 8_427.85
  const result = findRequiredUopGross(target, 'every-month', settings)
  assert.ok(result)
  assert.equal(result.gross, 11_879)
  assert.equal(result.lowestMonthlyNet, target)
  assert.equal(result.lowestMonth, 1)
  assert.ok(lowestNet(calcUopYear({ ...settings, gross: result.gross + 1 })) < target)
  for (let gross = 0; gross < result.gross; gross++) {
    assert.ok(lowestNet(calcUopYear({ ...settings, gross })) < target)
  }
})

test('the two goals differ at high pay, and options use the same yearly UoP engine', () => {
  const target = 50_000
  const average = findRequiredUopGross(target, 'average', settings)
  const everyMonth = findRequiredUopGross(target, 'every-month', settings)
  assert.ok(average)
  assert.ok(everyMonth)
  assert.ok(average.gross < everyMonth.gross)
  assert.ok(average.annualNet >= target * 12)
  assert.ok(average.lowestMonthlyNet < target)
  assert.ok(everyMonth.lowestMonthlyNet >= target)

  const ppkAndRelief = findRequiredUopGross(8_000, 'average', {
    under26: true,
    elevatedKup: true,
    ppk: true,
  })
  assert.ok(ppkAndRelief)
  assert.ok(ppkAndRelief.annualNet >= 8_000 * 12)
})

test('zero, unreachable targets, invalid amounts and unsupported years are explicit', () => {
  assert.equal(findRequiredUopGross(0, 'average', settings)?.gross, 0)
  assert.equal(findRequiredUopGross(100_000_000, 'every-month', settings), null)
  assert.throws(() => findRequiredUopGross(-1, 'average', settings), RangeError)
  assert.throws(() => findRequiredUopGross(1.234, 'average', settings), RangeError)
  assert.throws(() => findRequiredUopGross(8_000, 'other', settings), RangeError)
  assert.throws(() => findRequiredUopGross(8_000, 'average', settings, 2027), RangeError)
})

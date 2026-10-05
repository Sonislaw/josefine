import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calcB2b, calcUop, estimateMonthlyScaleTax, isValidAmount, money } =
  jiti('./calculations.ts')

const uop = { gross: 12_000, under26: false, elevatedKup: false, ppk: false }
const b2b = { invoice: 20_000, costs: 1000, form: 'linear', rate: 12, zus: 'full', sickness: false }

test('2026 UoP: standard contributions, PIT and employer cost are separate components', () => {
  const result = calcUop(uop, { year: 2026, month: 2 })
  assert.equal(result.social, 1645.2)
  assert.equal(result.health, 931.93)
  assert.equal(result.tax, 933)
  assert.equal(result.net, 8489.87)
  assert.equal(result.employerCost, 14_457.6)
})

test('PPK changes employee net and employer cost without changing gross', () => {
  const result = calcUop({ ...uop, ppk: true })
  assert.equal(result.ppkEmployee, 240)
  assert.equal(result.ppkEmployer, 180)
  assert.equal(result.tax, 991)
  assert.equal(result.net, 8191.87)
  assert.equal(result.employerCost, 14_637.6)
})

test('under-26 option is a single-month assumption with unused relief limit', () => {
  const result = calcUop({ ...uop, under26: true })
  assert.equal(result.tax, 0)
  assert.equal(result.net, 9422.87)
})

test('monthly approximation of the annual PIT scale changes rate after 10 000 zł', () => {
  assert.equal(estimateMonthlyScaleTax(10_000), 900)
  assert.equal(estimateMonthlyScaleTax(10_001), 900.32)
})

test('2026 ZUS fixed social rates are selected by variant and sickness', () => {
  assert.equal(calcB2b(b2b).social, 1788.29)
  assert.equal(calcB2b({ ...b2b, sickness: true }).social, 1926.76)
  assert.equal(calcB2b({ ...b2b, zus: 'preferential' }).social, 420.86)
  assert.equal(calcB2b({ ...b2b, zus: 'preferential', sickness: true }).social, 456.18)
  assert.equal(calcB2b({ ...b2b, zus: 'start' }).social, 0)
})

test('2026 minimum health contribution differs between January and February', () => {
  const zeroIncome = { ...b2b, invoice: 0, costs: 0, zus: 'start' }
  assert.equal(calcB2b(zeroIncome, { year: 2026, month: 1 }).health, 314.96)
  assert.equal(calcB2b(zeroIncome, { year: 2026, month: 2 }).health, 432.54)
  assert.equal(calcB2b(zeroIncome, { year: 2026, month: 2 }).net, -432.54)
})

test('2026 B2B linear estimate rounds components and keeps negative balances visible', () => {
  const result = calcB2b(b2b)
  assert.equal(result.health, 843.37)
  assert.equal(result.tax, 3270)
  assert.equal(result.net, 13_098.34)
  assert.match(money(-432.54), /432,54/)
  assert.match(money(-432.54), /-/)
})

test('lump health brackets use annualized monthly invoice, including boundaries', () => {
  const invoice = (amount) =>
    calcB2b({ ...b2b, invoice: amount, costs: 0, form: 'lump', zus: 'start' }).health
  assert.equal(invoice(5000), 498.35)
  assert.equal(invoice(5000.01), 830.58)
  assert.equal(invoice(25_000), 830.58)
  assert.equal(invoice(25_000.01), 1495.04)
})

test('invalid amounts and unsupported periods are rejected instead of displaying NaN or zero', () => {
  assert.equal(isValidAmount(0.29), true)
  assert.equal(isValidAmount(0.001), false)
  assert.equal(isValidAmount(Number.NaN), false)
  assert.throws(() => calcUop({ ...uop, gross: -1 }), RangeError)
  assert.throws(() => calcB2b({ ...b2b, costs: Infinity }), RangeError)
  assert.throws(() => calcUop(uop, { year: 2026, month: 13 }), RangeError)
  assert.throws(() => calcUop(uop, { year: 2027, month: 1 }), RangeError)
})

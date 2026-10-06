import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const {
  calculateWaterBill,
  calculateWaterPeriod,
  calculateWaterSavings,
  parseFixedCharge,
  parseDailyWaterSavings,
} = jiti('./water-cost.ts')

test('combined bill adds fixed charge once, without changing variable rate', () => {
  assert.deepEqual(
    calculateWaterBill({
      volume: 5,
      mode: 'combined',
      combinedRate: 12,
      waterRate: null,
      sewageRate: null,
      fixedCharge: 8.5,
    }),
    {
      variableCost: 60,
      waterCost: 60,
      sewageCost: 0,
      fixedCharge: 8.5,
      totalCost: 68.5,
      unitRate: 12,
    },
  )
})

test('split bill rounds each line before adding fixed charge', () => {
  assert.deepEqual(
    calculateWaterBill({
      volume: 1.005,
      mode: 'split',
      combinedRate: null,
      waterRate: 6.2,
      sewageRate: 11.5,
      fixedCharge: 3,
    }),
    {
      variableCost: 17.79,
      waterCost: 6.23,
      sewageCost: 11.56,
      fixedCharge: 3,
      totalCost: 20.79,
      unitRate: 17.7,
    },
  )
})

test('blank fixed charge means zero and invalid money is rejected', () => {
  assert.equal(parseFixedCharge(''), 0)
  assert.equal(parseFixedCharge('12,50'), 12.5)
  assert.equal(parseFixedCharge('12,501'), null)
  assert.equal(parseFixedCharge('-1'), null)
})

test('meter period uses calendar days including leap day, excludes fixed charge', () => {
  assert.deepEqual(calculateWaterPeriod(3, '2024-02-28', '2024-03-01', 12), {
    days: 2,
    litersPerDay: 1500,
    volume30Days: 45,
    cost30Days: 540,
  })
  assert.equal(calculateWaterPeriod(3, '2024-03-01', '2024-02-28', 12), null)
  assert.equal(calculateWaterPeriod(3, '2024-02-30', '2024-03-01', 12), null)
  assert.equal(calculateWaterPeriod(3, '2024-03-01', '2024-03-01', 12), null)
})

test('daily saving is priced only at usage rate for 30 days', () => {
  assert.equal(parseDailyWaterSavings('20,5'), 20.5)
  assert.deepEqual(calculateWaterSavings(20, 17.7), { volume30Days: 0.6, cost30Days: 10.62 })
  assert.deepEqual(calculateWaterSavings(0, 17.7), { volume30Days: 0, cost30Days: 0 })
  assert.equal(calculateWaterSavings(-1, 17.7), null)
})

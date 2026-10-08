import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculateScreed } = jiti('./screed.ts')

const example = {
  areaM2: 20,
  thicknessMm: 10,
  consumptionKgPerM2Mm: 1.8,
  reservePercent: 5,
  bagWeightKg: 25,
  bagPrice: null,
}

test('calculates volume, product-specific consumption and whole bags', () => {
  assert.deepEqual(calculateScreed(example), {
    volumeM3: 0.2,
    baseKg: 360,
    requiredKg: 378,
    bagCount: 16,
    purchasedKg: 400,
    remainingKg: 22,
    estimatedCost: null,
  })
})

test('optional price applies to purchased bags, not fractional mass', () => {
  assert.equal(calculateScreed({ ...example, bagPrice: 39.99 })?.estimatedCost, 639.84)
  assert.equal(calculateScreed({ ...example, bagPrice: 0 })?.estimatedCost, 0)
})

test('exact bag boundary is not rounded up again', () => {
  const result = calculateScreed({
    ...example,
    reservePercent: 0,
    consumptionKgPerM2Mm: 2,
    bagWeightKg: 20,
  })
  assert.equal(result?.requiredKg, 400)
  assert.equal(result?.bagCount, 20)
})

test('rejects zero divisors, negative values and out-of-range inputs', () => {
  for (const input of [
    { ...example, areaM2: 0 },
    { ...example, thicknessMm: -1 },
    { ...example, consumptionKgPerM2Mm: 0 },
    { ...example, bagWeightKg: 0 },
    { ...example, reservePercent: 101 },
    { ...example, bagPrice: -1 },
    { ...example, areaM2: Infinity },
  ])
    assert.equal(calculateScreed(input), null)
})

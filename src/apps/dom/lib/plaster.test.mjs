import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculatePlaster } = jiti('./plaster.ts')

const example = {
  areaM2: 45,
  mode: 'perMillimeter',
  consumptionKgPerM2Unit: 1,
  totalThicknessMm: 2,
  coats: null,
  reservePercent: 10,
  packageWeightKg: 20,
  packagePrice: null,
}

test('calculates dry plaster from total thickness and full bags', () => {
  const result = calculatePlaster(example)
  assert.equal(result?.appliedUnits, 2)
  assert.equal(result?.baseKg, 90)
  assert.ok(Math.abs(result.requiredKg - 99) < 1e-9)
  assert.equal(result?.packageCount, 5)
  assert.equal(result?.purchasedKg, 100)
  assert.ok(Math.abs(result.remainingKg - 1) < 1e-9)
  assert.equal(result?.estimatedCost, null)
})

test('ready-to-use paste may declare usage per coat and be sold in buckets', () => {
  const result = calculatePlaster({
    ...example,
    mode: 'perCoat',
    totalThicknessMm: null,
    coats: 2,
    consumptionKgPerM2Unit: 1.5,
    packageWeightKg: 18,
    reservePercent: 0,
    packagePrice: 57.5,
  })
  assert.equal(result?.baseKg, 135)
  assert.equal(result?.packageCount, 8)
  assert.equal(result?.estimatedCost, 460)
})

test('only the active consumption mode must have a valid thickness or coat count', () => {
  assert.ok(calculatePlaster({ ...example, coats: null }))
  assert.equal(calculatePlaster({ ...example, totalThicknessMm: null }), null)
  assert.equal(calculatePlaster({ ...example, mode: 'perCoat', coats: 1.5 }), null)
})

test('rejects invalid area, consumption, reserve and package weight', () => {
  for (const input of [
    { ...example, areaM2: 0 },
    { ...example, consumptionKgPerM2Unit: 0 },
    { ...example, reservePercent: 101 },
    { ...example, packageWeightKg: 0 },
    { ...example, packagePrice: -1 },
  ])
    assert.equal(calculatePlaster(input), null)
})

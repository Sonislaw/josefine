import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculateMaterialPackages } = jiti('./material-packages.ts')

test('rounds to whole packages without buying an extra one at a floating-point boundary', () => {
  const input = { baseKg: 90, reservePercent: 10, packageWeightKg: 33, packagePrice: 39.99 }
  const result = calculateMaterialPackages(input)
  assert.equal(result?.packageCount, 3)
  assert.equal(result?.estimatedCost, 119.97)
})

test('a real excess over a package boundary still requires one more package', () => {
  const result = calculateMaterialPackages({
    baseKg: 100.001,
    reservePercent: 0,
    packageWeightKg: 20,
    packagePrice: null,
  })
  assert.equal(result?.packageCount, 6)
  assert.equal(result?.estimatedCost, null)
})

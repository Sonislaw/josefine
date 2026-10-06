import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { energyPresets } = jiti('./energy-presets.ts')
const { parseDomNumber } = jiti('./calculations.ts')
const { parseDailyHours, parseDaysPerWeek, calculateEnergyProjection } = jiti('./practical.ts')

test('each appliance example has a unique, usable power and schedule', () => {
  assert.deepEqual(
    energyPresets.map((preset) => preset.id),
    ['fridge', 'oven', 'airConditioner', 'computer'],
  )
  for (const preset of energyPresets) {
    const power = parseDomNumber(preset.powerWatts)
    const hours = parseDailyHours(preset.hoursPerUseDay)
    const days = parseDaysPerWeek(preset.daysPerWeek)
    assert.ok(power > 0)
    assert.ok(hours !== null)
    assert.ok(days !== null)
    assert.ok(calculateEnergyProjection(power, 1, hours, days))
  }
})

test('fridge preset represents average daily power, not a compressor peak', () => {
  const fridge = energyPresets.find((preset) => preset.id === 'fridge')
  assert.ok(fridge)
  const projection = calculateEnergyProjection(
    parseDomNumber(fridge.powerWatts),
    1,
    parseDailyHours(fridge.hoursPerUseDay),
    parseDaysPerWeek(fridge.daysPerWeek),
  )
  assert.equal(projection?.annualEnergy, 175.2)
})

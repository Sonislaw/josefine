import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculateDom } = jiti('./calculations.ts')
const { calculateTileRoomPlan } = jiti('./tile-room.ts')
const { calculateTileCounts } = jiti('./tiles.ts')

test('floor tool and shared tile count use the same piece formula', () => {
  const counts = calculateTileCounts(20, 60, 60, 10)
  const rows = calculateDom('plytki-na-podloge', {
    area: 20,
    tileLength: 60,
    tileWidth: 60,
    waste: 10,
  })
  assert.deepEqual(counts, { withoutReserve: 56, tileCount: 62 })
  assert.equal(rows[0].value, counts.tileCount)
  assert.equal(rows[1].value, counts.withoutReserve)
})

test('wall plan ignores the floor and deducts only openings in the tiled wall area', () => {
  const plan = calculateTileRoomPlan({
    room: { length: 5, width: 4, height: 2.5 },
    openings: 0,
    floor: null,
    walls: { tileLength: 30, tileWidth: 60, waste: 10, tilesPerBox: 8, boxPrice: 129 },
    wallCoverage: { sides: ['lengthA'], height: 2 },
    detailedOpenings: [
      { kind: 'door', side: 'lengthA', width: 0.9, height: 2, bottom: 0 },
      { kind: 'window', side: 'lengthB', width: 1, height: 1, bottom: 1 },
    ],
  })
  assert.ok(plan)
  assert.equal(plan.floor, null)
  assert.equal(plan.grossWalls, 10)
  assert.equal(plan.openings, 1.8)
  assert.equal(plan.netWalls, 8.2)
  assert.equal(plan.walls.area, 8.2)
  assert.equal(plan.walls.tileCount, 51)
  assert.equal(plan.walls.boxCount, 7)
  assert.equal(plan.walls.estimatedCost, 903)
})

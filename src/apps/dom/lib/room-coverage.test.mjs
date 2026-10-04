import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculatePaintAccent, calculatePaintRoom } = jiti('./paint.ts')
const {
  calculateRoomLabor,
  calculateRoomPaintingAreas,
  calculateRoomPanelAreas,
  calculateRoomSkirtingLengths,
  calculateRoomTilingAreas,
} = jiti('./room-budget.ts')
const { calculateRoomCoverage } = jiti('./room-coverage.ts')
const { calculateSkirtingPlan } = jiti('./skirting.ts')

test('skirting labor uses net installation length, not room perimeter or purchased reserve', () => {
  const plan = calculateSkirtingPlan({
    perimeter: 18,
    openings: 1.5,
    boardLength: 2.4,
    reserve: 10,
    boardPrice: 25,
  })
  assert.ok(plan)
  const skirting = calculateRoomSkirtingLengths([
    { kind: 'skirting', skirtingLengthM: plan.netLength },
  ])
  const labor = calculateRoomLabor({ skirting: 12 }, undefined, undefined, skirting)
  assert.equal(skirting.length, 16.5)
  assert.equal(labor.lines[0]?.quantity, 16.5)
  assert.equal(labor.total, 198)
})

test('painting splits main and accent walls and counts the ceiling once', () => {
  const room = {
    length: 5,
    width: 4,
    height: 2.5,
    doors: 2,
    windows: 3,
    coats: 2,
    coverage: 10,
    ceiling: true,
  }
  const base = calculatePaintRoom(room)
  const accent = calculatePaintAccent({
    room,
    wall: 'length',
    openings: 1,
    coats: 2,
    coverage: 10,
  })
  assert.ok(base)
  assert.ok(accent)
  const painting = calculateRoomPaintingAreas([
    {
      kind: 'paintCans',
      paintWallAreaM2: accent.mainArea - base.ceilingArea,
      paintCeilingAreaM2: base.ceilingArea,
    },
    { kind: 'paintCans', paintWallAreaM2: accent.accentArea },
  ])
  assert.equal(painting.walls, base.netWalls)
  assert.equal(painting.ceiling, base.ceilingArea)
  const labor = calculateRoomLabor({ painting: 20 }, undefined, undefined, undefined, painting)
  assert.equal(labor.lines[0]?.quantity, base.paintArea)
  assert.equal(labor.total, base.paintArea * 20)
})

test('audit compares saved scopes but does not turn unallocated area into labor', () => {
  const panels = calculateRoomPanelAreas([{ kind: 'panels', panelAreaM2: 6 }])
  const tiling = calculateRoomTilingAreas([
    { kind: 'tilePieces', tileSurface: 'floor', tiledAreaM2: 12 },
    { kind: 'tileBoxes', tileSurface: 'walls', tiledAreaM2: 5 },
  ])
  const painting = calculateRoomPaintingAreas([
    { kind: 'paintCans', paintWallAreaM2: 30, paintCeilingAreaM2: 20 },
  ])
  const skirting = calculateRoomSkirtingLengths([{ kind: 'skirting', skirtingLengthM: 16.5 }])
  const metrics = { floor: 20, walls: 45, perimeter: 18, volume: 50 }
  const audit = calculateRoomCoverage(metrics, panels, tiling, painting, skirting)
  assert.deepEqual(
    audit.rows.map((row) => row.unallocated),
    [2, 10, 0, 1.5],
  )
  const labor = calculateRoomLabor({ flooring: 30 }, tiling, panels, skirting, painting)
  assert.equal(labor.total, 180)
  assert.equal(
    calculateRoomCoverage(metrics, { area: 10, missingAreaCount: 0 }, tiling, painting, skirting)
      .rows[0]?.excess,
    2,
  )
})

test('old purchases without a measured scope remain readable and do not invent labor', () => {
  const skirting = calculateRoomSkirtingLengths([{ kind: 'skirting' }])
  const painting = calculateRoomPaintingAreas([{ kind: 'paintCans' }])
  assert.equal(skirting.missingLengthCount, 1)
  assert.equal(painting.missingAreaCount, 1)
  assert.equal(
    calculateRoomLabor({ skirting: 12, painting: 20 }, undefined, undefined, skirting, painting)
      .total,
    0,
  )
})

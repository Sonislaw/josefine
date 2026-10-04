import assert from 'node:assert/strict'
import test from 'node:test'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const { calculatePaintAccent, calculatePaintRoom } = jiti('./paint.ts')
const { calculateRoomLabor, calculateRoomPaintingAreas, calculateRoomSkirtingLengths } =
  jiti('./room-budget.ts')
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

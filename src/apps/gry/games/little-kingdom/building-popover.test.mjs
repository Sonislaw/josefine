import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
const j = createJiti(import.meta.url)
const { placeBuildingPopover, CELL, MIN_ZOOM } = await j.import('./building-popover.ts')
test('building bubbles fit above corner tiles, including negative coordinates and close mobile zoom', () => {
  for (const width of [244, 310, 840])
    for (const height of [300, 420, 460])
      for (const zoom of [0.45, 0.7, 1.8])
        for (const tile of [
          { x: 0, y: 0 },
          { x: 6, y: 6 },
          { x: -70, y: 280 },
        ]) {
          const camera = { width, height, zoom, ox: -12, oy: -150 },
            before = { ...camera }
          const p = placeBuildingPopover(camera, tile, 218),
            c = p.camera,
            size = c.zoom * CELL
          assert.deepEqual(camera, before)
          assert.ok(p.left >= 8 && p.left + p.width <= width - 8)
          assert.ok(p.top >= 8 - 1e-9)
          assert.ok(Math.abs(p.top + 218 + 10 - (c.oy + tile.y * size)) < 1e-9)
          assert.ok(c.oy + (tile.y + 1) * size <= height - 8 + 1e-9)
          assert.ok(c.ox + tile.x * size >= 8 - 1e-9)
          assert.ok(c.zoom >= MIN_ZOOM && c.zoom <= zoom)
        }
})
test('positioning is idempotent and preserves zoom when sufficient space exists', () => {
  const camera = { width: 840, height: 460, zoom: 1.2, ox: 100, oy: 100 }
  const tile = { x: 3, y: 3 },
    first = placeBuildingPopover(camera, tile, 180)
  assert.equal(first.camera.zoom, camera.zoom)
  assert.deepEqual(placeBuildingPopover(first.camera, tile, 180), first)
  assert.ok(first.arrow >= 16 && first.arrow <= first.width - 16)
})
test('mobile rotation and changing bubble height continue to use the same tile coordinates', () => {
  const tile = { x: -24, y: 60 }
  const portrait = placeBuildingPopover(
    { width: 280, height: 320, zoom: 1.8, ox: 0, oy: 0 },
    tile,
    218,
  )
  const landscape = placeBuildingPopover({ ...portrait.camera, width: 720, height: 300 }, tile, 170)
  const expectedY = landscape.camera.oy + tile.y * CELL * landscape.camera.zoom
  assert.ok(Math.abs(landscape.top + 170 + 10 - expectedY) < 1e-9)
  assert.equal(landscape.width, 276)
})

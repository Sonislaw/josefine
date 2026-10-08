import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const sourceRoot = fileURLToPath(new URL('../../../', import.meta.url))
const jiti = createJiti(import.meta.url, { alias: { '@': sourceRoot } })
const {
  createFloorRoomToolLink,
  createFloorTileRoomToolLink,
  createWallTileRoomToolLink,
  createRoomToolLinks,
} = jiti('./room-links.ts')
const dimensions = { length: 5, width: 4, height: 2.5 }

test('floor budget opens panel and underlay calculator with room floor area', () => {
  const panels = createFloorRoomToolLink('panels', dimensions, 'room-1')
  const underlay = createFloorRoomToolLink('underlay', dimensions, 'room-1')
  assert.equal(panels.query.area, '20')
  assert.equal(panels.query.roomId, 'room-1')
  assert.equal(underlay.query.area, '20')
  assert.equal(underlay.query.includeUnderlay, '1')
  assert.equal(underlay.query.addMaterial, 'underlay')
  assert.equal(underlay.path, panels.path)
})

test('skirting calculator receives the saved room sides rather than its perimeter', () => {
  const skirting = createFloorRoomToolLink('skirting', dimensions, 'room-1')
  assert.deepEqual(skirting.query, { length: '5', width: '4', roomId: 'room-1' })
  assert.equal(skirting.path.endsWith('/obwod-prostokata'), true)
})

test('room overview uses the same links; missing dimensions preserve manual entry', () => {
  const links = createRoomToolLinks(dimensions, 'room-1')
  assert.deepEqual(links[0].to, createFloorRoomToolLink('panels', dimensions, 'room-1'))
  assert.deepEqual(links[1].to, createFloorRoomToolLink('skirting', dimensions, 'room-1'))
  assert.deepEqual(createFloorRoomToolLink('panels', null, 'room-1').query, { roomId: 'room-1' })
})

test('room overview prefills the floor tile calculator with saved dimensions', () => {
  const tiles = createFloorTileRoomToolLink(dimensions, 'room-1')
  const links = createRoomToolLinks(dimensions, 'room-1')
  assert.deepEqual(links[2].to, tiles)
  assert.equal(tiles.path.endsWith('/plytki-na-podloge'), true)
  assert.deepEqual(tiles.query, {
    area: '20',
    showLayout: '1',
    roomLength: '5',
    roomWidth: '4',
    roomId: 'room-1',
  })
  assert.deepEqual(createFloorTileRoomToolLink(null, 'room-1').query, { roomId: 'room-1' })
})

test('room overview prefills the screed calculator with floor area', () => {
  const links = createRoomToolLinks(dimensions, 'room-1')
  assert.equal(links[3].to.path.endsWith('/kalkulator-wylewki'), true)
  assert.deepEqual(links[3].to.query, { area: '20', roomId: 'room-1' })
})

test('room overview exposes a separate wall tile calculator with room dimensions', () => {
  const walls = createWallTileRoomToolLink(dimensions, 'room-1')
  const links = createRoomToolLinks(dimensions, 'room-1')
  assert.deepEqual(links[4].to, walls)
  assert.equal(walls.path.endsWith('/plytki-na-sciane'), true)
  assert.deepEqual(walls.query, {
    roomLength: '5',
    roomWidth: '4',
    roomHeight: '2.5',
    roomId: 'room-1',
  })
})

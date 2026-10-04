import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const sourceRoot = fileURLToPath(new URL('../../../', import.meta.url))
const jiti = createJiti(import.meta.url, { alias: { '@': sourceRoot } })
const { createFloorRoomToolLink, createRoomToolLinks } = jiti('./room-links.ts')
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

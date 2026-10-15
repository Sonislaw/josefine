import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { SIZE, terrain, baseTerrain } = await j.import('./terrain.ts')
const { newKingdom, resolveTurn, key, buildingProduction, neighbors } =
  await j.import('./engine.ts')
const { discoveryForSector } = await j.import('./discoveries.ts')
const { settlementPosition } = await j.import('./neighbours.ts')
const { decode, load, save, SAVE_KEY, CATALOG_KEY, LEGACY_KEY } = await j.import('./storage.ts')
const { terrainAt } = await j.import('./forestry.ts')
const { depositCapacity, planExtraction } = await j.import('./deposits.ts')

// Existing economy/combat fixtures deliberately use generator v1 to keep their
// precise geometry stable. These tests and the legal development simulations
// exercise the current generator instead, including its spatial properties.
function sectorCells(seed, sector, version = 2) {
  return Array.from({ length: SIZE * SIZE }, (_, i) => {
    const x = sector.x * SIZE + (i % SIZE),
      y = sector.y * SIZE + Math.floor(i / SIZE)
    return { x, y, kind: terrain(seed, x, y, version) }
  })
}
function components(seed, version) {
  const cells = new Map()
  for (let y = -42; y < 42; y++)
    for (let x = -42; x < 42; x++) cells.set(key(x, y), terrain(seed, x, y, version))
  const sizes = { forest: [], rock: [], water: [] }
  for (const [k, kind] of cells) {
    if (kind === 'meadow') continue
    const queue = [k]
    cells.delete(k)
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i].split(',').map(Number)
      for (const p of neighbors({ x, y })) {
        const next = key(p.x, p.y)
        if (cells.get(next) !== kind) continue
        cells.delete(next)
        queue.push(next)
      }
    }
    sizes[kind].push(queue.length)
  }
  return sizes
}

test('new terrain is deterministic, including negative sectors, with 20+ buildable plots', () => {
  for (const seed of [0, 1, 42, 183, 0xffffffff])
    for (let sy = -6; sy <= 6; sy++)
      for (let sx = -6; sx <= 6; sx++) {
        const sector = { x: sx, y: sy },
          cells = sectorCells(seed, sector)
        assert.ok(cells.filter((p) => p.kind === 'meadow').length >= 20)
        // Opposite query order must not affect a sector or a discovery.
        for (const p of [...cells].reverse()) assert.equal(terrain(seed, p.x, p.y, 2), p.kind)
        const d = discoveryForSector(seed, sector, 1, 2)
        if (!d) {
          assert.deepEqual(sector, { x: 0, y: 0 })
          continue
        }
        assert.equal(terrain(seed, d.x, d.y, 2), 'meadow')
        if (d.kind === 'spring' || d.kind === 'tradingPost')
          assert.ok(
            neighbors(d).some((p) =>
              cells.some((c) => c.x === p.x && c.y === p.y && c.kind === 'meadow'),
            ),
          )
        const neighbour = settlementPosition(seed, sector, d, 2)
        assert.equal(terrain(seed, neighbour.x, neighbour.y, 2), 'meadow')
        assert.ok(Math.abs(neighbour.x - d.x) + Math.abs(neighbour.y - d.y) > 1)
      }
})

test('forests and rocks form larger connected clusters; lakes are fewer, larger and not isolated tiles', () => {
  for (const seed of [1, 42, 183]) {
    const old = components(seed, 1),
      current = components(seed, 2)
    for (const kind of ['forest', 'rock', 'water']) {
      const mean = (a) => a.reduce((n, size) => n + size, 0) / a.length
      assert.ok(mean(current[kind]) > mean(old[kind]) * 5, `${seed}: ${kind}`)
      assert.ok(current[kind].length < old[kind].length / 3, `${seed}: fewer ${kind} groups`)
      if (kind !== 'water') {
        const total = (a) => a.reduce((n, size) => n + size, 0)
        // Rearrange reserves, rather than flooding the economy with extra resources.
        assert.ok(total(current[kind]) >= total(old[kind]) * 0.75)
        assert.ok(total(current[kind]) <= total(old[kind]) * 1.25)
      }
    }
    assert.ok(current.water.length < old.water.length / 10)
    assert.ok(Math.max(...current.water) >= 40)
    assert.equal(current.water.filter((n) => n === 1).length, 0)
  }
})

test('starter clearing has contiguous resources, accessible extraction and water near buildable plots', () => {
  for (const seed of [0, 1, 42, 0xffffffff]) {
    const s = newKingdom(seed),
      cells = sectorCells(seed, { x: 0, y: 0 })
    assert.equal(s.landscape.version, 2)
    assert.equal(baseTerrain(s, 3, 3), 'meadow')
    for (const kind of ['forest', 'rock', 'water'])
      assert.ok(cells.filter((p) => p.kind === kind).length >= 4)
    for (const [kind, x, y, resource] of [
      ['sawmill', 1, 2, 'wood'],
      ['quarry', 5, 1, 'stone'],
    ]) {
      const building = { kind, x, y, level: 1 }
      s.buildings[key(x, y)] = building
      assert.equal(terrainAt(s, building), 'meadow')
      assert.ok(buildingProduction(s, building)[resource] > 0)
    }
    const farm = { kind: 'farm', x: 2, y: 5, level: 1 }
    s.buildings['2,5'] = farm
    assert.equal(buildingProduction(s, farm).food, 4)
    assert.ok(planExtraction(s).buildings['1,2'].amount > 0)
    assert.ok(decode(encode(s)))
  }
})

test('exploration uses the same terrain for discoveries, castles, forecasts and saved growth/deposits', () => {
  let s = newKingdom(42)
  s.turn = 1
  s.rank = 1
  s.promotions = [{ rank: 1, turn: 1 }]
  s.resources = { wood: 10000, stone: 10000, food: 10000, gold: 10000 }
  for (let x = 1; x <= 15; x++) {
    const before = structuredClone(s),
      action = { type: 'explore', x, y: 0 },
      result = resolveTurn(s, action)
    assert.deepEqual(s, before)
    assert.deepEqual(resolveTurn(s, action), result)
    s = result.state
    assert.ok(decode(encode(s)))
  }
  assert.ok(s.affairs.settlements.length >= 3)
  for (const p of s.affairs.settlements) assert.equal(baseTerrain(s, p.x, p.y), 'meadow')
  const tree = sectorCells(s.seed, { x: 1, y: 0 }).find((p) => p.kind === 'forest')
  assert.ok(tree)
  s.deposits[key(tree.x, tree.y)] = 0
  s.forests[key(tree.x, tree.y)] = { age: 2 }
  s.deposits[key(tree.x, tree.y)] = 60
  assert.equal(depositCapacity(s, tree), 60)
  assert.deepEqual(decode(encode(s)).state, s)
})

test('v10 migration preserves all known terrain and old bytes; only future sectors use clustered generation', () => {
  const old = newKingdom(42, 1)
  old.sectors.push({ x: -1, y: 0 })
  old.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
  // These legacy cells differ in v2: preservation is essential for mines and buildings.
  old.buildings['2,2'] = { kind: 'sawmill', x: 2, y: 2, level: 1 }
  old.deposits['2,3'] = 11
  old.forests['1,1'] = { age: 3 }
  old.deposits['1,1'] = 60
  const raw = encode(old, 10),
    values = new Map([[CATALOG_KEY, raw]])
  const port = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
  const loaded = load(port)
  assert.equal(loaded.status, 'saved')
  assert.equal(values.get(CATALOG_KEY), raw)
  assert.deepEqual(loaded.state.resources, old.resources)
  assert.equal(loaded.state.turn, old.turn)
  for (const sector of old.sectors)
    for (const p of sectorCells(old.seed, sector, 1))
      assert.equal(baseTerrain(loaded.state, p.x, p.y), p.kind)
  const next = resolveTurn(loaded.state, { type: 'explore', x: 1, y: 0 }).state
  for (const p of sectorCells(old.seed, { x: 1, y: 0 }))
    assert.equal(baseTerrain(next, p.x, p.y), p.kind)
  assert.ok(save(port, next, true))
  assert.deepEqual(load(port).state, next)
  values.set(SAVE_KEY, '{broken')
  values.set(LEGACY_KEY, encode(old, 1))
  assert.equal(load(port).status, 'corrupt')
  assert.equal(values.get(SAVE_KEY), '{broken')
  values.delete(SAVE_KEY)
  const denied = load({
    getItem: port.getItem,
    setItem() {
      throw Error('quota')
    },
  })
  assert.equal(denied.status, 'saved')
  assert.equal(denied.migrationSaveFailed, true)
  assert.equal(values.get(CATALOG_KEY), raw)
})

test('invalid generator versions and forged legacy sectors are rejected without falling back', () => {
  for (const landscape of [
    null,
    { version: 3, legacySectors: [] },
    { version: 2, legacySectors: ['9,9'] },
    { version: 2, legacySectors: ['0,0', '0,0'] },
    { version: 1, legacySectors: ['0,0'] },
  ]) {
    const s = newKingdom(42)
    s.landscape = landscape
    assert.equal(decode(encode(s)), null)
  }
})

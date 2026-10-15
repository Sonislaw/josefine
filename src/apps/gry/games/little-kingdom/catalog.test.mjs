import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import { encode } from '../../../../../tests/gry/kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, ECONOMY_BUILDINGS, actionError, resolveTurn } = await j.import('./engine.ts')
const { load, SAVE_KEY, FORESTRY_KEY } = await j.import('./storage.ts')

test('every economic building can be chosen in consecutive turns, independently of the map seed', () => {
  for (const seed of [1, 42, 183])
    for (const kind of ECONOMY_BUILDINGS) {
      const state = newKingdom(seed, 1)
      state.resources = { wood: 1000, stone: 1000, food: 1000, gold: 1000 }
      const before = structuredClone(state)
      const action = { type: 'build', kind, x: 0, y: 0 }
      assert.equal(actionError(state, action), null)
      const result = resolveTurn(state, action)
      assert.deepEqual(state, before)
      assert.equal(result.state.buildings['0,0'].kind, kind)
      for (const nextKind of ECONOMY_BUILDINGS)
        assert.equal(actionError(result.state, { type: 'build', kind: nextKind, x: 1, y: 0 }), null)
      assert.equal(Object.hasOwn(result.state, 'offer'), false)
      assert.equal(Object.hasOwn(result.state, 'rng'), false)
    }
})
test('v9 migration removes dealt cards only, preserving forests, work progress, economy and original bytes', () => {
  const state = newKingdom(42, 1)
  state.turn = 12
  state.buildings['2,2'] = { kind: 'forester', level: 1, x: 2, y: 2, plantingProgress: 3 }
  state.forests['1,1'] = { age: 3 }
  state.deposits['1,1'] = 60
  const raw = encode(state, 9)
  const values = new Map([[FORESTRY_KEY, raw]])
  const port = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
  const result = load(port)
  assert.equal(result.status, 'saved')
  assert.deepEqual(result.state, { ...state, landscape: { version: 2, legacySectors: ['0,0'] } })
  assert.equal(values.get(FORESTRY_KEY), raw)
  assert.equal(JSON.parse(values.get(SAVE_KEY)).version, 11)
  values.set(SAVE_KEY, '{broken')
  assert.equal(load(port).status, 'corrupt')
  assert.equal(values.get(SAVE_KEY), '{broken')
  values.delete(SAVE_KEY)
  const invalid = JSON.parse(raw)
  invalid.state.offer = ['farm', 'farm', 'house']
  values.set(FORESTRY_KEY, JSON.stringify(invalid))
  assert.equal(load(port).status, 'corrupt')
  assert.equal(values.has(SAVE_KEY), false)
})

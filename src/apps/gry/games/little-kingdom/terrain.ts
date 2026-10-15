// Shared by the economy and discoveries, without a circular dependency between their rules.
export type Terrain = 'meadow' | 'forest' | 'rock' | 'water'
export const SIZE = 7
export type TerrainVersion = 1 | 2
export interface Landscape {
  version: TerrainVersion
  /** Previously explored sectors retain their original terrain after migration. */
  legacySectors: string[]
}
export interface TerrainState {
  seed: number
  landscape: Landscape
}
export function hash(seed: number, x: number, y: number) {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return (n ^ (n >>> 16)) >>> 0
}
/** Frozen v1 generator: old settlements must never move onto water after an update. */
function legacyTerrain(seed: number, x: number, y: number): Terrain {
  const lx = ((x % SIZE) + SIZE) % SIZE,
    ly = ((y % SIZE) + SIZE) % SIZE
  if (ly < 3 || (lx === 3 && ly === 3)) return 'meadow'
  if (ly === 3 && lx === 2) return 'forest'
  if (ly === 3 && lx === 4) return 'water'
  if (ly === 4 && lx === 3) return 'rock'
  const n = hash(seed, x, y) % 100
  return n < 45 ? 'meadow' : n < 70 ? 'forest' : n < 86 ? 'rock' : 'water'
}

const unit = (seed: number, x: number, y: number) => hash(seed, x, y) / 0x100000000

/** Overlapping ellipses use world coordinates, not independent rolls per tile.
 * Their cores form deposits and woodland that can continue across sector borders. */
function patch(
  seed: number,
  x: number,
  y: number,
  spacing: number,
  radius: number,
  density: number,
) {
  const cx = Math.floor(x / spacing),
    cy = Math.floor(y / spacing)
  let strength = 0
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx,
        gy = cy + dy
      if (unit(seed, gx, gy) > density) continue
      const px = (gx + 0.3 + unit(seed ^ 0x1265ab, gx, gy) * 0.4) * spacing,
        py = (gy + 0.3 + unit(seed ^ 0x7421ed, gx, gy) * 0.4) * spacing,
        rx = radius * (0.85 + unit(seed ^ 0x61dc85, gx, gy) * 0.3),
        ry = radius * (0.8 + unit(seed ^ 0x7e219b, gx, gy) * 0.35)
      strength = Math.max(strength, 1 - ((x - px) / rx) ** 2 - ((y - py) / ry) ** 2)
    }
  return strength
}

/** Sparse lakes, centred on sector junctions: one basin spans several sectors
 * instead of creating tiny ponds on every map. Domain-separated from resources. */
function lake(seed: number, x: number, y: number) {
  const spacing = SIZE * 4,
    cx = Math.floor(x / spacing),
    cy = Math.floor(y / spacing)
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx,
        gy = cy + dy
      if (unit(seed ^ 0x6c41b8, gx, gy) > 0.75) continue
      const px = gx * spacing + (1 + (hash(seed ^ 0x3d718f, gx, gy) % 3)) * SIZE - 0.5,
        py = gy * spacing + (1 + (hash(seed ^ 0x7b24ae, gx, gy) % 3)) * SIZE - 0.5,
        radius = 3.8 + unit(seed ^ 0x4d825b, gx, gy),
        ry = radius * (0.8 + unit(seed ^ 0x2c57af, gx, gy) * 0.2)
      if (((x - px) / radius) ** 2 + ((y - py) / ry) ** 2 < 1) return true
    }
  return false
}

/** Bounded memoization avoids regenerating 49 cells for every SVG/production query.
 * It is only a performance cache: order of calls never affects the map. */
const sectorCache = new Map<string, readonly Terrain[]>()
function clusteredSector(seed: number, sx: number, sy: number): readonly Terrain[] {
  const cacheKey = `${seed}:${sx},${sy}`,
    cached = sectorCache.get(cacheKey)
  if (cached) return cached
  const cells: Terrain[] = [],
    resources: { index: number; strength: number }[] = []
  let water = 0
  for (let ly = 0; ly < SIZE; ly++)
    for (let lx = 0; lx < SIZE; lx++) {
      const x = sx * SIZE + lx,
        y = sy * SIZE + ly,
        index = cells.length
      if (lake(seed, x, y)) {
        cells.push('water')
        water++
        continue
      }
      // Larger groups are sparser: clustering must not double the world's reserves.
      const forest = patch(seed ^ 0x513ac7, x, y, 9, 3.8, 0.4),
        rock = patch(seed ^ 0x291eab, x, y, 12, 3.1, 0.6)
      cells.push(forest > rock && forest > 0 ? 'forest' : rock > 0 ? 'rock' : 'meadow')
      if (Math.max(forest, rock) > 0) resources.push({ index, strength: Math.max(forest, rock) })
    }
  // Retain compact resource cores, rather than carving random holes into them.
  // Every sector still offers at least 20 plots for buildings and discoveries;
  // water is never cut up to satisfy this guarantee.
  resources.sort((a, b) => b.strength - a.strength || a.index - b.index)
  for (const entry of resources.slice(Math.max(0, SIZE * SIZE - 20 - water)))
    cells[entry.index] = 'meadow'
  if (sx === 0 && sy === 0) {
    // A playable clearing and three distinct, contiguous starter biomes. Other
    // sectors are seed-dependent; no repeated horizontal meadow stripes.
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        cells[y * SIZE + x] =
          (x <= 1 && y >= 3) || (x === 2 && y === 4)
            ? 'forest'
            : x >= 5 && (y === 2 || y === 3)
              ? 'rock'
              : (x >= 3 && y >= 5) || (x === 6 && y === 4)
                ? 'water'
                : 'meadow'
  }
  if (sectorCache.size >= 512) sectorCache.delete(sectorCache.keys().next().value!)
  sectorCache.set(cacheKey, cells)
  return cells
}

/** The version is explicit for new terrain; the default preserves legacy callers. */
export function terrain(seed: number, x: number, y: number, version: TerrainVersion = 1): Terrain {
  if (version === 1) return legacyTerrain(seed, x, y)
  const sx = Math.floor(x / SIZE),
    sy = Math.floor(y / SIZE)
  return clusteredSector(seed, sx, sy)[(y - sy * SIZE) * SIZE + x - sx * SIZE]!
}
export function terrainVersionAt(
  state: TerrainState,
  sector: { x: number; y: number },
): TerrainVersion {
  return state.landscape.legacySectors.includes(`${sector.x},${sector.y}`)
    ? 1
    : state.landscape.version
}
export function baseTerrain(state: TerrainState, x: number, y: number): Terrain {
  return terrain(
    state.seed,
    x,
    y,
    terrainVersionAt(state, { x: Math.floor(x / SIZE), y: Math.floor(y / SIZE) }),
  )
}

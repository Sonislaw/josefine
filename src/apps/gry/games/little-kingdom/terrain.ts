// Shared by the economy and discoveries, without a circular dependency between their rules.
export type Terrain = 'meadow' | 'forest' | 'rock' | 'water'
export const SIZE = 7
export function hash(seed: number, x: number, y: number) {
  let n = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return (n ^ (n >>> 16)) >>> 0
}
/** Existing terrain algorithm is unchanged, including negative coordinates and old saves. */
export function terrain(seed: number, x: number, y: number): Terrain {
  const lx = ((x % SIZE) + SIZE) % SIZE,
    ly = ((y % SIZE) + SIZE) % SIZE
  if (ly < 3 || (lx === 3 && ly === 3)) return 'meadow'
  if (ly === 3 && lx === 2) return 'forest'
  if (ly === 3 && lx === 4) return 'water'
  if (ly === 4 && lx === 3) return 'rock'
  const n = hash(seed, x, y) % 100
  return n < 45 ? 'meadow' : n < 70 ? 'forest' : n < 86 ? 'rock' : 'water'
}

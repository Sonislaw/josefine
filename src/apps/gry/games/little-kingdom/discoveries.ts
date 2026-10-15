import { hash, SIZE, terrain, type TerrainVersion } from './terrain'
import type { Building, Kingdom, Point, Resources } from './engine'

export type DiscoveryKind = 'ruins' | 'wagon' | 'spring' | 'tradingPost'
export interface Discovery extends Point {
  kind: DiscoveryKind
  status: 'available' | 'used'
  discoveredTurn: number
  usedTurn: number | null
}
const stock = (wood = 0, stone = 0, food = 0, gold = 0): Resources => ({ wood, stone, food, gold })
export const DISCOVERIES: Record<
  DiscoveryKind,
  {
    name: string
    action: string
    description: string
    benefit: string
    cost: Resources
    reward: Resources
    permanent: boolean
  }
> = {
  ruins: {
    name: 'Ruiny strażnicy',
    action: 'Zbadaj ruiny',
    description:
      'Pod bluszczem kryją się stare mury i zapomniana skrytka. Przygotuj drewno do zabezpieczenia przejścia.',
    benefit: 'Jednorazowo 10 kamienia i 6 monet. Po zbadaniu pole można zabudować.',
    cost: stock(4),
    reward: stock(0, 10, 0, 6),
    permanent: false,
  },
  wagon: {
    name: 'Porzucony wóz',
    action: 'Zbierz znalezisko',
    description:
      'Przy dawnym szlaku stoi wóz z drewnem i zapasami. Wystarczy zorganizować ich transport do osady.',
    benefit: 'Jednorazowo 12 drewna i 6 żywności. Opróżniony wóz zwalnia pole.',
    cost: stock(),
    reward: stock(12, 0, 6),
    permanent: false,
  },
  spring: {
    name: 'Zarośnięte źródło',
    action: 'Odnów źródło',
    description:
      'Pod korzeniami wciąż płynie czysta woda. Oczyść źródło i umocnij jego brzegi, by służyło gospodarstwom.',
    benefit:
      '+1 żywności dla farm i sadów przy wspólnej krawędzi, przed zimowym zmniejszeniem plonów. Bez mnożenia przez poziom i kumulacji kilku źródeł.',
    cost: stock(8, 6),
    reward: stock(),
    permanent: true,
  },
  tradingPost: {
    name: 'Dawny punkt handlowy',
    action: 'Odnów punkt handlowy',
    description:
      'Na rozstaju dróg zachował się stary kupiecki przystanek. Odbuduj go, a handel w sąsiedztwie odżyje.',
    benefit:
      '+1 moneta dla każdego targu przy wspólnej krawędzi. Bez mnożenia przez poziom i kumulacji kilku punktów handlowych.',
    cost: stock(12, 8),
    reward: stock(),
    permanent: true,
  },
}
const kinds: DiscoveryKind[] = ['ruins', 'wagon', 'spring', 'tradingPost']
/** Domain-separated hashes keep discoveries independent of other map features. */
export function discoveryForSector(
  seed: number,
  sector: Point,
  discoveredTurn: number,
  terrainVersion: TerrainVersion = 1,
): Discovery | null {
  if (sector.x === 0 && sector.y === 0) return null
  const kind = kinds[hash(seed ^ 0x27d4eb2d, sector.x, sector.y) % 4]!
  const meadows: Point[] = []
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const p = { x: sector.x * SIZE + x, y: sector.y * SIZE + y }
      if (terrain(seed, p.x, p.y, terrainVersion) !== 'meadow') continue
      // A permanent site must have a useful building plot next to it, not be trapped
      // among rocks/water. Both generators guarantee ample building plots.
      if (
        DISCOVERIES[kind].permanent &&
        ![
          { x: p.x - 1, y: p.y },
          { x: p.x + 1, y: p.y },
          { x: p.x, y: p.y - 1 },
          { x: p.x, y: p.y + 1 },
        ].some(
          (q) =>
            Math.floor(q.x / SIZE) === sector.x &&
            Math.floor(q.y / SIZE) === sector.y &&
            terrain(seed, q.x, q.y, terrainVersion) === 'meadow',
        )
      )
        continue
      meadows.push(p)
    }
  const point = meadows[hash(seed ^ 0x61c88647, sector.x, sector.y) % meadows.length]!
  return {
    ...point,
    kind,
    status: 'available',
    discoveredTurn,
    usedTurn: null,
  }
}
export function blocksBuilding(d: Discovery | undefined): boolean {
  return !!d && (d.status === 'available' || DISCOVERIES[d.kind].permanent)
}
export function discoveryStatus(d: Discovery) {
  return d.status === 'available'
    ? 'Do zbadania'
    : DISCOVERIES[d.kind].permanent
      ? 'Odnowione'
      : 'Wykorzystane'
}
/** One source at most per building; cardinal adjacency and no level multiplier. */
export function discoveryBonus(
  state: Kingdom,
  b: Building,
): { source: Discovery; resource: 'food' | 'gold' } | null {
  if (b.damaged) return null
  const kind =
    b.kind === 'farm' || b.kind === 'orchard'
      ? 'spring'
      : b.kind === 'market'
        ? 'tradingPost'
        : null
  if (!kind) return null
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    const d = state.discoveries[`${b.x + dx!},${b.y + dy!}`]
    if (d?.kind === kind && d.status === 'used')
      return { source: d, resource: kind === 'spring' ? 'food' : 'gold' }
  }
  return null
}

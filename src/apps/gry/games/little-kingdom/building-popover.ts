import type { Point } from './engine'

export const CELL = 64
export const MIN_ZOOM = 0.45
export const MAX_ZOOM = 1.8
export const POPOVER_WIDTH = 276
export interface MapCamera {
  width: number
  height: number
  zoom: number
  ox: number
  oy: number
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
/** Screen-space UI is not scaled with SVG terrain. Pan just enough to fit ABOVE the tile. */
export function placeBuildingPopover(camera: MapCamera, tile: Point, height: number) {
  const margin = 8,
    gap = 10
  const width = Math.min(POPOVER_WIDTH, camera.width - margin * 2)
  const zoom = Math.min(
    camera.zoom,
    Math.max(MIN_ZOOM, (camera.height - height - margin * 2 - gap) / CELL),
  )
  const size = CELL * zoom
  // If a very close mobile view needs zooming out, keep the selected tile's centre stable.
  let ox = camera.ox + (tile.x + 0.5) * CELL * (camera.zoom - zoom)
  let oy = camera.oy + (tile.y + 0.5) * CELL * (camera.zoom - zoom)
  const x = ox + tile.x * size,
    y = oy + tile.y * size
  ox += clamp(x, margin, camera.width - size - margin) - x
  oy += clamp(y, height + gap + margin, camera.height - size - margin) - y
  const centre = ox + (tile.x + 0.5) * size
  const left = clamp(centre - width / 2, margin, camera.width - width - margin)
  return {
    camera: { ...camera, ox, oy, zoom },
    width,
    left,
    top: oy + tile.y * size - height - gap,
    arrow: clamp(centre - left, 16, width - 16),
  }
}

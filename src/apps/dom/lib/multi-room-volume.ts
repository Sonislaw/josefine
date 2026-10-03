import { calculateRoomMetrics, parseRoomDimension } from './room-metrics'

export interface VolumeRoomInput {
  id: number
  name: string
  length: string
  width: string
  height: string
}

export interface VolumeRoomResult {
  id: number
  name: string
  volume: number
}

export const MAX_VOLUME_ROOMS = 10
const MAX_ROOM_NAME_LENGTH = 40
const MAX_DIMENSION_LENGTH = 40
const MAX_QUERY_LENGTH = 2000

export function parseVolumeDimension(raw: string) {
  return raw.length <= MAX_DIMENSION_LENGTH ? parseRoomDimension(raw) : null
}

/** One rectangular-room calculation powers both the row breakdown and the shared URL. */
export function calculateMultiRoomVolume(rooms: readonly VolumeRoomInput[]) {
  if (rooms.length < 1 || rooms.length > MAX_VOLUME_ROOMS) return null

  const ids = new Set<number>()
  const rows: VolumeRoomResult[] = []
  let total = 0
  for (const room of rooms) {
    const name = room.name.trim()
    if (
      !Number.isSafeInteger(room.id) ||
      room.id < 1 ||
      ids.has(room.id) ||
      !name ||
      name.length > MAX_ROOM_NAME_LENGTH ||
      /[\u0000-\u001f\u007f]/.test(name)
    )
      return null

    const length = parseVolumeDimension(room.length)
    const width = parseVolumeDimension(room.width)
    const height = parseVolumeDimension(room.height)
    if (length === null || width === null || height === null) return null
    const metrics = calculateRoomMetrics({ length, width, height })
    if (!metrics || !Number.isFinite(metrics.volume)) return null

    ids.add(room.id)
    rows.push({ id: room.id, name, volume: metrics.volume })
    total += metrics.volume
  }
  return Number.isFinite(total) ? { rows, total } : null
}

/** Share snapshots of dimensions, never browser-local room IDs or calculated results. */
export function serializeVolumeRooms(rooms: readonly VolumeRoomInput[]): string | null {
  if (!calculateMultiRoomVolume(rooms)) return null
  const value = JSON.stringify(
    rooms.map((room) => [
      room.name.trim(),
      parseVolumeDimension(room.length),
      parseVolumeDimension(room.width),
      parseVolumeDimension(room.height),
    ]),
  )
  return value.length <= MAX_QUERY_LENGTH ? value : null
}

/** Malformed or oversized query data never replaces the current form. */
export function parseVolumeRooms(raw: string): VolumeRoomInput[] | null {
  if (raw.length > MAX_QUERY_LENGTH) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!Array.isArray(data) || data.length < 1 || data.length > MAX_VOLUME_ROOMS) return null

  const rooms: VolumeRoomInput[] = []
  for (const [index, entry] of data.entries()) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 4 ||
      typeof entry[0] !== 'string' ||
      !entry.slice(1).every((value) => typeof value === 'number' && Number.isFinite(value))
    )
      return null
    rooms.push({
      id: index + 1,
      name: entry[0],
      length: String(entry[1]),
      width: String(entry[2]),
      height: String(entry[3]),
    })
  }
  return calculateMultiRoomVolume(rooms) ? rooms : null
}

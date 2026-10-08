import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'
import { domPath } from '../seo/useDomSeo'

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
const toQueryNumber = (value: number) => String(Number(value.toFixed(6)))

export type FloorRoomTool = 'panels' | 'underlay' | 'skirting'

/** Keep room-prefilled links identical in the room overview and floor budget. */
export function createFloorRoomToolLink(
  tool: FloorRoomTool,
  dimensions: RoomDimensions | null | undefined,
  roomId?: string,
) {
  const metrics = dimensions ? calculateRoomMetrics(dimensions) : null
  const context = roomId ? { roomId } : {}
  if (tool === 'skirting')
    return {
      path: domPath('/obwod-prostokata'),
      query: {
        ...(metrics && dimensions
          ? { length: String(dimensions.length), width: String(dimensions.width) }
          : {}),
        ...context,
      },
    }
  return {
    path: domPath('/liczba-paczek-paneli'),
    query: {
      ...(metrics ? { area: toQueryNumber(metrics.floor) } : {}),
      ...(tool === 'underlay' ? { includeUnderlay: '1', addMaterial: 'underlay' } : {}),
      ...context,
    },
  }
}

/** Keep the room overview's tile calculator link prefilled with the saved dimensions. */
export function createFloorTileRoomToolLink(
  dimensions: RoomDimensions | null | undefined,
  roomId?: string,
) {
  const metrics = dimensions ? calculateRoomMetrics(dimensions) : null
  return {
    path: domPath('/plytki-na-podloge'),
    query: {
      ...(metrics ? { area: toQueryNumber(metrics.floor) } : {}),
      ...(dimensions && dimensions.length >= 0.01 && dimensions.width >= 0.01
        ? {
            showLayout: '1',
            roomLength: String(dimensions.length),
            roomWidth: String(dimensions.width),
          }
        : {}),
      ...(roomId ? { roomId } : {}),
    },
  }
}

/** Wall tiles receive room dimensions; doors, windows and selected walls stay editable. */
export function createWallTileRoomToolLink(
  dimensions: RoomDimensions | null | undefined,
  roomId?: string,
) {
  return {
    path: domPath('/plytki-na-sciane'),
    query: {
      ...(dimensions
        ? {
            roomLength: String(dimensions.length),
            roomWidth: String(dimensions.width),
            roomHeight: String(dimensions.height),
          }
        : {}),
      ...(roomId ? { roomId } : {}),
    },
  }
}

/** Room identity stays local; calculators only receive dimensions and an optional local room ID. */
export function createRoomToolLinks(dimensions: RoomDimensions, roomId?: string) {
  const metrics = calculateRoomMetrics(dimensions)
  if (!metrics) return []
  const context = roomId ? { roomId } : {}
  return [
    {
      title: 'Panele na podłogę',
      detail: `${format(metrics.floor)} m² podłogi`,
      to: {
        ...createFloorRoomToolLink('panels', dimensions, roomId),
      },
    },
    {
      title: 'Listwy przypodłogowe',
      detail: `${format(metrics.perimeter)} m obwodu`,
      to: {
        ...createFloorRoomToolLink('skirting', dimensions, roomId),
      },
    },
    {
      title: 'Płytki na podłogę',
      detail: `${format(metrics.floor)} m² podłogi`,
      to: createFloorTileRoomToolLink(dimensions, roomId),
    },
    {
      title: 'Wylewka podłogowa',
      detail: `${format(metrics.floor)} m² podłogi`,
      to: {
        path: domPath('/kalkulator-wylewki'),
        query: { area: toQueryNumber(metrics.floor), ...context },
      },
    },
    {
      title: 'Płytki na ścianę',
      detail: `${format(metrics.walls)} m² ścian przed odjęciem otworów`,
      to: createWallTileRoomToolLink(dimensions, roomId),
    },
    {
      title: 'Gładź na ściany',
      detail: `${format(metrics.walls)} m² ścian przed odjęciem otworów`,
      to: {
        path: domPath('/kalkulator-gladzi'),
        query: { area: toQueryNumber(metrics.walls), ...context },
      },
    },
    {
      title: 'Farba na ściany',
      detail: `${format(metrics.walls)} m² ścian przed odjęciem otworów`,
      to: {
        path: domPath('/ilosc-farby'),
        query: {
          mode: 'room',
          length: String(dimensions.length),
          width: String(dimensions.width),
          height: String(dimensions.height),
          area: toQueryNumber(metrics.walls),
          ...context,
        },
      },
    },
    {
      title: 'Tapeta na ściany',
      detail: `${format(metrics.walls)} m² ścian przed odjęciem otworów`,
      to: {
        path: domPath('/liczba-rolek-tapety'),
        query: {
          length: String(dimensions.length),
          width: String(dimensions.width),
          height: String(dimensions.height),
          ...context,
        },
      },
    },
  ]
}

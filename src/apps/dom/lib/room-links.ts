import { calculateRoomMetrics, type RoomDimensions } from './room-metrics'
import { domPath } from '../seo/useDomSeo'

const format = (value: number) =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
const toQueryNumber = (value: number) => String(Number(value.toFixed(6)))

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
        path: domPath('/liczba-paczek-paneli'),
        query: { area: toQueryNumber(metrics.floor), ...context },
      },
    },
    {
      title: 'Listwy przypodłogowe',
      detail: `${format(metrics.perimeter)} m obwodu`,
      to: {
        path: domPath('/obwod-prostokata'),
        query: { length: String(dimensions.length), width: String(dimensions.width), ...context },
      },
    },
    {
      title: 'Płytki na podłogę',
      detail: `${format(metrics.floor)} m² podłogi`,
      to: {
        path: domPath('/liczba-plytek'),
        query: { area: toQueryNumber(metrics.floor), ...context },
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
  ]
}

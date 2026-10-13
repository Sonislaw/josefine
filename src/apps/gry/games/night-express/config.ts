/** All economy and movement tuning is local to this game. Units are world coordinates / seconds. */
export const RULES = {
  step: 1 / 60,
  maxFrameGap: 0.25,
  speed: 64,
  radius: 11,
  stopDistance: 56,
  switchLock: 32,
  platformRadius: 30,
  exitSpace: 48,
  stationStop: 2,
  initialCapacity: 6,
  maxCapacity: 12,
  maxTrains: 16,
  initialRails: 48,
  railUnit: 40,
  minEdge: 72,
  maxEdge: 900,
  nodeSpace: 64,
  districtSize: 640,
  districtEvery: 180,
  districtRails: 24,
  stationGrace: 60,
  upgradeEvery: 120,
  upgradeRails: 12,
  capacityUpgrade: 2,
  queue: 24,
  patience: 120,
  fare: 10,
  lostPenalty: 5,
  demandBase: 0.35,
  demandGrowth: 0.0005,
  maxDemand: 2,
  recentWeight: 0.7,
  saveEvery: 5,
  warningDistance: 150,
  minZoom: 0.18,
  maxZoom: 2,
} as const
export const SYMBOLS = ['●', '◆', '▲', '■', '✦', '⬟']
export const COLORS = ['#f3ba72', '#80d9dc', '#d6b3ed', '#a9d68c', '#f39eac', '#9abef9']
export const stationColor = (id: number) => COLORS[id % COLORS.length]!
export const stationSymbol = (id: number) => SYMBOLS[id % SYMBOLS.length]!
export const timeText = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(n % 60)
    .toString()
    .padStart(2, '0')}`

/** Pure rules. Neither persistence, animation nor pointer handling belongs to this module. */
export const SIZE = 8
export interface Shape {
  id: string
  name: string
  cells: readonly (readonly [number, number])[]
  color: number
}
export const SHAPES: readonly Shape[] = [
  { id: 'dot', name: 'Jeden klocek', cells: [[0, 0]], color: 1 },
  {
    id: 'h2',
    name: 'Dwa poziomo',
    cells: [
      [0, 0],
      [1, 0],
    ],
    color: 2,
  },
  {
    id: 'v2',
    name: 'Dwa pionowo',
    cells: [
      [0, 0],
      [0, 1],
    ],
    color: 2,
  },
  {
    id: 'h3',
    name: 'Trzy poziomo',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    color: 3,
  },
  {
    id: 'v3',
    name: 'Trzy pionowo',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    color: 3,
  },
  {
    id: 'h4',
    name: 'Cztery poziomo',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    color: 4,
  },
  {
    id: 'v4',
    name: 'Cztery pionowo',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    color: 4,
  },
  {
    id: 'square',
    name: 'Kwadrat',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    color: 1,
  },
  {
    id: 'corner',
    name: 'Mały narożnik',
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    color: 5,
  },
  {
    id: 'corner-r',
    name: 'Mały narożnik w prawo',
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    color: 5,
  },
  {
    id: 'corner-up',
    name: 'Mały narożnik w górę',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    color: 5,
  },
  {
    id: 'corner-top',
    name: 'Mały narożnik górny',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    color: 5,
  },
  {
    id: 'l',
    name: 'Litera L',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    color: 6,
  },
  {
    id: 'j',
    name: 'Odwrócona litera L',
    cells: [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
    color: 6,
  },
  {
    id: 't',
    name: 'Litera T',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    color: 2,
  },
  {
    id: 't-up',
    name: 'Odwrócona litera T',
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    color: 2,
  },
  {
    id: 'z',
    name: 'Zygzak',
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    color: 3,
  },
  {
    id: 's',
    name: 'Odwrócony zygzak',
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    color: 3,
  },
  {
    id: 'large',
    name: 'Duży kwadrat',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    color: 4,
  },
]
export const shapeById = (id: string | null | undefined) => SHAPES.find((shape) => shape.id === id)
export const shapeSize = (shape: Shape) => ({
  width: Math.max(...shape.cells.map(([x]) => x)) + 1,
  height: Math.max(...shape.cells.map(([, y]) => y)) + 1,
})
export interface Round {
  board: number[]
  tray: (string | null)[]
  score: number
  streak: number
  lines: number
  moves: number
  status: 'playing' | 'gameover'
}
export function drawTray(rng = Math.random): string[] {
  return Array.from(
    { length: 3 },
    () => SHAPES[Math.min(SHAPES.length - 1, Math.max(0, Math.floor(rng() * SHAPES.length)))]!.id,
  )
}
export const newRound = (rng = Math.random): Round => ({
  board: Array<number>(64).fill(0),
  tray: drawTray(rng),
  score: 0,
  streak: 0,
  lines: 0,
  moves: 0,
  status: 'playing',
})
export function placement(
  board: readonly number[],
  shape: Shape,
  row: number,
  col: number,
): number[] | null {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null
  const cells = shape.cells.map(([x, y]) => ({ row: row + y, col: col + x }))
  if (
    cells.some(
      (p) =>
        p.row < 0 ||
        p.row >= SIZE ||
        p.col < 0 ||
        p.col >= SIZE ||
        board[p.row * SIZE + p.col] !== 0,
    )
  )
    return null
  return cells.map((p) => p.row * SIZE + p.col)
}
export function fits(board: readonly number[], shape: Shape) {
  for (let row = 0; row < SIZE; row++)
    for (let col = 0; col < SIZE; col++) if (placement(board, shape, row, col)) return true
  return false
}
export const hasMove = (round: Pick<Round, 'board' | 'tray'>) =>
  round.tray.some((id) => {
    const s = shapeById(id)
    return s ? fits(round.board, s) : false
  })
export function fullLines(board: readonly number[]) {
  const rows = [],
    columns = []
  for (let i = 0; i < SIZE; i++) {
    if (Array.from({ length: SIZE }, (_, x) => board[i * SIZE + x]).every(Boolean)) rows.push(i)
    if (Array.from({ length: SIZE }, (_, y) => board[y * SIZE + i]).every(Boolean)) columns.push(i)
  }
  return {
    rows,
    columns,
    cells: Array.from(
      new Set([
        ...rows.flatMap((y) => Array.from({ length: SIZE }, (_, x) => y * SIZE + x)),
        ...columns.flatMap((x) => Array.from({ length: SIZE }, (_, y) => y * SIZE + x)),
      ]),
    ),
  }
}
export function place(round: Round, slot: number, row: number, col: number, rng = Math.random) {
  const shape = shapeById(round.tray[slot])
  if (round.status !== 'playing' || !Number.isInteger(slot) || !shape) return null
  const cells = placement(round.board, shape, row, col)
  if (!cells) return null
  const board = [...round.board]
  for (const index of cells) board[index] = shape.color
  // Detect rows AND columns before clearing either: crossing lines are simultaneous.
  const cleared = fullLines(board)
  const lines = cleared.rows.length + cleared.columns.length
  const streak = lines ? round.streak + 1 : 0
  const points = cells.length + 10 * lines * lines * streak
  for (const index of cleared.cells) board[index] = 0
  let tray = [...round.tray]
  tray[slot] = null
  const refilled = tray.every((id) => id === null)
  if (refilled) tray = drawTray(rng)
  const state: Round = {
    board,
    tray,
    score: round.score + points,
    streak,
    lines: round.lines + lines,
    moves: round.moves + 1,
    status: 'playing',
  }
  if (!hasMove(state)) state.status = 'gameover'
  return { state, cleared: cleared.cells, points, lines, refilled }
}

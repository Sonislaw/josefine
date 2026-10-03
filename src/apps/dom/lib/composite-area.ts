export type AreaOperation = 'add' | 'subtract'

export interface AreaFragment {
  id: number
  operation: AreaOperation
  length: string
  width: string
}

export const MAX_AREA_FRAGMENTS = 12
const MAX_DIMENSION = 1000
const MAX_QUERY_LENGTH = 1000

/** Wymiary w metrach; ten sam zapis z polskim przecinkiem co w prostym kalkulatorze. */
export function parseAreaDimension(raw: string): number | null {
  if (raw.length > 40) return null
  const normalized = raw
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) && value > 0 && value <= MAX_DIMENSION ? value : null
}

export function calculateCompositeArea(fragments: readonly AreaFragment[]) {
  if (fragments.length === 0 || fragments.length > MAX_AREA_FRAGMENTS) return null

  let addedArea = 0
  let subtractedArea = 0
  const parts = []
  for (const fragment of fragments) {
    if (fragment.operation !== 'add' && fragment.operation !== 'subtract') return null
    const length = parseAreaDimension(fragment.length)
    const width = parseAreaDimension(fragment.width)
    if (length === null || width === null) return null
    const area = length * width
    if (fragment.operation === 'add') addedArea += area
    else subtractedArea += area
    parts.push({ id: fragment.id, operation: fragment.operation, area })
  }

  const total = addedArea - subtractedArea
  if (!Number.isFinite(total) || total <= 0) return null
  return { parts, addedArea, subtractedArea, total }
}

function normalizedDimension(raw: string): string {
  return raw
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(',', '.')
}

/** Zapisujemy tylko dane wejściowe, nie wynik. Krótki format ogranicza długość linku. */
export function serializeAreaFragments(fragments: readonly AreaFragment[]): string | null {
  if (!calculateCompositeArea(fragments)) return null
  const value = fragments
    .map(
      (fragment) =>
        `${fragment.operation === 'add' ? '+' : '-'}${normalizedDimension(fragment.length)}x${normalizedDimension(fragment.width)}`,
    )
    .join(';')
  return value.length <= MAX_QUERY_LENGTH ? value : null
}

/** Niepoprawny URL nie nadpisuje bieżącego formularza. */
export function parseAreaFragments(raw: string): AreaFragment[] | null {
  if (raw.length > MAX_QUERY_LENGTH) return null
  if (raw === '') return []
  const encoded = raw.split(';')
  if (encoded.length > MAX_AREA_FRAGMENTS) return null

  const fragments: AreaFragment[] = []
  for (const [index, item] of encoded.entries()) {
    const match = /^([+-])((?:\d+(?:\.\d*)?|\.\d+))x((?:\d+(?:\.\d*)?|\.\d+))$/.exec(item)
    if (!match || parseAreaDimension(match[2]!) === null || parseAreaDimension(match[3]!) === null)
      return null
    fragments.push({
      id: index + 1,
      operation: match[1] === '+' ? 'add' : 'subtract',
      length: match[2]!,
      width: match[3]!,
    })
  }
  return calculateCompositeArea(fragments) ? fragments : null
}

import { isValidAmount, roundCents, type UopInput } from './calculations'
import { rules2026 } from './rules/2026'
import { calcUopYear, type UopYearResult } from './uop-year'

export type UopNetGoal = 'average' | 'every-month'

export interface UopRequiredGrossResult {
  gross: number
  annualNet: number
  averageMonthlyNet: number
  lowestMonthlyNet: number
  lowestMonth: number
  yearResult: UopYearResult
}

const maxMonthlyGross = 100_000_000

/**
 * Find the first whole-PLN gross salary meeting the selected 2026 net goal.
 * Net salary is not globally monotone: PIT rounding creates small dips, and
 * the lowest monthly payout can dip when a tax threshold moves between months.
 * A left-first, bounded search is therefore used instead of binary search.
 */
export function findRequiredUopGross(
  targetMonthlyNet: number,
  goal: UopNetGoal,
  settings: Omit<UopInput, 'gross'>,
  year: 2026 = 2026,
): UopRequiredGrossResult | null {
  if (!isValidAmount(targetMonthlyNet)) throw new RangeError('Nieprawidłowa docelowa kwota netto.')
  if (goal !== 'average' && goal !== 'every-month')
    throw new RangeError('Nieobsługiwany cel wynagrodzenia netto.')

  const cache = new Map<number, UopYearResult>()
  const at = (gross: number) => {
    let result = cache.get(gross)
    if (!result) {
      result = calcUopYear({ ...settings, gross }, year)
      cache.set(gross, result)
    }
    return result
  }
  const targetCents = Math.round(targetMonthlyNet * 100)
  const meetsGoal = (result: UopYearResult) =>
    goal === 'average'
      ? Math.round(result.totals.net * 100) >= targetCents * 12
      : result.months.every((month) => Math.round(month.net * 100) >= targetCents)

  // For each month, gross at the interval's upper end is an upper bound on
  // income; PIT, health and PPK at the lower end are lower bounds on charges.
  // Pension/disability base rises and then falls as the annual cap moves to an
  // earlier month, so its minimum within an interval is at one of the ends.
  // This optimistic net bound can only discard ranges with no valid answer.
  const canMeetGoal = (start: number, end: number) => {
    const low = at(start)
    const high = at(end)
    const { employee } = rules2026.uop
    const sicknessMinimum = roundCents(start * employee.sickness)
    let annualUpperBound = 0
    for (let index = 0; index < 12; index++) {
      const lowMonth = low.months[index]!
      const highMonth = high.months[index]!
      const pensionDisabilityMinimum = Math.min(
        lowMonth.pensionDisabilityBase,
        highMonth.pensionDisabilityBase,
      )
      const socialMinimum =
        roundCents(pensionDisabilityMinimum * employee.pension) +
        roundCents(pensionDisabilityMinimum * employee.disability) +
        sicknessMinimum
      const monthlyUpperBound =
        end - socialMinimum - lowMonth.health - lowMonth.tax - lowMonth.ppkEmployee
      if (goal === 'every-month' && Math.round(monthlyUpperBound * 100) < targetCents) return false
      annualUpperBound += monthlyUpperBound
    }
    return goal === 'every-month' || Math.round(annualUpperBound * 100) >= targetCents * 12
  }

  const firstMatching = (start: number, end: number): number | null => {
    if (!canMeetGoal(start, end)) return null
    if (meetsGoal(at(start))) return start
    if (start === end) return null
    const middle = Math.floor((start + end) / 2)
    return firstMatching(start, middle) ?? firstMatching(middle + 1, end)
  }

  const gross = firstMatching(0, maxMonthlyGross)
  if (gross === null) return null
  const yearResult = at(gross)
  const lowestMonth = yearResult.months.reduce((lowest, month) =>
    month.net < lowest.net ? month : lowest,
  )
  return {
    gross,
    annualNet: yearResult.totals.net,
    averageMonthlyNet: roundCents(yearResult.totals.net / 12),
    lowestMonthlyNet: lowestMonth.net,
    lowestMonth: lowestMonth.month,
    yearResult,
  }
}

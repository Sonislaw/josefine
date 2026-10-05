import { roundCents, type B2bInput, type UopInput } from './calculations'
import { calcB2bYear, type B2bYearMonth, type B2bYearResult } from './b2b-year'
import { calcUopYear, type UopYearMonth, type UopYearResult } from './uop-year'

export interface WorkYearComparisonMonth {
  month: number
  uop: UopYearMonth
  b2b: B2bYearMonth
  difference: number
}

export interface WorkYearComparison {
  year: 2026
  uop: UopYearResult
  b2b: B2bYearResult
  months: WorkYearComparisonMonth[]
  monthlyDifferenceTotal: number
  differenceAfterHealthSettlement: number
}

/** Compare the same twelve months; keep the subsequent B2B health settlement separate. */
export function calcWorkYearComparison(
  uopInput: UopInput,
  b2bInput: B2bInput,
  year: 2026 = 2026,
): WorkYearComparison {
  const uop = calcUopYear(uopInput, year)
  const b2b = calcB2bYear(b2bInput, year)
  const months = uop.months.map((uopMonth, index) => {
    const b2bMonth = b2b.months[index]!
    return {
      month: uopMonth.month,
      uop: uopMonth,
      b2b: b2bMonth,
      difference: roundCents(b2bMonth.net - uopMonth.net),
    }
  })

  return {
    year,
    uop,
    b2b,
    months,
    monthlyDifferenceTotal: roundCents(b2b.totals.net - uop.totals.net),
    differenceAfterHealthSettlement: roundCents(b2b.netAfterHealthSettlement - uop.totals.net),
  }
}

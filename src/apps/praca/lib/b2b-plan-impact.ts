import { calcB2bYear, type B2bYearResult } from './b2b-year'
import { roundCents, type B2bInput } from './calculations'

export interface B2bPlanImpact {
  baseline: B2bYearResult
  planned: B2bYearResult
  changedMonths: number[]
  invoiceDifference: number
  netDifference: number
}

/** Compare two annual projections without treating a change in invoices as cash flow. */
export function calcB2bPlanImpact(
  baselineInput: B2bInput,
  planned: B2bYearResult,
  year: 2026 = 2026,
): B2bPlanImpact {
  const baseline = calcB2bYear(baselineInput, year)
  if (planned.year !== year || planned.months.length !== 12)
    throw new RangeError('Nieprawidłowy plan roczny B2B.')

  return {
    baseline,
    planned,
    changedMonths: planned.months
      .filter((month, index) => month.invoice !== baseline.months[index]?.invoice)
      .map((month) => month.month),
    invoiceDifference: roundCents(planned.totals.invoice - baseline.totals.invoice),
    // Use the already-settled annual amounts exactly once in both variants.
    netDifference: roundCents(planned.netAfterHealthSettlement - baseline.netAfterHealthSettlement),
  }
}

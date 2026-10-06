import { roundCents, type B2bInput } from './calculations'
import { calcB2bYear, calcB2bYearFromPlan, type B2bYearResult } from './b2b-year'

export interface B2bRequiredInvoice {
  invoice: number
  annualNet: number
  differenceToTarget: number
}

const maxMonthlyInvoice = 100_000_000

/**
 * Finds the first whole-PLN base invoice whose 12-month B2B result reaches
 * the UoP target. Fixed monthly overrides remain untouched. Reuses the annual model, including the lump-sum health
 * settlement. On lump-sum tax the annual health bracket causes downward jumps
 * in net, so a single binary search over the entire range would be incorrect.
 */
export function findRequiredB2bInvoice(
  targetAnnualNet: number,
  settings: Omit<B2bInput, 'invoice'>,
  year: 2026 = 2026,
  invoiceOverrides?: readonly (number | null)[],
): B2bRequiredInvoice | null {
  if (!Number.isFinite(targetAnnualNet) || targetAnnualNet < 0)
    throw new RangeError('Nieprawidłowa roczna kwota netto UoP.')
  if (
    invoiceOverrides &&
    (invoiceOverrides.length !== 12 ||
      invoiceOverrides.some(
        (value) => value !== null && (!Number.isFinite(value) || value < 0 || value > 100_000_000),
      ))
  )
    throw new RangeError('Nieprawidłowy plan faktur B2B.')
  if (invoiceOverrides?.every((value) => value !== null)) return null

  const cache = new Map<number, B2bYearResult>()
  const at = (invoice: number) => {
    let result = cache.get(invoice)
    if (!result) {
      result = invoiceOverrides
        ? calcB2bYearFromPlan(
            { ...settings, invoices: invoiceOverrides.map((value) => value ?? invoice) },
            year,
          )
        : calcB2bYear({ ...settings, invoice }, year)
      cache.set(invoice, result)
    }
    return result
  }
  const targetCents = Math.round(targetAnnualNet * 100)
  const reachesTarget = (invoice: number) =>
    Math.round(at(invoice).netAfterHealthSettlement * 100) >= targetCents
  const firstMatching = (start: number, end: number, matches: (invoice: number) => boolean) => {
    let low = start
    let high = end
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (matches(middle)) high = middle
      else low = middle + 1
    }
    return low
  }

  // Annual bracket changes split the domain into monotone ranges. Searching
  // them from lowest to highest also handles a target reached before a later
  // bracket jump, even if that jump temporarily pushes net below the target.
  const starts = [0]
  if (settings.form === 'lump') {
    at(0) // Validate settings even when no bracket boundary exists.
    for (const bracket of [1, 2]) {
      const boundary = firstMatching(
        0,
        maxMonthlyInvoice,
        (invoice) => (at(invoice).annualLumpHealthBracket ?? 0) >= bracket,
      )
      if (boundary > 0 && boundary <= maxMonthlyInvoice) starts.push(boundary)
    }
  }
  starts.push(maxMonthlyInvoice + 1)

  for (let index = 0; index < starts.length - 1; index++) {
    const start = starts[index]!
    const end = starts[index + 1]! - 1
    if (!reachesTarget(end)) continue
    const invoice = firstMatching(start, end, reachesTarget)
    const annualNet = at(invoice).netAfterHealthSettlement
    return {
      invoice,
      annualNet,
      differenceToTarget: roundCents(annualNet - targetAnnualNet),
    }
  }
  return null
}

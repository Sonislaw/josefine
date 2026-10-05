import {
  isValidAmount,
  lumpRates,
  roundCents,
  roundZloty,
  taxForms,
  zusVariants,
  type B2bInput,
  type ZusVariant,
} from './calculations'
import { rules2026 } from './rules/2026'

export type B2bYearEvent = 'health-60k' | 'health-300k' | 'pit-threshold' | 'zus-transition'

export interface B2bYearMonth {
  month: number
  zusVariant: ZusVariant
  invoice: number
  costs: number
  social: number
  health: number
  tax: number
  net: number
  events: B2bYearEvent[]
}

export interface B2bYearResult {
  year: 2026
  months: B2bYearMonth[]
  totals: Omit<B2bYearMonth, 'month' | 'zusVariant' | 'events'>
  healthSettlement: number
  netAfterHealthSettlement: number
}

/**
 * Projection for twelve identical invoices and costs. Health is attributed to
 * the income month, rather than the following ZUS payment month. Tax advances
 * and the lump-sum health bracket are tracked cumulatively. This is not an
 * annual tax return or an exact payment calendar; see METODOLOGIA.md.
 */
export function calcB2bYear(input: B2bInput, year: 2026 = 2026): B2bYearResult {
  if (year !== rules2026.year) throw new RangeError('Nieobsługiwany rok rozliczenia B2B.')
  if (!isValidAmount(input.invoice) || !isValidAmount(input.costs))
    throw new RangeError('Nieprawidłowa kwota faktury lub kosztów.')
  if (
    !taxForms.some(({ value }) => value === input.form) ||
    !zusVariants.some(({ value }) => value === input.zus) ||
    (input.form === 'lump' && !lumpRates.includes(input.rate as (typeof lumpRates)[number]))
  )
    throw new RangeError('Nieobsługiwana forma opodatkowania lub wariant ZUS.')

  const { b2b, scale } = rules2026
  let cumulativeInvoice = 0
  let cumulativeIncome = 0
  let cumulativeSocial = 0
  let cumulativeHealth = 0
  let paidTax = 0
  let previousTaxBase = 0
  let previousHealthRevenue = 0
  const months: B2bYearMonth[] = []

  for (let month = 1; month <= 12; month++) {
    // A January start means six full months of the start-up relief. Assuming
    // eligibility, preferential contributions follow from July.
    const zusVariant = input.zus === 'start' && month > 6 ? 'preferential' : input.zus
    const socialVariant = b2b.social[zusVariant]
    const social = input.sickness ? socialVariant.withSickness : socialVariant.withoutSickness
    cumulativeInvoice = roundCents(cumulativeInvoice + input.invoice)
    cumulativeIncome = roundCents(cumulativeIncome + input.invoice - input.costs - social)
    cumulativeSocial = roundCents(cumulativeSocial + social)
    const healthRevenue = Math.max(0, roundCents(cumulativeInvoice - cumulativeSocial))
    const healthBracket =
      healthRevenue <= b2b.health.lumpThresholds[0]
        ? 0
        : healthRevenue <= b2b.health.lumpThresholds[1]
          ? 1
          : 2
    const minimumHealth = month === 1 ? b2b.health.januaryMinimum : b2b.health.minimumFromFebruary
    const health =
      input.form === 'lump'
        ? b2b.health.lumpAmounts[healthBracket]!
        : roundCents(
            Math.max(
              minimumHealth,
              Math.max(0, input.invoice - input.costs - social) *
                (input.form === 'scale' ? b2b.health.scaleRate : b2b.health.linearRate),
            ),
          )
    cumulativeHealth = roundCents(cumulativeHealth + health)

    // These health deductions assume the contribution is paid in the income
    // month. In reality, payment dates can move the deduction by one month.
    const healthDeduction =
      input.form === 'lump'
        ? roundCents(cumulativeHealth * 0.5)
        : input.form === 'linear'
          ? Math.min(cumulativeHealth, b2b.linearHealthDeductionLimit)
          : 0
    const taxBase = Math.max(
      0,
      roundZloty(
        (input.form === 'lump' ? cumulativeInvoice - cumulativeSocial : cumulativeIncome) -
          healthDeduction,
      ),
    )
    const taxDue =
      input.form === 'scale'
        ? roundZloty(
            Math.max(
              0,
              Math.min(taxBase, scale.annualThreshold) * scale.lowerRate +
                Math.max(0, taxBase - scale.annualThreshold) * scale.upperRate -
                scale.annualReduction,
            ),
          )
        : roundZloty(taxBase * (input.form === 'linear' ? b2b.linearTaxRate : input.rate / 100))
    const tax = Math.max(0, taxDue - paidTax)
    paidTax += tax

    const events: B2bYearEvent[] = []
    if (input.zus === 'start' && month === 7) events.push('zus-transition')
    if (input.form === 'lump') {
      if (
        previousHealthRevenue <= b2b.health.lumpThresholds[0] &&
        healthRevenue > b2b.health.lumpThresholds[0]
      )
        events.push('health-60k')
      if (
        previousHealthRevenue <= b2b.health.lumpThresholds[1] &&
        healthRevenue > b2b.health.lumpThresholds[1]
      )
        events.push('health-300k')
    }
    if (
      input.form === 'scale' &&
      previousTaxBase <= scale.annualThreshold &&
      taxBase > scale.annualThreshold
    )
      events.push('pit-threshold')
    previousHealthRevenue = healthRevenue
    previousTaxBase = taxBase

    months.push({
      month,
      zusVariant,
      invoice: input.invoice,
      costs: input.costs,
      social,
      health,
      tax,
      net: roundCents(input.invoice - input.costs - social - health - tax),
      events,
    })
  }

  const sum = (key: keyof B2bYearResult['totals']) =>
    roundCents(months.reduce((total, item) => total + item[key], 0))
  const totals = {
    invoice: sum('invoice'),
    costs: sum('costs'),
    social: sum('social'),
    health: sum('health'),
    tax: sum('tax'),
    net: sum('net'),
  }
  // On the lump-sum method the final annual bracket applies to all twelve
  // covered months; the difference is paid in the subsequent settlement.
  const healthSettlement =
    input.form === 'lump'
      ? Math.max(
          0,
          roundCents(
            b2b.health.lumpAmounts[
              previousHealthRevenue <= b2b.health.lumpThresholds[0]
                ? 0
                : previousHealthRevenue <= b2b.health.lumpThresholds[1]
                  ? 1
                  : 2
            ]! *
              12 -
              totals.health,
          ),
        )
      : 0
  return {
    year,
    months,
    totals,
    healthSettlement,
    netAfterHealthSettlement: roundCents(totals.net - healthSettlement),
  }
}

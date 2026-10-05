import { isValidAmount, roundCents, roundZloty, type UopInput } from './calculations'
import { rules2026 } from './rules/2026'

export type UopLimitEvent = 'young-relief' | 'pit-threshold' | 'social-base'

export interface UopYearMonth {
  month: number
  gross: number
  social: number
  health: number
  tax: number
  ppkEmployee: number
  ppkEmployer: number
  net: number
  employerCost: number
  exemptRevenue: number
  taxableBase: number
  pensionDisabilityBase: number
  events: UopLimitEvent[]
}

export interface UopYearResult {
  year: 2026
  months: UopYearMonth[]
  totals: Omit<UopYearMonth, 'month' | 'events' | 'taxableBase' | 'pensionDisabilityBase'>
}

/**
 * Twelve payouts from one employer and one fixed monthly gross amount. PIT is
 * estimated as payroll advances with a full monthly PIT-2 reduction, not as a
 * final annual tax return. Other income and the date of a 26th birthday are
 * outside this model; see METODOLOGIA.md.
 */
export function calcUopYear(input: UopInput, year: 2026 = 2026): UopYearResult {
  if (year !== rules2026.year) throw new RangeError('Nieobsługiwany rok rozliczenia UoP.')
  if (!isValidAmount(input.gross))
    throw new RangeError('Nieprawidłowe miesięczne wynagrodzenie brutto.')

  const { uop, scale } = rules2026
  let usedSocialBase = 0
  let usedYoungRelief = 0
  let cumulativeTaxableBase = 0
  const months: UopYearMonth[] = []

  for (let month = 1; month <= 12; month++) {
    const previousSocialBase = usedSocialBase
    const remainingSocialBase = Math.max(0, uop.pensionDisabilityAnnualBaseLimit - usedSocialBase)
    const pensionDisabilityBase = roundCents(Math.min(input.gross, remainingSocialBase))
    usedSocialBase = roundCents(usedSocialBase + pensionDisabilityBase)

    const pension = roundCents(pensionDisabilityBase * uop.employee.pension)
    const disability = roundCents(pensionDisabilityBase * uop.employee.disability)
    const sickness = roundCents(input.gross * uop.employee.sickness)
    const social = roundCents(pension + disability + sickness)
    const health = roundCents(Math.max(0, input.gross - social) * uop.health)

    // PPK contributions continue after the annual social-insurance cap.
    const ppkEmployee = input.ppk ? roundCents(input.gross * uop.ppk.employee) : 0
    const ppkEmployer = input.ppk ? roundCents(input.gross * uop.ppk.employer) : 0
    const employmentRevenue = roundCents(input.gross + ppkEmployer)
    const previousYoungRelief = usedYoungRelief
    const exemptRevenue = input.under26
      ? roundCents(Math.min(employmentRevenue, Math.max(0, uop.youngReliefLimit - usedYoungRelief)))
      : 0
    usedYoungRelief = roundCents(usedYoungRelief + exemptRevenue)
    const taxableRevenue = roundCents(employmentRevenue - exemptRevenue)

    // Social contributions attributable to exempt revenue cannot reduce PIT.
    const deductibleSocial =
      employmentRevenue > 0 ? roundCents((social * taxableRevenue) / employmentRevenue) : 0
    const kup =
      taxableRevenue > 0
        ? Math.min(
            input.elevatedKup ? uop.kup.elevated : uop.kup.standard,
            Math.max(0, taxableRevenue - deductibleSocial),
          )
        : 0
    const taxableBase = Math.max(0, roundZloty(taxableRevenue - deductibleSocial - kup))
    const previousTaxableBase = cumulativeTaxableBase
    cumulativeTaxableBase += taxableBase
    const lowerPart = Math.max(
      0,
      Math.min(taxableBase, scale.annualThreshold - previousTaxableBase),
    )
    const upperPart = taxableBase - lowerPart
    const taxBeforeReduction = lowerPart * scale.lowerRate + upperPart * scale.upperRate
    const tax =
      taxableBase > 0 ? Math.max(0, roundZloty(taxBeforeReduction - scale.annualReduction / 12)) : 0

    const employerSocial =
      roundCents(pensionDisabilityBase * uop.employer.pension) +
      roundCents(pensionDisabilityBase * uop.employer.disability) +
      roundCents(input.gross * uop.employer.accident) +
      roundCents(input.gross * uop.employer.laborFund) +
      roundCents(input.gross * uop.employer.guaranteedFund)
    const events: UopLimitEvent[] = []
    if (
      input.under26 &&
      previousYoungRelief < uop.youngReliefLimit &&
      usedYoungRelief >= uop.youngReliefLimit
    )
      events.push('young-relief')
    if (
      previousTaxableBase <= scale.annualThreshold &&
      cumulativeTaxableBase > scale.annualThreshold
    )
      events.push('pit-threshold')
    if (
      previousSocialBase < uop.pensionDisabilityAnnualBaseLimit &&
      usedSocialBase >= uop.pensionDisabilityAnnualBaseLimit
    )
      events.push('social-base')

    months.push({
      month,
      gross: input.gross,
      social,
      health,
      tax,
      ppkEmployee,
      ppkEmployer,
      net: roundCents(input.gross - social - health - tax - ppkEmployee),
      employerCost: roundCents(input.gross + employerSocial + ppkEmployer),
      exemptRevenue,
      taxableBase,
      pensionDisabilityBase,
      events,
    })
  }

  const sum = (
    key:
      | 'gross'
      | 'social'
      | 'health'
      | 'tax'
      | 'ppkEmployee'
      | 'ppkEmployer'
      | 'net'
      | 'employerCost'
      | 'exemptRevenue',
  ) => roundCents(months.reduce((total, item) => total + item[key], 0))
  return {
    year,
    months,
    totals: {
      gross: sum('gross'),
      social: sum('social'),
      health: sum('health'),
      tax: sum('tax'),
      ppkEmployee: sum('ppkEmployee'),
      ppkEmployer: sum('ppkEmployer'),
      net: sum('net'),
      employerCost: sum('employerCost'),
      exemptRevenue: sum('exemptRevenue'),
    },
  }
}

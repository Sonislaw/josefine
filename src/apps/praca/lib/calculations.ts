import { rules2026 } from './rules/2026'

export type TaxForm = 'scale' | 'linear' | 'lump'
export type ZusVariant = 'start' | 'preferential' | 'full'
export type CalculationPeriod = { year: 2026; month: number }
export type UopInput = { gross: number; under26: boolean; elevatedKup: boolean; ppk: boolean }
export type B2bInput = {
  invoice: number
  costs: number
  form: TaxForm
  rate: number
  zus: ZusVariant
  sickness: boolean
}

// February represents the main 2026 contribution period; January has a separate minimum.
export const defaultPeriod: CalculationPeriod = { year: 2026, month: 2 }
export const monthNames = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
] as const
export const taxForms = [
  { value: 'scale', label: 'Skala podatkowa' },
  { value: 'linear', label: 'Liniowy 19%' },
  { value: 'lump', label: 'Ryczałt' },
] as const
export const zusVariants = [
  { value: 'start', label: 'Ulga na start' },
  { value: 'preferential', label: 'Preferencyjny ZUS' },
  { value: 'full', label: 'Pełny ZUS' },
] as const
export const lumpRates = [8.5, 12, 15, 17] as const

const formatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
export const money = (value: number) => formatter.format(value)
export const isValidAmount = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100_000_000 &&
  Math.abs(value * 100 - Math.round(value * 100)) < 0.000001

export const roundCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
export const roundZloty = (value: number) => Math.round(value)

function assertPeriod(period: CalculationPeriod) {
  if (
    period.year !== rules2026.year ||
    !Number.isInteger(period.month) ||
    period.month < 1 ||
    period.month > 12
  ) {
    throw new RangeError('Nieobsługiwany okres rozliczeniowy Praca.')
  }
}

function assertAmount(value: number) {
  if (!isValidAmount(value))
    throw new RangeError('Kwota musi być nieujemna i mieć maksymalnie dwa miejsca po przecinku.')
}

/** Orientacyjna miesięczna część skali rocznej, nie zaliczka narastająca. */
export function estimateMonthlyScaleTax(base: number) {
  const { annualThreshold, lowerRate, upperRate, annualReduction } = rules2026.scale
  const monthlyThreshold = annualThreshold / 12
  const monthlyReduction = annualReduction / 12
  return Math.max(
    0,
    base <= monthlyThreshold
      ? base * lowerRate - monthlyReduction
      : monthlyThreshold * lowerRate - monthlyReduction + (base - monthlyThreshold) * upperRate,
  )
}

export function calcUop(input: UopInput, period: CalculationPeriod = defaultPeriod) {
  assertPeriod(period)
  assertAmount(input.gross)
  const { uop } = rules2026
  const social =
    roundCents(input.gross * uop.employee.pension) +
    roundCents(input.gross * uop.employee.disability) +
    roundCents(input.gross * uop.employee.sickness)
  const health = roundCents(Math.max(0, input.gross - social) * uop.health)
  const ppkEmployee = input.ppk ? roundCents(input.gross * uop.ppk.employee) : 0
  const ppkEmployer = input.ppk ? roundCents(input.gross * uop.ppk.employer) : 0
  const kup = input.elevatedKup ? uop.kup.elevated : uop.kup.standard
  // Employer PPK is taxable employment income; same-month payment is assumed.
  const taxBase = Math.max(0, Math.floor(input.gross - social - kup + ppkEmployer))
  const tax = input.under26 ? 0 : roundZloty(estimateMonthlyScaleTax(taxBase))
  const employerContributions = Object.values(uop.employer).reduce(
    (total, rate) => total + roundCents(input.gross * rate),
    0,
  )
  return {
    net: roundCents(Math.max(0, input.gross - social - health - tax - ppkEmployee)),
    social: roundCents(social),
    health,
    tax,
    ppkEmployee,
    ppkEmployer,
    employerCost: roundCents(input.gross + employerContributions + ppkEmployer),
  }
}

export function calcB2b(input: B2bInput, period: CalculationPeriod = defaultPeriod) {
  assertPeriod(period)
  assertAmount(input.invoice)
  assertAmount(input.costs)
  if (
    !taxForms.some(({ value }) => value === input.form) ||
    !zusVariants.some(({ value }) => value === input.zus) ||
    (input.form === 'lump' && !lumpRates.includes(input.rate as (typeof lumpRates)[number]))
  ) {
    throw new RangeError('Nieobsługiwana forma opodatkowania lub wariant ZUS.')
  }
  const { b2b } = rules2026
  const socialVariant = b2b.social[input.zus]
  const social = input.sickness ? socialVariant.withSickness : socialVariant.withoutSickness
  const profit = Math.max(0, input.invoice - input.costs - social)
  const annualInvoiceEstimate = input.invoice * 12
  const lumpIndex =
    annualInvoiceEstimate <= b2b.health.lumpThresholds[0]
      ? 0
      : annualInvoiceEstimate <= b2b.health.lumpThresholds[1]
        ? 1
        : 2
  const minimumHealth =
    period.month === 1 ? b2b.health.januaryMinimum : b2b.health.minimumFromFebruary
  const health =
    input.form === 'lump'
      ? b2b.health.lumpAmounts[lumpIndex]!
      : roundCents(
          Math.max(
            minimumHealth,
            profit * (input.form === 'scale' ? b2b.health.scaleRate : b2b.health.linearRate),
          ),
        )
  const taxBase = Math.max(0, Math.floor(input.form === 'lump' ? input.invoice - social : profit))
  const tax = roundZloty(
    input.form === 'scale'
      ? estimateMonthlyScaleTax(taxBase)
      : taxBase * (input.form === 'linear' ? b2b.linearTaxRate : input.rate / 100),
  )
  return {
    net: roundCents(input.invoice - input.costs - social - health - tax),
    social,
    health,
    tax,
  }
}

import { isValidAmount, roundCents } from './calculations'

export type InvoiceBreakBilling = 'fixed' | 'daily'

export interface InvoiceBreakInput {
  baseInvoice: number
  billing: InvoiceBreakBilling
  contractDays: number
  nonBillableDays: number
}

export interface InvoiceBreakEstimate {
  invoice: number
  reduction: number
}

/**
 * An optional helper for the comparison's monthly invoice plan. This is a
 * contractual arithmetic assumption, not a labour-law or ZUS calculation.
 * Working/contract days are provided by the user; we do not infer a calendar.
 */
export function calculateInvoiceAfterBreak(input: InvoiceBreakInput): InvoiceBreakEstimate | null {
  if (
    !isValidAmount(input.baseInvoice) ||
    (input.billing !== 'fixed' && input.billing !== 'daily') ||
    !Number.isInteger(input.contractDays) ||
    input.contractDays < 1 ||
    input.contractDays > 31 ||
    !Number.isInteger(input.nonBillableDays) ||
    input.nonBillableDays < 0 ||
    input.nonBillableDays > input.contractDays
  )
    return null

  const invoice =
    input.billing === 'fixed'
      ? input.baseInvoice
      : roundCents(
          (input.baseInvoice * (input.contractDays - input.nonBillableDays)) / input.contractDays,
        )

  return { invoice, reduction: roundCents(input.baseInvoice - invoice) }
}

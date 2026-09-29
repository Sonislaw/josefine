export type TaxForm = 'scale' | 'linear' | 'lump'
export type ZusVariant = 'start' | 'preferential' | 'full'

export const taxForms = [{ value: 'scale', label: 'Skala podatkowa' }, { value: 'linear', label: 'Liniowy 19%' }, { value: 'lump', label: 'Ryczałt' }] as const
export const zusVariants = [{ value: 'start', label: 'Ulga na start' }, { value: 'preferential', label: 'Preferencyjny ZUS' }, { value: 'full', label: 'Pełny ZUS' }] as const
export const money = (value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(Math.max(0, value))

const progressiveTax = (income: number) => Math.max(0, income <= 10_000 ? income * .12 - 300 : 900 + (income - 10_000) * .32)
const socialZus = (variant: ZusVariant, sickness: boolean) => variant === 'start' ? 0 : variant === 'preferential' ? (sickness ? 456.18 : 420.86) : (sickness ? 1926.76 : 1788.29)

export function calcB2b(invoice: number, costs: number, form: TaxForm, rate: number, zus: ZusVariant, sickness: boolean) {
  const social = socialZus(zus, sickness)
  const profit = Math.max(0, invoice - costs - social)
  const health = form === 'scale' ? Math.max(432.54, profit * .09) : form === 'linear' ? Math.max(432.54, profit * .049) : invoice * 12 <= 60_000 ? 498.35 : invoice * 12 <= 300_000 ? 830.58 : 1495.04
  const base = form === 'lump' ? Math.max(0, invoice - social) : profit
  const tax = form === 'scale' ? progressiveTax(base) : form === 'linear' ? base * .19 : base * rate / 100
  return { net: Math.max(0, invoice - costs - social - health - tax), social, health, tax }
}

export function calcUop(gross: number, under26: boolean, elevatedKup: boolean, ppk: boolean) {
  const social = gross * .1371
  const health = (gross - social) * .09
  const tax = under26 ? 0 : Math.max(0, Math.round(progressiveTax(Math.max(0, Math.floor(gross - social - (elevatedKup ? 300 : 250))))) )
  const ppkEmployee = ppk ? gross * .02 : 0
  return { net: Math.max(0, gross - social - health - tax - ppkEmployee), social, health, tax, ppkEmployee, employerCost: gross * (ppk ? 1.22 : 1.205) }
}

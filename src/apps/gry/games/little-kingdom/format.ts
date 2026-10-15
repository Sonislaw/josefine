import type { Resource } from './engine'
/** Presentation only: keep Polish quantity forms out of the numeric economy. */
export function resourceAmount(resource: Resource, amount: number): string {
  const units = { wood: 'drewna', stone: 'kamienia', food: 'żywności' }
  const n = Math.abs(amount)
  const unit =
    resource === 'gold'
      ? n === 1
        ? 'moneta'
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
          ? 'monety'
          : 'monet'
      : units[resource]
  return `${amount.toLocaleString('pl-PL')} ${unit}`
}

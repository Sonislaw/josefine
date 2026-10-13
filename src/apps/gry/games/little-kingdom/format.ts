import { KEYS, type Resource, type Resources } from './engine'
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
export const resourceList = (resources: Resources) =>
  KEYS.filter((k) => resources[k])
    .map((k) => resourceAmount(k, resources[k]))
    .join(' · ') || 'Bez kosztu'

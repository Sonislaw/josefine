import { calculateMaterialPackages, type MaterialPackageResult } from './material-packages'

export type PlasterConsumptionMode = 'perMillimeter' | 'perCoat'

export interface PlasterInput {
  areaM2: number
  mode: PlasterConsumptionMode
  consumptionKgPerM2Unit: number
  totalThicknessMm: number | null
  coats: number | null
  reservePercent: number
  packageWeightKg: number
  packagePrice: number | null
}

export interface PlasterResult extends MaterialPackageResult {
  appliedUnits: number
}

/** Jednostkę zużycia wybiera użytkownik zgodnie z etykietą: 1 mm lub 1 warstwa. */
export function calculatePlaster(input: PlasterInput): PlasterResult | null {
  const {
    areaM2,
    mode,
    consumptionKgPerM2Unit,
    totalThicknessMm,
    coats,
    reservePercent,
    packageWeightKg,
    packagePrice,
  } = input
  if (
    !Number.isFinite(areaM2) ||
    areaM2 <= 0 ||
    areaM2 > 10_000 ||
    !Number.isFinite(consumptionKgPerM2Unit) ||
    consumptionKgPerM2Unit < 0.1 ||
    consumptionKgPerM2Unit > 10 ||
    (mode !== 'perMillimeter' && mode !== 'perCoat')
  )
    return null

  const appliedUnits = mode === 'perMillimeter' ? totalThicknessMm : coats
  if (
    appliedUnits === null ||
    !Number.isFinite(appliedUnits) ||
    (mode === 'perMillimeter' && (appliedUnits < 0.1 || appliedUnits > 20)) ||
    (mode === 'perCoat' &&
      (!Number.isSafeInteger(appliedUnits) || appliedUnits < 1 || appliedUnits > 10))
  )
    return null

  const packages = calculateMaterialPackages({
    baseKg: areaM2 * appliedUnits * consumptionKgPerM2Unit,
    reservePercent,
    packageWeightKg,
    packagePrice,
  })
  return packages ? { ...packages, appliedUnits } : null
}

/** Obliczenia zakupowe Dom są oddzielone od widoku i nie zakładają konkretnego produktu. */
export function calculatePanelMaterial(area: number, packCoverage: number, waste: number) {
  const requiredArea = area * (1 + waste / 100)
  const packCount = Math.ceil(requiredArea / packCoverage)
  const purchasedArea = packCount * packCoverage

  return {
    requiredArea,
    packCount,
    purchasedArea,
    // Nadwyżka ponad metraż już powiększony o zapas, a nie ponad samą powierzchnię pokoju.
    surplusArea: Math.max(0, purchasedArea - requiredArea),
  }
}

export interface PanelPurchaseInput {
  area: number
  packCoverage: number
  waste: number
  packPrice: number | null
  underlay: { coverage: number; packPrice: number | null } | null
}

export function calculatePanelPurchase(input: PanelPurchaseInput) {
  const { area, packCoverage, waste, packPrice, underlay } = input
  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    !Number.isFinite(packCoverage) ||
    packCoverage <= 0 ||
    !Number.isFinite(waste) ||
    waste < 0 ||
    (packPrice !== null && (!Number.isFinite(packPrice) || packPrice < 0)) ||
    (underlay !== null &&
      (!Number.isFinite(underlay.coverage) ||
        underlay.coverage <= 0 ||
        (underlay.packPrice !== null &&
          (!Number.isFinite(underlay.packPrice) || underlay.packPrice < 0))))
  )
    return null

  const panels = calculatePanelMaterial(area, packCoverage, waste)
  const underlayCount = underlay ? Math.ceil(area / underlay.coverage) : null
  if (
    !Number.isSafeInteger(panels.packCount) ||
    !panels.packCount ||
    !Number.isFinite(panels.purchasedArea) ||
    !Number.isFinite(panels.requiredArea) ||
    (underlayCount !== null && !Number.isSafeInteger(underlayCount))
  )
    return null

  // Podkład pokrywa rzeczywistą powierzchnię podłogi; zapas na docinki paneli nie jest tu dodawany.
  const underlayArea = underlay && underlayCount !== null ? underlayCount * underlay.coverage : null
  const panelCost = packPrice === null ? null : panels.packCount * packPrice
  const underlayCost =
    underlay?.packPrice == null || underlayCount === null
      ? null
      : underlayCount * underlay.packPrice
  const totalCost =
    panelCost !== null && (!underlay || underlayCost !== null)
      ? panelCost + (underlayCost ?? 0)
      : null
  if (
    [panelCost, underlayCost, totalCost, underlayArea].some(
      (value) => value !== null && !Number.isFinite(value),
    )
  )
    return null

  return { panels, underlayCount, underlayArea, panelCost, underlayCost, totalCost }
}

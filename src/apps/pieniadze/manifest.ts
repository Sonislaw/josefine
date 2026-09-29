export const pieniadzeTools = [
  { id: 'brutto-netto', title: 'Brutto → netto', description: 'Oblicz kwotę netto i VAT z kwoty brutto.' },
  { id: 'netto-brutto', title: 'Netto → brutto', description: 'Oblicz kwotę brutto i VAT z kwoty netto.' },
  { id: 'procent-z-liczby', title: 'Procent z liczby', description: 'Oblicz wskazany procent danej liczby.' },
  { id: 'zmiana-procentowa', title: 'Zmiana procentowa', description: 'Oblicz procentowy wzrost lub spadek między dwiema kwotami.' },
  { id: 'rabat', title: 'Rabat', description: 'Oblicz cenę po obniżce procentowej.' },
  { id: 'podwyzka', title: 'Podwyżka', description: 'Oblicz kwotę po zwiększeniu o podany procent.' },
  { id: 'marza', title: 'Marża', description: 'Oblicz udział zysku w cenie sprzedaży.' },
  { id: 'narzut', title: 'Narzut', description: 'Oblicz udział zysku w koszcie zakupu.' },
  { id: 'cena-jednostkowa', title: 'Cena jednostkowa', description: 'Oblicz cenę za kilogram, litr, metr lub sztukę.' },
  { id: 'podzial-rachunku', title: 'Podział rachunku', description: 'Oblicz kwotę przypadającą na każdą osobę.' },
  { id: 'napiwek', title: 'Napiwek', description: 'Oblicz wysokość napiwku i końcową kwotę rachunku.' },
] as const
export type PieniadzeToolId = (typeof pieniadzeTools)[number]['id']
export const pieniadzeModule = { name: 'Pieniądze', description: 'Praktyczne kalkulatory do codziennych obliczeń finansowych.', tools: pieniadzeTools.map((tool) => ({ ...tool, to: `/pieniadze/${tool.id}` })) }

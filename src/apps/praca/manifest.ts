export const pracaModule = {
  name: 'Praca',
  description: 'Kalkulatory wynagrodzeń i narzędzia do porównywania ofert pracy.',
  tools: [
    {
      title: 'Ile na rękę UoP',
      description: 'Przelicz brutto na netto oraz koszt pracodawcy.',
      to: '/praca/ile-na-reke-uop',
    },
    {
      title: 'Netto na brutto UoP',
      description: 'Sprawdź, jakie brutto daje docelową wypłatę netto.',
      to: '/praca/netto-na-brutto-uop',
    },
    {
      title: 'Ile na rękę B2B',
      description: 'Oblicz dochód z faktury po kosztach, ZUS i podatku.',
      to: '/praca/ile-na-reke-b2b',
    },
    {
      title: 'B2B vs UoP',
      description: 'Porównaj formy współpracy na konkretnych liczbach.',
      to: '/praca/b2b-vs-uop',
    },
  ],
} as const

export const pracaModule = {
  name: 'Praca', description: 'Narzędzia wspierające decyzje zawodowe i rozliczenia.',
  tools: [
    { title: 'Ile na rękę UoP', description: 'Przyszły kalkulator wynagrodzenia na umowie o pracę.', to: '/praca/ile-na-reke-uop' },
    { title: 'Ile na rękę B2B', description: 'Przyszły kalkulator wynagrodzenia B2B.', to: '/praca/ile-na-reke-b2b' },
    { title: 'B2B vs UoP', description: 'Przyszłe narzędzie do porównywania form współpracy.', to: '/praca/b2b-vs-uop' },
  ],
} as const

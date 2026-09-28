export const caravaningModule = {
  name: 'Caravaning', description: 'Narzędzia dla podróży kamperem i przyczepą.',
  tools: [
    { title: 'Checklista przed wyjazdem', description: 'Lista rzeczy do sprawdzenia przed podróżą.', to: '/karawaning/checklista-przed-wyjazdem' },
    { title: 'Kalkulator DMC', description: 'Przyszły kalkulator dopuszczalnej masy całkowitej.', to: '/karawaning/kalkulator-dmc' },
    { title: 'Kalkulator kosztów podróży', description: 'Przyszłe narzędzie do szacowania kosztów podróży.', to: '/karawaning/kalkulator-kosztow-podrozy' },
  ],
} as const

export const caravaningModule = {
  name: 'Caravaning', description: 'Narzędzia dla podróży kamperem i przyczepą.',
  tools: [
    { title: 'Kalkulator DMC', description: 'Oblicz łączną DMC samochodu i przyczepy.', to: '/karawaning/kalkulator-dmc' },
    { title: 'Checklista przed wyjazdem', description: 'Sprawdź zestaw przed rozpoczęciem podróży.', to: '/karawaning/checklista-przed-wyjazdem' },
    { title: 'Kalkulator spalania', description: 'Oszacuj paliwo i koszt przejazdu.', to: '/karawaning/kalkulator-spalania' },
  ],
} as const

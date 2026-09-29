export const czasTools = [
  { id: 'roznica-miedzy-datami', title: 'Różnica między datami', description: 'Oblicza liczbę dni między dwiema datami.' },
  { id: 'data-za-liczbe-dni', title: 'Data za określoną liczbę dni', description: 'Oblicza datę po dodaniu wskazanej liczby dni.' },
  { id: 'wiek', title: 'Wiek', description: 'Oblicza wiek na podstawie daty urodzenia.' },
  { id: 'czas-pracy', title: 'Czas pracy', description: 'Oblicza liczbę godzin i minut między rozpoczęciem a zakończeniem pracy.' },
  { id: 'godziny-na-minuty', title: 'Godziny → minuty', description: 'Przelicza godziny na minuty.' },
  { id: 'minuty-na-godziny', title: 'Minuty → godziny', description: 'Przelicza minuty na godziny i pozostałe minuty.' },
  { id: 'odliczanie-do-daty', title: 'Odliczanie do daty', description: 'Oblicza liczbę dni pozostałych do wydarzenia.' },
] as const
export type CzasToolId = (typeof czasTools)[number]['id']
export const czasModule = { name: 'Czas', description: 'Proste kalkulatory dat, godzin i czasu.', tools: czasTools.map((tool) => ({ ...tool, to: `/czas/${tool.id}` })) }

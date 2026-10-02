export const czasTools = [
  {
    id: 'roznica-miedzy-datami',
    title: 'Różnica między datami',
    description:
      'Sprawdź, ile dni dzieli dwa ważne terminy — od urlopu po datę zakończenia projektu.',
    category: 'Daty',
    symbol: 'D↔D',
  },
  {
    id: 'data-za-liczbe-dni',
    title: 'Data za określoną liczbę dni',
    description: 'Dodaj dni do wybranej daty i szybko wyznacz kolejny termin.',
    category: 'Daty',
    symbol: 'D+N',
  },
  {
    id: 'wiek',
    title: 'Wiek',
    description: 'Policz ukończone lata i zobacz, ile dni minęło od daty urodzenia.',
    category: 'Daty',
    symbol: '18+',
  },
  {
    id: 'czas-pracy',
    title: 'Czas pracy',
    description: 'Podsumuj długość zmiany, również gdy praca kończy się po północy.',
    category: 'Godziny',
    symbol: '8:30',
  },
  {
    id: 'godziny-na-minuty',
    title: 'Godziny → minuty',
    description: 'Zamień liczbę godzin na minuty, bez liczenia w pamięci.',
    category: 'Godziny',
    symbol: '×60',
  },
  {
    id: 'minuty-na-godziny',
    title: 'Minuty → godziny',
    description: 'Rozbij minuty na pełne godziny i pozostałe minuty.',
    category: 'Godziny',
    symbol: '÷60',
  },
  {
    id: 'odliczanie-do-daty',
    title: 'Odliczanie do daty',
    description: 'Zobacz, ile dni zostało do wydarzenia, na które czekasz.',
    category: 'Daty',
    symbol: 'D−7',
  },
] as const
export type CzasToolId = (typeof czasTools)[number]['id']
export const czasModule = {
  name: 'Czas',
  description: 'Proste kalkulatory dat, godzin i czasu.',
  tools: czasTools.map((tool) => ({ ...tool, to: `/czas/${tool.id}` })),
}

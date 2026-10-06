export interface EnergyPreset {
  id: 'fridge' | 'oven' | 'airConditioner' | 'computer'
  label: string
  powerWatts: string
  hoursPerUseDay: string
  daysPerWeek: string
  description: string
}

/** Przykłady do edycji, nie deklaracje poboru konkretnych modeli urządzeń. */
export const energyPresets: readonly EnergyPreset[] = [
  {
    id: 'fridge',
    label: 'Lodówka',
    powerWatts: '20',
    hoursPerUseDay: '24',
    daysPerWeek: '7',
    description: 'Średnia moc w czasie, a nie chwilowa moc sprężarki.',
  },
  {
    id: 'oven',
    label: 'Piekarnik',
    powerWatts: '2000',
    hoursPerUseDay: '1',
    daysPerWeek: '2',
    description: 'Jedna godzina pieczenia w dniu używania.',
  },
  {
    id: 'airConditioner',
    label: 'Klimatyzacja',
    powerWatts: '900',
    hoursPerUseDay: '4',
    daysPerWeek: '5',
    description: 'Przykładowe dni chłodzenia, bez sezonowości.',
  },
  {
    id: 'computer',
    label: 'Komputer',
    powerWatts: '150',
    hoursPerUseDay: '4',
    daysPerWeek: '5',
    description: 'Komputer stacjonarny podczas typowego użytkowania.',
  },
]

/** One source of truth for cards, routes and calculator metadata. */
export const jednostkiTools = [
  { id: 'centymetry-cale', title: 'Centymetry ↔ cale', description: 'Przelicza długość między centymetrami i calami.', category: 'Długość', symbol: 'cm / in', accent: 'peach' },
  { id: 'kilometry-mile', title: 'Kilometry ↔ mile', description: 'Przelicza odległość między kilometrami i milami.', category: 'Odległość', symbol: 'km / mi', accent: 'lilac' },
  { id: 'kilogramy-funty', title: 'Kilogramy ↔ funty', description: 'Przelicza masę między kilogramami i funtami.', category: 'Masa', symbol: 'kg / lb', accent: 'mint' },
  { id: 'litry-galony', title: 'Litry ↔ galony', description: 'Przelicza objętość między litrami i galonami amerykańskimi.', category: 'Objętość', symbol: 'l / gal', accent: 'sky' },
  { id: 'celsjusz-fahrenheit', title: '°C ↔ °F', description: 'Przelicza temperaturę między skalami Celsjusza i Fahrenheita.', category: 'Temperatura', symbol: '°C / °F', accent: 'yellow' },
  { id: 'metry-kwadratowe-ary-hektary', title: 'm² ↔ ary ↔ hektary', description: 'Przelicza jednostki powierzchni: metry kwadratowe, ary i hektary.', category: 'Powierzchnia', symbol: 'm² / a / ha', accent: 'peach' },
  { id: 'metry-szescienne-litry', title: 'm³ ↔ litry', description: 'Przelicza objętość między metrami sześciennymi i litrami.', category: 'Objętość', symbol: 'm³ / l', accent: 'mint' },
] as const

export type JednostkiToolId = (typeof jednostkiTools)[number]['id']

export const jednostkiModule = {
  name: 'Jednostki',
  description: 'Szybkie przeliczniki długości, masy, temperatury, powierzchni i objętości.',
  tools: jednostkiTools.map((tool) => ({ ...tool, to: `/jednostki/${tool.id}` })),
}

import { createCaravaningRoutes } from './caravaning/routes'
import { createPracaRoutes } from './praca/routes'
import { createPieniadzeRoutes } from './pieniadze/routes'
import type { JosefineModule } from './types'

// Add a module once here. Domain assignment stays separate in config/domains.ts.
export const moduleRegistry = {
  caravaning: { id: 'caravaning', createRoutes: createCaravaningRoutes },
  praca: { id: 'praca', createRoutes: createPracaRoutes },
  pieniadze: { id: 'pieniadze', createRoutes: createPieniadzeRoutes },
} satisfies Record<string, JosefineModule>

export type ModuleId = keyof typeof moduleRegistry

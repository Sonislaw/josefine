import { createCaravaningRoutes } from './caravaning/routes'
import { createPracaRoutes } from './praca/routes'
import type { JosefineModule } from './types'

// Add a module once here. Domain assignment stays separate in config/domains.ts.
export const moduleRegistry = {
  caravaning: { id: 'caravaning', createRoutes: createCaravaningRoutes },
  praca: { id: 'praca', createRoutes: createPracaRoutes },
} satisfies Record<string, JosefineModule>

export type ModuleId = keyof typeof moduleRegistry

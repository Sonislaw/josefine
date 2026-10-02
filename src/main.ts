import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'

import App from './App.vue'
import { routes } from './router'
import './styles/main.css'

// ViteSSG renders route HTML during the build; the same entry hydrates it in the browser.
// Keep scroll handling here so every module follows the same navigation rules.
export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      // Back/forward should return to the place the visitor left.
      if (savedPosition) return savedPosition
      // Preserve links to sections within a page.
      if (to.hash) return { el: to.hash }
      // A newly opened page should always start at the top.
      return { left: 0, top: 0 }
    },
  },
  ({ app }) => {
    app.use(createPinia())
  },
)

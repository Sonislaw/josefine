import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'

import App from './App.vue'
import { routes } from './router'
import './styles/main.css'

// ViteSSG renders route HTML during the build; the same entry hydrates it in the browser.
export const createApp = ViteSSG(App, { routes }, ({ app }) => {
  app.use(createPinia())
})

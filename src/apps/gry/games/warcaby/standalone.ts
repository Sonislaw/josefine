import { createApp } from 'vue'
import WarcabyGame from './WarcabyGame.vue'
// Deliberately no router, analytics, platform styles or external resources.
createApp(WarcabyGame, { standalone: true }).mount('#app')

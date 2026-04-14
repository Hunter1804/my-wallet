import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import { registerCharts } from './lib/chartSetup'
import './style.css'

registerCharts()
registerSW({ immediate: true })

createApp(App).use(createPinia()).use(router).mount('#app')

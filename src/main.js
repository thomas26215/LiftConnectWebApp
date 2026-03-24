import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialise l'écoute Firebase avant le premier rendu
// pour éviter un flash vers /login si l'utilisateur est déjà connecté
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})

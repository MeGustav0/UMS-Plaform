import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'


const app = createApp(App)
app.use(store)
app.use(router)

const savedUser = localStorage.getItem('auth')
if (savedUser) {
  store.commit('auth/SET_USER', JSON.parse(savedUser))
}

app.mount('#app')
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { QuillEditor } from 'vue3-quill';

const app = createApp(App)
app.use(store)
store.dispatch('organizations/initState'); 
app.use(router)

export default {
  name: 'QuillEditor',
  components: {
    QuillEditor,
  },
}

const savedUser = localStorage.getItem('auth')
if (savedUser) {
  store.commit('auth/SET_USER', JSON.parse(savedUser))
}

app.mount('#app')
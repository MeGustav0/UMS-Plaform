import { createStore } from 'vuex'
import auth from './modules/auth'
import projects from './modules/projects'

export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    auth,
    projects,
  },
  plugins: [
    (store) => {
      // Восстановление проектов из localStorage при запуске
      const savedProjects = localStorage.getItem('projects');
      if (savedProjects) {
        store.commit('projects/INIT_PROJECTS', JSON.parse(savedProjects));
      }

      // Сохранение проектов при каждой мутации
      store.subscribe((mutation, state) => {
        if (mutation.type.startsWith('projects/')) {
          localStorage.setItem('projects', JSON.stringify(state.projects.projects));
        }
      });
    }
  ]
})
const savedProjects = localStorage.getItem('projects');
if (savedProjects) {
  try {
    const parsed = JSON.parse(savedProjects);
    if (Array.isArray(parsed)) {
      store.commit('projects/INIT_PROJECTS', parsed);
    }
  } catch (e) {
    console.error('Ошибка загрузки проектов:', e);
  }
}
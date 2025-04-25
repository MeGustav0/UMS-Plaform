import { createStore } from 'vuex'
import auth from './modules/auth'
import projects from './modules/projects'
import organizations from './modules/organizations'

export default createStore({
  state: {
    loading: false
  },
  getters: {
  },
  mutations: {
    SET_LOADING(state, isLoading) {
      state.loading = isLoading;
    }
  },
  actions: {
  },
  modules: {
    auth,
    organizations,
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

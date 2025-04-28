import { compare, hash } from 'bcryptjs';
import { generateId } from '@/utils/id';

export default {
  namespaced: true,
  state: () => ({
    user: null,
    users: JSON.parse(localStorage.getItem('users')) || []

  }),
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem("auth", JSON.stringify(user));
    },
    REGISTER_USER(state, newUser) {
      state.users.push(newUser);
      localStorage.setItem('users', JSON.stringify(state.users));
    },
    UPDATE_USER_PROJECTS(state, projectId) {
      if (!state.user) return;
  
      state.user.projects = state.user.projects || [];
      state.user.projects.push(projectId);
      localStorage.setItem("auth", JSON.stringify(state.user));
    },
    canDeleteProject(user, project) {
      return user.role === 'admin' || project.creatorId === user.id
    },
    UPDATE_USERS(state, users) {
      state.users = users;
      localStorage.setItem('users', JSON.stringify(users));
    }
  },
  actions: {
    async register({ commit, dispatch }, { email, name, password }) {
      try {
        const hashedPassword = await hash(password, 10);
        const user = {
          id: generateId(),
          email,
          name,
          password: hashedPassword
        };

        // Создаем организацию
        const org = {
          id: generateId(),
          name: `${name}'s Organization`,
          creatorId: user.id
        };

        // Коммитим изменения
        commit('REGISTER_USER', user);
        commit('organizations/ADD_ORGANIZATION', org, { root: true });
        commit('organizations/ADD_MEMBER', {
          orgId: org.id,
          userId: user.id,
          role: 'admin'
        }, { root: true });

        // Автоматический логин
        commit('SET_USER', user);
        
        return true;
      } catch (error) {
        console.error('Ошибка регистрации:', error);
        return false;
      }
    },
    async login({ commit, state }, { email, password }) {
      const user = state.users.find(u => u.email === email);
      if (user.password.length < 30) {
        if (password !== user.password) throw new Error('Неверные данные');
      } else {
        if (!(await compare(password, user.password))) throw new Error('Неверные данные');
      }
      if (!user || !(await compare(password, user.password))) { 
        throw new Error('Неверные учетные данные');
      }
      
      if (!user) throw new Error('Неверные учетные данные');
      commit('SET_USER', user);
      console.log('Ищем пользователя:', email);
      console.log('Найденный пользователь:', user);
    },
    logout({ commit }) {
      commit('SET_USER', null)
      localStorage.removeItem('auth')
    },
    checkAuth({ commit }) {
      const savedUser = localStorage.getItem('auth');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        commit('SET_USER', user);
        return true;
      }
      return false;
    }
  },
  getters: {
    isAuthenticated: state => !!state.user,
    getUserOrganizations: (state) => {
      return state.user?.organizations || [];
    },
    canDeleteProject: (state) => state.user?.role === 'admin',
    getOrgRole: (state) => (orgId) => {
      const org = state.user?.organizations?.find((o) => o.orgId === orgId);
      return org?.role || "member";
    },
  }
}
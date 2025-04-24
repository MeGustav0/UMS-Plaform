import { hash } from 'bcryptjs';

export default {
  namespaced: true,
  state: () => ({
    user: null,
    users: JSON.parse(localStorage.getItem('users')) || []
    // Убираем поле organizations из пользователя
  }),
  mutations: {
    // SET_USER(state, user) {
    //   state.user = user !== null 
    //   ? { ...user, 
    //     organizations: user.organizations || [],
    //     projects: user?.projects || []
    //   } 
    //   : null;
    //   localStorage.setItem("auth", JSON.stringify(state.user));
    //   if (user) {
    //     localStorage.setItem('auth', JSON.stringify(state.user));
    //   } else {
    //     localStorage.removeItem('auth');
    //   }
    // },
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem("auth", JSON.stringify(user));
    },
    // REGISTER_USER(state, newUser) {
    //   state.users.push({
    //     ...newUser,
    //     organizations: newUser.organizations || []
    //   })
    //   localStorage.setItem('users', JSON.stringify(state.users))
    // },
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
        // Создаем пользователя
        const user = {
          id: Date.now(),
          email,
          name,
          password // В реальном приложении нужно хешировать!
        };

        // Создаем организацию
        const org = {
          id: Date.now(),
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
    login({ commit, state }, { email, password }) { // Добавляем state
      const user = state.users.find(u => 
        u.email === email && 
        u.password === password // Сравниваем пароль из хранилища с введенным
      );
      
      if (!user) throw new Error('Неверные учетные данные');
      commit('SET_USER', user); // Вызываем мутацию
      console.log('Ищем пользователя:', email);
      console.log('Найденный пользователь:', user);
    },
    logout({ commit }) {
      commit('SET_USER', null)
      localStorage.removeItem('currentUser')
    },
    checkAuth({ commit }) {
      const savedUser = localStorage.getItem('currentUser');
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
    canEditProject: (state) => (project) => {
      const userOrg = state.user?.organizations?.[0];
      return userOrg?.orgId === project?.orgId;
    },
    canDeleteProject: (state) => state.user?.role === 'admin',
    getOrgRole: (state) => (orgId) => {
      const org = state.user?.organizations?.find((o) => o.orgId === orgId);
      return org?.role || "member";
    },
    
    canEditProject: (state) => (project) => {
      const userOrgId = state.user?.organizations?.[0]?.orgId;
      return userOrgId === project?.orgId;
    }
  }
}
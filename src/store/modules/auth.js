export default {
  namespaced: true,
  state: () => ({
    user: null,
    users: JSON.parse(localStorage.getItem('users')) || []
  }),
  mutations: {
    SET_USER(state, user) {
      state.user = user !== null 
      ? { ...user, 
        organizations: user.organizations || [],
        projects: user?.projects || []
      } 
      : null;
      localStorage.setItem("auth", JSON.stringify(state.user));
      if (user) {
        localStorage.setItem('auth', JSON.stringify(state.user));
      } else {
        localStorage.removeItem('auth');
      }
    },
    REGISTER_USER(state, newUser) {
      state.users.push({
        ...newUser,
        organizations: newUser.organizations || []
      })
      localStorage.setItem('users', JSON.stringify(state.users))
    },
    UPDATE_USER_PROJECTS(state, projectId) {
      const user = { 
        ...state.user,
        projects: [...state.user.projects, projectId]
      };
      state.user = user;
      localStorage.setItem('auth', JSON.stringify(user));
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
    async register({ commit }, { email, name, password }) {
      try {
        // Создаем пользователя
        const user = {
          id: Date.now(),
          email,
          name,
          password,
          organizations: []
        };
  
        // Создаем организацию
        const org = {
          id: Date.now(),
          name: `${name}'s Organization`,
          creatorId: user.id,
          members: [{ userId: user.id, role: 'admin' }],
          projects: []
        };
  
        // Привязываем организацию к пользователю
        user.organizations.push({ orgId: org.id, role: 'admin' });
  
        // Фиксируем изменения
        commit('REGISTER_USER', user);
        commit('organizations/ADD_ORGANIZATION', org, { root: true });
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
    isAdmin: (state) => state.user?.role === "admin",
    isManager: (state) => state.user?.role === 'manager',
    isMember: (state) => state.user?.role === "member",
    canEditProject: (state) => (project) => {
      return state.user?.role === 'admin' || 
        (state.user?.role === 'manager' && project.creatorId !== state.user?.id);
    },
    canDeleteProject: (state) => state.user?.role === 'admin',
    getOrgRole: (state) => (orgId) => {
      return state.user?.organizations.find(o => o.orgId === orgId)?.role
    },
    
    canEditProject: (state, getters) => (project) => {
      return getters.getOrgRole(project.orgId) === 'admin'
    }
  }
}
export default {
  namespaced: true,
  state: () => ({
    user: null,
    roles: {
      admin: ['create', 'edit', 'delete'],
      manager: ['create', 'edit'],
      member: ['edit_status']
    },
    users: JSON.parse(localStorage.getItem('users')) || [
      {
        id: 1,
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin',
        role: 'admin'
      },
      {
        id: 2,
        email: 'manager@example.com',
        password: 'manager123',
        name: 'Manager',
      },
      {
        id: 3,
        email: 'user@example.com',
        password: 'user123',
        name: 'User',
      }
    ],
  }),
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem('auth', JSON.stringify(user)); // Ключ 'auth', а не 'currentUser'
    },
    REGISTER_USER(state, newUser) {
      state.users.push(newUser);
      localStorage.setItem('users', JSON.stringify(state.users)); // Сохраняем пользователей
    },
    UPDATE_USER_PROJECTS(state, projects) {
      state.user.projects = projects
      localStorage.setItem('currentUser', JSON.stringify(state.user))
    }
  },
  actions: {
    register({ state, commit }, { email, password, name }) {
      if (state.users.some(u => u.email === email)) { // Используем state.users
        throw new Error('Пользователь уже существует')
      }
      
      const newUser = {
        id: Date.now(),
        email,
        password,
        name,
        role: 'member',
        projects: []
      }
      
      commit('REGISTER_USER', newUser)
      return newUser
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
    isManager: (state) => state.user?.role === "manager",
    isMember: (state) => state.user?.role === "member",
  }
}
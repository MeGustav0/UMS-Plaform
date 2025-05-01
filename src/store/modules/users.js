import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    usersById: {}
  }),

  mutations: {
    SET_USERS(state, users) {
      users.forEach(user => {
        state.usersById[user.id] = user;
      });
    }
  },

  actions: {
    async fetchUsersByIds({ commit }, ids) {
      if (!Array.isArray(ids) || ids.length === 0) return;
      try {
        const { data } = await axios.post("/api/users/by-ids", { ids });
        commit("SET_USERS", data);
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
      }
    }
  },

  getters: {
    getUserById: (state) => (id) => state.usersById[id] || { name: "—", email: "—" }
  }
};
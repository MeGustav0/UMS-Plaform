export default {
  namespaced: true,
  state: () => ({
      organizations: JSON.parse(localStorage.getItem('organizations')) || []
    }),
  mutations: {
    ADD_ORGANIZATION(state, org) {
      // Инициализируем массив, если он не существует
      if (!state.organizations) {
        state.organizations = [];
      }
      const creatorId = org.creatorId;
      const updatedOrg = {
        ...org,
        members: [{ userId: creatorId, role: 'admin' }] // Добавляем создателя
      };
      state.organizations.push(updatedOrg);
    localStorage.setItem('organizations', JSON.stringify(state.organizations));
    },
    UPDATE_ORGANIZATION(state, updatedOrg) {
      const index = state.organizations.findIndex(o => o.id === updatedOrg.id)
      if (index !== -1) {
        state.organizations.splice(index, 1, updatedOrg)
        localStorage.setItem('organizations', JSON.stringify(state.organizations))
      }
    }
  },
  getters: {
    userOrganizations: (state, getters, rootState) => {
      const userId = rootState.auth.user?.id
      return state.organizations.filter(org => 
        org.members.some(m => m.userId === userId)
    )
    }
  }
}
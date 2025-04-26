export default {
  namespaced: true,
  state: () => ({
    organizations: [],
    members: [],
  }),
  mutations: {
    INIT_STATE(state) {
      // Организации
      const savedOrgs = localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
      state.organizations = savedOrgs ? JSON.parse(savedOrgs) : [];
      
      // Участники
      const savedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);
      state.members = savedMembers ? JSON.parse(savedMembers) : [];
      
      // Индекс участников
      state.memberIndex = state.members.reduce((acc, m) => {
        const key = `${m.orgId}-${m.userId}`;
        acc[key] = m;
        return acc;
      }, {});
    },
    INIT_MEMBERS(state, members) {
      state.members = members;
      
      // Создаем индекс
      state.memberIndex = members.reduce((acc, m) => {
        const key = `${m.orgId}-${m.userId}`;
        acc[key] = m;
        return acc;
      }, {});
    },
    ADD_MEMBER(state, payload) {
      // Добавляем в общий список участников
      const memberKey = `${payload.orgId}-${payload.userId}`;
      if (!state.memberIndex[memberKey]) {
        state.members.push(payload);
        state.memberIndex[memberKey] = payload;
      }
      
      // Добавляем в организацию
      const org = state.organizations.find(o => o.id === payload.orgId);
      if (org && !org.members.some(m => m.userId === payload.userId)) {
        org.members.push({
          userId: payload.userId,
          role: payload.role
        });
      }
      
      this.commit('organizations/PERSIST_DATA');
    },
    UPDATE_MEMBER(state, payload) {
      const index = state.members.findIndex(m => 
        m.orgId === payload.orgId && m.userId === payload.userId
      );
      if (index !== -1) {
        state.members.splice(index, 1, payload);
        this.commit('organizations/PERSIST_DATA');
      }
    },
    ADD_ORGANIZATION(state, org) {
      const updatedOrg = {
        ...org,
        members: [{ userId: org.creatorId, role: "admin" }]
      };
      
      state.organizations.push(updatedOrg);
      
      // Добавляем создателя в members
      this.commit('organizations/ADD_MEMBER', {
        orgId: org.id,
        userId: org.creatorId,
        role: 'admin'
      });
      
      this.commit('organizations/PERSIST_DATA');
    },
    UPDATE_ORGANIZATION(state, updatedOrg) {
      const index = state.organizations.findIndex(o => o.id === updatedOrg.id)
      if (index !== -1) {
        state.organizations.splice(index, 1, updatedOrg)
        localStorage.setItem('organizations', JSON.stringify(state.organizations))
      }
    },
    PERSIST_DATA(state) {
      localStorage.setItem('organizations', JSON.stringify(state.organizations));
      localStorage.setItem('orgMembers', JSON.stringify(state.members));
    }
  },
  actions: {
    initState({ commit }) {
      commit('INIT_STATE');
    }
  },
  getters: {
    getUserRole: (state) => (orgId, userId) => {
      // Проверяем индекс
      const memberKey = `${orgId}-${userId}`;
      const member = state.memberIndex[memberKey];
      
      // Если нет в индексе, проверяем организации
      if (!member) {
        const org = state.organizations.find(o => o.id === orgId);
        return org?.members.find(m => m.userId === userId)?.role;
      }
      
      return member?.role;
    },
    userOrganizations: (state, getters, rootState) => {
      const userId = rootState.auth.user?.id;
      return state.organizations.filter(org => 
        org.members.some(m => m.userId === userId)
      );
    },
    // Для проверки прав в компонентах
    canEditProject: (state) => (orgId, userId) => {
      const member = state.members.find(m => 
        m.orgId === orgId && m.userId === userId
      );
      return ['admin', 'manager'].includes(member?.role);
    },
    
  }
}

function persistMembers(state) {
  localStorage.setItem('orgMembers', JSON.stringify(state.members));
}
export const ORGANIZATIONS_STORAGE_KEY = 'organizations';
export const MEMBERS_STORAGE_KEY = 'orgMembers';

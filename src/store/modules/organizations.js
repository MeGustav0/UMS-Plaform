import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    organizations: [],
    currentOrg: null,
  }),

  mutations: {
    SET_ORGANIZATIONS(state, orgs) {
      state.organizations = orgs;
    },

    SET_CURRENT_ORG(state, org) {
      state.currentOrg = org;
    }
  },

  actions: {
    async fetchOrganizations({ commit, rootState }) {
      const userId = rootState.auth.user?.id;
    
      if (!userId) {
        console.warn("fetchOrganizations: userId undefined — пользователь не авторизован");
        return;
      }
    
      const { data } = await axios.get(`/api/organizations?memberId=${userId}`);
      commit("SET_ORGANIZATIONS", data);
      if (data.length > 0) {
        commit("SET_CURRENT_ORG", data[0]);
      }
    },

    async createOrganization({ dispatch, rootState }, name) {
      const ownerId = rootState.auth.user?.id;
      await axios.post("/api/organizations", { name, ownerId });
      await dispatch("fetchOrganizations");
      
    },

    async deleteOrganization({ dispatch }, orgId) {
      await axios.delete(`/api/organizations/${orgId}`);
      await dispatch("fetchOrganizations");
    },

    async addMember({ dispatch }, { orgId, email }) {
      await axios.patch(`/api/organizations/${orgId}/add-member`, { email });
      await dispatch("fetchOrganizations");
    },

    async updateMemberRole({ dispatch }, { orgId, userId, role }) {
      await axios.patch(`/api/organizations/${orgId}/update-role`, { userId, role });
      await dispatch("fetchOrganizations");
    },

    async removeMember({ dispatch }, { orgId, userId }) {
      await axios.patch(`/api/organizations/${orgId}/remove-member`, { userId });
      await dispatch("fetchOrganizations");
    },
  },

  getters: {
    getUserRole: (state) => (orgId, userId) => {
      const org = state.organizations.find((o) => o.id === orgId);
      return org?.members.find((m) => m.userId === userId)?.role;
    },
    userOrganizations: (state, getters, rootState) => {
      const userId = rootState.auth.user?.id;
      return state.organizations.filter((org) =>
        org.members.some((m) => m.userId === userId)
      );
    },
  },
};
export default {
  namespaced: true,
  state: () => ({
    organizations: [],
  }),

  mutations: {
    INIT_STATE(state) {
      const savedOrgs = localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
      state.organizations = savedOrgs ? JSON.parse(savedOrgs) : [];
    },

    ADD_ORGANIZATION(state, org) {
      const updatedOrg = {
        ...org,
        members: [{ userId: org.creatorId, role: "admin" }],
      };

      state.organizations.push(updatedOrg);

      this.commit("organizations/PERSIST_DATA");
    },

    ADD_MEMBER(state, payload) {
      const org = state.organizations.find((o) => o.id === payload.orgId);
      if (org && !org.members.some((m) => m.userId === payload.userId)) {
        org.members.push({
          userId: payload.userId,
          role: payload.role,
        });
        this.commit("organizations/PERSIST_DATA");
      }
    },

    REMOVE_MEMBER(state, { orgId, userId }) {
      const org = state.organizations.find((o) => o.id === orgId);
      if (org) {
        org.members = org.members.filter((m) => m.userId !== userId);
        this.commit("organizations/PERSIST_DATA");
      }
    },

    UPDATE_MEMBER(state, { orgId, userId, role }) {
      const org = state.organizations.find((o) => o.id === orgId);
      if (org) {
        const member = org.members.find((m) => m.userId === userId);
        if (member) {
          member.role = role;
          this.commit("organizations/PERSIST_DATA");
        }
      }
    },

    UPDATE_ORGANIZATION(state, updatedOrg) {
      const index = state.organizations.findIndex(
        (o) => o.id === updatedOrg.id
      );
      if (index !== -1) {
        state.organizations.splice(index, 1, updatedOrg);
        this.commit("organizations/PERSIST_DATA");
      }
    },

    DELETE_ORGANIZATION(state, orgId) {
      state.organizations = state.organizations.filter(
        (org) => org.id !== orgId
      );
      this.commit("organizations/PERSIST_DATA");
    },

    PERSIST_DATA(state) {
      localStorage.setItem(
        ORGANIZATIONS_STORAGE_KEY,
        JSON.stringify(state.organizations)
      );
    },
  },

  actions: {
    initState({ commit }) {
      commit("INIT_STATE");
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

export const ORGANIZATIONS_STORAGE_KEY = "organizations";
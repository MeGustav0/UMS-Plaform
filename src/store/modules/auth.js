import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/firebase";
import axios from "axios";
import router from "@/router";

export default {
  namespaced: true,
  state: {
    user: null,
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem("auth", JSON.stringify(user));
    },

    CLEAR_USER(state) {
      state.user = null;
    },

    UPDATE_USER_PROJECTS(state, projectId) {
      if (!state.user) return;
      state.user.projects = state.user.projects || [];
      state.user.projects.push(projectId);
    },
  },

  actions: {
    async register({ commit, dispatch }, { email, password, name }) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const idToken = await user.getIdToken();

        const { data } = await axios.post("/api/auth/register", {
          idToken,
          name,
        });

        const userId = data.userId;

        commit("SET_USER", {
          id: userId,
          email,
          name,
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        console.log("fetch orgs for", userId);
        await dispatch("organizations/fetchOrganizations", null, {
          root: true,
        });

        const orgs = this.state.organizations.organizations;
        const userIds = new Set();
        orgs.forEach((org) => {
          org.members?.forEach((m) => userIds.add(m.userId));
        });

        await dispatch("users/fetchUsersByIds", Array.from(userIds), {
          root: true,
        });
        router.push("/");
      } catch (error) {
        console.error("Ошибка регистрации:", error);
        alert("Ошибка регистрации: " + error.message);
      }
    },

    async login({ commit, dispatch }, { email, password }) {
      try {
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const idToken = await user.getIdToken();

        const { data } = await axios.post("/api/auth/login", { idToken });

        commit("SET_USER", {
          id: data.uid,
          email: data.email,
          name: data.name,
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        await dispatch("organizations/fetchOrganizations", null, {
          root: true,
        });

        const orgs = this.state.organizations.organizations;
        const userIds = new Set();

        orgs.forEach((org) => {
          org.members?.forEach((m) => userIds.add(m.userId));
        });

        await dispatch("users/fetchUsersByIds", Array.from(userIds), {
          root: true,
        });
        router.push("/");
      } catch (error) {
        console.error("Ошибка входа:", error);
        alert("Ошибка входа: " + error.message);
      }
    },

    async logout({ commit }) {
      await signOut(auth);
      commit("CLEAR_USER");
      router.push("/login");
    },
  },

  getters: {
    user: (state) => state.user,
    isAuthenticated: (state) => !!state.user
  },
};

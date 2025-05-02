import { doc, onSnapshot } from "firebase/firestore";
import axios from "axios";
import { db } from "@/firebase";

let projectUnsubscribe = null;

export default {
  namespaced: true,
  state: () => ({
    projects: [],
  }),
  actions: {
    async subscribeToProject({ commit }, projectId) {
      if (!projectId) {
        console.warn("subscribeToProject: projectId отсутствует");
        return;
      }
    
      if (projectUnsubscribe) {
        projectUnsubscribe();
        projectUnsubscribe = null;
      }
    
      try {
        const ref = doc(db, "projects", projectId); 
        projectUnsubscribe = onSnapshot(ref, (docSnap) => {
          if (!docSnap.exists()) {
            console.warn(`Проект с id ${projectId} не найден`);
            return;
          }
    
          const updatedProject = docSnap.data();
          if (updatedProject) {
            commit("UPDATE_PROJECT_FROM_SNAPSHOT", updatedProject);
          }
        });
      } catch (error) {
        console.error("Ошибка при подписке на проект:", error);
      }
    },

    unsubscribeFromProject() {
      if (projectUnsubscribe) {
        projectUnsubscribe();
        projectUnsubscribe = null;
      }
    },
    async fetchProjects({ commit, rootState, dispatch }) {
      const orgId = rootState.organizations.currentOrg?.id;
      if (!orgId) return;
    
      try {
        const { data } = await axios.get(`/api/projects?orgId=${orgId}`);
        commit("INIT_PROJECTS", data);
    
        // Сбор всех userId
        const userIds = new Set();
        data.forEach((project) => {
          project.members?.forEach((m) => userIds.add(m.userId));
          project.activities?.forEach((act) => {
            if (act.owner) userIds.add(act.owner);
            act.tasks?.forEach((t) => {
              if (t.assignee) userIds.add(t.assignee);
              t.stories?.forEach((s) => {
                if (s.assignee) userIds.add(s.assignee);
                s.comments?.forEach((c) => {
                  if (c.userId) userIds.add(c.userId);
                });
              });
            });
          });
        });
    
        await dispatch("users/fetchUsersByIds", Array.from(userIds), { root: true });
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    },
    
    async createProject({ commit, dispatch, rootState }, payload) {
      const user = rootState.auth.user;
      const org = rootState.organizations.currentOrg;
    
      if (!user || !org) {
        console.warn("Нет данных пользователя или организации");
        return;
      }
    
      try {
        const { data } = await axios.post("/api/projects", {
          ...payload,
          orgId: org.id,
          creatorId: user.id,
          memberInfo: {
            name: user.name,
            email: user.email
          }
        });
    
        
        await dispatch("fetchProjects");
      } catch (error) {
        console.error("Ошибка при создании проекта:", error);
      }
    },
    async updateProject({ dispatch }, project) {
      await axios.put(`/api/projects/${project.id}`, project);
      await dispatch("fetchProjects"); 
    },
    async deleteProject({ commit, dispatch }, projectId) {
      await axios.delete(`/api/projects/${projectId}`);
      commit("REMOVE_PROJECT", projectId);
      await dispatch("releases/deleteReleasesByProjectId", projectId, { root: true });
    },
    async updateProjectMemberRole({ dispatch, getters }, { projectId, userId, role }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        members: project.members.map(m =>
          m.userId === userId ? { ...m, role } : m
        )
      };
      await dispatch("updateProject", updated);
    },
    async removeProjectMember({ dispatch, getters }, { projectId, userId }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        members: project.members.filter(m => m.userId !== userId)
      };
      await dispatch("updateProject", updated);
    },
    async addActivity({ dispatch, getters, rootState }, { projectId, activity }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: [...(project.activities || []), activity]
      };
      const userId = rootState.auth.user?.id;
      const isMember = project.members?.some(m => m.userId === userId);
      if (!isMember) {
        throw new Error("Вы не состоите в этом проекте");
      }
      await dispatch("updateProject", updated);
      await dispatch("releases/syncActivityToReleases", {
        projectId,
        activity
      }, { root: true });
    },
    async updateActivity({ dispatch, getters }, { projectId, activity }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: project.activities.map(a =>
          a.id === activity.id ? activity : a
        )
      };
      if (!activity) {
        throw new Error("Эта активность была удалена другим пользователем.");
      }
      await dispatch("updateProject", updated);
    },
    
    async deleteActivity({ dispatch, getters }, { projectId, activityId }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: project.activities.filter(a => a.id !== activityId)
      };
      await dispatch("updateProject", updated);
      await dispatch("releases/removeActivityFromReleases", {
        projectId,
        activityId
      }, { root: true });
    },
    async addTask({ dispatch, getters, rootState }, { projectId, activityId, task }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: project.activities.map(a =>
          a.id === activityId ? { ...a, tasks: [...a.tasks, task] } : a
        )
      };
      const userId = rootState.auth.user?.id;
      const isMember = project.members?.some(m => m.userId === userId);
      if (!isMember) {
        throw new Error("Вы не состоите в этом проекте");
      }
      await dispatch("updateProject", updated);
      await dispatch("releases/syncTaskToReleases", {
        projectId,
        activityId,
        task
      }, { root: true });
    },
    
    async updateTask({ dispatch, getters }, { projectId, activityId, task }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: project.activities.map(a =>
          a.id === activityId
            ? {
                ...a,
                tasks: a.tasks.map(t => (t.id === task.id ? task : t))
              }
            : a
        )
      };
      if (!project) {
        throw new Error("Эта задача была удалена другим пользователем.");
      }
      await dispatch("updateProject", updated);
    },
    
    async deleteTask({ dispatch, getters }, { projectId, activityId, taskId }) {
      const project = getters.getProjectById(projectId);
      const updated = {
        ...project,
        activities: project.activities.map(a =>
          a.id === activityId
            ? {
                ...a,
                tasks: a.tasks.filter(t => t.id !== taskId)
              }
            : a
        )
      };
      await dispatch("updateProject", updated);
      await dispatch("releases/removeTaskFromReleases", {
        projectId,
        activityId,
        taskId
      }, { root: true });
    },
  },
  mutations: {
    INIT_PROJECTS(state, projects) {
      state.projects = projects;
    },
    UPDATE_PROJECT_FROM_SNAPSHOT(state, updated) {
      const idx = state.projects.findIndex(p => p.id === updated.id);
      if (idx !== -1) {
        
        state.projects.splice(idx, 1, { ...updated });
      } else {
        state.projects.push({ ...updated });
      }
    },
    MOVE_TASK(state, { taskId, fromActivityId, toActivityId }) {
      const fromActivity = state.projects
        .flatMap(p => p.activities)
        .find(a => a.id === fromActivityId);
      
      const toActivity = state.projects
        .flatMap(p => p.activities)
        .find(a => a.id === toActivityId);
      
      const task = fromActivity.tasks.find(t => t.id === taskId);
      fromActivity.tasks = fromActivity.tasks.filter(t => t.id !== taskId);
      toActivity.tasks.push(task);
    },
    REMOVE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p.id !== projectId);
    },
  },
  getters: {
    getProjectById: (state) => (id) =>
      state.projects.find((p) => p.id === id),
    allTasks: (state) => (projectId) => {
      const project = state.projects.find(p => p.id === projectId)
      return project?.activities?.flatMap(a => a.tasks) || []
    },
    projectStats: (state) => (projectId) => {
      const project = state.projects.find(p => p.id === projectId)
      const allTasks = project?.activities?.flatMap(a => a.tasks || []) || []
      return {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'done').length
      }
    },
    userProjects: (state, getters, rootState) => {
      const userId = rootState.auth.user?.id;
      return state.projects.filter(project =>
        project.members?.some(m => m.userId === userId)
      );
    },
    orgProjects: (state) => (orgId) => {
      return state.projects.filter(project => project.orgId === orgId);
    },
  },
}
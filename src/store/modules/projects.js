import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    projects: JSON.parse(localStorage.getItem('projects')) || [],
  }),
  actions: {
    async fetchProjects({ commit, rootState, dispatch }) {
      const orgId = rootState.organizations.currentOrg?.id;
      if (!orgId) return;
    
      try {
        const { data } = await axios.get(`/api/projects?orgId=${orgId}`);
        commit("INIT_PROJECTS", data);
    
        // 🔥 Сбор всех userId
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
    
        // После создания — перезагружаем
        await dispatch("fetchProjects");
      } catch (error) {
        console.error("Ошибка при создании проекта:", error);
      }
    },
    async deleteProject({ commit, rootState }, projectId) {
      commit('DELETE_PROJECT', projectId);
  
      // Обновляем пользователей
      const updatedUsers = rootState.auth.users.map(user => ({
        ...user,
        projects: user.projects.filter(id => id !== projectId)
      }));
  
      commit('auth/UPDATE_USERS', updatedUsers, { root: true });
    },
  },
  mutations: {
    INIT_PROJECTS(state, projects) {
      state.projects = projects;
    },
    ADD_PROJECT(state, project) {
      const newProject = {
        ...project,
        members: project.members || []
      };
      state.projects.push({
        ...project,
        activities: project.activities || []
      })
    },
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p.id === updatedProject.id)
      if (index !== -1) {
        state.projects.splice(index, 1, updatedProject)
      }
    },
    // Обновление активности
    UPDATE_ACTIVITY(state, { projectId, activity }) {
      const project = state.projects.find(p => p.id === projectId)
      const index = project.activities.findIndex(a => a.id === activity.id)
      if (index !== -1) {
        project.activities.splice(index, 1, { 
          ...activity 
        });
      }
    },
    // Добавление активности
    ADD_ACTIVITY(state, { projectId, activity }) {
      const project = state.projects.find(p => p.id === projectId);
      if (project) {
        project.activities.push(activity);
      }
      this.commit('releases/ADD_ACTIVITY_TO_RELEASES', {
        projectId,
        activity
      });
    },
    
    // Добавление задачи
    ADD_TASK(state, { projectId, activityId, task }) {
      const project = state.projects.find(p => p.id === projectId);
      const activity = project?.activities.find(a => a.id === activityId);
      if (activity) activity.tasks.push(task);
      this.commit('releases/ADD_TASK_TO_RELEASES', {
        projectId,
        activityId,
        task
      });
    },
    
    // Перемещение задачи
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
    DELETE_TASK(state, { projectId, activityId, taskId }) {
      const project = state.projects.find(p => p.id === projectId)
      const activity = project?.activities.find(a => a.id === activityId)
      if (activity) {
        activity.tasks = activity.tasks.filter(t => t.id !== taskId)
      }
      this.commit('releases/DELETE_TASK_FROM_RELEASES', {
        projectId,
        activityId,
        taskId
      });
    },
    DELETE_ACTIVITY(state, { projectId, activityId }) {
      const project = state.projects.find(p => p.id === projectId)
      if (project) {
        project.activities = project.activities.filter(a => a.id !== activityId)
      }
      this.commit('releases/DELETE_ACTIVITY_FROM_RELEASES', {
        projectId,
        activityId
      });
    },
    UPDATE_TASK(state, { projectId, activityId, task }) {
      const project = state.projects.find(p => p.id === projectId);
      const activity = project?.activities.find(a => a.id === activityId);
      
      if (!activity) return;
      
      const taskIndex = activity.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        activity.tasks.splice(taskIndex, 1, { 
          ...task 
        });
      }
    },
    UPDATE_USERS(state, users) {
      state.users = users;
    },
    UPDATE_USER_PROJECTS(state, projectId) {
      if (!state.user.projects) {
        state.user.projects = [];
      }
      state.user.projects.push(projectId);
    },
    DELETE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p.id !== projectId);
    },
    UPDATE_MEMBER_ROLE(state, { projectId, userId, role }) {
      const project = state.projects.find(p => p.id === projectId);
      if (!project || !project.members) return;
    
      const member = project.members.find(m => m.userId === userId);
      if (member) {
        member.role = role;
      }
    }
  },
  getters: {
    getProjectById: (state) => (id) => 
      state.projects.find(p => p.id == id),
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
    userProjects: (state, getters, rootState, rootGetters) => {
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
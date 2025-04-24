export default {
  namespaced: true,
  state: () => ({
    projects: JSON.parse(localStorage.getItem('projects')) || []
  }),
  actions: {
    async deleteProject({ commit, rootState }, projectId) {
      // Удаляем проект
      commit('DELETE_PROJECT', projectId);
  
      // Обновляем пользователей
      const updatedUsers = rootState.auth.users.map(user => ({
        ...user,
        projects: user.projects.filter(id => id !== projectId)
      }));
  
      commit('auth/UPDATE_USERS', updatedUsers, { root: true });
    }
  },
  mutations: {
    INIT_PROJECTS(state, projects) {
      state.projects = projects;
    },
    // ADD_PROJECT(state, project) {
    //   state.projects.push({
    //     ...project,
    //     orgId: project.orgId, // Привязка к организации
    //     activities: project.activities || []
    //   })
    //   localStorage.setItem('projects', JSON.stringify(state.projects))
    // },
    ADD_PROJECT(state, project) {
      const newProject = {
        ...project,
        members: project.members || [] // Гарантируем массив
      };
      state.projects.push(newProject);
      localStorage.setItem('projects', JSON.stringify(state.projects));
    },
    UPDATE_PROJECT(state, updatedProject) {
      const index = state.projects.findIndex(p => p.id === updatedProject.id)
      if (index !== -1) {
        state.projects.splice(index, 1, updatedProject)
      }
      if (!getters['auth/canEditProject'](updatedProject)) {
        throw new Error('Нет прав для редактирования');
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
        localStorage.setItem('projects', JSON.stringify(state.projects));
      }
    },
    
    // Добавление задачи
    ADD_TASK(state, { projectId, activityId, task }) {
      const project = state.projects.find(p => p.id === projectId);
      const activity = project?.activities.find(a => a.id === activityId);
      if (activity) activity.tasks.push(task);
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
    },
    DELETE_ACTIVITY(state, { projectId, activityId }) {
      const project = state.projects.find(p => p.id === projectId)
      if (project) {
        project.activities = project.activities.filter(a => a.id !== activityId)
      }
    },
    UPDATE_TASK(state, { projectId, activityId, task }) {
      const project = state.projects.find(p => p.id === projectId);
      const activity = project?.activities.find(a => a.id === activityId);
      
      if (!activity) return;
      
      const taskIndex = activity.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        activity.tasks.splice(taskIndex, 1, { 
          ...task // Полное обновление задачи
        });
      }
    },
    UPDATE_USERS(state, users) {
      state.users = users;
      localStorage.setItem('users', JSON.stringify(users));
    },
    UPDATE_USER_PROJECTS(state, projectId) {
      if (!state.user.projects) {
        state.user.projects = [];
      }
      state.user.projects.push(projectId);
      localStorage.setItem("auth", JSON.stringify(state.user));
    },
    DELETE_PROJECT(state, projectId) {
      state.projects = state.projects.filter(p => p.id !== projectId);
    }
  },
  getters: {
    getProjectById: (state) => (id) => 
      state.projects.find(p => p.id === Number(id)),
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
        project.creatorId === userId || 
        project.members.some(m => m.userId === userId)
      );
    },
    orgProjects: (state) => (orgId) => {
      return state.projects.filter(project => project.orgId === orgId);
    }
  },
}
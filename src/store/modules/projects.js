export default {
  namespaced: true,
  state: () => ({
    projects: [
      // Пример структуры проекта
      {
        id: 1,
        name: "Проект 1",
        activities: [
          {
            id: 1,
            title: "Дизайн",
            owner: "Иван Петров",
            description: "Разработка UI/UX",
            startDate: "2023-01-01",
            endDate: "2023-12-31",
            tasks: [
              {
                id: 1,
                title: "Создать макет",
                assignee: "Анна Сидорова",
                description: "Мобильная версия",
                status: "progress",
                startDate: "2023-01-01", // Добавляем
                endDate: "2023-06-30"
              }
            ]
          }
        ],
        members: [
          { id: 1, role: "admin" }, // id пользователя из auth.js
          { id: 2, role: "manager" }
        ]
      }
    ]
  }),
  mutations: {
    INIT_PROJECTS(state, projects) {
      state.projects = projects;
    },
    ADD_PROJECT(state, project) {
      console.log('Добавляем проект в хранилище:', project);
      state.projects.push({
        id: project.id,
        name: project.name,
        description: project.description,
        organization: project.organization || '',
        startDate: project.startDate || new Date().toISOString(),
        endDate: project.endDate || null,
        created: project.created,
        members: project.members || [],
        activities: project.activities || []
      });
      this.commit('auth/UPDATE_USER_PROJECTS', 
        [...this.state.auth.user.projects, project.id]
      )
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
      if (project) project.activities.push(activity);
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
    userProjects: (state, getters, rootState) => { // Добавляем rootState
      const userId = rootState.auth.user?.id; // Доступ к auth через rootState
      return state.projects.filter(p => 
        p.members?.some(m => m.id === userId) ?? []
      )
    }
  },
}
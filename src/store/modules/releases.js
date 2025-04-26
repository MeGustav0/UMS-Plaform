// store/modules/releases.js
export default {
  namespaced: true,
  state: () => ({
    releases: JSON.parse(localStorage.getItem("releases")) || [],
  }),
  mutations: {
    ADD_RELEASE(state, release) {
      state.releases.push(release);
      localStorage.setItem("releases", JSON.stringify(state.releases));
    },
    ADD_STORY(state, { releaseId, taskPath, story }) {
      const release = state.releases.find(r => r.id === releaseId);
      if (!release) return;
      const [activityId, taskId] = taskPath;
      const activity = release.activitiesSnapshot.find(a => a.id === activityId);
      if (!activity) return;
      const task = activity.tasks.find(t => t.id === taskId);
      if (!task) return;
    
      if (!task.stories) task.stories = [];
      
      task.stories.push({
        id: Date.now(),
        title: story.title,
        status: story.status || 'todo',
        assignee: story.assignee || '',
        description: story.description || '',
        createdAt: new Date().toISOString(),
        endDate: story.endDate || null
      });
    },
    UPDATE_STORY(state, { releaseId, taskPath, story }) {
      const release = state.releases.find(r => r.id === releaseId);
      if (!release) return;
      const [activityId, taskId] = taskPath;
      const activity = release.activitiesSnapshot.find(a => a.id === activityId);
      if (!activity) return;
      const task = activity.tasks.find(t => t.id === taskId);
      if (!task) return;
    
      const index = task.stories.findIndex(s => s.id === story.id);
      if (index !== -1) {
        task.stories.splice(index, 1, story);
      }
    },
    
    DELETE_STORY(state, { releaseId, taskPath, storyId }) {
      const release = state.releases.find(r => r.id === releaseId);
      if (!release) return;
      const [activityId, taskId] = taskPath;
      const activity = release.activitiesSnapshot.find(a => a.id === activityId);
      if (!activity) return;
      const task = activity.tasks.find(t => t.id === taskId);
      if (!task) return;
    
      task.stories = task.stories.filter(s => s.id !== storyId);
    }
  },
  actions: {
    createRelease({ commit, rootState }, payload) {
      const project = rootState.projects.projects.find(
        (p) => p.id === payload.projectId
      );

      commit("ADD_RELEASE", {
        id: Date.now(),
        projectId: payload.projectId,
        name: payload.name || `Релиз ${new Date().toLocaleDateString()}`,
        activitiesSnapshot: JSON.parse(
          JSON.stringify(
            project.activities.map((activity) => ({
              ...activity,
              tasks: activity.tasks.map((task) => ({
                ...task,
                stories: task.stories || [],
              })),
            }))
          )
        ),
        createdAt: new Date().toISOString(),
      });
    },
  },
  getters: {
    projectReleases: (state) => (projectId) => {
      return state.releases.filter((r) => r.projectId === projectId);
    },
  },
};

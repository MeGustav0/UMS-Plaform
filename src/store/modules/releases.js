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

      task.stories.push({ ...story });
      localStorage.setItem("releases", JSON.stringify(state.releases));
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
      localStorage.setItem("releases", JSON.stringify(state.releases));
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
      localStorage.setItem("releases", JSON.stringify(state.releases));
    },
    MOVE_TASK_BETWEEN_ACTIVITIES(state, { fromReleaseId, fromActivityId, toReleaseId, toActivityId, taskId }) {
      const fromRelease = state.releases.find(r => r.id === fromReleaseId);
      const toRelease = state.releases.find(r => r.id === toReleaseId);
      if (!fromRelease || !toRelease) return;
    
      const fromActivity = fromRelease.activitiesSnapshot.find(a => a.id === fromActivityId);
      const toActivity = toRelease.activitiesSnapshot.find(a => a.id === toActivityId);
      if (!fromActivity || !toActivity) return;
    
      const taskIndex = fromActivity.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;
    
      const [task] = fromActivity.tasks.splice(taskIndex, 1);
      toActivity.tasks.push(task);
    
      localStorage.setItem("releases", JSON.stringify(state.releases));
    },
    UPDATE_RELEASE_NAME(state, { releaseId, newName }) {
      const release = state.releases.find(r => r.id === releaseId);
      if (release) {
        release.name = newName;
        localStorage.setItem("releases", JSON.stringify(state.releases));
      }
    }
  },
  actions: {
    createRelease({ commit, rootState }, payload) {
      const project = rootState.projects.projects.find(p => p.id === payload.projectId);
      if (!project) return;

      commit("ADD_RELEASE", {
        id: Date.now(),
        projectId: payload.projectId,
        name: payload.name || `Релиз ${new Date().toLocaleDateString()}`,
        activitiesSnapshot: JSON.parse(JSON.stringify(
          project.activities.map(activity => ({
            ...activity,
            tasks: activity.tasks.map(task => ({
              ...task,
              stories: task.stories || []
            }))
          }))
        )),
        createdAt: new Date().toISOString(),
      });
    },
  },
  getters: {
    projectReleases: (state) => (projectId) => {
      return state.releases.filter(r => r.projectId === projectId);
    },
  },
};
import axios from "axios";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

let releasesUnsubscribe = null;

export default {
  namespaced: true,
  state: () => ({
    releases: [],
  }),
  mutations: {
    SET_RELEASES(state, list) {
      state.releases = list;
    },
    ADD_RELEASE(state, release) {
      state.releases.push(release);
    },
    UPDATE_RELEASE(state, updated) {
      const index = state.releases.findIndex(r => r.id === updated.id);
      if (index !== -1) {
        state.releases.splice(index, 1, updated);
      }
    },
    DELETE_RELEASE(state, releaseId) {
      state.releases = state.releases.filter(r => r.id !== releaseId);
    },
    MOVE_STORY(state, { from, to }) {
      const release = state.releases.find(r => r.id === from.releaseId);
      const story =
        release?.activitiesSnapshot
          ?.find(a => a.id === from.activityId)
          ?.tasks?.find(t => t.id === from.taskId)
          ?.stories?.find(s => s.id === from.storyId);
    
      if (!story) return;
    
      // Удалить из старого
      const fromTask = release.activitiesSnapshot
        .find(a => a.id === from.activityId)
        .tasks.find(t => t.id === from.taskId);
      fromTask.stories = fromTask.stories.filter(s => s.id !== from.storyId);
    
      // Добавить в новый
      const toTask = release.activitiesSnapshot
        .find(a => a.id === to.activityId)
        .tasks.find(t => t.id === to.taskId);
      toTask.stories.push(story);
    }
    // MOVE_TASK_BETWEEN_ACTIVITIES(state, { fromReleaseId, fromActivityId, toReleaseId, toActivityId, taskId }) {
    //   const fromRelease = state.releases.find(r => r.id === fromReleaseId);
    //   const toRelease = state.releases.find(r => r.id === toReleaseId);
    //   if (!fromRelease || !toRelease) return;
    
    //   const fromActivity = fromRelease.activitiesSnapshot.find(a => a.id === fromActivityId);
    //   const toActivity = toRelease.activitiesSnapshot.find(a => a.id === toActivityId);
    //   if (!fromActivity || !toActivity) return;
    
    //   const taskIndex = fromActivity.tasks.findIndex(t => t.id === taskId);
    //   if (taskIndex === -1) return;
    
    //   const [task] = fromActivity.tasks.splice(taskIndex, 1);
    //   toActivity.tasks.push(task);
    
    //   localStorage.setItem("releases", JSON.stringify(state.releases));
    // },
    
  },
  actions: {
    subscribeToReleases({ commit }, projectId) {
      if (!projectId) return;

      if (releasesUnsubscribe) {
        releasesUnsubscribe();
        releasesUnsubscribe = null;
      }

      const q = query(
        collection(db, "releases"),
        where("projectId", "==", projectId)
      );

      releasesUnsubscribe = onSnapshot(q, (querySnap) => {
        const releases = [];
        querySnap.forEach(doc => {
          releases.push(doc.data());
        });
        commit("SET_RELEASES", releases);
      });
    },
    unsubscribeFromReleases() {
      if (releasesUnsubscribe) {
        releasesUnsubscribe();
        releasesUnsubscribe = null;
      }
    },
    async fetchReleases({ commit }, projectId) {
      try {
        const { data } = await axios.get(`/api/releases?projectId=${projectId}`);
        commit("SET_RELEASES", data);
      } catch (err) {
        console.error("Ошибка при загрузке релизов:", err);
      }
    },

    async createRelease({ dispatch, rootState }, { projectId, name }) {
      console.log("createRelease вызван");

      const project = rootState.projects.projects.find(p => p.id === projectId);
      if (!project) {
        console.error("Проект не найден");
        return;
      }

      const activitiesSnapshot = JSON.parse(JSON.stringify(
        project.activities.map(activity => ({
          ...activity,
          tasks: activity.tasks.map(task => ({
            ...task,
            stories: task.stories || []
          }))
        }))
      ));

      try {
        const { data } = await axios.post("/api/releases", {
          projectId,
          name,
          activitiesSnapshot
        });

        console.log("Ответ от сервера:", data);

        await dispatch("fetchReleases", projectId);

      } catch (err) {
        console.error("Ошибка при создании релиза:", err);
      }
    },

    async updateRelease({ commit }, updatedRelease) {
      try {
        await axios.put(`/api/releases/${updatedRelease.id}`, updatedRelease);
        commit("UPDATE_RELEASE", updatedRelease);
      } catch (err) {
        console.error("Ошибка при обновлении релиза:", err);
      }
    },

    async deleteRelease({ commit }, releaseId) {
      try {
        await axios.delete(`/api/releases/${releaseId}`);
        commit("DELETE_RELEASE", releaseId);
      } catch (err) {
        console.error("Ошибка при удалении релиза:", err);
      }
    },
    async deleteReleasesByProjectId(_, projectId) {
      try {
        await axios.delete(`/api/releases/by-project/${projectId}`);
      } catch (err) {
        console.error("Ошибка при удалении релизов по projectId:", err);
      }
    },
    async addStory({ getters, dispatch }, { releaseId, taskPath, story }) {
      const release = getters.getReleaseById(releaseId);
      if (!release) return;
    
      const [activityId, taskId] = taskPath;
      const updated = JSON.parse(JSON.stringify(release));
    
      const activity = updated.activitiesSnapshot.find(a => a.id === activityId);
      const task = activity?.tasks.find(t => t.id === taskId);
      if (!task?.stories) task.stories = [];
    
      task.stories.push(story);
    
      await dispatch("updateRelease", updated);
    },
    async updateStory({ getters, dispatch }, { releaseId, taskPath, story }) {
      const release = getters.getReleaseById(releaseId);
      if (!release) return;
    
      const [activityId, taskId] = taskPath;
      const updated = JSON.parse(JSON.stringify(release));
    
      const activity = updated.activitiesSnapshot.find(a => a.id === activityId);
      const task = activity?.tasks.find(t => t.id === taskId);
      const index = task?.stories.findIndex(s => s.id === story.id);
    
      if (index !== -1) {
        task.stories[index] = story;
        await dispatch("updateRelease", updated);
      }
    },
    async deleteStory({ getters, dispatch }, { releaseId, taskPath, storyId }) {
      const release = getters.getReleaseById(releaseId);
      if (!release) return;
    
      const [activityId, taskId] = taskPath;
      const updated = JSON.parse(JSON.stringify(release));
    
      const activity = updated.activitiesSnapshot.find(a => a.id === activityId);
      const task = activity?.tasks.find(t => t.id === taskId);
    
      if (!task?.stories) return;
    
      task.stories = task.stories.filter(s => s.id !== storyId);
      await dispatch("updateRelease", updated);
    },
    async syncActivityToReleases({ dispatch, getters }, { projectId, activity }) {
      const allReleases = getters.getReleasesByProject(projectId);
    
      for (const release of allReleases) {
        const updated = { ...release };
        updated.activitiesSnapshot.push(JSON.parse(JSON.stringify(activity)));
    
        await dispatch("updateRelease", updated);
      }
    },
    
    async syncTaskToReleases({ dispatch, getters }, { projectId, activityId, task }) {
      const allReleases = getters.getReleasesByProject(projectId);
    
      for (const release of allReleases) {
        const updated = { ...release };
        const activity = updated.activitiesSnapshot.find(a => a.id === activityId);
        if (!activity) continue;
    
        activity.tasks.push(JSON.parse(JSON.stringify(task)));
    
        await dispatch("updateRelease", updated);
      }
    },
    
    async removeActivityFromReleases({ dispatch, getters }, { projectId, activityId }) {
      const allReleases = getters.getReleasesByProject(projectId);
    
      for (const release of allReleases) {
        const updated = {
          ...release,
          activitiesSnapshot: release.activitiesSnapshot.filter(a => a.id !== activityId)
        };
    
        await dispatch("updateRelease", updated);
      }
    },
    
    async removeTaskFromReleases({ dispatch, getters }, { projectId, activityId, taskId }) {
      const allReleases = getters.getReleasesByProject(projectId);
    
      for (const release of allReleases) {
        const updated = { ...release };
        const activity = updated.activitiesSnapshot.find(a => a.id === activityId);
        if (!activity) continue;
    
        activity.tasks = activity.tasks.filter(t => t.id !== taskId);
    
        await dispatch("updateRelease", updated);
      }
    },
    // async moveTaskBetweenActivities({ getters, dispatch }, { releaseId, fromActivityId, toActivityId, taskId }) {
    //   const release = getters.getReleaseById(releaseId);
    //   if (!release) return;
    
    //   const updated = JSON.parse(JSON.stringify(release));
    
    //   const from = updated.activitiesSnapshot.find(a => a.id === fromActivityId);
    //   const to = updated.activitiesSnapshot.find(a => a.id === toActivityId);
    //   if (!from || !to) return;
    
    //   const index = from.tasks.findIndex(t => t.id === taskId);
    //   if (index === -1) return;
    
    //   const [task] = from.tasks.splice(index, 1);
    //   to.tasks.push(task);
    
    //   await dispatch("updateRelease", updated);
    // }
  },
  getters: {
    getReleasesByProject: (state) => (projectId) =>
      state.releases
        .filter(r => r.projectId === projectId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),

    getReleaseById: (state) => (id) =>
      state.releases.find(r => r.id === id)
  },
};
<template>
  <div class="releases-container">
    <div v-for="release in releases" :key="release.id" class="release-block">
      <div class="release-header">
        <h3 style="margin: 10px">{{ release.name }}</h3>
        <span class="release-date">{{ formatDate(release.createdAt) }}</span>
      </div>

      <div class="release-board">
        <div
          v-for="activity in release.activitiesSnapshot"
          :key="activity.id"
          class="activity-release"
        >
          <div
            v-for="task in activity.tasks"
            :key="task.id"
            class="task-release"
          >
            <div
              v-for="story in getStories(activity.id, task.id)"
              :key="story.id"
              class="story-item"
              draggable="false"
            >
              <div>
                <div class="activity-top">
                  <div class="task-status">
                    <select
                      v-model="story.status"
                      @change="
                        updateStoryStatus(
                          latestRelease.id,
                          [activity.id, task.id],
                          story
                        )
                      "
                      class="status-select"
                      :class="story.status"
                    >
                      <option value="todo">To Do</option>
                      <option value="progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div class="activity-actions">
                    <button
                      @click="
                        openEditStoryModal(
                          latestRelease.id,
                          [activity.id, task.id],
                          story
                        )
                      "
                      class="edit-btn orange hover"
                    >
                      <img
                        class="img_edit"
                        src="../assets/edit.svg"
                        alt="Редактировать"
                      />
                    </button>
                    <button
                      @click.stop="
                        deleteStory(
                          latestRelease.id,
                          [activity.id, task.id],
                          story.id
                        )
                      "
                      class="delete-btn orange hover"
                    >
                      ✖
                    </button>
                  </div>
                </div>

                <h4 style="margin-bottom: 0" class="description">
                  {{ story.title }}
                </h4>

                <div class="description orange">
                  <img class="img_edit" src="../assets/user.svg" alt="" />:
                  {{ getUserName(story.assignee) || "Не назначен" }}
                </div>

                <div class="description orange">
                  <img class="img_edit" src="../assets/deadline.svg" alt="" />:
                  {{ formatDate(story.endDate) }}
                </div>
              </div>
            </div>

            <div class="task-header">
              <button
                class="add-story-btn"
                @click="emitAddStory(latestRelease.id, [activity.id, task.id])"
              >
                + История
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <EditStoryModal
      v-if="showStoryModal"
      :story="editingStory"
      :projectMembers="projectMembers"
      @save="handleSaveStory"
      @close="closeStoryModal"
    />
  </div>
</template>

<script>
import EditStoryModal from "./Modal/EditStoryModal.vue";

export default {
  components: { EditStoryModal },
  emits: ["add-story"],
  props: {
    releases: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      showStoryModal: false,
      editingStory: null,
      editingReleaseId: null,
      editingTaskPath: null,
    };
  },
  computed: {
    projectMembers() {
      const release = this.releases.find((r) => r.id === this.editingReleaseId);
      if (!release) return [];
      const project = this.$store.state.projects.projects.find(
        (p) => p.id === release.projectId
      );
      return project?.members || [];
    },
    latestRelease() {
      return this.releases.length
        ? this.releases[this.releases.length - 1]
        : null;
    },
  },
  methods: {
    emitAddStory(releaseId, taskPath) {
      console.log('Emit add-story:', { releaseId, taskPath });
      this.$emit("add-story", { releaseId, taskPath }); 
    },
    openEditStoryModal(releaseId, taskPath, story) {
      this.editingReleaseId = releaseId;
      this.editingTaskPath = taskPath;
      this.editingStory = { ...story };
      this.showStoryModal = true;
    },
    closeStoryModal() {
      this.showStoryModal = false;
      this.editingStory = null;
      this.editingReleaseId = null;
      this.editingTaskPath = null;
    },
    handleSaveStory(updatedStory) {
      if (updatedStory.id) {
        this.$store.commit("releases/UPDATE_STORY", {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory,
        });
      } else {
        updatedStory.id = Date.now();
        this.$store.commit("releases/ADD_STORY", {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory,
        });
      }
      this.closeStoryModal();
    },
    deleteStory(releaseId, taskPath, storyId) {
      if (confirm("Удалить эту историю?")) {
        this.$store.commit("releases/DELETE_STORY", {
          releaseId,
          taskPath,
          storyId,
        });
      }
    },
    formatDate(date) {
      if (!date) return "Не указано";
      return new Date(date).toLocaleDateString("ru-RU");
    },
    getStories(activityId, taskId) {
      if (!this.latestRelease) return [];
      const act = this.latestRelease.activitiesSnapshot.map(a => ({ ...a })).find(a => a.id === activityId);
      if (!act) return [];
      const task = act.tasks.map(t => ({ ...t })).find(t => t.id === taskId);
      return task?.stories || [];
    },
    getUserName(id) {
      const u = this.$store.state.auth.users.find((u) => u.id === id);
      return u?.name || "—";
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString("ru-RU") : "—";
    },
    openEditStoryModal(rId, path, story) {
      this.$emit("edit-story", { releaseId: rId, taskPath: path, story });
    },
    updateStoryStatus(releaseId, taskPath, story) {
     if (!releaseId) return; 
      this.$store.commit('releases/UPDATE_STORY', {
        releaseId,
        taskPath,
        story
      });
    },
  },
};
</script>

<style scoped>
.releases-container {
  border-left: 0;
  border-bottom: 0;
  border-style: dotted;
  background: #f5f5f5;
  border-color: #3f3f3f;
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 1rem;
  border-style: dotted;
  border-color: #3f3f3f;
  border-top: 0;
  border-left: 0;
  border-right: 0;
}

.activity-release {
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
  border-style: dotted;
  border-color: #3f3f3f;
  display: flex;
  font-size: 0.8em;
  gap: 1.5rem;
  resize: horizontal; 
  overflow: auto; 
  /* min-width: 300px; */
  padding: 16px 103px 16px 16px;
}

.activity-top{
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.edit-btn {
  padding: 4px 5px 1px 4px;
  transition: background 0.2s;
}

.delete-btn {
  padding: 1px 6.5px 1px 5.5px;
  transition: background 0.2s;
}

.orange{
  background: #fdc65e;
  box-shadow: 0px 0px 5px 2px #fdc65e91;
  border: 0;
}

.activity-actions {
  display: flex;
  gap: 8px;
}

.task {
  display: flex;
  gap: 1.5rem;
}
.task-release {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  /* min-width: 230px; */
}

@media (max-width: 768px) {
  .activity-release {
    resize: vertical; 
    width: 100% !important; 
    max-width: 100%;
    margin: 1rem 0;
  }

  .task-release {
    resize: none; 
    width: 100% !important;
    max-width: 100%;
  }
}

.release-date {
  color: #666;
  font-size: 0.9em;
}

.release-board {
  display: flex;
  border-top: 0;
  border-right: 0;
  border-left: 0;
  border-style: dotted;
  border-color: #3f3f3f;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-story-btn {
  width: 100%;
  height: 50px;
  font-weight: 600;
  padding: 0.5rem;
  border: 0;
  cursor: pointer;
  opacity: 0.05;
  transition: background 0.2s;
}

.add-story-btn:hover {
  background: #c5c4c475;
  opacity: 1;
}

.story-item {
  display: flex;
  gap: 15px;
  padding: 0.5rem;
  cursor: move;
  resize: horizontal;
  width: 200px;
  overflow: auto;
  background-color: #fcb839;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

.story-item.clickable {
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 1.5rem;
  font-size: 0.8em;
}

.story-item:hover {
  transform: translateY(-2px);
  box-shadow: -3px 4px 1px 2px rgba(34, 60, 80, 0.2);
  background: #ffa806;
}

.description {
  display: flex;
  margin-top: 8px;
  padding: 4px;
}

.img_edit {
  width: 14px;
}

.todo { background: #008ffb }
.progress { background: #00e396}
.done { background: #feb019; }

.status-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.status-select.done {
  background: #ffeeba;
  color: #856404;
}

.status-select.todo {
  background: #b8daff;
  color: #004085;
}

.status-select.progress {
  background: #c3e6cb;
  color: #155724;
}

.status-select:hover {
  filter: brightness(95%);
}

.status-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
}

</style>

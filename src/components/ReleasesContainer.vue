<template>
  <div class="releases-container">
    <div v-for="release in releases" :key="release.id" class="release-block">
      <div class="release-header">
        <div style="display: flex">
          <h3 style="margin: 10px" @click="startEditingReleaseName(release)">
            <!-- Если мы редактируем этот релиз -->
            <template v-if="editingReleaseNameId === release.id">
              <input
                v-model="newReleaseName"
                @blur="saveReleaseName(release.id)"
                @keydown.enter="saveReleaseName(release.id)"
                class="release-name-input"
                autofocus
              />
            </template>

            <!-- Просто название если не редактируем -->
            <template v-else>
              {{ release.name }}
            </template>
          </h3>
          <button @click="deleteRelease(release.id)" class="delete-release-btn">
            Удалить
          </button>
        </div>

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
            draggable="true"
            @dragstart="startDrag($event, release.id, activity.id, task.id)"
            @drop="onDrop($event, release.id, activity.id)"
            @dragover.prevent
          >
            <div
              v-for="story in task.stories"
              :key="story.id"
              class="story-item"
              draggable="false"
            >
              <div style="width: 100%">
                <div class="activity-top">
                  <div class="task-status">
                    <select
                      v-model="story.status"
                      @change="
                        updateStoryStatus(
                          release.id,
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
                    <div
                      class="priority-button-wrapper orange"
                      @click.stop="toggleStoryPriorityMenu(story)"
                    >
                      <button
                        class="priority-button hover"
                        v-html="priorityIcon(story.priority)"
                      ></button>

                      <div v-if="story.showPriorityMenu" class="priority-menu">
                        <div
                          @click="
                            changeStoryPriority(story, 'low', release.id, [
                              activity.id,
                              task.id,
                            ])
                          "
                        >
                          <span v-html="priorityIcon('low')"></span>
                        </div>
                        <div
                          @click="
                            changeStoryPriority(story, 'medium', release.id, [
                              activity.id,
                              task.id,
                            ])
                          "
                        >
                          <span v-html="priorityIcon('medium')"></span>
                        </div>
                        <div
                          @click="
                            changeStoryPriority(story, 'high', release.id, [
                              activity.id,
                              task.id,
                            ])
                          "
                        >
                          <span v-html="priorityIcon('high')"></span>
                        </div>
                      </div>
                    </div>
                    <button
                      @click="
                        openEditStoryModal(
                          release.id,
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
                          release.id,
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

                <h4 style="margin-bottom: 0" class="description orange">
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
                @click="emitAddStory(release.id, [activity.id, task.id])"
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
import { generateId } from "@/utils/id";

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
      editingReleaseNameId: null,
      newReleaseName: "",
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
  },
  methods: {
    emitAddStory(releaseId, taskPath) {
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
        updatedStory.id = generateId();
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
      return date ? new Date(date).toLocaleDateString("ru-RU") : "—";
    },
    getUserName(id) {
      const user = this.$store.state.auth.users.find((u) => u.id === id);
      return user?.name || "—";
    },
    updateStoryStatus(releaseId, taskPath, story) {
      const updatedStory = { ...story };

      if (updatedStory.status === "done") {
        updatedStory.closedAt = new Date().toISOString();
      } else {
        updatedStory.closedAt = null;
      }

      this.$store.commit("releases/UPDATE_STORY", {
        releaseId,
        taskPath,
        story: updatedStory,
      });
    },
    startDrag(event, releaseId, activityId, taskId) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          releaseId,
          activityId,
          taskId,
        })
      );
    },
    onDrop(event, targetReleaseId, targetActivityId) {
      const data = JSON.parse(event.dataTransfer.getData("text/plain"));
      if (!data) return;

      // Перемещаем задачу через мутацию
      this.$store.commit("releases/MOVE_TASK_BETWEEN_ACTIVITIES", {
        fromReleaseId: data.releaseId,
        fromActivityId: data.activityId,
        toReleaseId: targetReleaseId,
        toActivityId: targetActivityId,
        taskId: data.taskId,
      });
    },
    startEditingReleaseName(release) {
      this.editingReleaseNameId = release.id;
      this.newReleaseName = release.name;
    },
    saveReleaseName(releaseId) {
      if (this.newReleaseName.trim()) {
        this.$store.commit("releases/UPDATE_RELEASE_NAME", {
          releaseId,
          newName: this.newReleaseName.trim(),
        });
      }
      this.editingReleaseNameId = null;
      this.newReleaseName = "";
    },
    priorityIcon(priority) {
      const size = 16; // размер кружка
      const color =
        {
          low: "#70b013",
          medium: "orange",
          high: "#ff0000b3",
        }[priority] || "#aeaeae";

      return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" />
      </svg>
    `;
    },
    toggleStoryPriorityMenu(story) {
      story.showPriorityMenu = !story.showPriorityMenu;
    },

    changeStoryPriority(story, newPriority, releaseId, taskPath) {
      story.priority = newPriority;
      story.showPriorityMenu = false;

      this.$store.commit("releases/UPDATE_STORY", {
        releaseId,
        taskPath,
        story: { ...story },
      });
    },
    deleteRelease(releaseId) {
      if (confirm("Вы уверены, что хотите удалить этот релиз?")) {
        this.$store.commit("releases/DELETE_RELEASE", releaseId);
      }
    },
  },
};
</script>

<style scoped>
.releases-container {
  border-left: 0;
  border-bottom: 0;
  border-right: 0;
  border-style: dotted;
  background: #f5f5f5;
  border-color: #3f3f3f;
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-left: 5px;
  border-style: dotted;
  border-color: #3f3f3f;
  border-top: 0;
  border-left: 0;
}

.release-name-input {
  font-size: 1.2rem;
  padding: 4px 8px;
  width: 90%;
  border: 1px solid #ccc;
  border-radius: 6px;
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
  /* resize: horizontal; 
  overflow: auto;  */
  min-width: 229px;
  padding: 16px 98px 16px 16px;
}

.activity-top {
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

.orange {
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
  margin-right: 15px;
}

.delete-release-btn {
  border: none;
  background: #dad8d8;
  color: #666;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin: 6px 0px 6px 10px;
  transition: all 0.3s;
  border-radius: 5px;
  padding: 0 10px;
  opacity: 0.1;
}

.delete-release-btn:hover {
  color: white;
  background: #f52812;
  opacity: 1;
}

.release-board {
  display: flex;
  border-top: 0;
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
  width: 216px;
  min-height: 52px;
  max-height: 134px;
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
  width: 200px;
  /* resize: horizontal; */
  /* overflow: auto; */
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

.todo {
  background: #008ffb;
}
.progress {
  background: #00e396;
}
.done {
  background: #feb019;
}

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
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.priority-button-wrapper {
  position: relative;
  display: inline-block;
  padding: 4px 4px 0px 4px;
}

.priority-button {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.priority-menu {
  position: absolute;
  top: 28px;
  left: 0;
  background: #fed995;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.priority-menu div {
  padding: 3px;
  cursor: pointer;
}

.priority-menu div:hover {
  background: #f0f0f0;
  border-radius: 6px;
}
.low {
  fill: #008000b3;
}

.medium {
  fill: orange;
}

.high {
  fill: #ff0000b3;
}
</style>

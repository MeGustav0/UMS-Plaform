<template>
  <div class="releases-container">
    <div v-for="release in releases" :key="release.id" class="release-block">
      <div class="release-header">
        <h3 style="margin: 10px;">{{ release.name }}</h3>
        <span class="release-date">{{ formatDate(release.createdAt) }}</span>
      </div>

      <div class="release-board">
        <div
          v-for="activity in release.activitiesSnapshot"
          :key="activity.id"
          class="activity-release"
        >
          <!-- <h4>{{ activity.title }}</h4> -->
          <div class="task">
            <div
              v-for="task in activity.tasks"
              :key="task.id"
              class="task-release"
            >
              <div v-for="story in task.stories" :key="story.id" >
                <div class="story-item clickable" @click="openEditStoryModal(release.id, [activity.id, task.id], story)">
                  <h4>{{ story.title }}</h4>
                  <small>{{ story.status }}</small>
                  <button @click.stop="deleteStory(release.id, [activity.id, task.id], story.id)">✖️</button>
                </div>
              </div>
              <div class="task-header">
                <!-- <span>{{ task.title }}</span> -->
                <button class="add-story-btn" @click="openNewStoryModal(release.id, [activity.id, task.id])">+ История</button>
              </div>
            </div>
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
</template>

<script>
import EditStoryModal from './Modal/EditStoryModal.vue';

export default {
  components: {EditStoryModal},
  data() {
    return {
      showStoryModal: false,       // Показывать или нет модалку
      editingStory: null,          // Какая история редактируется
      editingReleaseId: null,      // Где она лежит
      editingTaskPath: null        // Путь [activityId, taskId]
    };
  },
  props: {
    releases: {
      type: Array,
      required: true,
      default: () => [], // Добавляем значение по умолчанию
    },
  },
  computed: {
    projectMembers() {
    const release = this.releases.find(r => r.id === this.editingReleaseId)
    if (!release) return [];

    const project = this.$store.state.projects.projects.find(p => p.id === release.projectId)
    return project?.members || [];
  }
},
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    addStory(releaseId, taskPath) {
      this.$emit("add-story", { releaseId, taskPath });
    },
    openNewStoryModal(releaseId, taskPath) {
      this.editingReleaseId = releaseId;
      this.editingTaskPath = taskPath;
      this.editingStory = {
        id: null,
        title: '',
        status: 'todo',
        assignee: '',
        description: '',
        endDate: null
      };
      this.showStoryModal = true;
    },

    openEditStoryModal(releaseId, taskPath, story) {
      this.editingReleaseId = releaseId;
      this.editingTaskPath = taskPath;
      this.editingStory = { ...story }; // Копируем старую историю
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
        // Уже существует — обновляем
        this.$store.commit('releases/UPDATE_STORY', {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory
        });
      } else {
        // Новая история — создаём
        this.$store.commit('releases/ADD_STORY', {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory
        });
      }
    },

    deleteStory(releaseId, taskPath, storyId) {
      if (confirm('Удалить эту историю?')) {
        this.$store.commit('releases/DELETE_STORY', {
          releaseId,
          taskPath,
          storyId
        });
      }
    }
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
  border-left:0;
  border-right: 0;
}

.activity-release {
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
  border-style: dotted;
  border-color: #3f3f3f;
  resize: horizontal; /* Разрешаем изменение ширины */
  overflow: auto; /* Необходимо для работы resize */
  min-width: 355px;
  padding: 1rem;
}
.task {
  display: flex;
  gap: 1.5rem;
}
.task-release {
  display: flex;
  flex-direction: column;
  min-width: 230px;
}

@media (max-width: 768px) {
  .activity-release {
    resize: vertical; /* На мобильных меняем направление */
    width: 100% !important; /* Принудительно растягиваем */
    max-width: 100%;
    margin: 1rem 0;
  }

  .task-release {
    resize: none; /* Запрещаем изменение ширины задач */
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
  height: 100px;
  font-weight: 600;
  padding: 0.5rem;
  border: 0;
  cursor: pointer;
  opacity: 0.05;
  transition: background 0.2s;
}

.add-story-btn:hover{
  background: #c5c4c475;
  opacity: 1;
}

.stories {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 2px solid #eee;
}

.story-item {
  padding: 0.5rem;
  cursor: move;
  resize: horizontal;
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
</style>

<template>
  <div class="tasks-view">
    <h2 style="margin-top: 0;">Все задачи проекта</h2>
    <div class="tasks-list" v-if="project?.activities?.length">
      <div
        v-for="activity in project.activities"
        :key="activity.id"
        class="activity-tasks"
      >
        <h3 style="margin: 0;">{{ activity.title }}</h3>

        <div
          v-for="task in activity.tasks"
          :key="task.id"
          class="task-with-stories"
        >
          <!-- Существующий рендер задачи -->
          <TaskItem
            :task="task"
            :activityId="activity.id"
            @edit="$emit('edit', $event)"
          />

          <!-- Блок историй под задачей -->
          <div
            v-for="story in getStories(activity.id, task.id)"
            :key="story.id"
            class="story-item clickable"
            @click="openEditStoryModal(latestRelease.id, [activity.id, task.id], story)"
          >
            <div class="story-header">
              <strong>{{ story.title }}</strong>
              <span class="status" :class="story.status">{{ story.status }}</span>
            </div>
            <div class="story-meta">
              <span>Исполнитель: {{ getUserName(story.assignee) }}</span>
              <span>Создано: {{ formatDate(story.createdAt) }}</span>
              <span v-if="story.endDate">Дедлайн: {{ formatDate(story.endDate) }}</span>
            </div>
            <div v-if="story.description" class="story-description">
              {{ story.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">Нет активностей</div>

    <!-- Модалка редактирования истории -->
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
import TaskItem from '@/components/TaskItem.vue'
import EditStoryModal from '@/components/Modal/EditStoryModal.vue'

export default {
  name: 'TasksView',
  components: { TaskItem, EditStoryModal },
  props: ['project'],
  data() {
    return {
      showStoryModal: false,
      editingStory: null,
      editingReleaseId: null,
      editingTaskPath: null
    }
  },
  computed: {
    projectReleases() {
      return this.$store.getters['releases/projectReleases'](this.project.id)
    },
    latestRelease() {
      return this.projectReleases.slice(-1)[0] || null
    },
    projectMembers() {
      if (!this.latestRelease) return []
      const proj = this.$store.getters['projects/getProjectById'](this.project.id)
      return proj?.members || []
    }
  },
  methods: {
    getStories(activityId, taskId) {
      if (!this.latestRelease) return []
      const act = this.latestRelease.activitiesSnapshot.find(a => a.id === activityId)
      if (!act) return []
      const task = act.tasks.find(t => t.id === taskId)
      return task?.stories || []
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    getUserName(userId) {
      const user = this.$store.state.auth.users.find(u => u.id === userId)
      return user?.name || 'Не назначен'
    },
    openEditStoryModal(releaseId, taskPath, story) {
      this.editingReleaseId = releaseId
      this.editingTaskPath = taskPath
      this.editingStory = { ...story }
      this.showStoryModal = true
    },
    closeStoryModal() {
      this.showStoryModal = false
      this.editingStory = null
      this.editingReleaseId = null
      this.editingTaskPath = null
    },
    handleSaveStory(updatedStory) {
      if (updatedStory.id) {
        this.$store.commit('releases/UPDATE_STORY', {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory
        })
      }
      if (updatedStory.id && this.latestRelease) {
      this.$store.commit('releases/UPDATE_STORY', {
      releaseId: this.editingReleaseId,
      taskPath: this.editingTaskPath,
      story: updatedStory
    })
  } else if (this.latestRelease) {
    updatedStory.id = Date.now(); // Присваиваем ID если новая история
    this.$store.commit('releases/ADD_STORY', {
      releaseId: this.editingReleaseId,
      taskPath: this.editingTaskPath,
      story: updatedStory
    })
  }
      this.closeStoryModal()
    }
  }
}
</script>

<style scoped>
.tasks-view{
  padding: 20px 30px;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 80%;
}

.task-item{
  margin-bottom: 1rem;
}
.activity-tasks{
  border: 3px dotted #3f3f3f;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 20px; 
}

.task-with-stories {
  background: #ffffff;
  padding-bottom: 15px; 
  border-radius: 10px;
  margin-top: 0;
  margin-top: 15px;
  font-size: 0.9rem;
}
.story-item.clickable {
  cursor: pointer;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  margin: 15px;
  margin-bottom: 0;
  transition: background 0.2s;
}
.story-item.clickable:hover {
  background: #f5f5f5;
}
.story-header {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}
.story-meta span {
  display: inline-block;
  margin-right: 1rem;
  font-size: 0.875rem;
  color: #4a5568;
}
.story-description {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #2d3748;
}
</style>
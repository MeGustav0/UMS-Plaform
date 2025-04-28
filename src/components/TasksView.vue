<template>
  <div class="tasks-view">
    <h2 style="margin-top: 0;">Все задачи проекта</h2>

    <!-- Выбор релиза -->
    <div v-if="projectReleases.length > 0" class="release-select">
      <label>Выберите релиз:</label>
      <select v-model="selectedReleaseId">
        <option v-for="release in projectReleases" :key="release.id" :value="release.id">
          {{ release.name }}
        </option>
      </select>
    </div>

    <!-- Фильтры -->
    <div v-if="selectedRelease" class="filters">
      <label>Пользователь:
        <select v-model="selectedUserId">
          <option value="all">Все</option>
          <option v-for="member in projectMembers" :key="member.userId" :value="member.userId">
            {{ member.name }}
          </option>
        </select>
      </label>

      <label>Статус:
        <select v-model="selectedStatus">
          <option value="all">Все</option>
          <option value="todo">To Do</option>
          <option value="progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </label>
      <label>Приоритет:
        <select v-model="selectedPriority">
          <option value="all">Все</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </label>
      <label>Дедлайн до:
        <input type="date" v-model="selectedDeadline">
      </label>
    </div>

    <!-- Список задач и историй -->
    <div class="tasks-list" v-if="project?.activities?.length && selectedRelease">
      <div v-for="activity in project.activities" :key="activity.id" class="activity-tasks">
        <h3 style="margin: 0;">{{ activity.title }}</h3>

        <div v-for="task in getFilteredTasks(activity)" :key="task.id" class="task-with-stories">
          <TaskItem
            :task="task"
            :activityId="activity.id"
            @edit="$emit('edit', $event)"
          />

          <div v-for="story in getFilteredStories(activity.id, task.id)" :key="story.id" class="story-item clickable"
            @click="openEditStoryModal(selectedRelease.id, [activity.id, task.id], story)">
            <div class="story-header">
              <strong>{{ story.title }}</strong>
              <span class="status" :class="story.status">{{ story.status }}</span>
              <span class="priority" v-html="priorityIcon(story.priority)"></span>
            </div>
            <div class="story-meta">
              <span>Исполнитель: {{ getUserName(story.assignee) }}</span>
              <span>Создано: {{ formatDate(story.createdAt) }}</span>
              <span v-if="story.endDate">Дедлайн: {{ formatDate(story.endDate) }}</span>
            </div>
            <div class="story-description" v-if="story.description">
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
import { generateId } from '@/utils/id';

export default {
  name: 'TasksView',
  components: { TaskItem, EditStoryModal },
  props: ['project'],
  data() {
    return {
      showStoryModal: false,
      editingStory: null,
      editingReleaseId: null,
      editingTaskPath: null,
      selectedReleaseId: null,
      selectedPriority: 'all',
      selectedUserId: 'all',
      selectedStatus: 'all',
      selectedDeadline: ''
    }
  },
  computed: {
    projectReleases() {
      return this.$store.getters['releases/projectReleases'](this.project.id)
    },
    selectedRelease() {
      return this.projectReleases.find(r => r.id === this.selectedReleaseId) || null
    },
    projectMembers() {
      if (!this.selectedRelease) return []
      const proj = this.$store.getters['projects/getProjectById'](this.project.id)
      return proj?.members || []
    }
  },
  methods: {
    // Получить истории с фильтрами
    getStories(activityId, taskId) {
      if (!this.selectedRelease) return []
      const act = this.selectedRelease.activitiesSnapshot.find(a => a.id === activityId)
      if (!act) return []
      const task = act.tasks.find(t => t.id === taskId)
      return task?.stories || []
    },
    // Фильтрация задач
    getFilteredTasks(activity) {
      return activity.tasks.filter(task => {
        const userOk = this.selectedUserId === 'all' || task.assignee === this.selectedUserId;
        const statusOk = this.selectedStatus === 'all' || task.status === this.selectedStatus;
        const deadlineOk = !this.selectedDeadline || (task.endDate && task.endDate <= this.selectedDeadline);
        const priorityOk = this.selectedPriority === 'all' || task.priority === this.selectedPriority;
        return userOk && statusOk && deadlineOk && priorityOk;
      });
    },
    // Фильтрация историй
    getFilteredStories(activityId, taskId) {
      return this.getStories(activityId, taskId).filter(story => {
        const userOk = this.selectedUserId === 'all' || story.assignee === this.selectedUserId;
        const statusOk = this.selectedStatus === 'all' || story.status === this.selectedStatus;
        const deadlineOk = !this.selectedDeadline || (story.endDate && story.endDate <= this.selectedDeadline);
        const priorityOk = this.selectedPriority === 'all' || story.priority === this.selectedPriority;
        return userOk && statusOk && deadlineOk && priorityOk;
      });
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString('ru-RU') : '—'
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
      if (!this.editingReleaseId) return
      if (updatedStory.id) {
        this.$store.commit('releases/UPDATE_STORY', {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory
        })
      } else {
        updatedStory.id = generateId()
        this.$store.commit('releases/ADD_STORY', {
          releaseId: this.editingReleaseId,
          taskPath: this.editingTaskPath,
          story: updatedStory
        })
      }
      this.closeStoryModal()
    },
    priorityIcon(priority) {
      const size = 16;
      const color = { low: "green", medium: "orange", high: "red" }[priority] || "gray";
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" />
        </svg>
      `;
    },
getFilteredStories(activityId, taskId) {
  const priorityOrder = { high: 1, medium: 2, low: 3 };

  return [...this.getStories(activityId, taskId)]
    .filter(story => {
      const userOk = this.selectedUserId === 'all' || story.assignee === this.selectedUserId;
      const statusOk = this.selectedStatus === 'all' || story.status === this.selectedStatus;
      const deadlineOk = !this.selectedDeadline || (story.endDate && story.endDate <= this.selectedDeadline);
      return userOk && statusOk && deadlineOk;
    })
    .sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));
},
  },
  mounted() {
    if (this.projectReleases.length) {
      this.selectedReleaseId = this.projectReleases[0].id
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
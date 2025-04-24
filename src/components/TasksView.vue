<template>
  <div class="tasks-view">
    <div style="display: flex;">
      <h2 style="margin-top: 0;">Все задачи проекта</h2>
    </div>
    <div class="tasks-list" v-if="project?.activities?.length">
      <div
        v-for="activity in project.activities"
        :key="activity.id"
        class="activity-tasks"
      >
        <h3 style="margin-top: 0;">{{ activity.title }}</h3>
        <TaskItem
          v-for="task in activity.tasks"
          :key="task.id"
          :task="task"
          :activityId="activity.id"
          @edit="$emit('edit', $event)"
        />
      </div>
    </div>
    <div v-else class="empty-state">
      Нет активностей
    </div>
  </div>
</template>

<script>
import TaskItem from '@/components/TaskItem.vue'

export default {
  data() {
    return {
      
    }
  },
  components: { TaskItem },
  props: ['project'],
  methods: {
    updateTask(updatedTask) {
    this.$store.commit('projects/UPDATE_TASK', {
      projectId: this.project.id,
      activityId: updatedTask.activityId, // Теперь есть activityId
      task: updatedTask
    })
  }
  },
  computed: {
    allTasks() {
      // Получаем projectId из текущего маршрута
      const projectId = Number(this.$route.params.id);
      // Правильный вызов геттера с передачей projectId
      return this.$store.getters['projects/allTasks'](projectId);
    },
  },
}
</script>

<style>
.tasks-view{
  width: 100%;
  padding: 20px 30px;
}
.activity-tasks{
  border: 3px dotted #3f3f3f;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 20px;
}
</style>
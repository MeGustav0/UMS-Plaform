<template>
  <div class="task-item">
    <div class="item" style="justify-content: space-between">
      <div class="task-header">
        <span>{{ task.title }}</span>
      </div>
      <div class="item">
        <div class="item">
          <span class="priority" v-html="priorityIcon(task.priority)"></span>
          <span class="status" :class="task.status">{{ statusLabel }}</span>
          <span>Исполнитель: {{ getUserName(task.assignee) }}</span>
          <span>Начало: {{ formatDate(task.startDate) }}</span>
          <span>Дедлайн: {{ formatDate(task.endDate) }}</span>
        </div>
        <div>
          <button @click="openEdit">✏️</button>
        </div>
      </div>
    </div>
    <div>
      <div class="task-description">
        {{ task.description || 'Нет описания' }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["task", "activityId"],
  methods: {
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString("ru-RU") : "—";
    },
    getUserName(userId) {
      const user = this.$store.state.auth.users.find(u => u.id === userId);
      return user?.name || "Не назначен";
    },
    openEdit() {
      this.$emit("edit", {
        type: "task",
        data: { ...this.task, activityId: this.activityId }
      });
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
  },
  computed: {
    statusLabel() {
      return {
        todo: "To Do",
        progress: "In Progress",
        done: "Done"
      }[this.task.status] || "Неизвестно";
    }
  }
};
</script>
  
<style scoped>
.task-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  margin: 5px 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.20);
}

.item{
  display: flex;
  gap: 30px;
  align-items:center;
}

.task-description {
  margin-top: 4px;
  font-size: 0.9em;
  color: #777;
}
.task-input {
  flex: 1;
  border: none;
  padding: 5px;
}
  
select {
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
  
.delete-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 8px;
}
  
.task-item.done {
  background: #f0fff0;
}
.status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8em;
}

.todo { background: #008ffb }
.progress { background: #00e396}
.done { background: #feb019; }
  </style>
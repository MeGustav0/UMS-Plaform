<template>
  <div class="task-item">
    <div class="item" style="justify-content: space-between">
      <div class="task-header">
        <span>{{ task.title }}</span>
      </div>
      <div class="item">
        <div class="item">
          <span class="status" :class="task.status">{{ statusLabel }}</span>
          <span>Исполнитель: {{ task.assignee || 'Не назначен' }}</span>
          <span>Начало: {{ formatDate(task.startDate) }}</span>
          <span>Дедлайн: {{ formatDate(task.endDate) }}</span>
        </div>
        <div >
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
  props: ['task', 'activityId'],
  computed: {
    statusLabel() {
      const labels = {
        todo: 'To Do',
        progress: 'In Progress',
        done: 'Done'
      }
      return labels[this.task.status]
    },
  },
  methods: {
    updateTask() {
      this.$emit('update', {
        ...this.task,
        activityId: this.activityId // Используем пропс вместо task.activityId
      })
    },
    formatDate(dateString) {
      if (!dateString) return 'Нет срока';
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    openEdit() {
      this.$emit('edit', {
        type: 'task',
        data: {
          ...this.task,
          activityId: this.activityId
        }
      });
    }
    
  },
  props: {
    task: {
      type: Object,
      required: true,
      validator: (task) => ['id', 'title', 'status'].every(key => key in task)
    },
    activityId: {
      type: [Number, String],
      required: true
    }
  }
}
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
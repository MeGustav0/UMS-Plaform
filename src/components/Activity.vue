<template>
    <div class="activity">
      <div class="activity-header">
        <div class="activity-top">
          <h4 style="margin: 0px;">{{ activity.title }}</h4>
          <div class="activity-actions">
            <button v-if="$store.getters['auth/canEditProject'](project)" @click="openEdit('activity')" class="edit-btn pink hover"><img class="img_edit" src="../assets/edit.svg" alt=""></button>
            <button @click="deleteActivity" class="delete-btn pink hover">✖</button>
          </div>
        </div>
        <!-- <div class="description pink">
          {{ activity.description || 'Нет описания' }}
        </div> -->
        <div class="description pink">
          <span>Ответственный: {{ activity.owner || 'Не назначен' }}</span>
        </div>
        <div class="meta">
          <span class="info pink">Создана: {{ formatDate(activity.startDate) }}</span>
          <span class="info pink">Дедлайн: {{ formatDate(activity.endDate) }}</span>
        </div>
      </div>
      <div 
        class="tasks"
        @drop="onDrop($event)"
        @dragover.prevent
      >
        <div
          v-for="task in activity.tasks"
          :key="task.id"
          class="task"
          draggable="true"
          @dragstart="startDrag($event, task)"
        >
          <div class="task-header">
            <div class="activity-top">
              <h4 style="margin: 0px;">{{ task.title }}</h4>
              <div class="activity-actions">
                <div class="task-status">
                  <select 
                    v-model="task.status" 
                    @change="updateTaskStatus(task)"
                    class="status-select"
                    :class="task.status"
                  >
                    <option value="todo">To Do</option>
                    <option value="progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <button @click="openTaskEdit(task)" class="edit-btn yellow hover_task"><img class="img_edit" src="../assets/edit.svg" alt=""></button>
                <button @click="deleteTask(task.id)" class="delete-btn yellow hover_task">✖</button>
              </div>
            </div>
            <!-- <div class="description yellow">{{ task.description || 'Нет описания' }}</div> -->
            <div class="description yellow">Исполнитель: {{ task.assignee || 'Не назначен' }}</div>
            <div class="description yellow">Начало: {{ formatDate(task.startDate) }}</div>
            <div class="description yellow">Дедлайн: {{ formatDate(task.endDate) }}</div>
          </div>
        </div>
        <button @click="addTask" class="add-task">+ Задача</button>
        <TaskItem 
          :task="task"
          :activityId="activity.id"
          @edit="$emit('edit', $event)"
        />
      </div>
    </div>
  </template>
  
<script>
export default {
  props: ['activity', 'projectId'],
  methods: {
    addTask() {
      const newTask = {
        id: Date.now(),
        title: 'Новая задача',
        description: '', // Добавляем
        assignee: '', // Добавляем
        status: 'todo',
        startDate: new Date().toISOString(), // Добавляем
        endDate: null, // Добавляем
        activityId: this.activity.id
      };
      this.$store.commit('projects/ADD_TASK', {
        projectId: this.projectId,
        activityId: this.activity.id,
        task: newTask
      });
    },
    deleteTask(taskId) {
      this.$store.commit('projects/DELETE_TASK', {
        projectId: this.projectId,
        activityId: this.activity.id,
        taskId
      })
    },
    startDrag(evt, task) {
      evt.dataTransfer.setData('task', JSON.stringify({
        taskId: task.id,
        activityId: this.activity.id
      }));
    },
    onDrop(evt) {
      const data = JSON.parse(evt.dataTransfer.getData('task'));
      this.$store.commit('projects/MOVE_TASK', {
        taskId: data.taskId,
        fromActivityId: data.activityId,
        toActivityId: this.activity.id
      });
    },
    openEdit(type) {
      this.$emit('edit', {
        type,
        data: this.activity
      })
    },
    getOwnerName(ownerId) {
      const users = this.$store.state.auth.users // Получаем список пользователей
      const user = users.find(u => u.id === ownerId)
      return user ? user.name : 'Не назначен'
    },
    formatDate(dateString) {
      if (!dateString) return 'Не установлен';
      const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString('ru-RU', options);
    },
    openTaskEdit(task) {
      this.$emit('edit', {
        type: 'task',
        data: {
          ...task,
          activityId: this.activity.id
        }
      });
    },
    deleteActivity() {
      if (confirm('Удалить активность и все её задачи?')) {
        this.$emit('delete', this.activity.id)
      }
    },
    updateTaskStatus(task) {
      this.$store.commit('projects/UPDATE_TASK', {
        projectId: this.projectId,
        activityId: this.activity.id,
        task: {
          ...task,
          status: task.status
        }
      });
    }
  }
}
</script>
  
<style scoped>

.tasks {
  display: flex;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 1rem 0rem;
  border-radius: 6px;
}

.task:hover {
  transform: translateY(-2px);
  box-shadow: -3px 4px 1px 2px rgba(34, 60, 80, 0.2);
}

/* Адаптивность */
@media (max-width: 768px) {
  .activity {
    resize: vertical; /* Только вертикальное изменение на мобильных */
    max-width: 100%;
    margin: 1rem 0;
  }
  
  .task {
    max-width: 100%;
    resize: none;
  }
}

.activity {
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
  border-style: dotted;
  border-color: #3f3f3f;
  resize: horizontal;
  overflow: auto; 
  padding: 1rem;
  min-width: 280px;
  color: #3f3f3f;
  font-size: 0.8em;
}

.activity-top{
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-header{
  background-color: #ff5d98e6;
  padding: 10px;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

.meta{
  color: inherit;
  margin-top: 8px;
  gap: 10px;
  display: flex
;
}

.info{
  padding: 4px;
}

.task {
  padding: 0.5rem;
  cursor: move;
  resize: horizontal;
  overflow: auto;
  background-color:#fde549;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

.task-header{
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}

.description {
  margin-top: 8px;
  padding: 4px;
}

.add-task {
  width: 100%;
  height: 3rem;
  font-weight: 600;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 0;
  cursor: pointer;
  transition: background 0.2s;
}
.add-task:hover{
  background: #c5c4c475;
}
.edit-btn {
  padding: 4px 5px 1px 4px;
  transition: background 0.2s;
}

.delete-btn {
  padding: 1px 6.5px 1px 5.5px;
  transition: background 0.2s;
}

.hover:hover{
  background: #fb93ba;
}

.hover_task:hover{
  background: #ffffff75;
}

.pink{
  box-shadow: 0px 0px 5px 2px #ff83b1e1;
  border: 0;
  background-color:#ff83b1;
}

.yellow{
  box-shadow: 0px 0px 5px 2px #feec7586;
  border: 0;
  background-color:#feeb75;
}

.activity-actions {
  display: flex;
  gap: 8px;
}

.img_edit{
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
  margin-left: 10px;
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
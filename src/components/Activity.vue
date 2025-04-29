<template>
  <div class="activity">
    <div class="activity-header">
      <div class="activity-top">
        <div
          class="description pink"
          style="margin: 0px; border-radius: 6px; padding: 4px 8px; font-size: 1.17em; font-weight: 600;"
        >
          {{ activity.title }}
        </div>
        <div class="activity-actions">
          <button @click="openEdit('activity')" class="edit-btn pink hover">
            <img class="img_edit" src="../assets/edit.svg" alt="" />
          </button>
          <button @click="deleteActivity" class="delete-btn pink hover">
            ✖
          </button>
        </div>
      </div>
      <div class="meta">
        <span class="description pink"
          ><img class="img_edit" src="../assets/user.svg" alt="" />:
          {{ getUserName(activity.owner) }}</span
        >
      </div>
      <div class="meta">
        <!-- <span class="info pink">: {{ formatDate(activity.startDate) }}</span> -->
        <span class="description pink"
          ><img class="img_edit" src="../assets/deadline.svg" alt="" />:
          {{ formatDate(activity.endDate) }}</span
        >
      </div>
    </div>
    <div class="tasks" @drop="onDrop($event)" @dragover.prevent>
      <div
        v-for="task in activity.tasks"
        :key="task.id"
        class="task"
        draggable="true"
        @dragstart="startDrag($event, task)"
      >
        <div class="task-header">
          <div class="activity-top">
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
            <div class="activity-actions">
              <div
                class="priority-button-wrapper yellow"
                @click.stop="togglePriorityMenu(task)"
              >
                <button
                  class="priority-button"
                  v-html="priorityIcon(task.priority)"
                ></button>

                <div v-if="task.showPriorityMenu" class="priority-menu">
                  <div @click="changePriority(task, 'low')">
                    <span v-html="priorityIcon('low')"></span>
                  </div>
                  <div @click="changePriority(task, 'medium')">
                    <span v-html="priorityIcon('medium')"></span>
                  </div>
                  <div @click="changePriority(task, 'high')">
                    <span v-html="priorityIcon('high')"></span>
                  </div>
                </div>
              </div>
              <button
                @click="openTaskEdit(task)"
                class="edit-btn yellow hover_task"
              >
                <img class="img_edit" src="../assets/edit.svg" alt="" />
              </button>
              <button
                @click="deleteTask(task.id)"
                class="delete-btn yellow hover_task"
              >
                ✖
              </button>
            </div>
          </div>
          <h3 style="margin-bottom: 0" class="description yellow">
            {{ task.title }}
          </h3>
          <!-- <div class="description yellow">{{ task.description || 'Нет описания' }}</div> -->
          <div class="description yellow">
            <img class="img_edit" src="../assets/user.svg" alt="" />:
            {{ getUserName(task.assignee) }}
          </div>
          <!-- <div class="description yellow">Начало: {{ formatDate(task.startDate) }}</div> -->
          <div class="description yellow">
            <img class="img_edit" src="../assets/deadline.svg" alt="" />:
            {{ formatDate(task.endDate) }}
          </div>
        </div>
      </div>
      <button @click="addTask" class="add-task">+ Задача</button>
    </div>
  </div>
</template>

<script>
import { generateId } from "@/utils/id";

export default {
  props: ["activity", "projectId"],
  computed: {
    users() {
      return this.$store.getters["auth/getAllUsers"] || [];
    },
  },
  methods: {
    addTask() {
      const newTask = {
        id: generateId(),
        title: "Новая задача",
        description: "",
        assignee: "",
        priority: "medium",
        status: "todo",
        startDate: new Date().toISOString(),
        endDate: null,
        activityId: this.activity.id,
      };
      this.$store.commit("projects/ADD_TASK", {
        projectId: this.projectId,
        activityId: this.activity.id,
        task: newTask,
      });
    },
    deleteTask(taskId) {
      this.$store.commit("projects/DELETE_TASK", {
        projectId: this.projectId,
        activityId: this.activity.id,
        taskId,
      });
    },
    startDrag(evt, task) {
      evt.dataTransfer.setData(
        "task",
        JSON.stringify({
          taskId: task.id,
          activityId: this.activity.id,
        })
      );
    },
    onDrop(evt) {
      const data = JSON.parse(evt.dataTransfer.getData("task"));
      this.$store.commit("projects/MOVE_TASK", {
        taskId: data.taskId,
        fromActivityId: data.activityId,
        toActivityId: this.activity.id,
      });
    },
    openEdit(type) {
      this.$emit("edit", {
        type,
        data: this.activity,
      });
    },
    getOwnerName(ownerId) {
      const users = this.$store.state.auth.users;
      const user = users.find((u) => u.id === ownerId);
      return user ? user.name : "—";
    },
    formatDate(dateString) {
      if (!dateString) return "—";
      const options = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      return new Date(dateString).toLocaleDateString("ru-RU", options);
    },
    openTaskEdit(task) {
      this.$emit("edit", {
        type: "task",
        data: {
          ...task,
          activityId: this.activity.id,
        },
      });
    },
    deleteActivity() {
      if (confirm("Удалить активность и все её задачи?")) {
        this.$emit("delete", this.activity.id);
      }
    },
    updateTaskStatus(task) {
      const updatedTask = { ...task };

      if (updatedTask.status === "done") {
        updatedTask.closedAt = new Date().toISOString();
      } else {
        updatedTask.closedAt = null;
      }

      this.$store.commit("projects/UPDATE_TASK", {
        projectId: this.projectId,
        activityId: this.activity.id,
        task: updatedTask,
      });
    },
    getUserName(userId) {
      if (!userId) return "—";
      const user = this.$store.state.auth.users.find((u) => u.id == userId);
      return user?.name || "—";
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
    togglePriorityMenu(task) {
      // Показать/скрыть меню для конкретной задачи
      task.showPriorityMenu = !task.showPriorityMenu;
    },
    changePriority(task, newPriority) {
      task.priority = newPriority;

      this.$store.commit("projects/UPDATE_TASK", {
        projectId: this.projectId,
        activityId: this.activity.id,
        task: { ...task },
      });
      task.showPriorityMenu = false;
    },
  },
};
</script>

<style scoped>
.tasks {
  display: flex;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  /* flex-wrap: wrap; */
  gap: 1.5rem;
  margin-top: 1rem;
  border-radius: 6px;
}

.task:hover {
  transform: translateY(-2px);
  box-shadow: -3px 4px 1px 2px rgba(34, 60, 80, 0.2);
}

/* Адаптивность */
@media (max-width: 768px) {
  .activity {
    resize: vertical;
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
  padding: 16px 16px 16px 16px;
  /* resize: horizontal;
  overflow: auto;  */
  /* color: #3f3f3f; */
  font-size: 0.8em;
}

.activity-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-header {
  background-color: #ff5d98e6;
  min-width: 290px;
  padding: 10px;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

.meta {
  color: inherit;
  margin-top: 8px;
  gap: 10px;
}

.info {
  padding: 4px;
}

.task {
  padding: 0.5rem;
  cursor: move;
  /* resize: horizontal;
  overflow: auto; */
  background-color: #fde549;
  min-width: 200px;
  box-shadow: -3px 4px 1px 0px rgba(34, 60, 80, 0.2);
}

.task-header {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}

.description {
  display: flex;
  margin-top: 8px;
  padding: 4px;
}

.add-task {
  font-weight: 600;
  width: 100%;
  height: 136px;
  border: 0;
  opacity: 0.05;
  cursor: pointer;
  transition: all 0.2s;
}
.add-task:hover {
  background: #c5c4c475;
  opacity: 1;
}
.edit-btn {
  padding: 4px 5px 1px 4px;
  transition: background 0.2s;
}

.delete-btn {
  padding: 1px 6.5px 1px 5.5px;
  transition: background 0.2s;
}

.hover:hover {
  background: #fb93ba;
}

.hover_task:hover {
  background: #ffffff75;
}

.pink {
  box-shadow: 0px 0px 5px 2px #ff83b1e1;
  border: 0;
  background-color: #ff83b1;
}

.yellow {
  box-shadow: 0px 0px 5px 2px #feec7586;
  border: 0;
  background-color: #feeb75;
}

.activity-actions {
  display: flex;
  gap: 8px;
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
  padding: 4px 5px 1px 4px;
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
  background: #fff7c6;
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

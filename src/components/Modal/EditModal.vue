<template>
  <div class="modal-overlay" @click.self="$emit('close')" tabindex="-1">
    <div class="modal">
      <h3>{{ local.id ? "Редактировать" : "Создать" }} {{ title }}</h3>

      <!-- Название -->
      <div class="form-group">
        <label>Название</label>
        <input v-model="local.title" required />
      </div>

      <!-- Статус -->
      <div v-if="type === 'task'" class="form-group">
        <label>Статус</label>
        <select v-model="local.status">
          <option value="todo">To Do</option>
          <option value="progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div class="form-group" v-if="type === 'task'">
        <label>Приоритет</label>
        <select v-model="local.priority">
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
      </div>

      <!-- Исполнитель / Ответственный -->
      <div v-if="canChooseResponsible" class="form-group">
        <label>{{ responsibleLabel }}</label>
        <select v-model="responsibleField">
          <option value="">—</option>
          <option
            v-for="member in projectMembers"
            :key="member.userId"
            :value="member.userId"
          >
            {{ getUserName(member.userId) }}
          </option>
        </select>
      </div>
      <div class="form-group" v-if="type === 'task'">
        <label>Дата закрытия</label>
        <input type="text" :value="formatDate(local.closedAt)" disabled />
      </div>
      <!-- Дедлайн -->
      <div class="form-group">
        <label>Дедлайн</label>
        <input type="date" v-model="local.endDate" />
      </div>

      <!-- Описание -->
      <div class="form-group">
        <label>Описание</label>
        <textarea v-model="local.description" rows="4" />
      </div>

      <div class="modal-actions">
        <button type="button" @click="$emit('close')">Отмена</button>
        <button type="submit" @click="save">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: { type: Object, required: true },
    type: { type: String, required: true }, 
    projectMembers: { type: Array, default: () => [] },
  },

  data() {
    return {
      local: this.prepareLocal(this.data),
    };
  },

  watch: {
    data: {
      deep: true,
      immediate: true,
      handler(newData) {
        this.local = this.prepareLocal(newData);
      },
    },
  },

  computed: {
    title() {
      return { task: "задачу", activity: "активность" }[this.type] || "";
    },

    canChooseResponsible() {
      return this.type === "task" || this.type === "activity";
    },

    responsibleLabel() {
      return this.type === "task" ? "Исполнитель" : "Ответственный";
    },

    responsibleField: {
      get() {
        return this.type === "task" ? this.local.assignee : this.local.owner;
      },
      set(value) {
        if (this.type === "task") {
          this.local.assignee = value;
        } else if (this.type === "activity") {
          this.local.owner = value;
        }
      },
    },
  },

  methods: {
    prepareLocal(data) {
      const copy = JSON.parse(JSON.stringify(data || {}));
      if (this.type === "task" && typeof copy.assignee === "undefined") {
        copy.assignee = "";
      }
      if (this.type === "activity" && typeof copy.owner === "undefined") {
        copy.owner = "";
      }
      if (this.type === "task" && typeof copy.status === "undefined") {
        copy.status = "todo";
      }
      return copy;
    },
    getUserName(userId) {
      const user = this.$store.getters["users/getUserById"](userId);
      return user?.name || "Неизвестный";
    },
    save() {
      this.$emit("save", { ...this.local });
    },
    formatDate(date) {
      return date ? new Date(date).toLocaleDateString("ru-RU") : "—";
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 100;
}

.modal {
  background: #f8f7f7;
  border-radius: 12px;
  padding: 30px;
  margin-top: 15vh;
  width: 90%;
  max-width: 500px;
  box-shadow: 0px 7px 20px 0px rgba(34, 60, 80, 0.2);
}

.modal h3 {
  color: #2c3e50;
  margin: 0 0 25px 0;
  font-size: 1.4rem;
}

.form-group {
  margin-bottom: 20px;
  display: flex;
}

.form-group label {
  display: block;
  color: #7f8c8d;
  font-weight: 500;
}

label {
  display: block;
  margin-bottom: 8px;
  align-self: center;
  color: #7f8c8d;
  font-weight: 500;
  width: 50%;
  margin: 0;
  font-size: 1.1rem;
}

input,
textarea,
select {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-actions {
  display: flex;
  gap: 35px;
  margin-top: 25px;
}

.modal-actions button {
  flex: 1;
  padding: 12px 25px;
  border-radius: 6px;
  border: 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.2s;
}

.modal-actions button[type="button"] {
  background: #e74c3c;
  color: white;
}

.modal-actions button[type="submit"] {
  background: #2ecc71;
  color: white;
}

.modal-actions button[type="button"]:hover {
  background: #f8301a;
}

.modal-actions button[type="submit"]:hover {
  background: #23ec77;
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
  padding: 10px;
  margin-left: -5px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
</style>

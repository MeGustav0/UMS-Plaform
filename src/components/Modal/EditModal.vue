<template>
  <div class="modal-overlay">
    <div class="edit-modal">
      <h3>{{ title }}</h3>
      
      <form @submit.prevent="save">
        <div class="form-group">
          <label>Название:</label>
          <input v-model="localData.title" required>
        </div>
  
        <div class="form-group">
            <label>Описание:</label>
            <textarea v-model="localData.description" rows="3"></textarea>
        </div>
         <!-- Для активности -->
        <div v-if="type === 'activity'">
            <div class="form-group">
            <label>Ответственный:</label>
            <input v-model="localData.owner" placeholder="Введите имя">
            </div>
        </div>
        <!-- Для задач -->
        <div v-if="type === 'task'">
          <div class="form-group">
            <label>Статус:</label>
            <select class="status-select" v-model="localData.status">
              <option value="todo">To Do</option>
              <option value="progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
  
            <div class="form-group">
                <label>Исполнитель:</label>
                <input v-model="localData.assignee" placeholder="Введите имя">
            </div>
        </div>
  
        <div class="form-group">
          <label>Дата окончания:</label>
          <input 
            type="date" 
            v-model="localData.endDate"
            :min="localData.startDate"
          >
        </div>
  
        <div class="modal-actions">
          <button type="button" @click="$emit('close')">Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>
  
  <script>
  export default {
    props: ['data', 'type', 'users'],
    data() {
      return {
        localData: {...this.data}
      }
    },
    computed: {
      title() {
        return this.type === 'activity' 
          ? 'Редактирование активности' 
          : 'Редактирование задачи'
      }
    },
    methods: {
      save() {
        this.$emit('save', this.localData)
        this.$emit('close')
      },
      validateDates() {
        if (new Date(this.localData.endDate) < new Date(this.localData.startDate)) {
        this.error = 'Дата окончания не может быть раньше начала'
        return false
        }
        return true
    },
    }
  }
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

.edit-modal {
  background: #f8f7f7;
  border-radius: 12px;
  padding: 30px;
  margin-top: 15vh;
  width: 90%;
  max-width: 500px;
  box-shadow: 0px 7px 20px 0px rgba(34, 60, 80, 0.2);
}

.edit-modal h3 {
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

input, textarea {
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
  border: 2px solid #5c5f5f;
  cursor: pointer;
  font-weight: 600;
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

.todo { background: #008ffb }
.progress { background: #00e396}
.done { background: #feb019; }

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
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
}
</style>
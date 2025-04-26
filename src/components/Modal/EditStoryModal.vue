<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>{{ story.id ? 'Редактировать историю' : 'Новая история' }}</h3>
      <form @submit.prevent="saveStory">
        <div class="form-group">
          <label>Название</label>
          <input v-model="localStory.title" required />
        </div>

        <div class="form-group">
          <label>Статус</label>
          <select v-model="localStory.status" required>
            <option value="todo">To Do</option>
            <option value="progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div class="form-group">
          <label>Исполнитель:</label>
          <select v-model="localStory.assignee">
            <option disabled value="">-- выберите --</option>
            <option 
              v-for="member in projectMembers" 
              :key="member.userId" 
              :value="member.userId"
            >
              {{ getUserName(member.userId) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="localStory.description" rows="3" />
        </div>

        <div class="form-group">
          <label>Дедлайн</label>
          <input type="date" v-model="localStory.endDate" />
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
  props: ['story', 'projectMembers'],
  data() {
    return {
      localStory: { ...this.story }
    };
  },
  methods: {
    saveStory() {
      this.$emit('save', this.localStory);
      this.$emit('close');
    },
    getUserName(userId) {
      const user = this.$store.state.auth.users.find(u => u.id === userId);
      return user?.name || 'Неизвестный';
    }
  },
  
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

.modal {
  background: #f8f7f7;
  border-radius: 12px;
  padding: 30px;
  margin-top: 10vh;
  width: 30%;
  max-width: 600px;
  box-shadow: 0px 7px 20px 0px rgba(34, 60, 80, 0.2);
  color: #2c3e50;
}

.form-group {
  display: flex;
  margin-bottom: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  margin-top: 0;
}

label {
  display: block;
  align-self: center;
  margin-bottom: 8px;
  color: #7f8c8d;
  font-weight: 500;
  width: 50%;
  margin: 0;
  font-size: 1.1rem;
}

input,
textarea {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

textarea {
  height: 80px;
  resize: vertical;
}

.user-list {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  padding: 4px;
  padding-left: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-item select {
  margin-left: auto;
  padding: 6px 12px;
  border-radius: 4px;
  border: 0;
  background: #f4f4f4;
}
.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
}
.access-warning {
  color: #e74c3c;
  padding: 15px;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  margin-top: 20px;
  text-align: center;
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
</style>

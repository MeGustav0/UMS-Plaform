<template>
    <div v-if="canEdit">
    <div class="modal-overlay">
      <div class="modal">
        <div>
          <h2>Редактирование проекта</h2>
          <div v-if="$store.getters['auth/isAdmin']" class="footer">
            <button v-if="$store.getters['auth/canDeleteProject']" @click="deleteProject" class="delete-btn">
              Удалить проект
            </button>
          </div>
        </div>
        <form @submit.prevent="save">
          <div class="form-group">
            <label>Название:</label>
            <input v-model="localProject.name" :disabled="!isAdmin">
          </div>

          <div class="form-group">
            <label>Организация:</label>
            <input 
              v-model="localProject.organization" 
              :disabled="!isAdmin"
            >
          </div>

          <div class="form-group">
            <label>Описание:</label>
            <textarea 
              v-model="localProject.description" 
              :disabled="!isAdmin"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Дедлайн:</label>
            <input 
              type="date" 
              v-model="localProject.endDate" 
              :min="localProject.startDate"
              :disabled="!isAdmin"
            >
          </div>
  
          <div class="form-group">
            <label>Добавить участника:</label>
            <input 
              v-model="newMemberEmail"
              placeholder="Добавить по email"
              @keyup.enter="addMember"
            >
          </div>
          <div class="user-list">
            <h2>Участники:</h2>
            <div 
              v-for="user in localProject.members" 
              :key="user.id"
              class="user-item"
            >
              <span>{{ user.name }}</span>
              <select 
                v-model="user.role" 
                :disabled="!isAdmin"
              >
                <option value="member">Участник</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
  
          <div class="modal-actions">
            <button type="button" @click="$emit('close')">Закрыть</button>
            <button type="submit" v-if="isAdmin">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <div v-else>
    <p>У вас нет прав для редактирования этого проекта</p>
  </div>
</template>
  
<script>
export default {
  props: ['project'],
  data() {
    return {
      localProject: {...this.project},
      isAdmin: this.$store.state.auth.user?.role === 'admin'
    }
  },
  computed: {
    canEdit() {
        const user = this.$store.state.auth.user
        return user.role === 'admin' || 
        this.project.managers.includes(user.id)
    },
    canDelete() {
      return this.$store.getters["auth/isAdmin"];
    }
  },
  methods: {
    save() {
        this.$emit('save', this.localProject)
        this.$emit('close')
    },
    addUserToProject(userId, role) {
        const project = this.project
        if (role === 'manager') {
            project.managers = [...new Set([...project.managers, userId])]
        } else {
            project.members = [...new Set([...project.members, userId])]
        }
        this.$store.commit('projects/UPDATE_PROJECT', project)
    },
    addMember() {
      const user = this.$store.state.auth.users.find(u => 
        u.email === this.newMemberEmail.trim()
      )
      if (user) {
        this.localProject.members.push({
          id: user.id,
          email: user.email,
          role: 'member'
        })
      }
    },
    deleteProject() {
      this.$store.dispatch('projects/deleteProject', this.project.id)
        .then(() => {
          this.$router.push('/');
        })
        .catch(err => {
          console.error('Ошибка удаления:', err);
      });
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

.modal {
  background: #f8f7f7;
  border-radius: 12px;
  padding: 30px;
  margin-top: 10vh;
  width: 90%;
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

input, textarea {
  width: 100%;
  border: 0;
  display: flex;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
  margin-top: 20px;
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
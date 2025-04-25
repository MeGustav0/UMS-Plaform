<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="form-group" style="align-items: center; justify-content: space-between;">
        <h2 style="margin: 0;">Редактирование проекта</h2>
        <button 
            v-if="canDelete"
            type="button" 
            @click="deleteProject"
            class="delete-btn"
          >
            Удалить проект
          </button>
      </div>
      <form @submit.prevent="save">
        <!-- Основная информация -->
        <div class="form-group">
          <label>Название:</label>
          <input v-model="localProject.name" required>
        </div>

        <div class="form-group">
          <label>Описание:</label>
          <textarea v-model="localProject.description"></textarea>
        </div>

        <!-- Управление участниками -->
        <div class="members-section">
          <h4>Участники проекта</h4>

          <!-- Выбор из членов организации -->
          <div class="members-selector">
            <div 
              v-for="member in orgMembers"
              :key="member.userId"
              class="member-item"
            >
              <label>
                <input
                  type="checkbox"
                  :value="member.userId"
                  v-model="selectedMembers"
                >
                {{ getUserName(member.userId) }}
              </label>
              <select v-model="memberRoles[member.userId]">
                <option value="admin">Админ</option>
                <option value="manager">Менеджер</option>
                <option value="member">Исполнитель</option>
              </select>
            </div>
            <button 
              type="button" 
              @click="addMembers"
              class="add-btn"
            >
              Добавить выбранных
            </button>
          </div>

          <!-- Текущие участники -->
          <div class="current-members">
            <div
              v-for="member in localProject.members"
              :key="member.userId"
              class="member-row"
            >
              <span>{{ getUserName(member.userId) }}</span>
              <div class="role-actions">
                <span class="role-badge">{{ member.role }}</span>
                <button 
                  v-if="canEdit"
                  @click="removeMember(member.userId)"
                  class="remove-btn"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопки управления -->
        <div class="modal-actions">
          <button 
            type="button"
            @click="$emit('close')"
            class="cancel-btn"
          >
            Отмена
          </button>
          <button 
            type="submit"
            class="save-btn"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: ['project'],
  data() {
    return {
      localProject: {
        ...this.project,
        members: this.project.members || []
      },
      selectedMembers: [],
      memberRoles: {}
    }
  },
  computed: {
    // Получаем участников организации
    orgMembers() {
      if (!this.localProject.orgId) return [];
      const org = this.$store.state.organizations.organizations.find(
        o => o.id === this.localProject.orgId
      );
      return org?.members || [];
    },

    // Проверка прав на редактирование
    canEdit() {
      if (!this.$store.state.auth.user) return false;
      const userRole = this.$store.getters['organizations/getUserRole'](
        this.localProject.orgId,
        this.$store.state.auth.user.id
      );
      return ['admin', 'manager'].includes(userRole);
    },

    // Проверка прав на удаление
    canDelete() {
      return (
        this.localProject.creatorId === this.$store.state.auth.user?.id ||
        this.canEdit
      );
    }
  },
  methods: {
    // Добавление выбранных участников
    addMembers() {
      this.selectedMembers.forEach(userId => {
        const exists = this.localProject.members.some(m => m.userId === userId);
        if (!exists) {
          this.localProject.members.push({
            userId,
            role: this.memberRoles[userId] || 'member'
          });
        }
      });
      this.selectedMembers = [];
    },

    // Удаление участника
    removeMember(userId) {
      this.localProject.members = this.localProject.members.filter(
        m => m.userId !== userId
      );
    },

    // Сохранение изменений
    save() {
      this.$store.commit('projects/UPDATE_PROJECT', this.localProject);
      this.$emit('close');
    },

    // Удаление проекта
    deleteProject() {
      if (confirm('Удалить проект?')) {
        this.$store.commit('projects/DELETE_PROJECT', this.localProject.id);
        this.$emit('close');
        this.$router.push('/');
      }
    },

    // Получение имени пользователя
    getUserName(userId) {
      const user = this.$store.state.auth.users.find(u => u.id === userId);
      return user?.name || 'Неизвестный';
    }
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
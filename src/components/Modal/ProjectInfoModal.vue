<template>
  <div class="modal-overlay">
    <div class="modal">
      <div
        class="form-group"
        style="align-items: center; justify-content: space-between"
      >
        <h2 style="margin: 0">Редактирование проекта</h2>
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
          <input v-model="localProject.name" required />
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
                />
                {{ getUserName(member.userId) }}
              </label>
              <select v-model="memberRoles[member.userId]">
                <option value="admin">Админ</option>
                <option value="manager">Менеджер</option>
                <option value="member">Исполнитель</option>
              </select>
            </div>
            <button type="button" @click="addMembers" class="add-btn">
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
          <button type="button" @click="$emit('close')" class="cancel-btn">
            Отмена
          </button>
          <button type="submit" class="save-btn">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: ["project"],
  data() {
    return {
      localProject: {
        ...this.project,
        members: this.project.members || [],
      },
      selectedMembers: [],
      memberRoles: {},
    };
  },
  computed: {
    // Получаем участников организации
    orgMembers() {
      if (!this.localProject.orgId) return [];
      const org = this.$store.state.organizations.organizations.find(
        (o) => o.id === this.localProject.orgId
      );
      return org?.members || [];
    },

    // Проверка прав на редактирование
    canEdit() {
      if (!this.$store.state.auth.user) return false;
      const userRole = this.$store.getters["organizations/getUserRole"](
        this.localProject.orgId,
        this.$store.state.auth.user.id
      );
      return ["admin", "manager"].includes(userRole);
    },

    // Проверка прав на удаление
    canDelete() {
      return (
        this.localProject.creatorId === this.$store.state.auth.user?.id ||
        this.canEdit
      );
    },
  },
  methods: {
    // Добавление выбранных участников
    addMembers() {
      this.selectedMembers.forEach((userId) => {
        const exists = this.localProject.members.some(
          (m) => m.userId === userId
        );
        if (!exists) {
          this.localProject.members.push({
            userId,
            role: this.memberRoles[userId] || "member",
          });
        }
      });
      this.selectedMembers = [];
    },

    // Удаление участника
    removeMember(userId) {
      this.localProject.members = this.localProject.members.filter(
        (m) => m.userId !== userId
      );
    },

    // Сохранение изменений
    save() {
      this.$store.commit("projects/UPDATE_PROJECT", this.localProject);
      this.$emit("close");
    },

    // Удаление проекта
    deleteProject() {
      if (confirm("Удалить проект?")) {
        this.$store.commit("projects/DELETE_PROJECT", this.localProject.id);
        this.$emit("close");
        this.$router.push("/");
      }
    },

    // Получение имени пользователя
    getUserName(userId) {
      const user = this.$store.state.auth.users.find((u) => u.id === userId);
      return user?.name || "Неизвестный";
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

.members-section {
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

h4 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.members-selector {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid #edf2f7;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4299e1;
}

select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #cbd5e0;
  background: white;
  font-size: 0.9rem;
}

.add-btn {
  margin-top: 1rem;
  background: #4299e1;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #3182ce;
}

.current-members {
  margin-top: 1rem;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f7fafc;
  margin-bottom: 0.5rem;
  border-radius: 6px;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  background: #48bb78;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.role-badge[value="admin"] { background: #4299e1; }
.role-badge[value="manager"] { background: #f6ad55; }

.remove-btn {
  background: none;
  border: none;
  color: #e53e3e;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
}

.remove-btn:hover {
  color: #c53030;
}

/* Адаптивность */
@media (max-width: 480px) {
  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  select {
    width: 100%;
  }
  
  .member-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .role-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

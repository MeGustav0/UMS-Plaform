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
          <h4 style="margin: 10px 0px">Участники проекта</h4>
          <!-- Выбор из членов организации -->

          <div class="add-member-controls">
            <select v-model="selectedUserId" class="member-add">
              <option disabled value="">-- Выберите пользователя --</option>
              <option
                v-for="member in availableOrgMembers"
                :key="member.userId"
                :value="member.userId"
              >
                {{ getUserName(member.userId) }}
              </option>
            </select>

            <select v-model="selectedRole" class="role-add">
              <option value="admin">Админ</option>
              <option value="manager">Менеджер</option>
              <option value="member">Исполнитель</option>
            </select>

            <button type="button" @click="addMember" class="add-btn">
              Добавить
            </button>
          </div>

          <!-- Текущие участники -->
          <div class="member-row" style="margin-top: 15px; font-weight: 600">
            <div class="member-info">
              <div style="width: 150px">Имя:</div>
              <div>Почта:</div>
            </div>
            <div class="role-actions">
              <span style="padding-right: 43px">Роль:</span>
            </div>
          </div>
          <div class="current-members">
            <div
              v-for="member in localProject.members"
              :key="member.userId"
              class="member-row"
            >
              <div class="member-info">
                <div style="width: 150px">{{ getUserName(member.userId) }}</div>
                <div class="member-email">
                  {{ getUserEmail(member.userId) }}
                </div>
              </div>
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
      selectedUserId: "",
      selectedRole: "member",
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

    availableOrgMembers() {
      return this.orgMembers.filter(
        (member) =>
          !this.localProject.members.some((m) => m.userId === member.userId)
      );
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
    addMember() {
      if (!this.selectedUserId) {
        alert("Пожалуйста, выберите пользователя!");
        return;
      }
      const exists = this.localProject.members.some(
        (m) => m.userId === this.selectedUserId
      );
      if (exists) {
        alert("Этот пользователь уже добавлен в проект!");
        return;
      }
      this.localProject.members.push({
        userId: this.selectedUserId,
        role: this.selectedRole || "member",
      });

      // Сбросить выбор
      this.selectedUserId = "";
      this.selectedRole = "member";
    },
    getUserEmail(userId) {
      const user = this.$store.state.auth.users.find((u) => u.id === userId);
      return user?.email || "Нет почты";
    },
    // Удаление участника
    removeMember(userId) {
      if (this.isMemberUsed(userId)) {
        alert(
          "Нельзя удалить участника, который закреплен за задачами или историями!"
        );
        return;
      }
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
    isMemberUsed(userId) {
      const project = this.$store.getters["projects/getProjectById"](
        this.localProject.id
      );
      if (!project) return false;

      for (const activity of project.activities || []) {
        if (activity.owner === userId) return true;
        for (const task of activity.tasks || []) {
          if (task.assignee === userId) return true;
          for (const story of task.stories || []) {
            if (story.assignee === userId) return true;
          }
        }
      }

      return false;
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
  width: 40%;
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
  height: 50px;
  resize: vertical;
}

.delete-btn {
  border: none;
  background: #f52912d5;
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  height: 32px;
  transition: all 0.3s;
  border-radius: 5px;
  padding: 0 10px;
}

.delete-btn:hover {
  color: white;
  background: #f52812;
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

.members-section {
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  max-height: 400px;
  overflow-y: auto;
}

h4 {
  color: #2d3748;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid #e2e8f0;
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
  accent-color: #3498db;
}

select {
  padding: 0.4rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 0;
  border-right: 0;
  border-top:0;
  background: white;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.add-member-controls {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
}

.member-add {
  border-right: 0;
  border-left: 0;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}
.role-add {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}
.add-btn {
  background: #4299e1;
  color: white;
  font-weight: 600;
  padding: 0.45rem 1rem;
  margin-left: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #3182ce;
}

.current-members {
  max-height: 200px;
  overflow-y: auto;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e2e8f0;
}

.member-info {
  display: flex;
}

.member-email {
  color: #777;
}

.role-actions {
  display: flex;
  align-items: center;
}

.role-badge {
  background: #48bb78;
  color: white;
  width: 55px;
  text-align: center;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.role-badge[value="admin"] {
  background: #4299e1;
}
.role-badge[value="manager"] {
  background: #f6ad55;
}

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
}
</style>

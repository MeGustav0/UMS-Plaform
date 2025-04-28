<template>
  <div>
    <div class="profile">
      <!-- Личная информация -->
      <div class="personal-info">
        <h2 style="margin-top: 0">{{ user.name }}</h2>
        <p>Email: {{ user.email }}</p>
        <p>ID: {{ user.id }}</p>
        <!-- <p>Дата регистрации: {{ formatDate(user.createdAt) }}</p> -->
      </div>
      <!-- Организации пользователя -->
      <div class="org-section">
        <h2 style="margin-top: 0">Мои организации</h2>
        <button @click="showOrgForm = true">+ Новая организация</button>
        <!-- Форма создания организации -->
        <div v-if="showOrgForm" class="org-form">
          <input v-model="newOrgName" placeholder="Название организации" />
          <button @click="createOrganization">Создать</button>
        </div>
        <!-- Список организаций -->
        <div v-for="org in userOrganizations" :key="org.id" class="org-card">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <h4>{{ org.name }}</h4>
            <button class="delete-btn" @click="deleteOrganization(org.id)">
              Удалить
            </button>
          </div>
          <p>Роль: {{ getOrgRole(org.id) }}</p>

          <div class="members-section">
            <h5>Участники:</h5>
            <div class="add-member-controls">
              <input
                v-model="newMembers[org.id]"
                placeholder="Email пользователя"
                @keyup.enter="addMember(org.id)"
                class="member-add"
              />
              <button class="add-memeber" @click="addMember(org.id)">Добавить</button>
            </div>
            <div class="member-row" style="margin-top: 15px; font-weight: 600">
              <div class="member-info">
                <div style="width: 150px">Имя:</div>
                <div>Почта:</div>
              </div>
              <div class="role-actions">
                <span style="padding-right: 65px">Роль:</span>
              </div>
            </div>
            <div
              v-for="member in org.members"
              :key="member.userId"
              class="member-item"
            >
              <div class="member-row">
                <div class="member-info">
                  <span style="width: 150px">{{
                    getUserName(member.userId)
                  }}</span>
                  <span class="member-email">{{ getUserEmail(member.userId) }}</span>
                </div>
              </div>

              <div style="display: flex; gap: 10px; align-items: center">
                <div
                  class="role-button-wrapper"
                  @click.stop="toggleRoleMenu(member)"
                >
                  <span :class="['role-badge', roleBadgeClass(member.role)]">
                    {{ roleLabel(member.role) }}
                  </span>

                  <div v-if="member.showRoleMenu" class="role-menu">
                    <div @click="changeMemberRole(org.id, member, 'admin')">
                      <span>Админ</span>
                    </div>
                    <div @click="changeMemberRole(org.id, member, 'manager')">
                      <span>Менеджер</span>
                    </div>
                    <div @click="changeMemberRole(org.id, member, 'member')">
                      <span>Исполнитель</span>
                    </div>
                  </div>
                </div>
                <button
                  class="remove-btn"
                  @click="removeMember(org.id, member.userId)"
                >
                  ✖
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { generateId } from "@/utils/id";

export default {
  props: ["orgId"],
  data: () => ({
    showOrgForm: false,
    newOrgName: "",
    newMembers: {},
  }),
  computed: {
    user() {
      return this.$store.state.auth.user || {};
    },
    allOrganizations() {
      return this.$store.state.organizations.organizations;
    },
    userOrganizations() {
      return this.$store.getters["organizations/userOrganizations"];
    },
  },
  methods: {
    updateRole(member) {
      this.$store.commit("organizations/UPDATE_MEMBER", {
        orgId: this.orgId,
        userId: member.userId,
        role: member.role,
      });
    },
    getOrgName(orgId) {
      const org = this.$store.state.organizations.organizations.find(
        (o) => o.id === orgId
      );
      return org?.name || "Неизвестная организация";
    },
    getUserName(userId) {
      const user = this.$store.state.auth.users.find((u) => u.id === userId);
      return user?.name || "Неизвестный пользователь";
    },
    getOrgProjects(orgId) {
      return this.$store.state.projects.projects.filter(
        (p) => p.orgId === orgId
      );
    },
    getOrgRole(orgId) {
      return this.$store.getters["organizations/getUserRole"](
        orgId,
        this.user.id
      );
    },
    createOrganization() {
      const newOrg = {
        id: generateId(),
        name: this.newOrgName || "Новая организация",
        creatorId: this.user.id,
      };
      this.$store.commit("organizations/ADD_ORGANIZATION", newOrg);
      this.$store.commit("organizations/ADD_MEMBER", {
        orgId: newOrg.id,
        userId: this.user.id,
        role: "admin",
      });
      this.newOrgName = "";
    },
    async addMember(orgId) {
      const email = this.newMembers[orgId]?.trim();
      if (!email) return;

      try {
        const user = this.$store.state.auth.users.find(
          (u) => u.email === email
        );
        if (!user) throw new Error("Пользователь не найден");
        this.$store.commit("organizations/ADD_MEMBER", {
          orgId,
          userId: user.id,
          role: "member",
        });
        this.newMembers[orgId] = "";
      } catch (error) {
        alert(error.message);
      }
    },
    deleteOrganization(orgId) {
      if (confirm("Удалить эту организацию?")) {
        this.$store.commit("organizations/DELETE_ORGANIZATION", orgId);
      }
    },
    removeMember(orgId, userId) {
      if (confirm("Удалить пользователя из организации?")) {
        this.$store.commit("organizations/REMOVE_MEMBER", {
          orgId,
          userId,
        });
      }
    },
    updateMemberRole(orgId, member) {
      this.$store.commit("organizations/UPDATE_MEMBER", {
        orgId,
        userId: member.userId,
        role: member.role,
      });
    },
    toggleRoleMenu(member) {
      // Закрываем все другие меню перед открытием
      this.userOrganizations.forEach((org) => {
        org.members.forEach((m) => {
          if (m !== member) m.showRoleMenu = false;
        });
      });
      member.showRoleMenu = !member.showRoleMenu;
    },
    changeMemberRole(orgId, member, newRole) {
      member.role = newRole;
      member.showRoleMenu = false;
      this.updateMemberRole(orgId, member);
    },
    updateMemberRole(orgId, member) {
      this.$store.commit("organizations/UPDATE_MEMBER", {
        orgId,
        userId: member.userId,
        role: member.role,
      });
    },
    // formatDate(date) {
    //   if (!date) return "—";
    //   return new Date(date).toLocaleDateString("ru-RU");
    // },
    roleBadgeClass(role) {
      switch (role) {
        case "admin":
          return "badge-admin";
        case "manager":
          return "badge-manager";
        case "member":
          return "badge-member";
        default:
          return "";
      }
    },
    roleLabel(role) {
      return (
        {
          admin: "Админ",
          manager: "Менеджер",
          member: "Исполнитель",
        }[role] || role
      );
    },
    getUserEmail(userId) {
      const user = this.$store.state.auth.users.find((u) => u.id === userId);
      return user?.email || "Нет почты";
    },
  },
};
</script>

<style scoped>
.profile {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* Личная информация */
.personal-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.personal-info h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

/* Секция организаций */
.org-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.org-section h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

/* Карточка организации */
.org-card {
  background: #f8f9fa;
  padding: 15px;
  margin-bottom: 15px;
  margin-top: 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.org-card h4 {
  color: #2c3e50;
  margin: 0 0 10px 0;
}

/* Формы */
.org-form {
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.org-form input {
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
}

button:hover {
  opacity: 0.9;
}

/* Кнопки действий */
button[type="submit"] {
  background: #3498db;
  color: white;
}

.remove-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}

.remove-btn:hover {
  opacity: 0.9;
  background: #ff1900;
  color: white;
}

/* Кнопки действий */
.remove-btn[type="submit"] {
  background: #3498db;
  color: white;
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

/* Участники */
.members-section {
  margin-top: 15px;
}

.add-member-controls {
  display: flex;
  flex-wrap: nowrap;
  /* align-items: flex-start; */
}

.member-add {
  border-right: 0;
  border-left: 0;
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  padding: 0.4rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 0;
  border-right: 0;
  border-top:0;
  background: white;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.add-memeber{
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.role-button-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.role-menu {
  position: absolute;
  top: 120%;
  left: 0;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 120px;
}

.role-menu div {
  padding: 8px 12px;
  cursor: pointer;
}

.role-menu div:hover {
  background: #f0f0f0;
}
.role-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  min-width: 73px;
  display: inline-block;
  transition: background-color 0.3s, color 0.3s;
}
.badge-admin {
  background-color: #3498db;
  color: white;
}

.badge-manager {
  background-color: #f39c12;
  color: white;
}

.badge-member {
  background-color: #7f8c8d;
  color: white;
}

/* Ошибки */
.error {
  color: #e74c3c;
  margin-top: 10px;
  padding: 8px;
  background: #f8d7da;
  border-radius: 4px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .profile {
    padding: 10px;
  }

  .org-form input {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>

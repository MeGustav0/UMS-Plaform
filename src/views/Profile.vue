<template>
  <div style="width: 100vw;">
  <div class="profile">
    <!-- Личная информация -->
    <div class="personal-info">
      <h2>{{ user.name }}</h2>
      <p>Email: {{ user.email }}</p>
    </div>
    <!-- Организации пользователя -->
    <div class="org-section">
      <h3>Мои организации</h3>
      <button @click="showOrgForm = true">+ Новая организация</button>
      <!-- Форма создания организации -->
      <div v-if="showOrgForm" class="org-form">
        <input v-model="newOrgName" placeholder="Название организации">
        <button @click="createOrganization">Создать</button>
      </div>
      <!-- Список организаций -->
      <div v-for="org in userOrganizations" :key="org.id" class="org-card">
      <h4>{{ org.name }}</h4>
      <p>Роль: {{ getOrgRole(org.id) }}</p>

      <div class="members-section">
        <h5>Участники:</h5>
        <div v-for="member in org.members" :key="member.userId" class="member-item">
          <span>{{ getUserName(member.userId) }}</span>
          <span class="role-badge">{{ member.role }}</span>
        </div>
        
        <div class="add-member-form">
          <input 
            v-model="newMembers[org.id]" 
            placeholder="Email пользователя"
            @keyup.enter="addMember(org.id)"
          >
          <button @click="addMember(org.id)">Добавить</button>
        </div>
      </div>
    </div>
    </div>
  </div>
  </div>
</template>

<script>
import { generateId } from '@/utils/id';

export default {
  props: ['orgId'],
  data: () => ({
    showOrgForm: false,
    newOrgName: '',
    newMembers: {}
  }),
  computed: {
    user() {
      return this.$store.state.auth.user || {};
    },
    allOrganizations() {
      return this.$store.state.organizations.organizations;
    },
    userOrganizations() {
    return this.$store.getters['organizations/userOrganizations'];
  }
  },
  methods: {
    updateRole(member) {
      this.$store.commit('organizations/UPDATE_MEMBER', {
        orgId: this.orgId,
        userId: member.userId,
        role: member.role
      });
    },
    getOrgName(orgId) {
      const org = this.$store.state.organizations.organizations.find(o => o.id === orgId);
      return org?.name || 'Неизвестная организация';
    },
    getUserName(userId) {
      const user = this.$store.state.auth.users.find(u => u.id === userId);
      return user?.name || 'Неизвестный пользователь';
    },
    getOrgProjects(orgId) {
      return this.$store.state.projects.projects.filter(p => p.orgId === orgId)
    },
    getOrgRole(orgId) {
      return this.$store.getters['organizations/getUserRole'](
        orgId,
        this.user.id
      );
    },
    createOrganization() {
      const newOrg = {
        id: generateId(),
        name: this.newOrgName || "Новая организация",
        creatorId: this.user.id
      };
      this.$store.commit('organizations/ADD_ORGANIZATION', newOrg);
      this.$store.commit('organizations/ADD_MEMBER', {
        orgId: newOrg.id,
        userId: this.user.id,
        role: 'admin'
      });
      this.newOrgName = '';
    },
    async addMember(orgId) {
      const email = this.newMembers[orgId]?.trim();
      if (!email) return;

      try {
        const user = this.$store.state.auth.users.find(u => u.email === email);
        if (!user) throw new Error('Пользователь не найден');
        this.$store.commit('organizations/ADD_MEMBER', {
          orgId,
          userId: user.id,
          role: 'member'
        });
        this.newMembers[orgId] = '';
      } catch (error) {
        alert(error.message);
      }
    },
  }
}
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

button.delete-btn {
  background: #e74c3c;
  color: white;
}

/* Участники */
.members-section {
  margin-top: 15px;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.role-badge {
  background: #3498db;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-left: 10px;
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
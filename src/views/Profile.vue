<template>
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
</template>

<script>
export default {
  props: ['orgId'],
  data: () => ({
    showOrgForm: false,
    newOrgName: '',
    newMembers: {}
  }),
  computed: {
    user() {
      return this.$store.state.auth.user || {}; // Уберите organizations из значения по умолчанию
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
        id: Date.now(),
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
/* Стили для формы организаций */
.org-form {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 15px 0;
}

.org-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
}

.org-textarea {
  width: 100%;
  height: 80px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
}

.member-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.members-section {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #eee;
}

.member-item {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
}

.role-badge {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.add-member-form {
  margin-top: 1rem;
  display: flex;
  gap: 8px;
}

.remove-member-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 0 10px;
  cursor: pointer;
}

.org-card {
  background: white;
  border: 1px solid #eee;
  padding: 15px;
  margin: 15px 0;
  border-radius: 8px;
}

.org-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
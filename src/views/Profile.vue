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
      <div 
        v-for="org in allOrganizations" 
        :key="org.id"
        class="org-card"
      >
        <h4>{{ org.name }}</h4>
        <p>Роль: {{ getOrgRole(org.id) }}</p>
        <p>Проектов: {{ getOrgProjects(org.id).length }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    showOrgForm: false,
    newOrgName: ''
  }),
  computed: {
    user() {
      return this.$store.state.auth.user || { organizations: [] } // Значение по умолчанию
    },
    allOrganizations() {
      return this.$store.state.organizations.organizations;
    }
  },
  methods: {
    getOrgName(orgId) {
      const org = this.$store.state.organizations.organizations.find(o => o.id === orgId);
      return org?.name || 'Неизвестная организация';
    },

    getOrgProjects(orgId) {
      return this.$store.state.projects.projects.filter(p => p.orgId === orgId)
    },
    getOrgRole(orgId) {
      const org = this.allOrganizations.find(o => o.id === orgId);
      return org?.members.find(m => m.userId === this.user.id)?.role || 'unknown';
    },
    createOrganization() {
    const newOrg = {
      id: Date.now(),
      name: "Новая организация",
      creatorId: this.$store.state.auth.user.id,
      members: [{
        userId: this.$store.state.auth.user.id,
        role: "admin"
      }],
      projects: []
    };

    // Используйте мутацию с правильным namespace
    this.$store.commit("organizations/ADD_ORGANIZATION", newOrg);
  }
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

.member-input {
  flex: 1;
  padding: 8px;
}

.role-select {
  width: 120px;
  padding: 8px;
}

.remove-member-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 0 10px;
  cursor: pointer;
}

.add-member-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 15px;
  margin-top: 10px;
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
<template>
  <header class="app-header">
    <!-- Логотип -->
    <div class="logo">
      <router-link to="/">USM Platform</router-link>
    </div>

    <!-- Секция проектов -->
    <div class="projects-section">
      <div 
        v-for="project in $store.getters['projects/userProjects']" 
        :key="project.id"
        class="project-tab"
        :class="{ active: isActive(project.id) }"
        @click="openProject(project.id)"
      >
        {{ project.name }}
      </div>
      <button 
        class="new-project-btn hover" 
        @click="showProjectModal = true"
      >
        +
      </button>
    </div>

    <!-- Профиль -->
    <div class="profile-section">
      <div 
        class="profile-info hover" 
        @click="toggleProfileMenu"
      >
        <span class="username">{{ user.name }} ({{ user.role }})</span>
      </div>
      
      <div 
        v-if="showProfileMenu" 
        class="profile-menu"
      >
        <div class="menu-item hover" @click="goToProfile">
          👤 Профиль
        </div>
        <div class="menu-item logout hover" @click="logout">
          🚪 Выйти
        </div>
      </div>
    </div>
  </header>
  <!-- Модальное окно -->
  <CreateProjectModal 
      v-if="showProjectModal"
      @close="showProjectModal = false"
      @created="handleProjectCreated"
    />
</template>

<script>
import CreateProjectModal from '@/components/CreateProjectModal.vue'

export default {
  components: { CreateProjectModal },
  data() {
    return {
      showProfileMenu: false,
      showProjectModal: false,
      user: {
        name: 'Волис',
        role: 'Администратор'
      }
    }
  },
  computed: {
    projects() {
      return this.$store.getters['projects/userProjects']
    },
    user() {
      return this.$store.state.auth.user || { name: 'Гость', role: 'Не авторизован' }
    }
  },
  methods: {
    isActive(projectId) {
      return this.$route.params.id === projectId.toString()
    },
    openProject(projectId) {
      this.$router.push(`/project/${projectId}`)
    },
    handleProjectCreated(newProject) {
      console.log('Получен новый проект:', newProject);
      this.$store.commit('projects/ADD_PROJECT', newProject);
      this.openProject(newProject.id);
      this.showProjectModal = false;
    },
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu
    },
    logout() {
      this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    },
    goToProfile() {
      this.$router.push('/profile')
    }
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  width: 100%;
  position: fixed ;
  justify-content: space-between;
  align-items: center;
  height: 54px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 999;
}

.projects-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.project-tab {
  padding: 9.5px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.hover:hover {
  background: #f0f0f0;
}

.project-tab.active {
  background: #3498db;
  color: white;
}

.new-project-btn {
  font-size: 2rem;
  padding: 0 12px;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.2s;
}

.profile-section {
  position: relative;
  padding: 0 2rem;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.profile-menu {
  position: absolute;
  right: 0;
  top: 50px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
  min-width: 200px;
  z-index: 1000;
}

.menu-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.logo a {
  font-size: 1.5rem;
  padding: 0 1rem;
  font-weight: 700;
  color: #2c3e50;
  text-decoration: none;
}

.logout {
  color: #e74c3c;
}
</style>
<template>
  <div class="sidebar">

      <div class="project-header">
      <button 
        v-if="isAdmin"
        @click="openEdit"
        class="edit-btn"
      >{{ project.name }}</button>
      
    <ProjectInfoModal
      v-if="showProjectModal"
      :project="project"
      @close="showProjectModal = false"
      @save="handleSave"
    />
    </div>
    <nav class="project-nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{ active: currentTab === tab.id }"
        @click="$emit('change-tab', tab.id)"
      >
      {{ tab.label }}
    </button>
    </nav>
  </div>
</template>

<script>
import ProjectInfoModal from '@/components/ProjectInfoModal.vue'


export default {
  components: { ProjectInfoModal },
  props: ['project', 'currentTab'],
  data() {
    return {
      showProjectModal: false,
      tabs: [
        { id: 'usm', label: 'USM Доска' },
        { id: 'tasks', label: 'Все задачи' },
        { id: 'stats', label: 'Статистика' }
      ]
    }
  },
  computed: {
    isAdmin() {
      return this.$store.state.auth.user?.role === 'admin'
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'Не установлен'
      const date = new Date(dateString)
      return isNaN(date) ? 'Неверная дата' : 
        date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
      })
    },
    openEdit() {
      this.showProjectModal = true
    },
    handleSave(updatedProject) {
      this.$store.commit('projects/UPDATE_PROJECT', updatedProject)
    }
  }
}
</script>
  
<style scoped>
.sidebar {
  background: #424348;
  color: white;
  padding: 10px;
  min-height: calc(100vh - 74px) ;
  min-width: 160px;
  position: fixed;
  margin-top: 54px;
  z-index: 100;
}

.project-header {
  display: flex;
  align-items: center;
  padding-left: 6px;
  background: #424348;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5em;
  padding: 5px;
  color: white;
}

.edit-btn:hover {
  color: #2196F3;
}

.project-meta {
  margin-bottom: 2rem;
}

.project-meta h2 {
  color: #3498db;
  margin-bottom: 1rem;
}

.project-meta p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #bdc3c7;
}

.members {
  margin-top: 1.5rem;
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}

.member {
  padding: 5px;
  margin: 3px 0;
  background: rgba(255,255,255,0.05);
  border-radius: 2px;
}

.project-nav button {
  display: block;
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  text-align: left;
  font-size: 1rem;
  background: none;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.project-nav button:hover {
  background: #3498db;
}

.project-nav button.active {
  background: #3498db;
  font-weight: bold;
}
</style>
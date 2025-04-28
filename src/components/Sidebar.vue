<template>
  <div class="sidebar" v-if="project">
    <div class="project-header">
      <button v-if="isAdmin && project" @click="openEdit" class="edit-btn">
        {{ project.name }}
      </button>

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
import ProjectInfoModal from "@/components/Modal/ProjectInfoModal.vue";

export default {
  components: { ProjectInfoModal },
  props: {
    project: {
      type: Object,
      required: true,
      validator: (p) => p && typeof p === "object",
    },
    currentTab: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showProjectModal: false,
      tabs: [
        { id: "usm", label: "USM Доска" },
        { id: "tasks", label: "Все задачи" },
        { id: "stats", label: "Статистика" },
      ],
    };
  },
  computed: {
    isAdmin() {
      if (!this.project || !this.project.members) return false;
      const userId = this.$store.state.auth.user?.id;
      const member = this.project.members.find((m) => m.userId == userId);
      return member?.role === "admin";
    },
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return "Не установлен";
      const date = new Date(dateString);
      return isNaN(date)
        ? "Неверная дата"
        : date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
    },
    openEdit() {
      console.log("Project data:", this.project);
      this.showProjectModal = true;
    },
    handleSave(updatedProject) {
      this.$store.commit("projects/UPDATE_PROJECT", updatedProject);
    },
  },
};
</script>

<style scoped>
.sidebar {
  background: #424348;
  color: white;
  padding: 10px;
  min-height: calc(100vh - 74px);
  max-width: 180px;
  min-width: 160px;
  position: fixed;
  z-index: 100;
}

.project-header {
  display: flex;
  align-items: center;
  padding-left: 6px;
  background: #424348;
  max-width: 180px;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5em;
  padding: 5px;
  color: white;
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.edit-btn:hover {
  color: #2196f3;
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.member {
  padding: 5px;
  margin: 3px 0;
  background: rgba(255, 255, 255, 0.05);
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

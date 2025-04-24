<template>
  <div v-if="project">
  <div class="project-view">
    <Header />
    
    <div class="main-layout">
      <!-- Сайдбар -->
      <Sidebar 
        :project="project"
        :currentTab="currentTab"
        @change-tab="currentTab = $event"
      />
      <!-- Основной контент -->
      <div class="content-area">
        <!-- USM -->
        <div  v-if="currentTab === 'usm'">
          <div class="usm-board">
            <Activity 
              v-for="activity in project.activities" 
              :key="activity.id"
              :activity="activity"
              @edit="handleEdit"
              :projectId="projectId"
              @delete="handleDeleteActivity"
            />
            <button class="add-activity" @click="addActivity">+ Активность</button>
          </div>
        </div>

        <!-- Задачи -->
        <TasksView 
          v-if="currentTab === 'tasks'" 
          :project="project" 
          @edit="handleEdit"
        />

        <!-- Статистика -->
        <StatsView v-if="currentTab === 'stats'" :project="project" />
      </div>
    </div>
  </div>
  </div>
  <div v-else>
    Проект не найден
  </div>
  <EditModal
    v-if="showEditModal"
    :data="editingItem"
    :type="editingType"
    @save="handleSave"
    @close="showEditModal = false"
  />
</template>

<script>
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import TaskItem from '@/components/TaskItem.vue'
import TasksView from '@/components/TasksView.vue'
import StatsView from '@/components/StatsView.vue'
import Activity from '@/components/Activity.vue'
import EditModal from '@/components/EditModal.vue'

export default {
  components: { Header, Sidebar, TaskItem, TasksView, StatsView, Activity, EditModal },
  data() {
    return {
      currentTab: 'usm',
      showEditModal: false,
      editingType: null,
      editingItem: null
    }
  },
  computed: {
    project() {
      return this.$store.getters['projects/getProjectById'](this.projectId) || {};
    },
    projectId() {
      return Number(this.$route.params.id);
    },
    isAdmin() {
      return this.$store.state.auth.user?.role === 'admin'
    },
    isManager() {
    return this.project.members?.some(m => 
      m.id === this.$store.state.auth.user?.id && 
      m.role === 'manager'
    )
    },
    canEdit() {
      return this.isAdmin || this.isManager
    }
  },
  methods: {
    addActivity() {
      const newActivity = {
        id: Date.now(),
        title: 'Новая активность',
        description: '',
        owner: '',
        startDate: new Date().toISOString(), // Добавляем дату начала
        endDate: null,
        tasks: []
      };
      
      this.$store.commit('projects/ADD_ACTIVITY', {
        projectId: this.project.id,
        activity: newActivity
      });
    },
    handleDeleteActivity(activityId) {
      this.$store.commit('projects/DELETE_ACTIVITY', {
        projectId: this.projectId,
        activityId: activityId
      })
    },
    handleEdit(payload) {
      console.log('Edit event:', payload);
      this.editingType = payload.type;
      this.editingItem = payload.data;
      this.showEditModal = true;
    },
    handleSave(updatedData) {
      console.log('Saving:', updatedData);
      if (this.editingType === 'activity') {
        this.$store.commit('projects/UPDATE_ACTIVITY', {
          projectId: this.projectId,
          activity: updatedData
        });
      } else if (this.editingType === 'task') {
        this.$store.commit('projects/UPDATE_TASK', {
          projectId: this.projectId,
          activityId: updatedData.activityId,
          task: updatedData
        });
      }
      this.showEditModal = false;
    },
    deleteProject() {
      if (this.isAdmin) {
        // Логика удаления
      }
    }
  },
  watch: {
    project: {
      handler(newVal) {
      // Форсирует обновление при глубоких изменениях
       this.$forceUpdate()
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.main-layout{
  display: flex;
}
.usm-board {
  width: 100%;
  display: flex;
  overflow-x: auto;
  background: #f5f5f5;
}

.add-activity {
  height: 135px;
  font-weight: 600;
  margin: 1rem;
  padding: 0.5rem;
  border: 0;
  cursor: pointer;
  transition: background 0.2s;
}

.add-activity:hover {
  background: #c5c4c475;
}

.activity-header {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.activity-header input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.tasks {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

</style>
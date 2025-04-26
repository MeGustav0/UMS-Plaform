<template>
  <div v-if="project" :key="project.id + safeActivitiesLength">
  
     <!-- Хеадер -->
    <Header />
    <div class="project-view">
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
            <div class="usm">
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
            <div>
              <ReleasesContainer
                :releases="projectReleases"
                @add-story="handleAddStory"
              />
            </div>
            
            <div>
              <button @click="createRelease">Создать релиз</button>
            </div>
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
import EditModal from '@/components/Modal/EditModal.vue'
import ReleasesContainer from '@/components/ReleasesContainer.vue'

export default {
  components: { Header, Sidebar, TaskItem, TasksView, StatsView, Activity, EditModal, ReleasesContainer, },
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
    projectExists() {
      return this.$store.getters['projects/getProjectById'](this.projectId)
    },
    userRole() {
      return this.$store.getters['organizations/getUserRole'](
        this.project.orgId, 
        this.$store.state.auth.user.id
      );
    },
    canEditProject() {
      return this.$store.getters['organizations/canEditProject'](
        this.project.orgId,
        this.$store.state.auth.user?.id
      );
    },
    projectReleases() { // Правильное название computed-свойства
      return this.$store.getters['releases/projectReleases'](this.projectId)
    },
    safeActivitiesLength() {
      return this.project?.activities?.length || 0;
    }
  },
  methods: {
    addActivity() {
      const newActivity = {
        id: Date.now(),
        title: 'Новая активность',
        orgId: this.project.orgId,
        description: '',
        owner: '',
        startDate: new Date().toISOString(),
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
    createRelease() {
      this.$store.dispatch('releases/createRelease', {
        projectId: this.projectId,
        name: 'Новый релиз'
      })
    },
    handleAddStory({ releaseId, taskPath }) {
      const text = prompt('Введите текст истории:')
      if (text) {
        this.$store.commit('releases/ADD_STORY', {
          releaseId,
          taskPath,
          story: {
            id: Date.now(),
            text,
            createdAt: new Date().toISOString()
          }
        })
      }
    },
  },
}
</script>

<style scoped>
.usm{
  display: flex;
  height: 100%;
  border: dotted;
  border-color: #3f3f3f;
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
}

.main-layout{
  display: flex;
}
.usm-board {
  width: 100%;
  display: flex;
  overflow-x: auto;
  flex-direction: column;
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
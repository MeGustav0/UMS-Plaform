<template>
  <div v-if="project">
    <!-- Хеадер -->
    <Header />
    <div
      class="project-view"
      ref="scrollContainer"
      @mousedown="startDragging"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @mousemove="drag"
    >
      <!-- Сайдбар -->
      <Sidebar
        :project="project"
        :currentTab="currentTab"
        @change-tab="currentTab = $event"
      />
      <!-- Основной контент -->
      <div class="content-area">
        <!-- USM -->
        <div v-if="currentTab === 'usm'">
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
              <button class="add-activity" @click="addActivity">
                + Активность
              </button>
            </div>
            <div>
              <ReleasesContainer
                :releases="projectReleases"
                @add-story="handleAddStory"
              />
            </div>

            <div>
              <button class="add-realese" @click="createRelease">
                Создать релиз
              </button>
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
        <StatsView
          v-if="currentTab === 'stats'"
          :project="project"
          :releases="projectReleases"
          :chartData="chartData"
        />
      </div>
    </div>
  </div>

  <div v-else>Проект не найден</div>
  <EditModal
    v-if="showEditModal"
    :data="editingItem"
    :type="editingType"
    :projectMembers="project.members || []"
    @save="handleSave"
    @close="showEditModal = false"
  />
  <EditStoryModal
    v-if="showStoryModal"
    :story="editingItem"
    :projectMembers="project.members || []"
    @save="handleSaveStory"
    @close="showStoryModal = false"
  />
</template>

<script>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import TaskItem from "@/components/TaskItem.vue";
import TasksView from "@/components/TasksView.vue";
import StatsView from "@/components/Charts/StatsView.vue";
import Activity from "@/components/Activity.vue";
import EditModal from "@/components/Modal/EditModal.vue";
import EditStoryModal from "@/components/Modal/EditStoryModal.vue";
import ReleasesContainer from "@/components/ReleasesContainer.vue";
import { generateId } from "@/utils/id";

export default {
  components: {
    Header,
    Sidebar,
    TaskItem,
    TasksView,
    StatsView,
    Activity,
    EditModal,
    ReleasesContainer,
    EditStoryModal,
  },
  data() {
    return {
      currentTab: "usm",
      showEditModal: false,
      editingType: null,
      editingItem: null,
      showStoryModal: false,
      showFlowChart: false,
      newStoryReleaseId: null,
      newStoryTaskPath: null,
      isRightMouseDown: false,
      movedAfterRightClick: false,
      lastRightClickPos: { x: 0, y: 0 },
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      scrollStartX: 0,
      scrollStartY: 0,
    };
  },
  computed: {
    project() {
      return (
        this.$store.getters["projects/getProjectById"](this.projectId) || null
      );
    },
    projectId() {
      return this.$route.params.id;
    },
    isAdmin() {
      return this.$store.state.auth.user?.role === "admin";
    },
    isManager() {
      return this.project.members?.some(
        (m) => m.id === this.$store.state.auth.user?.id && m.role === "manager"
      );
    },
    projectExists() {
      return this.$store.getters["projects/getProjectById"](this.projectId);
    },
    userRole() {
      return this.$store.getters["organizations/getUserRole"](
        this.project.orgId,
        this.$store.state.auth.user.id
      );
    },
    canEditProject() {
      if (!this.project || !this.project.members) return false;
      const userId = this.$store.state.auth.user?.id;
      const member = this.project.members.find((m) => m.userId == userId);
      return member && ["admin", "manager"].includes(member.role);
    },
    projectReleases() {
      return this.$store.getters["releases/projectReleases"](this.projectId);
    },
    safeActivitiesLength() {
      return this.project?.activities?.length || 0;
    },
    chartData() {
      // Пример вычисления данных для диаграммы на основе активностей и задач проекта
      const tasks = this.project.activities.flatMap(
        (activity) => activity.tasks
      );

      const statusCounts = ["todo", "progress", "done"].map((status) => ({
        label: this.statusLabels[status],
        value: tasks.filter((task) => task.status === status).length,
      }));

      return statusCounts;
    },
    statusLabels() {
      return {
        todo: "To Do",
        progress: "In Progress",
        done: "Done",
      };
    },
  },
  methods: {
    addActivity() {
      const newActivity = {
        id: generateId(),
        title: "Новая активность",
        orgId: this.project.orgId,
        description: "",
        owner: "",
        startDate: new Date().toISOString(),
        endDate: null,
        tasks: [],
      };
      this.$store.commit("projects/ADD_ACTIVITY", {
        projectId: this.project.id,
        activity: newActivity,
      });
    },
    handleDeleteActivity(activityId) {
      this.$store.commit("projects/DELETE_ACTIVITY", {
        projectId: this.projectId,
        activityId: activityId,
      });
    },
    handleEdit(payload) {
      console.log("Edit event:", payload);
      this.editingType = payload.type;
      this.editingItem = payload.data;
      this.showEditModal = true;
    },
    handleSave(updatedData) {
      console.log("Saving:", updatedData);
      if (this.editingType === "activity") {
        this.$store.commit("projects/UPDATE_ACTIVITY", {
          projectId: this.projectId,
          activity: updatedData,
        });
      } else if (this.editingType === "task") {
        this.$store.commit("projects/UPDATE_TASK", {
          projectId: this.projectId,
          activityId: updatedData.activityId,
          task: updatedData,
        });
      }
      this.showEditModal = false;
    },
    createRelease() {
      this.$store.dispatch("releases/createRelease", {
        projectId: this.projectId,
        name: "Новый релиз",
      });
    },
    handleAddStory({ releaseId, taskPath }) {
      this.newStoryReleaseId = releaseId;
      this.newStoryTaskPath = taskPath;
      this.editingItem = {
        id: null,
        title: "",
        priority: "medium",
        status: "todo",
        assignee: "",
        description: "",
        createdAt: new Date().toISOString(),
        endDate: null,
        comments: [],
      };
      this.editingType = "story";
      this.showStoryModal = true;
    },
    handleSaveStory(updatedStory) {
      if (!this.newStoryReleaseId || !this.newStoryTaskPath) return;

      updatedStory.id = generateId(); // создаём ID
      this.$store.commit("releases/ADD_STORY", {
        releaseId: this.newStoryReleaseId,
        taskPath: this.newStoryTaskPath,
        story: updatedStory,
      });

      this.showStoryModal = false;
      this.newStoryReleaseId = null;
      this.newStoryTaskPath = null;
    },
    startDragging(event) {
      if (event.button !== 2) return; // Только правая кнопка
      this.isRightMouseDown = true;
      this.movedAfterRightClick = false;
      this.lastRightClickPos = { x: event.clientX, y: event.clientY };

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      const container = this.$refs.scrollContainer;
      this.scrollStartX = container.scrollLeft;
      this.scrollStartY = container.scrollTop;
    },
    stopDragging(event) {
      if (event.button === 2) {
        // Если отпустил правую кнопку
        setTimeout(() => {
          this.isRightMouseDown = false;
          this.movedAfterRightClick = false;
        }, 0); // Сбрасываем на следующем тике
      }
    },
    drag(event) {
      if (!this.isRightMouseDown) return;

      const dx = Math.abs(event.clientX - this.lastRightClickPos.x);
      const dy = Math.abs(event.clientY - this.lastRightClickPos.y);

      // Если мышка двинулась хоть немного — считаем, что это перетаскивание
      if (dx > 3 || dy > 3) {
        this.movedAfterRightClick = true;
      }

      const container = this.$refs.scrollContainer;
      container.scrollLeft =
        this.scrollStartX - (event.clientX - this.dragStartX);
      container.scrollTop =
        this.scrollStartY - (event.clientY - this.dragStartY);
    },
    onContextMenu(event) {
      if (this.movedAfterRightClick) {
        event.preventDefault(); // Блокируем если была тяга мыши
      }
    },
  },
  mounted() {
    this.$refs.scrollContainer.addEventListener(
      "contextmenu",
      this.onContextMenu
    );
  },
  beforeUnmount() {
    this.$refs.scrollContainer.removeEventListener(
      "contextmenu",
      this.onContextMenu
    );
  },
};
</script>

<style scoped>
.project-view {
  overflow: auto;
  cursor: grab;
}

.project-view:active {
  cursor: grabbing;
}
.usm {
  display: flex;
  height: 100%;
  border: dotted;
  border-color: #3f3f3f;
  border-top: 0;
  border-bottom: 0;
  border-left: 0;
}

.main-layout {
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
  height: 105px;
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

.add-realese {
  width: 100%;
  height: 46px;
  text-align: left;
  padding-left: 11px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 0;
  opacity: 0.05;
  cursor: pointer;
  transition: all 0.2s;
}

.add-realese:hover {
  background: #c5c4c475;
  opacity: 1;
  cursor: pointer;
  transition: background 0.2s;
}
</style>

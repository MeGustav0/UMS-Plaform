<template>
  <div v-if="isLoading">Загрузка...</div>
  <div v-else>
    <div class="stats">
      <!-- Фильтры -->
      <div class="filters">
        <div class="filter-group">
          <label>Релиз:</label>
          <select v-model="selectedRelease">
            <option value="all">Все релизы</option>
            <option
              v-for="release in releases"
              :key="release.id"
              :value="release.id"
            >
              {{ release.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Активность:</label>
          <select v-model="selectedActivity">
            <option value="all">Все активности</option>
            <option
              v-for="activity in filteredActivities"
              :key="activity.id"
              :value="activity.id"
            >
              {{ activity.title }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Задача:</label>
          <select v-model="selectedTask">
            <option value="all">Все задачи</option>
            <option
              v-for="task in filteredTasks"
              :key="task.id"
              :value="task.id"
            >
              {{ task.title }}
            </option>
          </select>
        </div>
      </div>

      <!-- Динамические метрики -->
      <div class="metrics-grid">
        <!-- Для уровня проекта/релиза -->
        <template v-if="['project', 'activity'].includes(currentLevel)">
          <MetricCard
            title="Активностей"
            :value="metrics.activity.total"
            :progress="progress.activity"
            icon="📂"
          />
        </template>

        <!-- Для уровня активности/задачи -->
        <template v-if="['project', 'activity', 'task'].includes(currentLevel)">
          <MetricCard
            title="Задач"
            :value="metrics.task.total"
            :progress="progress.task"
            :overdue="metrics.task.overdue"
            icon="📝"
          />
        </template>

        <!-- Для всех уровней -->
        <MetricCard
          v-if="metrics && metrics.activity"
          title="Активностей"
          :value="metrics.activity.total"
          :progress="progress.activity"
          icon="📂"
        />
      </div>
      <div>
        <div v-if="chartData && chartData.length > 0" class="chart-container">
          <PieChart :data="computedChartData" :title="chartTitle" />
        </div>
        <div v-else>Нет данных для отображения графика.</div>
      </div>
    </div>
  </div>
</template>

<script>
import MetricCard from "@/components/MetricCard.vue";
import PieChart from "@/components/PieChart.vue";

export default {
  components: { MetricCard, PieChart },
  props: {
    project: {
      type: Object,
      required: true
    },
    releases: {
      type: Array,
      required: true
    },
    chartData: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      selectedRelease: "all",
      selectedActivity: "all",
      selectedTask: "all",
      isLoading: true,
    };
  },
  computed: {
    computedChartData() {
      // Здесь возвращаем корректные данные
      return this.project.activities // или что-то другое в зависимости от данных
    },
    chartTitle() {
      return "Статистика по проекту";
    },
    // Фильтрация данных
    filteredData() {
      return this.getFilteredTasks();
    },

    // Метрики
    totalTasks() {
      return this.filteredData.length;
    },
    completedTasks() {
      return this.filteredData.filter((t) => t.status === "done").length;
    },
    progress() {
      return this.totalTasks > 0
        ? Math.round((this.completedTasks / this.totalTasks) * 100)
        : 0;
    },
    overdueTasks() {
      return this.filteredData.filter(
        (t) =>
          !["done", "canceled"].includes(t.status) &&
          new Date(t.endDate) < new Date()
      ).length;
    },
    currentLevel() {
      if (this.selectedTask !== "all") return "story";
      if (this.selectedActivity !== "all") return "task";
      if (this.selectedRelease !== "all") return "activity";
      return "project";
    },
    // Данные для графиков
    statusDistribution() {
      const statuses = ["todo", "progress", "done"];
      return statuses.map((status) => ({
        label: this.statusLabel(status),
        value: this.filteredData.filter((t) => t.status === status).length,
      }));
    },

    // Вспомогательные вычисления
    filteredActivities() {
      if (!this.project || !this.releases) return [];
      if (this.selectedRelease === "all") return this.project.activities;
      const release = this.releases.find((r) => r.id === this.selectedRelease);
      return release?.activitiesSnapshot || [];
    },

    filteredTasks() {
      return this.filteredActivities
        .flatMap((a) => a.tasks)
        .filter(
          (t) =>
            this.selectedActivity === "all" ||
            t.activityId === this.selectedActivity
        );
    },

    filteredStories() {
      return this.releases
        .filter(
          (r) => this.selectedRelease === "all" || r.id === this.selectedRelease
        )
        .flatMap((r) => r.activitiesSnapshot)
        .filter(
          (a) =>
            this.selectedActivity === "all" || a.id === this.selectedActivity
        )
        .flatMap((a) => a.tasks)
        .filter(
          (t) => this.selectedTask === "all" || t.id === this.selectedTask
        )
        .flatMap((t) => t.stories || []);
    },
    metrics() {
      console.log("filteredActivities", this.filteredActivities);
      console.log("filteredTasks", this.filteredTasks);
      console.log("filteredStories", this.filteredStories);

      return {
        activity: {
          total: this.filteredActivities.length,
          completed: this.filteredActivities.filter((a) =>
            a.tasks.every((t) => t.status === "done")
          ).length,
        },
        task: {
          total: this.filteredTasks.length,
          completed: this.filteredTasks.filter((t) => t.status === "done")
            .length,
          overdue: this.filteredTasks.filter(
            (t) =>
              !["done", "canceled"].includes(t.status) &&
              new Date(t.endDate) < new Date()
          ).length,
        },
        story: {
          total: this.filteredStories.length,
          completed: this.filteredStories.filter((s) => s.status === "done")
            .length,
          overdue: this.filteredStories.filter(
            (s) =>
              !["done", "canceled"].includes(s.status) &&
              new Date(s.endDate) < new Date()
          ).length,
        },
      };
    },
    progress() {
      return {
        activity:
          this.metrics.activity.total > 0
            ? Math.round(
                (this.metrics.activity.completed /
                  this.metrics.activity.total) *
                  100
              )
            : 0,
        task:
          this.metrics.task.total > 0
            ? Math.round(
                (this.metrics.task.completed / this.metrics.task.total) * 100
              )
            : 0,
        story:
          this.metrics.story.total > 0
            ? Math.round(
                (this.metrics.story.completed / this.metrics.story.total) * 100
              )
            : 0,
      };
    },
  },
  methods: {
    getFilteredTasks() {
      let tasks = [];

      if (this.selectedRelease === "all") {
        // Все задачи из всех релизов
        tasks = this.releases.flatMap((r) =>
          r.activitiesSnapshot.flatMap((a) =>
            a.tasks.flatMap((t) => t.stories || [])
          )
        );
      } else {
        // Задачи из конкретного релиза
        const release = this.releases.find(
          (r) => r.id === this.selectedRelease
        );
        if (!release) return [];
        tasks = release.activitiesSnapshot
          .flatMap((a) => a.tasks)
          .flatMap((t) => t.stories || []);
      }

      // Дополнительная фильтрация
      return tasks.filter((t) => {
        const matchesActivity =
          this.selectedActivity === "all" ||
          t.activityId === this.selectedActivity;
        const matchesTask =
          this.selectedTask === "all" || t.taskId === this.selectedTask;
        return matchesActivity && matchesTask;
      });
    },

    statusLabel(status) {
      const labels = {
        todo: "To Do",
        progress: "In Progress",
        done: "Done",
      };
      return labels[status];
    },
  },
  mounted() {
    this.isLoading = false  
  }
};
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>

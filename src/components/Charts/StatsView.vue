<template>
  <div class="stats-view">
    <!-- Фильтры -->
    <div class="filters">
      <select v-model="selectedRelease">
        <option value="all">Все релизы</option>
        <option v-for="r in releases" :key="r.id" :value="r.id">
          {{ r.name }}
        </option>
      </select>

      <select v-model="selectedActivity">
        <option value="all">Все активности</option>
        <option v-for="a in filteredActivities" :key="a.id" :value="a.id">
          {{ a.title }}
        </option>
      </select>

      <select v-model="selectedTask">
        <option value="all">Все задачи</option>
        <option v-for="t in filteredTasks" :key="t.id" :value="t.id">
          {{ t.title }}
        </option>
      </select>
    </div>

    <!-- Метрики -->
    <div class="metrics-grid">
      <MetricCard
        v-if="showActivitiesMetrics"
        title="Активностей"
        :value="metrics.activities.total"
        :completed="metrics.activities.completed"
        :progress="progress.activities"
        icon="📂"
      />
      <MetricCard
        v-if="showTasksMetrics"
        title="Задач"
        :value="metrics.tasks.total"
        :completed="metrics.tasks.completed"
        :overdue="metrics.tasks.overdue"
        :progress="progress.tasks"
        icon="📝"
      />
      <MetricCard
        v-if="showStoriesMetrics"
        title="Историй"
        :value="metrics.stories.total"
        :completed="metrics.stories.completed"
        :overdue="metrics.stories.overdue"
        :progress="progress.stories"
        icon="📚"
      />
    </div>

    <!-- Графики -->
    <div class="charts-row">
      <PieChart
        v-if="showTasksChart"
        :data="tasksStatusDistribution"
        title="Распределение задач"
      />
      <PieChart
        v-if="showStoriesChart"
        :data="storiesStatusDistribution"
        title="Распределение историй"
      />
    </div>
    <div class="flow-chart-container">
      <CumulativeFlowChart :stories="filteredStories" />
    </div>
  </div>
</template>

<script>
import MetricCard from "@/components/Charts/MetricCard.vue";
import PieChart from "@/components/Charts/PieChart.vue";
import CumulativeFlowChart from "@/components/Charts/CumulativeFlowChart.vue";

export default {
  name: "StatsView",
  components: { MetricCard, PieChart, CumulativeFlowChart },
  props: {
    project: { type: Object, required: true },
    releases: { type: Array, required: true },
  },
  data() {
    return {
      selectedRelease: "all",
      selectedActivity: "all",
      selectedTask: "all",
    };
  },
  methods: {
    isValidDate(d) {
      return d instanceof Date && !isNaN(d);
    },
  },
  computed: {
    currentRelease() {
      return this.selectedRelease === "all"
        ? null
        : this.releases.find((r) => r.id === this.selectedRelease);
    },
    filteredActivities() {
      if (this.currentRelease) return this.currentRelease.activitiesSnapshot;
      return this.project.activities;
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
      const releasesToCheck =
        this.selectedRelease === "all" ? this.releases : [this.currentRelease];
      let stories = [];

      releasesToCheck.forEach((release) => {
        release.activitiesSnapshot.forEach((activity) => {
          if (
            this.selectedActivity === "all" ||
            activity.id === this.selectedActivity
          ) {
            activity.tasks.forEach((task) => {
              if (
                this.selectedTask === "all" ||
                task.id === this.selectedTask
              ) {
                stories.push(...(task.stories || []));
              }
            });
          }
        });
      });

      return stories;
    },

    // Метрики
    metrics() {
      return {
        activities: {
          total: this.filteredActivities.length,
          completed: this.filteredActivities.filter((a) =>
            a.tasks.every((t) => t.status === "done")
          ).length,
        },
        tasks: {
          total: this.filteredTasks.length,
          completed: this.filteredTasks.filter((t) => t.status === "done")
            .length,
          overdue: this.filteredTasks.filter((t) => {
            const date = new Date(t.endDate);
            return (
              t.status !== "done" && this.isValidDate(date) && date < new Date()
            );
          }).length,
        },
        stories: {
          total: this.filteredStories.length,
          completed: this.filteredStories.filter((s) => s.status === "done")
            .length,
          overdue: this.filteredStories.filter((s) => {
            const date = new Date(s.endDate);
            return (
              s.status !== "done" && this.isValidDate(date) && date < new Date()
            );
          }).length,
        },
      };
    },

    progress() {
      const calc = (completed, total) =>
        total ? Math.round((completed / total) * 100) : 0;
      return {
        activities: calc(
          this.metrics.activities.completed,
          this.metrics.activities.total
        ),
        tasks: calc(this.metrics.tasks.completed, this.metrics.tasks.total),
        stories: calc(
          this.metrics.stories.completed,
          this.metrics.stories.total
        ),
      };
    },

    // Диаграммы
    tasksStatusDistribution() {
      const statuses = ["todo", "progress", "done"];
      return statuses.map((status) => ({
        label: this.statusLabel(status),
        value: this.filteredTasks.filter((t) => t.status === status).length,
      }));
    },
    storiesStatusDistribution() {
      const statuses = ["todo", "progress", "done"];
      return statuses.map((status) => ({
        label: this.statusLabel(status),
        value: this.filteredStories.filter((s) => s.status === status).length,
      }));
    },

    // Что показывать?
    showActivitiesMetrics() {
      return this.selectedTask === "all" && this.selectedActivity === "all";
    },
    showTasksMetrics() {
      return this.selectedTask === "all";
    },
    showStoriesMetrics() {
      return true; // истории всегда показываем в метриках
    },
    showTasksChart() {
      return this.selectedTask === "all";
    },
    showStoriesChart() {
      return true;
    },

    // Текстовые метки для статусов
    statusLabel() {
      return (status) =>
        ({
          todo: "To Do",
          progress: "In Progress",
          done: "Done",
        }[status]);
    },
  },
};
</script>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  gap: 5px;
  margin-right: auto;
  margin-left: auto;
}

.filters {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 900px;
  margin-bottom: 10px;
}

select,
input {
  min-width: 130px;
  width: 200px;
  border: 0;
  margin-top: 0;
  display: flex;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: -3px 3px 2px 0px rgba(34, 60, 80, 0.1);
  margin-top: 5px;
}

.charts-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
  padding: 8px 0;
  background: #ffffff;
  box-shadow: -3px 3px 2px 0px rgba(34, 60, 80, 0.1);
  border-radius: 10px;
  width: 100%;
}

.charts-row > * {
  flex: 1 1 300px;
  max-width: 400px;
}

.flow-chart-container {
  width: 100%;
  max-width: 1200px;
}
</style>

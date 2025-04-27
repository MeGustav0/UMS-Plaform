<template>
  <div class="stats-view">
    <!-- Фильтры -->
    <div class="filters">
      <label>Релиз:
        <select v-model="selectedRelease">
          <option value="all">Все релизы</option>
          <option v-for="r in releases" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
      </label>

      <label>Активность:
        <select v-model="selectedActivity">
          <option value="all">Все активности</option>
          <option v-for="a in filteredActivities" :key="a.id" :value="a.id">{{ a.title }}</option>
        </select>
      </label>

      <label>Задача:
        <select v-model="selectedTask">
          <option value="all">Все задачи</option>
          <option v-for="t in filteredTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
      </label>
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
    <div class="chart-container">
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
  </div>
</template>

<script>
import MetricCard from '@/components/MetricCard.vue'
import PieChart from '@/components/PieChart.vue'

export default {
  name: 'StatsView',
  components: { MetricCard, PieChart },
  props: {
    project: { type: Object, required: true },
    releases: { type: Array, required: true }
  },
  data() {
    return {
      selectedRelease: 'all',
      selectedActivity: 'all',
      selectedTask: 'all'
    }
  },
  computed: {
    currentRelease() {
      return this.selectedRelease === 'all' ? null : this.releases.find(r => r.id === this.selectedRelease);
    },
    filteredActivities() {
      if (this.currentRelease) return this.currentRelease.activitiesSnapshot;
      return this.project.activities;
    },
    filteredTasks() {
      return this.filteredActivities
        .flatMap(a => a.tasks)
        .filter(t => this.selectedActivity === 'all' || t.activityId === this.selectedActivity);
    },
    filteredStories() {
      const releasesToCheck = this.selectedRelease === 'all' ? this.releases : [this.currentRelease];
      let stories = [];

      releasesToCheck.forEach(release => {
        release.activitiesSnapshot.forEach(activity => {
          if (this.selectedActivity === 'all' || activity.id === this.selectedActivity) {
            activity.tasks.forEach(task => {
              if (this.selectedTask === 'all' || task.id === this.selectedTask) {
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
          completed: this.filteredActivities.filter(a => a.tasks.every(t => t.status === 'done')).length
        },
        tasks: {
          total: this.filteredTasks.length,
          completed: this.filteredTasks.filter(t => t.status === 'done').length,
          overdue: this.filteredTasks.filter(t => t.status !== 'done' && new Date(t.endDate) < new Date()).length
        },
        stories: {
          total: this.filteredStories.length,
          completed: this.filteredStories.filter(s => s.status === 'done').length,
          overdue: this.filteredStories.filter(s => s.status !== 'done' && new Date(s.endDate) < new Date()).length
        }
      }
    },

    progress() {
      const calc = (completed, total) => (total ? Math.round((completed / total) * 100) : 0);
      return {
        activities: calc(this.metrics.activities.completed, this.metrics.activities.total),
        tasks: calc(this.metrics.tasks.completed, this.metrics.tasks.total),
        stories: calc(this.metrics.stories.completed, this.metrics.stories.total)
      }
    },

    // Диаграммы
    tasksStatusDistribution() {
      const statuses = ['todo', 'progress', 'done'];
      return statuses.map(status => ({
        label: this.statusLabel(status),
        value: this.filteredTasks.filter(t => t.status === status).length
      }));
    },
    storiesStatusDistribution() {
      const statuses = ['todo', 'progress', 'done'];
      return statuses.map(status => ({
        label: this.statusLabel(status),
        value: this.filteredStories.filter(s => s.status === status).length
      }));
    },

    // Что показывать?
    showActivitiesMetrics() {
      return this.selectedTask === 'all' && this.selectedActivity === 'all';
    },
    showTasksMetrics() {
      return this.selectedTask === 'all';
    },
    showStoriesMetrics() {
      return true; // истории всегда показываем в метриках
    },
    showTasksChart() {
      return this.selectedTask === 'all';
    },
    showStoriesChart() {
      return true;
    },

    // Текстовые метки для статусов
    statusLabel() {
      return (status) => ({
        todo: 'To Do',
        progress: 'In Progress',
        done: 'Done'
      }[status]);
    }
  }
}
</script>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.metrics-grid {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.chart-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}
</style>

<!-- <style scoped>
.stats-view{
  width: 50%;
  margin-left: auto;
  margin-right: auto;
}
.metrics-grid{
  display: flex;
  width: 100%;
  justify-content: space-evenly
}
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

.chart-container{
  display: flex;
  justify-content: space-evenly;
  width: 100%;
}
</style> -->

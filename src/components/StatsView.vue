<template>
  <div class="stats">
    <div class="header">
      <h2 style="margin-top: 0;">📊 Статистика проекта</h2>
    </div>

    <!-- Основные метрики -->
    <div class="metrics-grid">
      <MetricCard 
        title="Всего задач"
        :value="totalTasks"
        icon="📋"
      />
      <MetricCard 
        title="Выполнено"
        :value="completedTasks"
        icon="✅"
      />
      <MetricCard 
        title="Прогресс"
        :value="`${progress}%`"
        icon="📈"
      />
      <MetricCard 
        title="Просрочено"
        :value="overdueTasks"
        icon="⏰"
      />
    </div>

    <!-- График распределения -->
    <div class="chart-container">
      <PieChart 
        :data="statusDistribution"
        title="Распределение задач по статусам"
        class="centered-chart"
      />
    </div>
  </div>
</template>

<script>
import MetricCard from '@/components/MetricCard.vue'
import PieChart from '@/components/PieChart.vue'

export default {
  components: { MetricCard, PieChart },
  props: ['project'],
  computed: {
    allTasks() {
      return this.project?.activities?.flatMap(a => a.tasks || []) || []
    },
    totalTasks() {
      return this.allTasks.length
    },
    completedTasks() {
      return this.allTasks.filter(t => t.status === 'done').length
    },
    progress() {
      return this.totalTasks > 0 
        ? Math.round((this.completedTasks / this.totalTasks) * 100)
        : 0
    },
    overdueTasks() {
      return this.allTasks.filter(task => {
        const isDone = task.status === 'done';
        const isOverdue = new Date(task.endDate) < new Date();
        return !isDone && isOverdue;
      }).length;
    },
    statusDistribution() {
      const statuses = [
        { id: 'todo', label: 'To Do' },
        { id: 'progress', label: 'In Progress' },
        { id: 'done', label: 'Done' }
      ]
      
      return statuses.map(status => ({
        label: status.label,
        value: this.allTasks.filter(t => t.status === status.id).length
      }))
    }
  }
}
</script>

<style scoped>
.chart-container {
  margin: 20px 0;
}
@media (max-width: 768px) {
  .chart-wrapper {
    max-width: 100%;
    padding: 0.5rem;
  }
  
  .chart-container {
    margin: 10px 0;
  }
}
.stats {
  width: 100%;
}

.header {
  margin-bottom: 2rem;
  text-align: center;
}

.metrics-grid {
  display: flex;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center
}
</style>
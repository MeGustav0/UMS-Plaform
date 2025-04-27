<template>
  <div class="metric-card">
    <div class="header">
      <div class="icon">{{ icon }}</div>
      <h3>{{ title }}</h3>
    </div>
    
    <div class="content">
      <div class="main-value">{{ value }}</div>
      
      <div v-if="progress !== undefined" class="progress">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        <span>{{ progress }}%</span>
      </div>
      
      <div v-if="overdue !== undefined" class="overdue">
        🚨 Просрочено: {{ overdue }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    progress: Number,
    overdue: Number,
    icon: {
      type: String,
      default: '📊'
    }
  }
}
</script>

<style scoped>
.metric-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.content {
  flex-grow: 1;
}

.title {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.value {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #212529;
}
</style>
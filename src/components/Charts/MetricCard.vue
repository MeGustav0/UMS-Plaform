<template>
  <div class="metric-card">
    <div class="icon">{{ icon }}</div>
    <div class="content">
      <h3 class="title">{{ title }}</h3>
      <p class="value">{{ value }}</p>
      <p v-if="progress !== null" class="progress">Прогресс: {{ progress }}%</p>
      <p v-if="overdue !== null" class="overdue">Просрочено: {{ overdue }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "MetricCard",
  props: {
    title:    { type: String,  required: true },
    value:    { type: [Number, String], required: true },
    icon:     { type: String,  default: "📊" },
    progress: { type: Number,  default: null },
    overdue:  { type: Number,  default: null }
  }
}
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  padding: 8px 0;
  text-align: center;
  box-shadow: -3px 3px 2px 0px rgba(34, 60, 80, 0.1);
  border-radius: 10px;
}
.icon { font-size: 2em; }
.title { margin: 0.5em 0 0.2em; }
.value { font-size: 1.5em; margin: 0; }
.progress, .overdue { margin: 0.2em 0; font-size: 0.9em; color: #555; }
</style>
<template>
  <div class="chart-wrapper">
    <VueApexCharts
      type="pie"
      width="100%"
      margin-right="auto"
      margin-left="auto"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  props: {
    // data: {
    //   type: Array,
    //   required: true,
    //   validator: function (arr) {
    //     return arr.every((item) => item.label && item.value);
    //   },
    // },
    title: {
      type: String,
      default: "Распределение задач",
    },
  },
  // data() {
  //   return [
  //     { label: "Завершено", value: 5 },
  //     { label: "В работе", value: 3 },
  //     { label: "Не начато", value: 2 },
  //   ];
  // },
  components: { VueApexCharts },
  computed: {
  series() {
    return this.chartData ? this.chartData.map((item) => item.value) : [];
  },
  chartOptions() {
    return {
      chart: {
        type: "pie",
        height: 250,
        width: "90%",
      },
      labels: this.chartData && this.chartData.length
        ? this.chartData.map((item) => item.label)
        : [],
      title: {
        text: this.chartTitle,
        align: "center",
        style: {
          fontSize: "16px",
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };
  },
  chartData() {
    switch (this.$parent.currentLevel) {
      case "activity":
        return this.activityChartData;
      case "task":
        return this.taskChartData;
      default:
        return this.storyChartData;
    }
  },
  activityChartData() {
    const activities = this.$parent.filteredActivities || [];
    return [
      {
        label: "Завершено",
        value: activities.filter((a) =>
          a.tasks.every((t) => t.status === "done")
        ).length,
      },
      {
        label: "В работе",
        value: activities.filter((a) =>
          a.tasks.some((t) => t.status === "progress")
        ).length,
      },
      {
        label: "Не начато",
        value: activities.filter((a) =>
          a.tasks.every((t) => t.status === "todo")
        ).length,
      },
    ];
  },

  taskChartData() {
    const tasks = this.$parent.filteredTasks;
    return ["todo", "progress", "done"].map((status) => ({
      label: this.statusLabels[status],
      value: tasks.filter((t) => t.status === status).length,
    }));
  },

  storyChartData() {
    const stories = this.$parent.filteredStories;
    return ["todo", "progress", "done"].map((status) => ({
      label: this.statusLabels[status],
      value: stories.filter((s) => s.status === status).length,
    }));
  },

  statusLabels() {
    return {
      todo: "To Do",
      progress: "In Progress",
      done: "Done",
    };
  },
  chartTitle() {
    const titles = {
      activity: "Статус активностей",
      task: "Статус задач",
      story: "Статус историй",
    };
    return titles[this.$parent.currentLevel] || "Распределение";
  },
},
};
</script>

<style scoped>
.chart-wrapper {
  margin: 1rem auto;
  max-width: 500px;
  padding: 1rem;
  text-align: center;
}
</style>

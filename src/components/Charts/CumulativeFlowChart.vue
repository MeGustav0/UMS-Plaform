<template>
  <div class="chart-wrapper">
    <VueApexCharts
      type="area"
      :series="series"
      :options="chartOptions"
      height="290"
    />
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "CumulativeFlowChart",
  components: { VueApexCharts },
  props: {
    stories: {
      type: Array,
      required: true,
    },
  },
  computed: {
    series() {
      if (!this.stories.length) return [];

      const statuses = ["done", "progress", "todo"];
      const statusNames = {
        todo: "To Do",
        progress: "In Progress",
        done: "Done",
      };

      const dateCounts = {};

      this.stories.forEach((story) => {
        const created = story.createdAt ? story.createdAt.split("T")[0] : null;
        const ended = story.closedAt ? story.closedAt.split("T")[0] : null;

        if (created)
          dateCounts[created] = dateCounts[created] || {
            todo: 0,
            progress: 0,
            done: 0,
          };
        if (ended)
          dateCounts[ended] = dateCounts[ended] || {
            todo: 0,
            progress: 0,
            done: 0,
          };
      });

      const sortedDates = Object.keys(dateCounts).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      sortedDates.forEach((date) => {
        this.stories.forEach((story) => {
          const created = story.createdAt
            ? story.createdAt.split("T")[0]
            : null;
          const ended = story.closedAt ? story.closedAt.split("T")[0] : null;

          if (created && new Date(created) <= new Date(date)) {
            if (!ended || new Date(ended) >= new Date(date)) {
              dateCounts[date][story.status]++;
            }
          }
        });
      });

      const datasets = statuses.map((status) => ({
        name: statusNames[status],
        data: sortedDates.map((date) => dateCounts[date][status] || 0),
      }));

      return datasets;
    },
    chartOptions() {
      return {
        chart: {
          type: "area",
          stacked: true,
          toolbar: { show: false },
        },
        colors: ["#facc15", "#10b981", "#3b82f6"],
        dataLabels: { enabled: false },
        stroke: {
          curve: "smooth",
        },
        xaxis: {
          categories: this.series.length
            ? this.series[0].data.map((_, index) => this.sortedDates[index])
            : [],
          labels: { rotate: -45 },
        },
        legend: {
          position: "top",
        },
        fill: {
          type: "gradient",
          gradient: {
            opacityFrom: 0.6,
            opacityTo: 0.1,
          },
        },
        title: {
          text: "Диаграмма суммарного потока",
          align: "center",
        },
      };
    },
    sortedDates() {
      const dates = new Set();
      this.stories.forEach((story) => {
        if (story.createdAt) dates.add(story.createdAt.split("T")[0]);
        if (story.endDate) dates.add(story.endDate.split("T")[0]);
      });
      return Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
    },
  },
};
</script>

<style scoped>
.chart-wrapper {
  margin-top: 10px;
  background: #fff;
  padding: 10px;
  border-radius: 10px;
  box-shadow: -3px 3px 2px 0px rgba(34, 60, 80, 0.1);
}
</style>

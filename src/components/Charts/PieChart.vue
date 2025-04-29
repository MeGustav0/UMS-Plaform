<template>
  <div class="chart-wrapper">
    <VueApexCharts
      type="pie"
      :series="series"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import VueApexCharts from 'vue3-apexcharts'

export default {
  name: "PieChart",
  components: { VueApexCharts },
  props: {
    data: {
      type: Array,
      required: true,
      // каждый элемент { label: String, value: Number }
      validator: arr => arr.every(i => 'label' in i && 'value' in i)
    },
    title: { type: String, default: 'Распределение' }
  },
  computed: {
    series() {
      // массив значений
      return this.data.map(i => i.value)
    },
    chartOptions() {
      return {
        labels: this.data.map(i => i.label),
        title: {
          text: this.title,
          align: 'center'
        },
        legend: { position: 'bottom' },
        responsive: [{
          breakpoint: 480,
          options: { chart: { width: 200 }, legend: { position: 'bottom' } }
        }]
      }
    }
  }
}
</script>

<style scoped>
.chart-wrapper { max-width: 100%; }
</style>
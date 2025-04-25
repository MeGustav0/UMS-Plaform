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
import VueApexCharts from 'vue3-apexcharts'

export default {
  props: {
    data: {
      type: Array,
      required: true,
      validator: (arr) => arr.every(item => 'label' in item && 'value' in item)
    },
    title: {
      type: String,
      default: 'Распределение задач'
    }
  },
  components: { VueApexCharts },
  computed: {
    series() {
      return this.data.map(item => item.value)
    },
    chartOptions() {
      return {
        chart: {
          type: 'pie',
          height: 250, 
          width: '90%' 
        },
        labels: this.data.map(item => item.label),
        title: {
          text: this.title,
          align: 'center',
          style: {
            fontSize: '16px'
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      }
    }
  }
}
</script>

<style scoped>
.chart-wrapper {
  margin: 1rem auto; 
  max-width: 500px; 
  padding: 1rem;
  text-align: center; 
}
</style>
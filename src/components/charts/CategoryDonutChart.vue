<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { useDark } from '@vueuse/core'

const props = defineProps<{
  labels: string[]
  data: number[]
}>()

const isDark = useDark()

const palette = [
  '#0ea5e9',
  '#22c55e',
  '#a855f7',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#84cc16',
  '#64748b',
  '#38bdf8',
]

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.labels.map((_, i) => palette[i % palette.length]),
      borderWidth: 2,
      borderColor: isDark.value ? '#0f172a' : '#ffffff',
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        color: isDark.value ? '#e2e8f0' : '#334155',
        font: { size: 11, weight: 600 },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: unknown; label: string }) => {
          const v = typeof ctx.parsed === 'number' ? ctx.parsed : Number(ctx.parsed)
          const t = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
          }).format(v)
          return ` ${ctx.label}: ${t}`
        },
      },
    },
  },
}))
</script>

<template>
  <div class="h-64 w-full">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TooltipItem } from 'chart.js'
import { Line } from 'vue-chartjs'
import { useDark } from '@vueuse/core'

const props = defineProps<{
  labels: string[]
  data: number[]
}>()

const isDark = useDark()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Chi tiêu',
      data: props.data,
      borderColor: '#0ea5e9',
      backgroundColor: isDark.value ? 'rgba(14,165,233,0.14)' : 'rgba(14,165,233,0.12)',
      fill: true,
      tension: 0.38,
      pointRadius: 3,
      pointHoverRadius: 4,
      borderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => {
  const grid = isDark.value ? 'rgba(148,163,184,0.14)' : 'rgba(226,232,240,0.95)'
  const ticks = isDark.value ? '#cbd5e1' : '#64748b'
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
          const y = ctx.parsed.y
          if (y == null) return ''
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
          }).format(y)
        },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: ticks, maxRotation: 0, autoSkip: true },
      },
      y: {
        grid: { color: grid },
        ticks: {
          color: ticks,
          callback: (value: string | number) => {
            const n = Number(value)
            if (!Number.isFinite(n)) return value
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
            if (n >= 1_000) return `${Math.round(n / 1_000)}k`
            return `${n}`
          },
        },
      },
    },
  }
})
</script>

<template>
  <div class="h-56 w-full">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

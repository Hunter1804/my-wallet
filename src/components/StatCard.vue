<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
  trend?: { dir: 'up' | 'down' | 'flat'; text: string }
  clickable?: boolean
}>()
</script>

<template>
  <article
    class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur transition dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark"
    :class="[
      clickable ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-500/50 hover:bg-white dark:hover:bg-slate-900 active:scale-[0.98]' : ''
    ]"
  >
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {{ label }}
    </p>
    <div class="mt-2 flex items-end justify-between gap-3">
      <p class="font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {{ value }}
      </p>
      <span
        v-if="trend"
        class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
        :class="
          trend.dir === 'up'
            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
            : trend.dir === 'down'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
        "
      >
        {{ trend.text }}
      </span>
    </div>
    <p v-if="hint" class="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
      {{ hint }}
    </p>
  </article>
</template>

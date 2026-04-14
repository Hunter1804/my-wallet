<script setup lang="ts">
import { useAppTheme } from '@/composables/useTheme'

const { isDark, toggleDark } = useAppTheme()
</script>

<template>
  <button
    type="button"
    class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:border-primary-300 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-primary-500/40 dark:hover:bg-slate-800"
    :aria-pressed="isDark"
    aria-label="Đổi giao diện sáng tối"
    @click="toggleDark()"
  >
    <svg
      v-if="!isDark"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
    <svg
      v-else
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  </button>
</template>

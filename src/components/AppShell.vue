<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomTabBar from '@/components/BottomTabBar.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useWalletStore } from '@/stores/wallet'
import { storeToRefs } from 'pinia'

const route = useRoute()
const title = computed(() => (route.meta.title as string) ?? 'Spending Wallet')
const wallet = useWalletStore()
const { familyName } = storeToRefs(wallet)
</script>

<template>
  <div
    class="relative min-h-[100dvh] bg-gradient-to-b from-sky-50 via-surface to-slate-50 text-slate-900 transition-colors duration-250 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50"
  >
    <div
      class="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-400/25 blur-3xl dark:bg-primary-500/15"
      />
      <div
        class="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10"
      />
    </div>

    <div class="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <header class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-display text-xs font-semibold uppercase tracking-wider text-primary-700/80 dark:text-primary-300/90">
            Ví gia đình<span v-if="familyName" class="opacity-80"> · {{ familyName }}</span>
          </p>
          <h1 class="font-display truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {{ title }}
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main class="flex-1">
        <slot />
      </main>
    </div>

    <BottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import AppShell from '@/components/AppShell.vue'
import { setupMessageListener } from '@/services/fcm'

const route = useRoute()
const useShell = () => route.meta.shell !== false

onMounted(() => {
  setupMessageListener()
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="tab-page" mode="out-in">
      <Suspense>
        <AppShell v-if="useShell()">
          <component v-if="Component" :is="Component" :key="route.fullPath" />
        </AppShell>
        <component v-else-if="Component" :is="Component" :key="route.fullPath" />
        <template #fallback>
          <div
            class="flex min-h-[50vh] items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/50 px-4 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
          >
            Đang tải…
          </div>
        </template>
      </Suspense>
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-900/40 px-4 py-10 backdrop-blur-sm dark:bg-slate-950/60"
        @click.self="emit('close')"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="show"
            class="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
          >
            <div class="mb-5 flex items-center justify-between">
              <h2 v-if="title" class="font-display text-xl font-semibold text-slate-900 dark:text-white">
                {{ title }}
              </h2>
              <button
                type="button"
                class="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                @click="emit('close')"
              >
                <span class="sr-only">Đóng</span>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

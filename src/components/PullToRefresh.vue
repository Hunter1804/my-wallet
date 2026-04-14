<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps<{
  refreshing?: boolean
  threshold?: number
  resistance?: number
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const threshold = props.threshold ?? 80
const resistance = props.resistance ?? 2.5

const startY = ref(0)
const currentY = ref(0)
const pulling = ref(false)
const pullDistance = ref(0)
const isAtTop = ref(true)

const pullOpacity = computed(() => {
  return Math.min(1, pullDistance.value / threshold)
})

const pullRotation = computed(() => {
  return (pullDistance.value / threshold) * 360
})

const isReady = computed(() => pullDistance.value >= threshold)

const handleTouchStart = (e: TouchEvent) => {
  // Only start tracking if we are at the top of the scrollable container
  const scrollTarget = document.scrollingElement || document.documentElement
  isAtTop.value = scrollTarget.scrollTop === 0

  if (!isAtTop.value || props.refreshing) return

  startY.value = e.touches[0].pageY
  pulling.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!pulling.value) return

  const y = e.touches[0].pageY
  const diff = y - startY.value

  if (diff > 0 && isAtTop.value) {
    // Prevent default scrolling when pulling down at the top
    if (e.cancelable) e.preventDefault()
    
    // Apply resistance for elastic feel
    pullDistance.value = Math.pow(diff, 0.85) * (1 / (resistance * 0.5))
    
    // Cap it slightly to avoid excessive pulling
    if (pullDistance.value > threshold * 1.5) {
      pullDistance.value = threshold * 1.5 + (pullDistance.value - threshold * 1.5) * 0.2
    }
  } else {
    pullDistance.value = 0
    // If user swipes up while tracking, stop tracking to allow normal scroll
    if (diff < -10) pulling.value = false
  }
}

const handleTouchEnd = () => {
  if (!pulling.value) return

  if (isReady.value) {
    emit('refresh')
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      try { navigator.vibrate(10) } catch (e) {}
    }
  }

  pulling.value = false
  pullDistance.value = 0
}

onMounted(() => {
  window.addEventListener('touchstart', handleTouchStart, { passive: false })
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
  <div class="relative w-full">
    <!-- Pull Indicator Container -->
    <div
      class="pointer-events-none absolute left-0 right-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-300 ease-out"
      :class="{ 'transition-none': pulling }"
      :style="{
        height: `${refreshing ? threshold : pullDistance}px`,
        opacity: refreshing ? 1 : pullOpacity,
        transform: `translateY(${refreshing ? 0 : -10}px)`
      }"
    >
      <div 
        class="flex flex-col items-center justify-center gap-2 rounded-full border border-white/20 bg-white/40 p-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-800/40"
        :class="{ 'scale-110 ring-2 ring-primary-500/20': isReady && !refreshing }"
      >
        <div class="relative h-8 w-8">
          <!-- Background Circle -->
          <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="text-slate-200 dark:text-slate-700"
            />
            <!-- Progress Circle -->
            <circle
              v-if="!refreshing"
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-dasharray="88"
              :stroke-dashoffset="88 - (Math.min(1, pullDistance / threshold) * 88)"
              stroke-linecap="round"
              class="text-primary-500 transition-all duration-75"
            />
          </svg>

          <!-- Spinner Icon -->
          <div
            class="absolute inset-0 flex items-center justify-center"
            :class="{ 'animate-spin': refreshing }"
            :style="{ transform: !refreshing ? `rotate(${pullRotation}deg)` : undefined }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-primary-600 dark:text-primary-400"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <polyline points="22 10 22 4 16 10" />
            </svg>
          </div>
        </div>
        
        <span 
          v-if="pullDistance > threshold * 0.5 || refreshing" 
          class="text-[10px] font-bold uppercase tracking-widest text-primary-700 dark:text-primary-300"
        >
          {{ refreshing ? 'Đang tải...' : (isReady ? 'Thả để làm mới' : 'Kéo xuống') }}
        </span>
      </div>
    </div>

    <!-- Main Content Slot -->
    <div
      class="transition-transform duration-300 ease-out"
      :class="{ 'transition-none': pulling }"
      :style="{ transform: `translateY(${refreshing ? threshold : (pullDistance * 0.6)}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const active = computed(() => (route.meta.tab as string) ?? 'home')

const tabOrder = ['home', 'history', 'add', 'members'] as const

const activeIndex = computed(() => {
  const i = tabOrder.indexOf(active.value as (typeof tabOrder)[number])
  return i >= 0 ? i : 0
})

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}

function linkClass(name: string) {
  const isOn = active.value === name
  return [
    'group relative z-10 flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold tracking-wide transition-[color,font-weight,transform] duration-300 ease-out motion-reduce:transition-none',
    isOn
      ? 'text-primary-700 dark:text-primary-100'
      : 'text-slate-500 hover:text-slate-800 active:scale-[0.97] dark:text-slate-400 dark:hover:text-slate-100',
  ]
}

function iconWrap(name: string) {
  const isOn = active.value === name
  return [
    'flex h-10 w-10 items-center justify-center rounded-2xl transition-[transform,color] duration-[400ms] ease-out will-change-transform motion-reduce:transition-none',
    isOn
      ? 'scale-[1.06] text-primary-600 dark:text-primary-300'
      : 'scale-100 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200',
  ]
}

function iconSvgClass(name: string) {
  const isOn = active.value === name
  return [
    'transition-transform duration-[400ms] ease-out motion-reduce:transition-none',
    isOn ? 'scale-105' : 'scale-100',
  ]
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 w-full select-none rounded-t-2xl border-t border-slate-200/90 bg-white/92 shadow-[0_-6px_28px_-6px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-950/92 dark:shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.45)]"
    aria-label="Điều hướng chính"
  >
    <div class="relative w-full px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
      <!-- Track + sliding pill -->
      <div
        class="pointer-events-none absolute left-2 right-2 top-2 h-14 sm:left-3 sm:right-3"
        aria-hidden="true"
      >
        <div
          class="h-full w-1/5 origin-left rounded-2xl bg-primary-500/14 transition-[transform] duration-[420ms] ease-[cubic-bezier(0.33,1,0.68,1)] will-change-transform motion-reduce:!transition-none dark:bg-primary-400/12"
          :style="{ transform: `translateX(calc(${activeIndex} * 100%))` }"
        />
      </div>

      <div class="relative z-10 flex h-14 items-center">
        <RouterLink
          to="/"
          class="flex min-w-0 flex-1 flex-col items-center"
          :class="linkClass('home')"
        >
          <span :class="iconWrap('home')">
            <svg
              class="h-[1.35rem] w-[1.35rem] shrink-0"
              :class="iconSvgClass('home')"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.85"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"
              />
            </svg>
          </span>
          <span class="leading-none transition-opacity duration-300" :class="active === 'home' ? 'opacity-100' : 'opacity-90'">
            Tổng quan
          </span>
        </RouterLink>

        <RouterLink
          to="/history"
          class="flex min-w-0 flex-1 flex-col items-center"
          :class="linkClass('history')"
        >
          <span :class="iconWrap('history')">
            <svg
              class="h-[1.35rem] w-[1.35rem] shrink-0"
              :class="iconSvgClass('history')"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.85"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              />
            </svg>
          </span>
          <span class="leading-none transition-opacity duration-300" :class="active === 'history' ? 'opacity-100' : 'opacity-90'">
            Lịch sử
          </span>
        </RouterLink>

        <RouterLink
          to="/add"
          class="flex min-w-0 flex-1 flex-col items-center"
          :class="linkClass('add')"
        >
          <span :class="iconWrap('add')">
            <svg
              class="h-[1.35rem] w-[1.35rem] shrink-0"
              :class="iconSvgClass('add')"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              aria-hidden="true"
            >
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span class="leading-none transition-opacity duration-300" :class="active === 'add' ? 'opacity-100' : 'opacity-90'">
            Thêm
          </span>
        </RouterLink>

        <RouterLink
          to="/members"
          class="flex min-w-0 flex-1 flex-col items-center"
          :class="linkClass('members')"
        >
          <span :class="iconWrap('members')">
            <svg
              class="h-[1.35rem] w-[1.35rem] shrink-0"
              :class="iconSvgClass('members')"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.85"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11a4 4 0 11-8 0 4 4 0 018 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 20a6 6 0 0112 0" />
            </svg>
          </span>
          <span class="leading-none transition-opacity duration-300" :class="active === 'members' ? 'opacity-100' : 'opacity-90'">
            Thành viên
          </span>
        </RouterLink>

        <button
          type="button"
          class="group relative z-10 flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold tracking-wide text-slate-500 transition-[color,transform] duration-300 ease-out active:scale-[0.97] motion-reduce:transition-none hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          @click="logout"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition-[transform,color] duration-[400ms] ease-out group-hover:text-slate-700 motion-reduce:transition-none dark:group-hover:text-slate-200">
            <svg
              class="h-[1.35rem] w-[1.35rem] shrink-0 transition-transform duration-[400ms] ease-out motion-reduce:transition-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.85"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H3m0 0 3-3m-3 3 3 3" />
            </svg>
          </span>
          <span class="leading-none opacity-90">Đăng xuất</span>
        </button>
      </div>
    </div>
  </nav>
</template>

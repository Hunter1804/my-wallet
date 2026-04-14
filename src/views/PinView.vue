<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@/stores/wallet'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const wallet = useWalletStore()
const { familyName } = storeToRefs(wallet)

onMounted(() => {
  if (!auth.isLoggedIn) router.replace({ name: 'login' })
})

const entered = ref('')
const error = ref('')

const title = computed(() => {
  return 'Nhập mã PIN'
})

const subtitle = computed(() => {
  return 'PIN dùng chung của gia đình'
})

const dots = computed(() => Array.from({ length: 4 }, (_, i) => i < entered.value.length))

function resetState() {
  entered.value = ''
  error.value = ''
}

function goHome() {
  router.replace({ name: 'dashboard' })
}

async function submitIfReady() {
  if (entered.value.length !== 4) return
  try {
    await auth.verifyFamilyPin(entered.value)
    goHome()
  } catch (e) {
    error.value = auth.getErrorMessage(e)
    entered.value = ''
  }
}

function press(d: string) {
  if (entered.value.length >= 4) return
  entered.value += d
}

function backspace() {
  entered.value = entered.value.slice(0, -1)
}

watch(
  () => entered.value,
  () => {
    if (error.value) error.value = ''
    void submitIfReady()
  },
)

</script>

<template>
  <div
    class="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50"
  >
    <div class="mx-auto flex w-full max-w-lg flex-col">
      <header class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-wider text-primary-700/80 dark:text-primary-300/90">
          Ví gia đình<span v-if="familyName" class="opacity-80"> · {{ familyName }}</span>
        </p>
        <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {{ title }}
        </h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {{ subtitle }}
        </p>
      </header>

      <section
        class="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary-500/10 blur-2xl dark:bg-primary-400/10"
          aria-hidden="true"
        />

        <div class="relative">
          <div class="flex items-center justify-center gap-3 py-4">
            <span
              v-for="(on, i) in dots"
              :key="i"
              class="h-3 w-3 rounded-full transition-colors duration-200"
              :class="on ? 'bg-primary-600 dark:bg-primary-400' : 'bg-slate-200 dark:bg-slate-700'"
              aria-hidden="true"
            />
          </div>

          <p v-if="error" class="mt-1 text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ error }}
          </p>

          <div class="mt-5 grid grid-cols-3 gap-3">
            <button
              v-for="n in 9"
              :key="n"
              type="button"
              class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-900 shadow-sm transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              @click="press(String(n))"
            >
              {{ n }}
            </button>

            <button
              type="button"
              class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              @click="resetState"
            >
              Xóa
            </button>

            <button
              type="button"
              class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-900 shadow-sm transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              @click="press('0')"
            >
              0
            </button>

            <button
              type="button"
              class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              @click="backspace"
            >
              Xóa 1
            </button>
          </div>
        </div>
      </section>

      <p class="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        PIN chỉ lưu trên thiết bị này (PWA).
      </p>
    </div>
  </div>
</template>


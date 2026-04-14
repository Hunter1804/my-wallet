<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(false)
const error = ref('')

const form = reactive({
  phone: '',
  password: '',
})

const canSubmit = computed(() => form.phone.trim().length >= 8 && form.password.length >= 6 && !loading.value)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.phone.trim(), form.password)
    // After login, user must verify family PIN
    await router.replace({ name: 'lock' })
  } catch (e) {
    error.value = auth.getErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50"
  >
    <div class="mx-auto flex w-full max-w-lg flex-col">
      <header class="mb-8 flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-primary-700/80 dark:text-primary-300/90">
            Spending Wallet
          </p>
          <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Đăng nhập
          </h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Số điện thoại + mật khẩu
          </p>
        </div>
        <ThemeToggle />
      </header>

      <form
        class="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark"
        @submit.prevent="submit"
      >
        <div class="space-y-4">
          <div>
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="phone">Số điện thoại</label>
            <input
              id="phone"
              v-model="form.phone"
              inputmode="tel"
              autocomplete="tel"
              placeholder="090xxxxxxx"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="pw">Mật khẩu</label>
            <input
              id="pw"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            class="flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-600 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit"
          >
            {{ loading ? 'Đang đăng nhập…' : 'Đăng nhập' }}
          </button>

          <p v-if="error" class="text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ error }}
          </p>

          <p class="text-center mt-4 text-sm text-slate-600 dark:text-slate-400">
            Chưa có tài khoản? <RouterLink :to="{ name: 'register' }" class="font-semibold text-primary-600 hover:text-primary-500 max-w-fit">Đăng ký</RouterLink>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>


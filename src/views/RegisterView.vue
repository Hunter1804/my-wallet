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
  displayName: '',
  familyName: '',
  sharedPin: '',
  nickname: '',
})

const canSubmit = computed(() => 
  form.phone.trim().length >= 8 && 
  form.password.length >= 6 && 
  form.displayName.trim().length > 0 &&
  form.familyName.trim().length > 0 &&
  form.sharedPin.trim().length >= 4 &&
  !loading.value
)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register({
      phone: form.phone.trim(),
      password: form.password,
      displayName: form.displayName.trim(),
      familyName: form.familyName.trim(),
      sharedPin: form.sharedPin.trim(),
      nickname: form.nickname.trim() || form.displayName.trim(),
      accent: 'sky' // default accent
    })
    // Go to lock to enter pin
    await router.replace({ name: 'lock' })
  } catch (e) {
    error.value = auth.getErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[100dvh] bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50">
    <div class="mx-auto flex w-full max-w-lg flex-col">
      <header class="mb-8 flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-primary-700/80 dark:text-primary-300/90">
            Spending Wallet
          </p>
          <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Đăng ký
          </h1>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Tạo tài khoản và nhóm mới
          </p>
        </div>
        <ThemeToggle />
      </header>

      <form class="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">Số điện thoại</label>
          <input v-model="form.phone" inputmode="tel" placeholder="090xxxxxxx" class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>
        
        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">Mật khẩu</label>
          <input v-model="form.password" type="password" placeholder="••••••" class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">Tên hiển thị</label>
          <input v-model="form.displayName" placeholder="Tên của bạn" class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">Tên ví / Nhóm</label>
          <input v-model="form.familyName" placeholder="Ví gia đình" class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200">Mã PIN nhóm</label>
          <input v-model="form.sharedPin" type="password" placeholder="Mã PIN chung" class="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>

        <button type="submit" class="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-600 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50" :disabled="!canSubmit">
          {{ loading ? 'Đang tạo…' : 'Tạo tài khoản' }}
        </button>

        <p v-if="error" class="text-center text-sm font-semibold text-rose-600">{{ error }}</p>

        <p class="text-center mt-4 text-sm text-slate-600 dark:text-slate-400">
          Đã có tài khoản? <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary-600 hover:text-primary-500 max-w-fit">Đăng nhập</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

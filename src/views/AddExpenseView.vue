<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import TransactionForm from '@/components/TransactionForm.vue'

const store = useWalletStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  void store.refreshMembers()
  void store.refreshSettings()
})

function handleSubmit(data: any) {
  store
    .createExpense(data)
    .then(() => router.push({ name: 'history' }))
    .catch((e) => {
      alert(auth.getErrorMessage(e))
    })
}

</script>

<template>
  <div class="pb-2">
    <div class="mb-4 rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
        Chi tiêu mới
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Nhập nhanh — tối ưu cho điện thoại
      </p>
    </div>

    <div class="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <TransactionForm @submit="handleSubmit" />
    </div>
  </div>
</template>

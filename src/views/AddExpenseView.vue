<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { storeToRefs } from 'pinia'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'

const store = useWalletStore()
const auth = useAuthStore()
const { membersUi } = storeToRefs(store)
const categories = store.categories
const router = useRouter()

const form = reactive({
  payerId: '',
  amount: '' as string | number,
  description: '',
  category: categories[0] ?? '',
  paidAt: format(new Date(), 'yyyy-MM-dd'),
})

const touched = ref(false)

const formattedAmount = computed({
  get: () => {
    if (!form.amount) return ''
    return Number(form.amount).toLocaleString('vi-VN')
  },
  set: (val: string) => {
    const raw = val.replace(/\D/g, '')
    form.amount = raw ? Number(raw) : ''
  }
})

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.payerId) e.payerId = 'Chọn người thanh toán'
  const raw = typeof form.amount === 'string' ? form.amount.replace(/\s/g, '').replace(',', '.') : String(form.amount)
  const n = Number(raw)
  if (!raw || !Number.isFinite(n) || n <= 0) e.amount = 'Nhập số tiền hợp lệ (> 0)'
  if (!String(form.description).trim()) e.description = 'Nhập mô tả ngắn'
  if (!form.category) e.category = 'Chọn danh mục'
  if (!form.paidAt) e.paidAt = 'Chọn ngày'
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

watch(
  membersUi,
  (list) => {
    if (!form.payerId && list?.length) {
      const myId = auth.currentUser?.id
      const me = list.find((m) => m.id === myId)
      form.payerId = me ? me.id : list[0]!.id
    }
  },
  { immediate: true },
)

onMounted(() => {
  void store.refreshMembers()
  void store.refreshSettings()
})

function submit() {
  touched.value = true
  if (!isValid.value) return
  const raw = typeof form.amount === 'string' ? form.amount.replace(/\s/g, '').replace(',', '.') : String(form.amount)
  const amount = Math.round(Number(raw))
  store
    .createExpense({
      payerUserId: form.payerId,
      amount,
      description: String(form.description).trim(),
      category: form.category,
      paidAt: form.paidAt,
    })
    .then(() => router.push({ name: 'history' }))
    .catch((e) => {
      // lightweight inline error; keep UI simple
      alert(auth.getErrorMessage(e))
    })
}

</script>

<template>
  <div class="pb-2">
    <form
      class="space-y-4 rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark"
      @submit.prevent="submit"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Chi tiêu mới
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Nhập nhanh — tối ưu cho điện thoại
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="payer">Người thanh toán</label>
          <select
            id="payer"
            v-model="form.payerId"
            class="mt-1 h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            :class="touched && errors.payerId ? 'border-rose-400 ring-2 ring-rose-500/15' : ''"
          >
            <option disabled value="">Chọn thành viên</option>
            <option v-for="m in membersUi" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
          <p v-if="touched && errors.payerId" class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {{ errors.payerId }}
          </p>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="amount">Số tiền (VND)</label>
          <input
            id="amount"
            v-model="formattedAmount"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Ví dụ: 125000"
            class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            :class="touched && errors.amount ? 'border-rose-400 ring-2 ring-rose-500/15' : ''"
          />
          <p v-if="touched && errors.amount" class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {{ errors.amount }}
          </p>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="desc">Nội dung</label>
          <textarea
            id="desc"
            v-model="form.description"
            rows="4"
            placeholder="Mô tả ngắn (ví dụ: đi chợ, tiền điện…)"
            class="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            :class="touched && errors.description ? 'border-rose-400 ring-2 ring-rose-500/15' : ''"
          />
          <p v-if="touched && errors.description" class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {{ errors.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="cat">Danh mục</label>
            <select
              id="cat"
              v-model="form.category"
              class="mt-1 h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              :class="touched && errors.category ? 'border-rose-400 ring-2 ring-rose-500/15' : ''"
            >
              <option disabled value="">Chọn danh mục</option>
              <option v-for="c in categories" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
            <p v-if="touched && errors.category" class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {{ errors.category }}
            </p>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="day">Ngày thanh toán</label>
            <input
              id="day"
              v-model="form.paidAt"
              type="date"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              :class="touched && errors.paidAt ? 'border-rose-400 ring-2 ring-rose-500/15' : ''"
            />
            <p v-if="touched && errors.paidAt" class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {{ errors.paidAt }}
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-600 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        Lưu giao dịch
      </button>
      <p v-if="touched && !isValid" class="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
        Vui lòng kiểm tra các trường được đánh dấu.
      </p>
    </form>
  </div>
</template>

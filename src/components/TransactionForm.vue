<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import { storeToRefs } from 'pinia'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import type { Expense } from '@/types/wallet'

const props = defineProps<{
  initialData?: Partial<Expense>
  isEditing?: boolean
}>()

const emit = defineEmits<{
  submit: [data: { payerUserId: string, amount: number, category: string, description: string, paidAt: string }]
  cancel: []
}>()

const store = useWalletStore()
const auth = useAuthStore()
const { membersUi } = storeToRefs(store)
const categories = store.categories

const form = reactive({
  payerId: props.initialData?.payerId ?? '',
  amount: props.initialData?.amount ?? '' as string | number,
  description: props.initialData?.description ?? '',
  category: props.initialData?.category ?? categories[0] ?? '',
  paidAt: props.initialData?.paidAt ?? format(new Date(), 'yyyy-MM-dd'),
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

function handleSubmit() {
  touched.value = true
  if (!isValid.value) return
  const raw = typeof form.amount === 'string' ? form.amount.replace(/\s/g, '').replace(',', '.') : String(form.amount)
  const amount = Math.round(Number(raw))
  
  emit('submit', {
    payerUserId: form.payerId,
    amount,
    description: String(form.description).trim(),
    category: form.category,
    paidAt: form.paidAt,
  })
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="handleSubmit"
  >
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
          rows="3"
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

    <div class="flex gap-3">
      <button
        v-if="isEditing"
        type="button"
        class="h-14 flex-1 cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        @click="emit('cancel')"
      >
        Hủy
      </button>
      <button
        type="submit"
        class="flex h-14 flex-[2] cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-600 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        {{ isEditing ? 'Cập nhật' : 'Lưu giao dịch' }}
      </button>
    </div>
    <p v-if="touched && !isValid" class="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
      Vui lòng kiểm tra các trường được đánh dấu.
    </p>
  </form>
</template>

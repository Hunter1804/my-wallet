<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { parseISO } from 'date-fns'
import { useWalletStore } from '@/stores/wallet'
import type { HistoryFilters } from '@/types/wallet'
import { useAuthStore } from '@/stores/auth'
import Modal from '@/components/Modal.vue'
import TransactionForm from '@/components/TransactionForm.vue'
import type { Expense } from '@/types/wallet'

const store = useWalletStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { membersUi, expensesUi } = storeToRefs(store)
const categories = store.categories

const year = ref<number | 'all'>('all')
const month = ref<number | 'all'>('all')
const memberId = ref<string | 'all'>('all')
const category = ref<string | 'all'>('all')

function syncFiltersFromQuery() {
  if (route.query.year) year.value = route.query.year === 'all' ? 'all' : Number(route.query.year)
  else year.value = 'all'

  if (route.query.month) month.value = route.query.month === 'all' ? 'all' : Number(route.query.month)
  else month.value = 'all'

  if (route.query.memberId) memberId.value = route.query.memberId as string
  else memberId.value = 'all'

  if (route.query.category) category.value = route.query.category as string
  else category.value = 'all'
}

onMounted(() => {
  void store.refreshMembers()
  void store.refreshSettings()
  syncFiltersFromQuery()
  void store.refreshExpenses(filters.value)
})

// Watch for URL changes (back/forward navigation)
watch(
  () => route.query,
  () => {
    syncFiltersFromQuery()
  },
  { deep: true }
)

const filters = computed<HistoryFilters>(() => ({
  year: year.value,
  month: month.value,
  memberId: memberId.value,
  category: category.value,
}))

watch(
  filters,
  (f) => {
    void store.refreshExpenses(f)
    // Update URL query params only if they differ from current filters to avoid redundant history entries
    const currentQuery = { ...route.query }
    const nextQuery: any = {
      ...currentQuery,
      year: f.year === 'all' ? undefined : String(f.year),
      month: f.month === 'all' ? undefined : String(f.month),
      memberId: f.memberId === 'all' ? undefined : f.memberId,
      category: f.category === 'all' ? undefined : f.category,
    }

    // Stringify comparison to see if we actually need to replace
    if (JSON.stringify(currentQuery) !== JSON.stringify(nextQuery)) {
      void router.replace({ query: nextQuery })
    }
  },
  { deep: true },
)

const list = computed(() =>
  expensesUi.value.slice().sort((a, b) => parseISO(b.paidAt).getTime() - parseISO(a.paidAt).getTime()),
)

const totalFiltered = computed(() => list.value.reduce((s, e) => s + e.amount, 0))

const yearOptions = computed(() => {
  const cur = new Date().getFullYear()
  return Array.from({ length: 8 }, (_, i) => cur - i)
})

function resetFilters() {
  year.value = 'all'
  month.value = 'all'
  memberId.value = 'all'
  category.value = 'all'
}

function onDelete(id: string) {
  if (!confirm('Xóa giao dịch này?')) return
  store.deleteExpense(id).catch((e) => alert(auth.getErrorMessage(e)))
}

const editingExpense = ref<Expense | null>(null)
const showEditModal = ref(false)

function onEdit(expense: Expense) {
  editingExpense.value = expense
  showEditModal.value = true
}

function handleUpdate(data: any) {
  if (!editingExpense.value) return
  store
    .updateExpense(editingExpense.value.id, data)
    .then(() => {
      showEditModal.value = false
      editingExpense.value = null
    })
    .catch((e) => alert(auth.getErrorMessage(e)))
}
</script>

<template>
  <div class="space-y-4 pb-2">
    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Bộ lọc
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Lọc theo năm, tháng, thành viên và danh mục
          </p>
        </div>
        <button
          type="button"
          class="cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary-300 hover:text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-primary-500/40"
          @click="resetFilters"
        >
          Xóa lọc
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Năm
          <select
            v-model="year"
            class="h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option :value="'all'">Tất cả</option>
            <option v-for="y in yearOptions" :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Tháng
          <select
            v-model="month"
            class="h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option :value="'all'">Tất cả</option>
            <option v-for="m in 12" :key="m" :value="m - 1">
              Tháng {{ m }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Thành viên
          <select
            v-model="memberId"
            class="h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option :value="'all'">Tất cả</option>
            <option v-for="m in membersUi" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Danh mục
          <select
            v-model="category"
            class="h-14 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option :value="'all'">Tất cả</option>
            <option v-for="c in categories" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
        </label>
      </div>

      <div
        class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/35"
      >
        <p class="font-semibold text-slate-700 dark:text-slate-200">
          {{ list.length }} giao dịch
        </p>
        <p class="font-display text-base font-semibold text-slate-900 dark:text-white">
          {{ formatCurrencyVnd(totalFiltered) }}
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <TransactionCard
        v-for="e in list"
        :key="e.id"
        :expense="e"
        :payer="(store.memberById(e.payerId) as any)"
        :is-owner="e.payerId === auth.currentUser?.id"
        @delete="onDelete"
        @edit="onEdit"
      />

      <Modal
        :show="showEditModal"
        title="Sửa giao dịch"
        @close="showEditModal = false"
      >
        <TransactionForm
          v-if="editingExpense"
          :initial-data="editingExpense"
          is-editing
          @submit="handleUpdate"
          @cancel="showEditModal = false"
        />
      </Modal>

      <div
        v-if="list.length === 0"
        class="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40"
      >
        <p class="font-semibold text-slate-800 dark:text-slate-100">Không có giao dịch phù hợp</p>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Thử bỏ bớt bộ lọc hoặc thêm chi tiêu mới.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useWalletStore } from '@/stores/wallet'
import StatCard from '@/components/StatCard.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import CategoryDonutChart from '@/components/charts/CategoryDonutChart.vue'
import MemberContributionBar from '@/components/MemberContributionBar.vue'
import { formatCurrencyVnd, formatShortMonthVi } from '@/utils/format'
import { requestPushPermission, disablePush } from '@/services/fcm'
import { useAuthStore } from '@/stores/auth'
import { useStorage } from '@vueuse/core'

const auth = useAuthStore()
const store = useWalletStore()
const router = useRouter()
const { membersUi, currentMonthTotal, monthOverMonthDelta, monthlyBudget, categoryBudgets, categorySpentCurrentMonth, statsYear, statsCategories, statsMembers, categories: expenseCategories } =
  storeToRefs(store)

const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth0 = ref(now.getMonth())

const currentYear = now.getFullYear()
const currentMonth0 = now.getMonth()

onMounted(() => {
  void store.refreshMembers()
  void store.refreshSettings()
  void store.refreshExpenses()
  void store.refreshStatsYear(selectedYear.value)
  void store.refreshStatsCategories(selectedYear.value, selectedMonth0.value + 1)
  void store.refreshStatsMembers(selectedYear.value, selectedMonth0.value + 1)
})

const yearLabels = computed(() =>
  Array.from({ length: 12 }, (_, m) => formatShortMonthVi(m)),
)

watch(
  selectedYear,
  (y) => {
    void store.refreshStatsYear(y)
  },
  { immediate: false },
)

watch(
  () => [selectedYear.value, selectedMonth0.value] as const,
  ([y, m0]) => {
    void store.refreshStatsCategories(y, m0 + 1)
    void store.refreshStatsMembers(y, m0 + 1)
  },
  { immediate: false },
)

const yearData = computed(() => {
  if (!statsYear.value || statsYear.value.year !== selectedYear.value) return Array.from({ length: 12 }, () => 0)
  const arr = Array.from({ length: 12 }, () => 0)
  for (const r of statsYear.value.months) arr[r.month - 1] = r.total
  return arr
})

const rolling = computed(() => {
  // last 6 months from year stats (fallback to 0s)
  const end = new Date()
  const labels: string[] = []
  const data: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    const y = d.getFullYear()
    const m0 = d.getMonth()
    labels.push(`${m0 + 1}/${String(y).slice(2)}`)
    if (statsYear.value?.year === y) data.push(statsYear.value.months[m0]?.total ?? 0)
    else data.push(0)
  }
  return { labels, data }
})

const categoryChart = computed(() => {
  if (!statsCategories.value) return { labels: [], data: [] }
  const rows = statsCategories.value.rows ?? []
  return { labels: rows.map((r) => r.category), data: rows.map((r) => r.total) }
})

const memberTotals = computed(() => {
  const map = new Map<string, number>()
  for (const m of membersUi.value) map.set(m.id, 0)
  const rows = statsMembers.value?.rows ?? []
  for (const r of rows) map.set(r.payerUserId, r.total)
  return map
})

const txCountMonth = computed(() => {
  const y = selectedYear.value
  const m = selectedMonth0.value
  return store.expenses.filter((e) => store.expenseInMonth(e, y, m)).length
})

const txCountCurrentMonth = computed(
  () => store.expenses.filter((e) => store.expenseInMonth(e, currentYear, currentMonth0)).length,
)

const mostCategoryCurrentMonth = computed(() => {
  const map = new Map<string, number>()
  for (const c of store.categories) map.set(c, 0)
  for (const e of store.expenses) {
    if (!store.expenseInMonth(e, currentYear, currentMonth0)) continue
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  let best: { category: string; amount: number } | null = null
  for (const [category, amount] of map) if (!best || amount > best.amount) best = { category, amount }
  return best
})

const memberTotalsCurrentMonth = computed(() => {
  const map = new Map<string, number>()
  for (const m of membersUi.value) map.set(m.id, 0)
  // reuse stats if the selected month equals current month; otherwise fall back to loaded expenses
  if (statsMembers.value && statsMembers.value.year === currentYear && statsMembers.value.month === currentMonth0 + 1) {
    for (const r of statsMembers.value.rows) map.set(r.payerUserId, r.total)
    return map
  }
  for (const e of store.expenses) if (store.expenseInMonth(e, currentYear, currentMonth0)) map.set(e.payerUserId, (map.get(e.payerUserId) ?? 0) + e.amount)
  return map
})

const topSpenderCurrentMonth = computed(() => {
  const map = memberTotalsCurrentMonth.value
  let best: { id: string; amount: number } | null = null
  for (const [id, amount] of map) {
    if (!best || amount > best.amount) best = { id, amount }
  }
  if (!best || best.amount <= 0) return null
  return { member: store.memberById(best.id), amount: best.amount }
})

const yearOptions = computed(() => {
  const cur = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => cur - i)
})

const deltaTrend = computed(() => {
  const d = monthOverMonthDelta.value
  if (d === 0) return { dir: 'flat' as const, text: 'Ổn định' }
  if (d > 0)
    return {
      dir: 'up' as const,
      text: `+${d}% so với tháng trước`,
    }
  return {
    dir: 'down' as const,
    text: `${d}% so với tháng trước`,
  }
})

const budgetEditing = ref(false)
const budgetDraft = ref('')
const categoryBudgetsDraft = ref<Record<string, string>>({})
const budgetViewMode = ref<'total' | 'category'>('total')

const formattedBudget = computed({
  get: () => {
    if (!budgetDraft.value) return ''
    return Number(budgetDraft.value).toLocaleString('vi-VN')
  },
  set: (val: string) => {
    budgetDraft.value = val.replace(/\D/g, '')
  }
})

function formatInput(val: string) {
  const numeric = val.replace(/\D/g, '')
  if (!numeric) return ''
  return Number(numeric).toLocaleString('vi-VN')
}

const budgetUsed = computed(() => currentMonthTotal.value)
const budgetLimit = computed(() => monthlyBudget.value ?? 0)
const budgetPct = computed(() => {
  const limit = budgetLimit.value
  if (!limit) return 0
  return Math.min(100, Math.round((budgetUsed.value / limit) * 100))
})
const budgetRemaining = computed(() => {
  const limit = budgetLimit.value
  if (!limit) return 0
  return Math.max(0, limit - budgetUsed.value)
})
const budgetState = computed(() => {
  const limit = budgetLimit.value
  if (!limit) return 'unset' as const
  if (budgetUsed.value > limit) return 'over' as const
  if (budgetPct.value >= 85) return 'warn' as const
  return 'ok' as const
})

function openBudgetEditor() {
  budgetDraft.value = budgetLimit.value ? String(budgetLimit.value) : ''
  // Initialize category drafts with formatting
  categoryBudgetsDraft.value = {}
  expenseCategories.value.forEach(cat => {
    const val = categoryBudgets.value[cat]
    categoryBudgetsDraft.value[cat] = val ? formatInput(String(val)) : ''
  })
  budgetEditing.value = true
}

function saveBudget() {
  if (budgetViewMode.value === 'total') {
    const raw = budgetDraft.value.replace(/\D/g, '')
    const n = Math.round(Number(raw))
    store.setMonthlyBudget(Number.isFinite(n) ? n : 0)
  } else {
    const newBudgets: Record<string, number> = {}
    Object.entries(categoryBudgetsDraft.value).forEach(([cat, val]) => {
      const n = Math.round(Number(val.replace(/\D/g, '')))
      if (n > 0) newBudgets[cat] = n
    })
    store.setCategoryBudgets(newBudgets)
  }
  budgetEditing.value = false
}

function clearBudget() {
  if (budgetViewMode.value === 'total') {
    store.setMonthlyBudget(0)
  } else {
    store.setCategoryBudgets({})
  }
  budgetEditing.value = false
}

const getCategoryProgress = (category: string) => {
  const spent = categorySpentCurrentMonth.value[category] || 0
  const limit = categoryBudgets.value[category] || 0
  if (!limit) return 0
  return Math.min(100, Math.round((spent / limit) * 100))
}

const getCategoryState = (category: string) => {
  const spent = categorySpentCurrentMonth.value[category] || 0
  const limit = categoryBudgets.value[category] || 0
  if (!limit) return 'unset'
  if (spent > limit) return 'over'
  if ((spent / limit) >= 0.85) return 'warn'
  return 'ok'
}

const pushEnabled = useStorage('sw-push-enabled', false)

function navigateToHistory(f: { year?: number; month?: number; category?: string; memberId?: string }) {
  void router.push({
    name: 'history',
    query: {
      year: f.year,
      month: f.month,
      category: f.category,
      memberId: f.memberId,
    }
  })
}

async function togglePush() {
  if (pushEnabled.value) {
    await disablePush()
    pushEnabled.value = false
    alert("Đã tắt thông báo!")
  } else {
    if (auth.familyId) {
      await requestPushPermission(auth.familyId)
      pushEnabled.value = true
      alert("Đã kết nối thông báo thành công!")
    }
  }
}
</script>

<template>
  <div class="space-y-5 pb-2">
    <section
      class="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-primary-500/95 via-sky-500/90 to-cyan-600/95 p-5 text-white shadow-lg shadow-primary-500/25 dark:border-white/10 dark:from-primary-600/55 dark:via-sky-700/45 dark:to-cyan-900/40"
    >
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] opacity-70" />
      <div class="relative">
        <p class="text-xs font-semibold uppercase tracking-wide text-white/85">
          Chi tiêu tháng này
        </p>
        <p class="mt-2 font-display text-4xl font-semibold tracking-tight">
          {{ formatCurrencyVnd(currentMonthTotal) }}
        </p>
        <p class="mt-1 text-sm text-white/85">
          {{ deltaTrend.text }}
        </p>
      </div>
    </section>

    <section
      class="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark"
    >
      <div
        class="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary-500/10 blur-2xl dark:bg-primary-400/10"
        aria-hidden="true"
      />
      <div class="relative">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Hạn mức chi tiêu
              </p>
              <div class="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  class="px-2 py-0.5 text-[10px] font-bold rounded-md transition-all"
                  :class="budgetViewMode === 'total' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500'"
                  @click="budgetViewMode = 'total'"
                >
                  Tổng
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 text-[10px] font-bold rounded-md transition-all"
                  :class="budgetViewMode === 'category' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500'"
                  @click="budgetViewMode = 'category'"
                >
                  Hạng mục
                </button>
              </div>
            </div>

            <div v-if="budgetViewMode === 'total'">
              <h2 class="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                {{
                  budgetLimit
                    ? `${formatCurrencyVnd(budgetUsed)} / ${formatCurrencyVnd(budgetLimit)}`
                    : 'Chưa đặt hạn mức'
                }}
              </h2>
              <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
                <span v-if="budgetState === 'unset'">Đặt hạn mức để theo dõi và kiểm soát chi tiêu tháng.</span>
                <span v-else-if="budgetState === 'over'">Bạn đã vượt hạn mức. Xem lại lịch sử để tối ưu.</span>
                <span v-else-if="budgetState === 'warn'">Sắp chạm hạn mức. Cân nhắc điều chỉnh kế hoạch.</span>
                <span v-else>Còn lại {{ formatCurrencyVnd(budgetRemaining) }}.</span>
              </p>
            </div>
            <div v-else>
              <h2 class="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                Theo hạng mục
              </h2>
              <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Chi tiết hạn mức riêng cho từng mục chi tiêu.
              </p>
            </div>
          </div>

          <button
            v-if="!budgetEditing"
            type="button"
            class="cursor-pointer rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            @click="openBudgetEditor"
          >
            {{ (budgetViewMode === 'total' ? budgetLimit : Object.keys(categoryBudgets).length) ? 'Chỉnh' : 'Đặt' }}
          </button>
        </div>

        <!-- Total View Progress -->
        <div v-if="budgetViewMode === 'total'" class="mt-4">
          <div class="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              class="h-full rounded-full transition-[width] duration-500 ease-out"
              :class="
                budgetState === 'over'
                  ? 'bg-rose-500'
                  : budgetState === 'warn'
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-primary-500 to-sky-500'
              "
              :style="{ width: `${budgetPct}%` }"
            />
          </div>
          <div class="mt-2 flex items-center justify-between text-xs font-semibold">
            <span class="text-slate-600 dark:text-slate-300">{{ budgetPct }}%</span>
            <span class="text-slate-500 dark:text-slate-400">Tháng hiện tại</span>
          </div>
        </div>

        <!-- Category View Progress -->
        <div v-else class="mt-4 space-y-3">
          <div v-for="cat in expenseCategories" :key="cat">
            <template v-if="categoryBudgets[cat]">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{{ cat }}</span>
                <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {{ formatCurrencyVnd(categorySpentCurrentMonth[cat] || 0) }} / {{ formatCurrencyVnd(categoryBudgets[cat]) }}
                </span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full rounded-full transition-[width] duration-500 ease-out"
                  :class="
                    getCategoryState(cat) === 'over'
                      ? 'bg-rose-500'
                      : getCategoryState(cat) === 'warn'
                        ? 'bg-amber-500'
                        : 'bg-primary-500'
                  "
                  :style="{ width: `${getCategoryProgress(cat)}%` }"
                />
              </div>
            </template>
          </div>
          <div v-if="Object.keys(categoryBudgets).length === 0" class="py-4 text-center">
             <p class="text-xs text-slate-500 italic">Chưa có hạn mức hạng mục nào được thiết lập.</p>
          </div>
        </div>

        <!-- Editor Modal -->
        <div
          v-if="budgetEditing"
          class="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/35"
        >
          <div v-if="budgetViewMode === 'total'">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 block" for="budget">Hạn mức tổng (VND)</label>
            <input
              id="budget"
              v-model="formattedBudget"
              inputmode="numeric"
              placeholder="Ví dụ: 8,000,000"
              class="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              @keyup.enter="saveBudget"
            />
          </div>
          <div v-else class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            <div v-for="cat in expenseCategories" :key="`edit-${cat}`">
              <label class="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase block mb-1" :for="`budget-${cat}`">{{ cat }}</label>
              <input
                :id="`budget-${cat}`"
                v-model="categoryBudgetsDraft[cat]"
                inputmode="numeric"
                placeholder="0"
                class="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                @input="categoryBudgetsDraft[cat] = formatInput(String(categoryBudgetsDraft[cat]))"
              />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="h-12 flex-1 min-w-[80px] cursor-pointer rounded-xl bg-primary-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              @click="saveBudget"
            >
              Lưu
            </button>
            <button
              type="button"
              class="h-12 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
              @click="budgetEditing = false"
            >
              Hủy
            </button>
            <button
              v-if="(budgetViewMode === 'total' ? budgetLimit : Object.keys(categoryBudgets).length)"
              type="button"
              class="h-12 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
              @click="clearBudget"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Giao dịch tháng này"
        :value="`${txCountCurrentMonth} lần`"
        hint="Số lần ghi nhận trong tháng hiện tại."
        clickable
        @click="navigateToHistory({ year: currentYear, month: currentMonth0 })"
      />
      <StatCard
        label="Hạng mục nổi bật"
        :value="mostCategoryCurrentMonth && mostCategoryCurrentMonth.amount > 0 ? mostCategoryCurrentMonth.category : '—'"
        :hint="
          mostCategoryCurrentMonth && mostCategoryCurrentMonth.amount > 0
            ? formatCurrencyVnd(mostCategoryCurrentMonth.amount)
            : 'Chưa có dữ liệu cho tháng này'
        "
        :clickable="!!(mostCategoryCurrentMonth && mostCategoryCurrentMonth.amount > 0)"
        @click="mostCategoryCurrentMonth && navigateToHistory({ category: mostCategoryCurrentMonth.category })"
      />
      <StatCard
        label="Thành viên chi nhiều nhất"
        :value="topSpenderCurrentMonth?.member ? topSpenderCurrentMonth.member.name : '—'"
        :hint="
          topSpenderCurrentMonth
            ? formatCurrencyVnd(topSpenderCurrentMonth.amount)
            : 'Chưa có dữ liệu cho tháng này'
        "
        :clickable="!!topSpenderCurrentMonth"
        @click="topSpenderCurrentMonth && navigateToHistory({ memberId: topSpenderCurrentMonth.member?.id })"
      />
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Nhận Thông Báo
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Ting ting khi gia đình thêm chi tiêu.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 cursor-pointer rounded-2xl px-4 py-2 text-xs font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          :class="pushEnabled ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 focus-visible:outline-slate-500' : 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600'"
          @click="togglePush"
        >
          {{ pushEnabled ? 'Tắt Thông Báo' : 'Bật Thông Báo' }}
        </button>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Xu hướng 6 tháng
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tổng chi theo tháng (gần nhất)
          </p>
        </div>
      </div>
      <div class="mt-4">
        <TrendLineChart :labels="rolling.labels" :data="rolling.data" />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Theo năm
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tổng chi theo từng tháng trong năm
          </p>
        </div>
        <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Năm
          <select
            v-model.number="selectedYear"
            class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option v-for="y in yearOptions" :key="y" :value="y">
              {{ y }}
            </option>
          </select>
        </label>
      </div>
      <div class="mt-4">
        <TrendLineChart :labels="yearLabels" :data="yearData" />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Phân bổ danh mục
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Chọn tháng để xem tỷ trọng chi tiêu
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Tháng
            <select
              v-model.number="selectedMonth0"
              class="h-14 min-w-[8.5rem] cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option v-for="m in 12" :key="m" :value="m - 1">
                Tháng {{ m }}
              </option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Năm
            <select
              v-model.number="selectedYear"
              class="h-14 min-w-[8.5rem] cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option v-for="y in yearOptions" :key="`y2-${y}`" :value="y">
                {{ y }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div class="mt-4">
        <CategoryDonutChart
          v-if="categoryChart.labels.length"
          :labels="categoryChart.labels"
          :data="categoryChart.data"
        />
        <p v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
          Chưa có chi tiêu trong tháng này.
        </p>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex items-end justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Đóng góp theo thành viên
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Tổng chi theo người thanh toán (tháng đang xem ở phần trên)
          </p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {{ txCountMonth }} giao dịch
        </span>
      </div>
      <div class="mt-4">
        <MemberContributionBar :members="membersUi" :amounts="memberTotals" />
      </div>
    </section>
  </div>
</template>

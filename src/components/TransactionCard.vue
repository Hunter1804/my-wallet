<script setup lang="ts">
import { computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Expense, Member } from '@/types/wallet'
import { formatCurrencyVnd } from '@/utils/format'
import { memberAccentDotClass, memberAccentSoftClass } from '@/utils/memberAccent'

const props = defineProps<{
  expense: Expense
  payer?: Member
  isOwner?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const when = computed(() =>
  format(parseISO(props.expense.paidAt), 'EEE, d MMM yyyy', { locale: vi }),
)
</script>

<template>
  <article
    class="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur transition duration-200 hover:border-primary-200/80 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900/55 dark:hover:border-primary-500/25 dark:hover:shadow-soft-dark"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 max-w-full items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="payer ? memberAccentSoftClass(payer.accent) : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'"
          >
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :class="payer ? memberAccentDotClass(payer.accent) : 'bg-slate-400'"
              aria-hidden="true"
            />
            <span class="truncate">{{ payer?.name ?? 'Thành viên' }}</span>
          </span>
          <span
            class="inline-flex max-w-[10rem] items-center truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {{ expense.category }}
          </span>
        </div>
        <p class="mt-2 text-base font-semibold text-slate-900 dark:text-white">
          {{ expense.description }}
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {{ when }}
        </p>
      </div>

      <div class="shrink-0 text-right">
        <p class="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {{ formatCurrencyVnd(expense.amount) }}
        </p>
        <button
          type="button"
          class="mt-2 cursor-pointer text-xs font-semibold text-rose-600 transition hover:text-rose-700 focus-visible:outline-none dark:text-rose-400 dark:hover:text-rose-300"
          :class="isOwner ? 'opacity-100' : ''"
          @click="emit('delete', expense.id)"
        >
          Xóa
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Member } from '@/types/wallet'
import { formatCurrencyVnd } from '@/utils/format'
import { memberAccentDotClass } from '@/utils/memberAccent'

const props = defineProps<{
  members: Member[]
  amounts: Map<string, number>
}>()

const rows = computed(() => {
  const list = props.members.map((m) => ({
    member: m,
    amount: props.amounts.get(m.id) ?? 0,
  }))
  const sum = list.reduce((s, r) => s + r.amount, 0)
  return list.map((r) => ({
    ...r,
    pct: sum > 0 ? Math.round((r.amount / sum) * 100) : 0,
  }))
})
</script>

<template>
  <div class="space-y-3">
    <div v-for="row in rows" :key="row.member.id" class="space-y-2">
      <div class="flex items-center justify-between gap-3 text-sm">
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :class="memberAccentDotClass(row.member.accent)"
            aria-hidden="true"
          />
          <span class="truncate font-semibold text-slate-800 dark:text-slate-100">
            {{ row.member.name }}
          </span>
        </div>
        <span class="shrink-0 font-display text-sm font-semibold text-slate-900 dark:text-white">
          {{ formatCurrencyVnd(row.amount) }}
        </span>
      </div>
      <div class="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          class="h-full rounded-full bg-gradient-to-r from-primary-500 to-sky-500 transition-[width] duration-500 ease-out"
          :style="{ width: `${row.pct}%` }"
        />
      </div>
    </div>
  </div>
</template>

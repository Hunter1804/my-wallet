<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import type { ItineraryItem, ItineraryItemType } from '@/stores/itinerary'

const props = defineProps<{
  initialData?: Partial<ItineraryItem>
  isEditing?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Omit<ItineraryItem, 'id' | 'order'>]
  cancel: []
}>()

const itemTypes: { value: ItineraryItemType; label: string; emoji: string }[] = [
  { value: 'morning', label: 'Sáng', emoji: '🌅' },
  { value: 'lunch', label: 'Trưa', emoji: '🍴' },
  { value: 'dinner', label: 'Tối', emoji: '🌙' },
  { value: 'cafe', label: 'Café', emoji: '☕' },
  { value: 'sight', label: 'Tham quan', emoji: '📍' },
  { value: 'move', label: 'Di chuyển', emoji: '🚌' },
  { value: 'shop', label: 'Mua sắm', emoji: '🛍️' },
]

const form = reactive({
  day: props.initialData?.day ?? 1,
  time: props.initialData?.time ?? '08:00',
  type: props.initialData?.type ?? 'sight',
  name: props.initialData?.name ?? '',
  addr: props.initialData?.addr ?? '',
  note: props.initialData?.note ?? '',
  cost: props.initialData?.cost ?? '',
})

const touched = ref(false)

const errors = computed(() => {
  const e: Record<string, string> = {}
  if (!form.name.trim()) e.name = 'Nhập tên địa điểm/hoạt động'
  if (!form.time) e.time = 'Chọn thời gian'
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

function handleSubmit() {
  touched.value = true
  if (!isValid.value) return
  
  emit('submit', {
    day: form.day,
    time: form.time,
    type: form.type,
    name: form.name.trim(),
    addr: form.addr.trim(),
    note: form.note.trim(),
    cost: form.cost.trim(),
    visited: props.initialData?.visited ?? false
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày</label>
        <select v-model="form.day" class="mt-1 w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white">
          <option :value="1">Ngày 1</option>
          <option :value="2">Ngày 2</option>
          <option :value="3">Ngày 3</option>
          <option :value="4">Ngày 4</option>
          <option :value="5">Ngày 5</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</label>
        <input v-model="form.time" type="time" class="mt-1 w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white" :class="touched && errors.time ? 'border-rose-400' : ''" />
      </div>
    </div>

    <div>
      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại hoạt động</label>
      <div class="mt-2 flex flex-wrap gap-2">
        <button v-for="t in itemTypes" :key="t.value" type="button" @click="form.type = t.value" class="h-9 px-3 rounded-full text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5" :class="form.type === t.value ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'">
          <span>{{ t.emoji }}</span>
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>

    <div>
      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên địa điểm / Hoạt động</label>
      <input v-model="form.name" placeholder="Ví dụ: Nhà thờ Đá Sapa" class="mt-1 w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white" :class="touched && errors.name ? 'border-rose-400' : ''" />
      <p v-if="touched && errors.name" class="mt-1 text-[10px] font-bold text-rose-500 uppercase">{{ errors.name }}</p>
    </div>

    <div>
      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ (không bắt buộc)</label>
      <input v-model="form.addr" placeholder="Ví dụ: TT. Sapa" class="mt-1 w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
    </div>

    <div>
      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú / Mẹo</label>
      <textarea v-model="form.note" rows="2" placeholder="Ví dụ: Đi sớm để ngắm sương mù..." class="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white resize-none"></textarea>
    </div>

    <div>
      <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí bác tính</label>
      <input v-model="form.cost" placeholder="Ví dụ: 30K - 50K hoặc Miễn phí" class="mt-1 w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
    </div>

    <div class="flex gap-3 pt-2">
      <button type="button" @click="emit('cancel')" class="flex-1 h-12 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
        Hủy
      </button>
      <button type="submit" class="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-sm text-white shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-[0.98] transition-all">
        {{ isEditing ? 'Cập nhật' : 'Thêm hoạt động' }}
      </button>
    </div>
  </form>
</template>

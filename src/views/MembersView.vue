<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWalletStore } from '@/stores/wallet'
import { useAuthStore } from '@/stores/auth'
import { formatCurrencyVnd } from '@/utils/format'
import { memberAccentDotClass, memberAccentSoftClass } from '@/utils/memberAccent'

const store = useWalletStore()
const { membersUi, familyName } = storeToRefs(store)
const auth = useAuthStore()

onMounted(() => {
  void store.refreshMembers()
  void store.refreshSettings()
})

const newName = ref('')
const newPhone = ref('')
const newPassword = ref('')
const newAccent = ref<'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'>('sky')
const addError = ref('')
const adding = ref(false)

const pinEditing = ref(false)
const pinCurrent = ref('')
const pinNext = ref('')
const pinConfirm = ref('')
const pinError = ref('')

const hasPin = ref(true)

function openPinEditor() {
  pinEditing.value = true
  pinCurrent.value = ''
  pinNext.value = ''
  pinConfirm.value = ''
  pinError.value = ''
}

function cancelPinEditor() {
  pinEditing.value = false
  pinCurrent.value = ''
  pinNext.value = ''
  pinConfirm.value = ''
  pinError.value = ''
}

function isPin4(v: string) {
  return /^\d{4}$/.test(v)
}

async function savePin() {
  pinError.value = ''
  if (hasPin.value) {
    if (!isPin4(pinCurrent.value)) {
      pinError.value = 'Nhập PIN hiện tại (4 số).'
      return
    }
  }

  if (!isPin4(pinNext.value)) {
    pinError.value = 'PIN mới phải gồm 4 số.'
    return
  }
  if (pinConfirm.value !== pinNext.value) {
    pinError.value = 'Xác nhận PIN không khớp.'
    return
  }

  try {
    if (hasPin.value) {
      await store.changeFamilyPin(pinCurrent.value, pinNext.value)
    } else {
      await store.changeFamilyPin('0000', pinNext.value)
      hasPin.value = true
    }
  } catch (e) {
    pinError.value = auth.getErrorMessage(e)
    return
  }

  cancelPinEditor()
}

const now = new Date()
const cy = now.getFullYear()
const cm = now.getMonth()

const rows = computed(() =>
  membersUi.value.map((m) => {
    const paid = store.expenses
      .filter((e) => e.payerUserId === m.id && store.expenseInMonth(e, cy, cm))
      .reduce((s, e) => s + e.amount, 0)
    const count = store.expenses.filter((e) => e.payerUserId === m.id && store.expenseInMonth(e, cy, cm)).length
    return { member: m, paid, count }
  }),
)

function add() {
  addError.value = ''
  const nickname = newName.value.trim()
  const phone = newPhone.value.trim()
  const password = newPassword.value
  if (!nickname) {
    addError.value = 'Nhập tên hiển thị (nickname).'
    return
  }
  if (!phone) {
    addError.value = 'Nhập số điện thoại.'
    return
  }
  if (!password || password.length < 6) {
    addError.value = 'Mật khẩu tối thiểu 6 ký tự.'
    return
  }
  adding.value = true
  store
    .createMember({
      phone,
      password,
      displayName: nickname,
      nickname,
      accent: newAccent.value,
    })
    .then(() => {
      newName.value = ''
      newPhone.value = ''
      newPassword.value = ''
      newAccent.value = 'sky'
    })
    .catch((e) => {
      addError.value = auth.getErrorMessage(e)
    })
    .finally(() => {
      adding.value = false
    })
}

function remove(id: string) {
  if (!confirm('Xóa thành viên?')) return
  store.removeMember(id).catch((e) => alert(auth.getErrorMessage(e)))
}

function renameMember(id: string, ev: Event) {
  const el = ev.target as HTMLInputElement
  store.updateNickname(id, el.value).catch((e) => alert(auth.getErrorMessage(e)))
}
</script>

<template>
  <div class="space-y-4 pb-2">
    <section class="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
        Tên gia đình
      </h2>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Hiển thị ở phần tiêu đề trên cùng để cá nhân hóa ví chung.
      </p>
      <div class="mt-4">
        <label class="sr-only" for="family-name">Tên gia đình</label>
        <input
          id="family-name"
          v-model="familyName"
          type="text"
          autocomplete="organization"
          placeholder="Ví dụ: Gia đình Phạm"
          class="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Cài đặt mã PIN
          </h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ hasPin ? 'Đổi PIN khi cần.' : 'Thiết lập PIN để bảo vệ ví.' }}
          </p>
        </div>

        <button
          v-if="!pinEditing"
          type="button"
          class="h-14 shrink-0 cursor-pointer rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          @click="openPinEditor"
        >
          {{ hasPin ? 'Đổi PIN' : 'Đặt PIN' }}
        </button>
      </div>

      <div
        v-if="pinEditing"
        class="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/35"
      >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div v-if="hasPin" class="sm:col-span-1">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="pin-current">
              PIN hiện tại
            </label>
            <input
              id="pin-current"
              v-model="pinCurrent"
              inputmode="numeric"
              autocomplete="current-password"
              placeholder="••••"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold tracking-[0.35em] text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxlength="4"
            />
          </div>

          <div class="sm:col-span-1">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="pin-next">
              PIN mới
            </label>
            <input
              id="pin-next"
              v-model="pinNext"
              inputmode="numeric"
              autocomplete="new-password"
              placeholder="••••"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold tracking-[0.35em] text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxlength="4"
            />
          </div>

          <div class="sm:col-span-1">
            <label class="text-xs font-semibold text-slate-700 dark:text-slate-200" for="pin-confirm">
              Xác nhận
            </label>
            <input
              id="pin-confirm"
              v-model="pinConfirm"
              inputmode="numeric"
              autocomplete="new-password"
              placeholder="••••"
              class="mt-1 h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-base font-semibold tracking-[0.35em] text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxlength="4"
              @keyup.enter="savePin"
            />
          </div>
        </div>

        <p v-if="pinError" class="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {{ pinError }}
        </p>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="h-14 cursor-pointer rounded-2xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            @click="savePin"
          >
            Lưu
          </button>
          <button
            type="button"
            class="h-14 cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600"
            @click="cancelPinEditor"
          >
            Hủy
          </button>
          <!-- remove PIN not supported on backend yet -->
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-soft-dark">
      <h2 class="font-display text-lg font-semibold text-slate-900 dark:text-white">
        Thêm thành viên
      </h2>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Ví chung hoạt động tốt nhất khi mọi người đều được ghi nhận.
      </p>
      <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div class="sm:col-span-1">
          <label class="sr-only" for="new-nickname">Tên hiển thị</label>
          <input
            id="new-nickname"
            v-model="newName"
            type="text"
            autocomplete="name"
            placeholder="Tên hiển thị (ví dụ: Chi)"
            class="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div class="sm:col-span-1">
          <label class="sr-only" for="new-phone">Số điện thoại</label>
          <input
            id="new-phone"
            v-model="newPhone"
            inputmode="tel"
            autocomplete="tel"
            placeholder="Số điện thoại"
            class="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div class="sm:col-span-1">
          <label class="sr-only" for="new-password">Mật khẩu</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Mật khẩu (>= 6 ký tự)"
            class="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            @keyup.enter="add"
          />
        </div>
        <div class="sm:col-span-1">
          <label class="sr-only" for="new-accent">Accent</label>
          <select
            id="new-accent"
            v-model="newAccent"
            class="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="sky">Sky</option>
            <option value="emerald">Emerald</option>
            <option value="violet">Violet</option>
            <option value="amber">Amber</option>
            <option value="rose">Rose</option>
            <option value="cyan">Cyan</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <button
            type="button"
            class="h-14 w-full cursor-pointer rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            :disabled="adding"
            @click="add"
          >
            {{ adding ? 'Đang thêm…' : 'Thêm thành viên' }}
          </button>
          <p v-if="addError" class="mt-2 text-center text-sm font-semibold text-rose-600 dark:text-rose-400">
            {{ addError }}
          </p>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <article
        v-for="row in rows"
        :key="row.member.id"
        class="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur transition hover:border-primary-200/70 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900/55 dark:hover:border-primary-500/25 dark:hover:shadow-soft-dark"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="memberAccentSoftClass(row.member.accent)"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="memberAccentDotClass(row.member.accent)"
                  aria-hidden="true"
                />
                <input
                  :value="row.member.name"
                  class="w-[min(16rem,70vw)] bg-transparent text-sm font-semibold text-slate-900 outline-none ring-0 placeholder:text-slate-400 dark:text-white"
                  aria-label="Tên thành viên"
                  @change="renameMember(row.member.id, $event)"
                />
              </span>
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {{ row.count }} giao dịch · tháng này
              </span>
            </div>
            <p class="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {{ formatCurrencyVnd(row.paid) }}
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tổng chi trả bởi thành viên (tháng hiện tại)
            </p>
          </div>

          <button
            v-if="row.member.id !== auth.currentUser?.id"
            type="button"
            class="cursor-pointer rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
            @click="remove(row.member.id)"
          >
            Xóa
          </button>
        </div>
      </article>

      <div
        v-if="membersUi.length === 0"
        class="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900/40"
      >
        <p class="font-semibold text-slate-800 dark:text-slate-100">Chưa có thành viên</p>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">Thêm ít nhất một người để bắt đầu ghi chi tiêu.</p>
      </div>
    </section>
  </div>
</template>

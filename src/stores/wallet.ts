import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { parseISO, subMonths } from 'date-fns'
import { db } from '@/services/firebase'
import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, addDoc, setDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { EXPENSE_CATEGORIES } from '@/constants/categories'
import { useAuthStore } from './auth'
import type { Expense, HistoryFilters, Member } from '@/types/wallet'

export type MemberAccent = 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'

export type ApiMember = {
  userId: string
  phone: string
  displayName: string
  role: 'owner' | 'member'
  nickname: string
  accent: MemberAccent
}

export type ApiExpense = {
  _id: string
  payerUserId: string
  amount: number
  currency: string
  category: string
  description: string
  paidAt: string
  paidYear: number
  paidMonth: number
}

export const useWalletStore = defineStore('wallet', () => {
  const authStore = useAuthStore()

  // family name – populated from Firestore
  const familyName = ref<string>('')

  const members = ref<ApiMember[]>([])
  const expenses = ref<ApiExpense[]>([])
  const categories = ref<string[]>([...EXPENSE_CATEGORIES])
  const monthlyBudget = ref<number>(0)
  const categoryBudgets = ref<Record<string, number>>({})

  const statsYear = ref<{ year: number; months: { month: number; total: number }[] } | null>(null)
  const statsCategories = ref<{ year: number; month: number; rows: { category: string; total: number }[] } | null>(null)
  const statsMembers = ref<{ year: number; month: number; rows: { payerUserId: string; total: number; count: number }[] } | null>(null)

  const membersUi = computed<Member[]>(() =>
    members.value.map((m) => ({ id: m.userId, name: m.nickname || m.displayName, accent: m.accent })),
  )

  const expensesUi = computed<Expense[]>(() =>
    expenses.value.map((e) => ({
      id: e._id,
      payerId: e.payerUserId,
      amount: e.amount,
      description: e.description,
      category: e.category,
      paidAt: e.paidAt.slice(0, 10),
    })),
  )

  const getFamilyId = () => {
    if (!authStore.familyId) throw new Error('No family loaded')
    return authStore.familyId
  }

  async function refreshMembers() {
    try {
      const qs = query(collection(db, 'families', getFamilyId(), 'member_profiles'))
      const snap = await getDocs(qs)
      const list: ApiMember[] = []
      
      // We also need the base user info (displayName, phone), which requires fetching from users col
      for (const docSnap of snap.docs) {
        const profile = docSnap.data()
        const userSnap = await getDoc(doc(db, 'users', docSnap.id))
        const user = userSnap.exists() ? userSnap.data() : { displayName: 'Unknown', phone: 'N/A', role: 'member' }
        
        list.push({
          userId: docSnap.id,
          nickname: profile.nickname,
          accent: profile.accent,
          displayName: user.displayName,
          phone: user.phone,
          role: user.role as any
        })
      }
      members.value = list
    } catch {
       members.value = []
    }
  }

  async function refreshSettings() {
    try {
      const snap = await getDoc(doc(db, 'families', getFamilyId()))
      if (snap.exists()) {
        const data = snap.data()
        // Load family name from DB
        if (data.name) familyName.value = data.name
        if (data.settings) {
          const s = data.settings
          monthlyBudget.value = s.monthlyBudget || 0
          categoryBudgets.value = s.categoryBudgets || {}
          categories.value = s.categories?.length ? s.categories : [...EXPENSE_CATEGORIES]
        }
      }
    } catch {
      //
    }
  }

  async function updateFamilyName(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    await updateDoc(doc(db, 'families', getFamilyId()), { name: trimmed })
    familyName.value = trimmed
  }

  async function refreshExpenses(filters?: Partial<HistoryFilters>) {
    try {
      const ref = collection(db, 'families', getFamilyId(), 'expenses')
      let q = query(ref)
      
      // In Firestore, you need composite indexes for multiple where clauses. 
      // This is simplified. 
      if (filters?.year && filters.year !== 'all') q = query(q, where('paidYear', '==', filters.year))
      if (filters?.month && filters.month !== 'all') q = query(q, where('paidMonth', '==', Number(filters.month) + 1))
      if (filters?.category && filters.category !== 'all') q = query(q, where('category', '==', filters.category))
      if (filters?.memberId && filters.memberId !== 'all') q = query(q, where('payerUserId', '==', filters.memberId))

      const snap = await getDocs(q)
      const parsedExpenses = snap.docs.map(doc => {
        const dt = doc.data()
        
        let convertedPaidAt = new Date().toISOString()
        if (dt.paidAt?.toDate) convertedPaidAt = dt.paidAt.toDate().toISOString()
        else if (typeof dt.paidAt === 'string') convertedPaidAt = dt.paidAt

        return {
           _id: doc.id,
           payerUserId: dt.payerUserId,
           amount: dt.amount,
           currency: dt.currency,
           category: dt.category,
           description: dt.description,
           paidAt: convertedPaidAt,
           paidYear: dt.paidYear,
           paidMonth: dt.paidMonth,
           _createdAtMs: dt.createdAt?.toDate ? dt.createdAt.toDate().getTime() : 0
        } as ApiExpense & { _createdAtMs: number }
      })

      // Sort descending by paidAt, fallback to createdAt if same day
      parsedExpenses.sort((a, b) => {
         const d1 = new Date(b.paidAt).getTime()
         const d2 = new Date(a.paidAt).getTime()
         if (d1 === d2 && a._createdAtMs && b._createdAtMs) {
            return b._createdAtMs - a._createdAtMs
         }
         return d1 - d2
      })

      expenses.value = parsedExpenses
    } catch {
       expenses.value = []
    }
  }

  async function createExpense(input: {
    payerUserId: string
    amount: number
    category: string
    description: string
    paidAt: string
  }) {
    const d = parseISO(input.paidAt)
    await addDoc(collection(db, 'families', getFamilyId(), 'expenses'), {
      ...input,
      paidYear: d.getFullYear(),
      paidMonth: d.getMonth() + 1,
      currency: 'VND', // Default
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    await refreshExpenses()
  }

  async function deleteExpense(id: string) {
    await deleteDoc(doc(db, 'families', getFamilyId(), 'expenses', id))
    expenses.value = expenses.value.filter((e) => e._id !== id)
  }

  async function changeFamilyPin(currentPin: string, newPin: string) {
    // In frontend without backend functions, checking currentPin is basic
    const familyDoc = doc(db, 'families', getFamilyId())
    const snap = await getDoc(familyDoc)
    if (!snap.exists()) return
    const currentHash = snap.data()?.settings?.sharedPinHash
    if (currentHash === currentPin) {
       await updateDoc(familyDoc, {
         'settings.sharedPinHash': newPin
       })
    } else {
       throw new Error('Current PIN is incorrect')
    }
  }

  /* Aggregation logic previously handled by NestJS */
  function aggregateExpenses(expList: any[]) {
      return expList.reduce((acc, curr) => acc + curr.amount, 0)
  }

  async function refreshStatsYear(year: number) {
    const snap = await getDocs(query(collection(db, 'families', getFamilyId(), 'expenses'), where('paidYear', '==', year)))
    const list = snap.docs.map(d => d.data())
    const months = Array.from({length: 12}).map((_, i) => ({
      month: i + 1,
      total: aggregateExpenses(list.filter(e => e.paidMonth === i + 1))
    }))
    statsYear.value = { year, months }
    return months
  }

  async function refreshStatsCategories(year: number, month: number) {
    const snap = await getDocs(query(collection(db, 'families', getFamilyId(), 'expenses'), where('paidYear', '==', year), where('paidMonth', '==', month)))
    const list = snap.docs.map(d => d.data())
    const grouped = list.reduce((acc: any, c: any) => {
        acc[c.category] = (acc[c.category] || 0) + c.amount
        return acc
    }, {})
    const rows = Object.keys(grouped).map(cat => ({ category: cat, total: grouped[cat] }))
    statsCategories.value = { year, month, rows }
    return rows
  }

  async function refreshStatsMembers(year: number, month: number) {
    const snap = await getDocs(query(collection(db, 'families', getFamilyId(), 'expenses'), where('paidYear', '==', year), where('paidMonth', '==', month)))
    const list = snap.docs.map(d => d.data())
    const grouped = list.reduce((acc: any, c: any) => {
        if(!acc[c.payerUserId]) acc[c.payerUserId] = { total: 0, count: 0 }
        acc[c.payerUserId].total += c.amount
        acc[c.payerUserId].count += 1
        return acc
    }, {})
    const rows = Object.keys(grouped).map(uId => ({ payerUserId: uId, total: grouped[uId].total, count: grouped[uId].count }))
    statsMembers.value = { year, month, rows }
    return rows
  }

  async function setMonthlyBudget(value: number) {
    await updateDoc(doc(db, 'families', getFamilyId()), {
      'settings.monthlyBudget': Math.max(0, Math.round(value))
    })
    await refreshSettings()
  }

  async function setCategoryBudgets(budgets: Record<string, number>) {
    await updateDoc(doc(db, 'families', getFamilyId()), {
      'settings.categoryBudgets': budgets
    })
    await refreshSettings()
  }

  async function updateNickname(userId: string, nickname: string, accent?: MemberAccent) {
    const targetUserId = userId === 'me' ? authStore.currentUser?.id : userId
    if (!targetUserId) return
    const payload: any = { nickname: nickname.trim() }
    if (accent) payload.accent = accent
    
    await updateDoc(doc(db, 'families', getFamilyId(), 'member_profiles', targetUserId), payload)
    await refreshMembers()
  }

  async function removeMember(userId: string) {
    if (userId === authStore.currentUser?.id) {
      throw new Error('Bạn không thể xoá chính mình.')
    }
    // Requires multiple steps. Simply deleting the profile for now
    await deleteDoc(doc(db, 'families', getFamilyId(), 'member_profiles', userId))
    await refreshMembers()
  }

  async function createMember(input: {
    phone: string
    password: string
    displayName: string
    nickname: string
    accent?: MemberAccent
  }) {
    // Workaround: Create secondary Auth instance to not sign-out current owner
    const { initializeApp, deleteApp } = await import('firebase/app')
    const { getAuth: getTempAuth, createUserWithEmailAndPassword } = await import('firebase/auth')
    const { getFirestore: getTempFirestore } = await import('firebase/firestore')
    
    const tempApp = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    }, 'TempApp' + Date.now())
    const tempAuth = getTempAuth(tempApp)
    const tempDb = getTempFirestore(tempApp)

    try {
      const email = `${input.phone.trim()}@wallet.local`
      const cred = await createUserWithEmailAndPassword(tempAuth, email, input.password)
      const newUid = cred.user.uid

      // IMPORTANT: Use tempDb here so the request is authenticated as 'newUid', bridging the strict Security Rules
      await setDoc(doc(tempDb, 'users', newUid), {
        phone: input.phone.trim(),
        displayName: input.displayName.trim(),
        role: 'member',
        status: 'active',
        familyId: getFamilyId(),
        lastLoginAt: serverTimestamp()
      })

      await setDoc(doc(tempDb, 'families', getFamilyId(), 'member_profiles', newUid), {
        nickname: input.nickname.trim() || input.displayName.trim(),
        accent: input.accent || 'sky',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } finally {
      await deleteApp(tempApp)
    }

    await refreshMembers()
  }

  function memberById(id: string) {
    return membersUi.value.find((m) => m.id === id)
  }

  function expenseInMonth(e: ApiExpense, year: number, month0: number) {
    const d = parseISO(e.paidAt)
    return d.getFullYear() === year && d.getMonth() === month0
  }

  const currentMonthTotal = computed(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m0 = d.getMonth()
    return expenses.value.filter((e) => expenseInMonth(e, y, m0)).reduce((s, e) => s + e.amount, 0)
  })

  const previousMonthTotal = computed(() => {
    const d = subMonths(new Date(), 1)
    const y = d.getFullYear()
    const m0 = d.getMonth()
    return expenses.value.filter((e) => expenseInMonth(e, y, m0)).reduce((s, e) => s + e.amount, 0)
  })

  const monthOverMonthDelta = computed(() => {
    const cur = currentMonthTotal.value
    const prev = previousMonthTotal.value
    if (prev === 0) return cur > 0 ? 100 : 0
    return Math.round(((cur - prev) / prev) * 100)
  })

  const categorySpentCurrentMonth = computed(() => {
    const y = new Date().getFullYear()
    const m0 = new Date().getMonth()
    const map: Record<string, number> = {}
    for (const cat of categories.value) map[cat] = 0
    for (const e of expenses.value) {
      if (expenseInMonth(e, y, m0)) {
        map[e.category] = (map[e.category] || 0) + e.amount
      }
    }
    return map
  })

  return {
    members,
    expenses,
    membersUi,
    expensesUi,
    categories,
    monthlyBudget,
    categoryBudgets,
    familyName,
    refreshMembers,
    refreshSettings,
    refreshExpenses,
    createExpense,
    deleteExpense,
    changeFamilyPin,
    setMonthlyBudget,
    setCategoryBudgets,
    updateFamilyName,
    updateNickname,
    removeMember,
    createMember,
    statsYear,
    statsCategories,
    statsMembers,
    refreshStatsYear,
    refreshStatsCategories,
    refreshStatsMembers,
    memberById,
    currentMonthTotal,
    previousMonthTotal,
    monthOverMonthDelta,
    categorySpentCurrentMonth,
    expenseInMonth,
  }
})

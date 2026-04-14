export interface Member {
  id: string
  name: string
  /** Tailwind palette key for avatar dot */
  accent: MemberAccent
}

export type MemberAccent = 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan'

export interface Expense {
  id: string
  payerId: string
  amount: number
  description: string
  category: string
  /** ISO date yyyy-MM-dd */
  paidAt: string
}

export interface HistoryFilters {
  year: number | 'all'
  month: number | 'all'
  memberId: string | 'all'
  category: string | 'all'
}

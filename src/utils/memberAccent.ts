import type { MemberAccent } from '@/types/wallet'

const dot: Record<MemberAccent, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
}

const soft: Record<MemberAccent, string> = {
  sky: 'bg-sky-500/15 text-sky-800 dark:text-sky-100',
  emerald: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-100',
  violet: 'bg-violet-500/15 text-violet-800 dark:text-violet-100',
  amber: 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
  rose: 'bg-rose-500/15 text-rose-800 dark:text-rose-100',
  cyan: 'bg-cyan-500/15 text-cyan-900 dark:text-cyan-100',
}

export function memberAccentDotClass(accent: MemberAccent): string {
  return dot[accent]
}

export function memberAccentSoftClass(accent: MemberAccent): string {
  return soft[accent]
}

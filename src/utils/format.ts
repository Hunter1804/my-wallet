const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function formatCurrencyVnd(value: number): string {
  return vnd.format(value)
}

export function formatShortMonthVi(monthIndex0: number): string {
  const labels = [
    'T1',
    'T2',
    'T3',
    'T4',
    'T5',
    'T6',
    'T7',
    'T8',
    'T9',
    'T10',
    'T11',
    'T12',
  ]
  return labels[monthIndex0] ?? ''
}

export const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Nhà cửa',
  'Sức khỏe',
  'Giải trí',
  'Giáo dục',
  'Mua sắm',
  'Hóa đơn & dịch vụ',
  'Du lịch',
  'Khác',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

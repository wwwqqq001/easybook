import { Category } from "./types";

export const INCOME_CATEGORIES: Category[] = [
  { id: 'alipay', name: '支付宝', icon: '🟦', color: 'bg-blue-100 text-blue-600' },
  { id: 'wechat', name: '微信', icon: '🟩', color: 'bg-green-100 text-green-600' },
  { id: 'cash', name: '现金', icon: '💴', color: 'bg-amber-100 text-amber-600' },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'charcoal', name: '木炭', icon: '⚫', color: 'bg-stone-700 text-stone-100' },
  { id: 'flour', name: '面粉', icon: '🥡', color: 'bg-orange-50 text-orange-800' },
  { id: 'spices', name: '大料', icon: '🌿', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'syrup', name: '糖稀', icon: '🍯', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'yeast', name: '酵母', icon: '🍞', color: 'bg-amber-100 text-amber-800' },
  { id: 'bags', name: '袋子', icon: '🛍️', color: 'bg-pink-100 text-pink-700' },
  { id: 'sesame', name: '芝麻', icon: '🌱', color: 'bg-stone-200 text-stone-700' },
  { id: 'salt', name: '盐', icon: '🧂', color: 'bg-slate-200 text-slate-700' },
  { id: 'other', name: '其他', icon: '📝', color: 'bg-gray-100 text-gray-600' },
];

// Combined list for AI and display lookups
export const CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const INITIAL_TRANSACTIONS = [];

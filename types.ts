export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji or icon name
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  note: string;
  date: string; // ISO string
  timestamp: number;
}

export enum ViewState {
  HOME = 'HOME',
  ADD_MANUAL = 'ADD_MANUAL',
  DAILY_DETAILS = 'DAILY_DETAILS',
  REPORT = 'REPORT',
}
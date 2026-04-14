import type { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Firebase Auth UID
  phone: string;
  displayName: string;
  status: 'active' | 'disabled';
  familyId?: string;
  role: 'owner' | 'member';
  lastLoginAt?: Timestamp;
}

export interface FamilySettings {
  sharedPinHash: string;
  sharedPinUpdatedAt?: Timestamp;
  sharedPinUpdatedByUserId?: string;
  monthlyBudget: number;
  categoryBudgets?: Record<string, number>;
  categories: string[];
}

export interface Family {
  id: string;
  name: string;
  code?: string;
  currency: string;
  timezone: string;
  settings: FamilySettings;
}

export interface FamilyMemberProfile {
  id: string; // matches userId
  nickname: string;
  accent: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Expense {
  id: string;
  payerUserId: string; // The user who paid
  amount: number;
  currency: string;
  category: string;
  description: string;
  paidAt: Timestamp;
  paidYear: number; // For easy monthly querying without complex dates if needed
  paidMonth: number;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

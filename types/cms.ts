export type UserRole = 'ADMIN' | 'MANAGER' | 'WAITER' | 'CHEF';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'NEEDS_CLEANING';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

export type KOTStatus = 'RECEIVED' | 'IN_PREP' | 'READY' | 'COMPLETED';

export type PlatePortion = 'HALF' | 'FULL';

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  password: string;
  pin: string;
  role: UserRole;
}

export interface CafeProfile {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  upiId: string;
}

export interface GSTConfig {
  enabled: boolean;
  gstin: string;
  cgstPercent: number;
  sgstPercent: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  imageKey: string;
  isMeal: boolean;
  fullPlatePrice: number;
  halfPlatePrice?: number;
  isOutOfStock: boolean;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  imageKey: string;
  quantity: number;
  portion: PlatePortion;
  unitPrice: number;
  kitchenNotes: string;
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  occupiedAt?: string;
  currentKotIds: string[];
  mergedTableIds: string[];
  mergedIntoTableId?: string;
}

export interface KOTTicket {
  id: string;
  ticketNumber: string;
  tableId: string;
  tableName: string;
  items: CartItem[];
  status: KOTStatus;
  createdAt: string;
  completedAt?: string;
  struckItemIds: string[];
  createdByStaffId: string;
}

export interface OrderBill {
  id: string;
  billNumber: string;
  tableId: string;
  tableName: string;
  items: CartItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  splitCount: number;
  settledAt: string;
  settledByStaffId: string;
  upiString?: string;
}

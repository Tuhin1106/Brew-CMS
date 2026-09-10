import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  CafeProfile,
  CartItem,
  GSTConfig,
  KOTStatus,
  KOTTicket,
  MenuItem,
  OrderBill,
  PaymentMethod,
  PlatePortion,
  StaffUser,
  Table,
  TableStatus,
  UserRole,
} from '../types/cms';
import {
  ACTIVE_KOT_TICKETS,
  COMPLETED_BILLS,
  DEFAULT_CAFE_PROFILE,
  DEFAULT_GST_CONFIG,
  FLOOR_TABLES,
  MENU_CATEGORIES,
  MENU_ITEMS,
  STAFF_USERS,
} from './seedData';
import { migrateUserRole } from '../constants/roles';
import { resolveImageKey } from '../constants/foodImages';

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export function computeBillBreakdown(items: CartItem[], gst: GSTConfig) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
  if (!gst.enabled) {
    return { subtotal, cgstAmount: 0, sgstAmount: 0, total: subtotal };
  }
  const cgstAmount = roundMoney(subtotal * (gst.cgstPercent / 100));
  const sgstAmount = roundMoney(subtotal * (gst.sgstPercent / 100));
  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    total: roundMoney(subtotal + cgstAmount + sgstAmount),
  };
}

export function buildUpiPayString(upiId: string, amount: number) {
  return `upi://pay?pa=${upiId}&am=${roundMoney(amount)}`;
}

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const nextTicketNumber = (tickets: KOTTicket[]) => {
  const max = tickets.reduce((highest, ticket) => {
    const numeric = Number.parseInt(ticket.ticketNumber.replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 100);
  return `KOT-${max + 1}`;
};

const nextBillNumber = (bills: OrderBill[]) => {
  const max = bills.reduce((highest, bill) => {
    const numeric = Number.parseInt(bill.billNumber.replace(/\D/g, ''), 10);
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 1000);
  return `BILL-${max + 1}`;
};

export const collectTableItems = (
  tableId: string,
  cart: CartItem[],
  tickets: KOTTicket[],
): CartItem[] => {
  const kotItems = tickets
    .filter(
      (ticket) => ticket.tableId === tableId && ticket.status !== 'COMPLETED',
    )
    .flatMap((ticket) => ticket.items);
  return [...kotItems, ...cart];
};

function mergeStaffRoles(existing: StaffUser[]): StaffUser[] {
  const chefSeed = STAFF_USERS.find((seed) => seed.id === 'staff-chef');
  const remapped = existing.map((member) => {
    if (member.id === 'staff-cashier' && chefSeed) {
      return {
        ...chefSeed,
        phone: member.phone,
        password: member.password === 'Cashier1' ? chefSeed.password : member.password,
        pin: member.pin || chefSeed.pin,
      };
    }
    return { ...member, role: migrateUserRole(member.role) };
  });

  const phones = new Set(remapped.map((member) => member.phone));
  const ids = new Set(remapped.map((member) => member.id));
  for (const seed of STAFF_USERS) {
    if (!ids.has(seed.id) && !phones.has(seed.phone)) {
      remapped.push(seed);
      ids.add(seed.id);
      phones.add(seed.phone);
    }
  }
  return remapped;
}

function migrateCurrentUser(user: StaffUser | null, staff: StaffUser[]): StaffUser | null {
  if (!user) {
    return null;
  }
  if (user.id === 'staff-cashier') {
    return staff.find((member) => member.id === 'staff-chef') ?? {
      ...user,
      id: 'staff-chef',
      role: 'CHEF',
    };
  }
  return staff.find((member) => member.id === user.id) ?? {
    ...user,
    role: migrateUserRole(user.role),
  };
}

export interface CafeStoreState {
  currentUser: StaffUser | null;
  rememberDevice: boolean;
  cafeProfile: CafeProfile;
  gstConfig: GSTConfig;
  staff: StaffUser[];
  categories: string[];
  menuItems: MenuItem[];
  tables: Table[];
  cart: CartItem[];
  activeTableId: string | null;
  kotTickets: KOTTicket[];
  completedOrders: OrderBill[];
}

export interface CafeStoreActions {
  login: (phone: string, password: string, role?: UserRole, rememberDevice?: boolean) => boolean;
  logout: () => void;

  setActiveTable: (tableId: string | null) => void;
  addToCart: (
    menuItemId: string,
    portion: PlatePortion,
    kitchenNotes?: string,
  ) => boolean;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  setCartItemNotes: (cartItemId: string, kitchenNotes: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  fireKOT: () => string | null;
  updateKOTStatus: (kotId: string, status: KOTStatus) => void;
  cycleKOTStatus: (kotId: string) => void;
  toggleKOTItemStruck: (kotId: string, itemId: string) => void;

  setTableStatus: (tableId: string, status: TableStatus) => void;
  markTableClean: (tableId: string) => void;
  addTable: (name: string, seats: number) => string;
  updateTable: (tableId: string, patch: Pick<Table, 'name' | 'seats'>) => void;
  deleteTable: (tableId: string) => boolean;
  shiftTable: (fromTableId: string, toTableId: string) => boolean;
  mergeTables: (sourceTableId: string, targetTableId: string) => boolean;

  settleBill: (
    paymentMethod: PaymentMethod,
    splitCount?: number,
  ) => OrderBill | null;

  updateCafeProfile: (patch: Partial<CafeProfile>) => void;
  updateGSTConfig: (patch: Partial<GSTConfig>) => void;
  addStaff: (staff: Omit<StaffUser, 'id'>) => string;
  updateStaff: (staffId: string, patch: Partial<Omit<StaffUser, 'id'>>) => void;
  deleteStaff: (staffId: string) => boolean;
  addCategory: (name: string) => boolean;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => string;
  updateMenuItem: (itemId: string, patch: Partial<Omit<MenuItem, 'id'>>) => void;
  toggleMenuItemStock: (itemId: string) => void;
}

export type CafeStore = CafeStoreState & CafeStoreActions;

const initialState: CafeStoreState = {
  currentUser: null,
  rememberDevice: true,
  cafeProfile: DEFAULT_CAFE_PROFILE,
  gstConfig: DEFAULT_GST_CONFIG,
  staff: STAFF_USERS,
  categories: [...MENU_CATEGORIES],
  menuItems: MENU_ITEMS,
  tables: FLOOR_TABLES,
  cart: [],
  activeTableId: null,
  kotTickets: ACTIVE_KOT_TICKETS,
  completedOrders: COMPLETED_BILLS,
};

export const useCafeStore = create<CafeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (phone, password, role, rememberDevice = true) => {
        const match = get().staff.find(
          (member) =>
            member.phone === phone &&
            member.password === password &&
            (role ? member.role === role : true),
        );
        if (!match) {
          return false;
        }
        set({ currentUser: match, rememberDevice });
        return true;
      },

      logout: () => {
        set({ currentUser: null, cart: [], activeTableId: null });
      },

      setActiveTable: (tableId) => {
        set({ activeTableId: tableId });
      },

      addToCart: (menuItemId, portion, kitchenNotes = '') => {
        const item = get().menuItems.find((entry) => entry.id === menuItemId);
        if (!item || item.isOutOfStock) {
          return false;
        }
        const resolvedPortion: PlatePortion =
          item.isMeal && portion === 'HALF' ? 'HALF' : 'FULL';
        if (resolvedPortion === 'HALF' && item.halfPlatePrice == null) {
          return false;
        }
        const unitPrice =
          resolvedPortion === 'HALF'
            ? item.halfPlatePrice!
            : item.fullPlatePrice;
        const notes = kitchenNotes.trim();

        const existing = get().cart.find(
          (line) =>
            line.menuItemId === item.id &&
            line.portion === resolvedPortion &&
            line.kitchenNotes === notes,
        );

        if (existing) {
          set({
            cart: get().cart.map((line) =>
              line.id === existing.id
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            ),
          });
          return true;
        }

        const line: CartItem = {
          id: createId('cart'),
          menuItemId: item.id,
          name: item.name,
          imageKey: item.imageKey,
          quantity: 1,
          portion: resolvedPortion,
          unitPrice,
          kitchenNotes: notes,
        };
        set({ cart: [...get().cart, line] });
        return true;
      },

      updateCartQuantity: (cartItemId, quantity) => {
        if (quantity < 1) {
          return;
        }
        set({
          cart: get().cart.map((line) =>
            line.id === cartItemId ? { ...line, quantity } : line,
          ),
        });
      },

      setCartItemNotes: (cartItemId, kitchenNotes) => {
        set({
          cart: get().cart.map((line) =>
            line.id === cartItemId
              ? { ...line, kitchenNotes: kitchenNotes.trim() }
              : line,
          ),
        });
      },

      removeFromCart: (cartItemId) => {
        set({ cart: get().cart.filter((line) => line.id !== cartItemId) });
      },

      clearCart: () => {
        set({ cart: [] });
      },

      fireKOT: () => {
        const state = get();
        const table = state.tables.find((entry) => entry.id === state.activeTableId);
        if (!table || table.status === 'NEEDS_CLEANING' || state.cart.length === 0) {
          return null;
        }

        const now = new Date().toISOString();
        const kotId = createId('kot');
        const ticket: KOTTicket = {
          id: kotId,
          ticketNumber: nextTicketNumber(state.kotTickets),
          tableId: table.id,
          tableName: table.name,
          items: state.cart.map((line) => ({ ...line, id: createId('kot-line') })),
          status: 'RECEIVED',
          createdAt: now,
          struckItemIds: [],
          createdByStaffId: state.currentUser?.id ?? 'staff-unknown',
        };

        set({
          kotTickets: [...state.kotTickets, ticket],
          cart: [],
          tables: state.tables.map((entry) =>
            entry.id === table.id
              ? {
                  ...entry,
                  status: 'OCCUPIED',
                  occupiedAt: entry.occupiedAt ?? now,
                  currentKotIds: [...entry.currentKotIds, kotId],
                  mergedIntoTableId: undefined,
                }
              : entry,
          ),
        });

        return kotId;
      },

      updateKOTStatus: (kotId, status) => {
        const now = new Date().toISOString();
        set({
          kotTickets: get().kotTickets.map((ticket) =>
            ticket.id === kotId
              ? {
                  ...ticket,
                  status,
                  completedAt: status === 'COMPLETED' ? now : ticket.completedAt,
                }
              : ticket,
          ),
        });
      },

      cycleKOTStatus: (kotId) => {
        const ticket = get().kotTickets.find((entry) => entry.id === kotId);
        if (!ticket || ticket.status === 'COMPLETED') {
          return;
        }
        const sequence: KOTStatus[] = ['RECEIVED', 'IN_PREP', 'READY', 'COMPLETED'];
        const next = sequence[sequence.indexOf(ticket.status) + 1];
        if (next) {
          get().updateKOTStatus(kotId, next);
        }
      },

      toggleKOTItemStruck: (kotId, itemId) => {
        set({
          kotTickets: get().kotTickets.map((ticket) => {
            if (ticket.id !== kotId) {
              return ticket;
            }
            const struck = ticket.struckItemIds.includes(itemId)
              ? ticket.struckItemIds.filter((id) => id !== itemId)
              : [...ticket.struckItemIds, itemId];
            return { ...ticket, struckItemIds: struck };
          }),
        });
      },

      setTableStatus: (tableId, status) => {
        set({
          tables: get().tables.map((table) => {
            if (table.id !== tableId) {
              return table;
            }
            if (status === 'AVAILABLE') {
              return {
                ...table,
                status,
                occupiedAt: undefined,
                currentKotIds: [],
                mergedTableIds: [],
                mergedIntoTableId: undefined,
              };
            }
            return {
              ...table,
              status,
              occupiedAt:
                status === 'OCCUPIED'
                  ? table.occupiedAt ?? new Date().toISOString()
                  : undefined,
            };
          }),
        });
      },

      markTableClean: (tableId) => {
        get().setTableStatus(tableId, 'AVAILABLE');
      },

      addTable: (name, seats) => {
        const id = createId('table');
        const table: Table = {
          id,
          name: name.trim(),
          seats,
          status: 'AVAILABLE',
          currentKotIds: [],
          mergedTableIds: [],
        };
        set({ tables: [...get().tables, table] });
        return id;
      },

      updateTable: (tableId, patch) => {
        set({
          tables: get().tables.map((table) =>
            table.id === tableId
              ? { ...table, name: patch.name.trim(), seats: patch.seats }
              : table,
          ),
        });
      },

      deleteTable: (tableId) => {
        const table = get().tables.find((entry) => entry.id === tableId);
        if (!table || table.status === 'OCCUPIED' || table.currentKotIds.length > 0) {
          return false;
        }
        set({
          tables: get().tables.filter((entry) => entry.id !== tableId),
          activeTableId:
            get().activeTableId === tableId ? null : get().activeTableId,
        });
        return true;
      },

      shiftTable: (fromTableId, toTableId) => {
        if (fromTableId === toTableId) {
          return false;
        }
        const source = get().tables.find((table) => table.id === fromTableId);
        const target = get().tables.find((table) => table.id === toTableId);
        if (!source || !target) {
          return false;
        }
        if (source.status !== 'OCCUPIED' || target.status !== 'AVAILABLE') {
          return false;
        }

        set({
          tables: get().tables.map((table) => {
            if (table.id === fromTableId) {
              return {
                ...table,
                status: 'AVAILABLE',
                occupiedAt: undefined,
                currentKotIds: [],
                mergedTableIds: [],
                mergedIntoTableId: undefined,
              };
            }
            if (table.id === toTableId) {
              return {
                ...table,
                status: 'OCCUPIED',
                occupiedAt: source.occupiedAt ?? new Date().toISOString(),
                currentKotIds: [...source.currentKotIds],
                mergedTableIds: [...source.mergedTableIds],
                mergedIntoTableId: undefined,
              };
            }
            if (source.mergedTableIds.includes(table.id)) {
              return { ...table, mergedIntoTableId: toTableId };
            }
            return table;
          }),
          kotTickets: get().kotTickets.map((ticket) =>
            ticket.tableId === fromTableId && ticket.status !== 'COMPLETED'
              ? { ...ticket, tableId: toTableId, tableName: target.name }
              : ticket,
          ),
          activeTableId:
            get().activeTableId === fromTableId ? toTableId : get().activeTableId,
        });
        return true;
      },

      mergeTables: (sourceTableId, targetTableId) => {
        if (sourceTableId === targetTableId) {
          return false;
        }
        const source = get().tables.find((table) => table.id === sourceTableId);
        const target = get().tables.find((table) => table.id === targetTableId);
        if (!source || !target || target.mergedIntoTableId) {
          return false;
        }

        set({
          tables: get().tables.map((table) => {
            if (table.id === sourceTableId) {
              return {
                ...table,
                status: 'OCCUPIED',
                occupiedAt: table.occupiedAt ?? new Date().toISOString(),
                currentKotIds: [],
                mergedTableIds: [],
                mergedIntoTableId: targetTableId,
              };
            }
            if (table.id === targetTableId) {
              return {
                ...table,
                status: 'OCCUPIED',
                occupiedAt:
                  table.occupiedAt ??
                  source.occupiedAt ??
                  new Date().toISOString(),
                currentKotIds: [...table.currentKotIds, ...source.currentKotIds],
                mergedTableIds: [
                  ...new Set([
                    ...table.mergedTableIds,
                    sourceTableId,
                    ...source.mergedTableIds,
                  ]),
                ],
                mergedIntoTableId: undefined,
              };
            }
            if (source.mergedTableIds.includes(table.id)) {
              return { ...table, mergedIntoTableId: targetTableId };
            }
            return table;
          }),
          kotTickets: get().kotTickets.map((ticket) =>
            ticket.tableId === sourceTableId && ticket.status !== 'COMPLETED'
              ? { ...ticket, tableId: targetTableId, tableName: target.name }
              : ticket,
          ),
        });
        return true;
      },

      settleBill: (paymentMethod, _splitCount = 1) => {
        const state = get();
        const table = state.tables.find((entry) => entry.id === state.activeTableId);
        if (!table) {
          return null;
        }

        const items = collectTableItems(table.id, state.cart, state.kotTickets);
        if (items.length === 0) {
          return null;
        }

        const breakdown = computeBillBreakdown(items, state.gstConfig);
        const now = new Date().toISOString();
        const bill: OrderBill = {
          id: createId('bill'),
          billNumber: nextBillNumber(state.completedOrders),
          tableId: table.id,
          tableName: table.name,
          items,
          ...breakdown,
          paymentMethod,
          splitCount: 1,
          settledAt: now,
          settledByStaffId: state.currentUser?.id ?? 'staff-unknown',
          upiString:
            paymentMethod === 'UPI'
              ? buildUpiPayString(state.cafeProfile.upiId, breakdown.total)
              : undefined,
        };

        const mergedIds = [table.id, ...table.mergedTableIds];
        const openKotIds = new Set(
          state.kotTickets
            .filter(
              (ticket) =>
                mergedIds.includes(ticket.tableId) && ticket.status !== 'COMPLETED',
            )
            .map((ticket) => ticket.id),
        );

        set({
          completedOrders: [...state.completedOrders, bill],
          cart: [],
          kotTickets: state.kotTickets.map((ticket) =>
            openKotIds.has(ticket.id)
              ? { ...ticket, status: 'COMPLETED', completedAt: now }
              : ticket,
          ),
          tables: state.tables.map((entry) => {
            if (mergedIds.includes(entry.id) || entry.mergedIntoTableId === table.id) {
              return {
                ...entry,
                status: 'NEEDS_CLEANING',
                occupiedAt: undefined,
                currentKotIds: [],
                mergedTableIds: [],
                mergedIntoTableId: undefined,
              };
            }
            return entry;
          }),
        });

        return bill;
      },

      updateCafeProfile: (patch) => {
        set({ cafeProfile: { ...get().cafeProfile, ...patch } });
      },

      updateGSTConfig: (patch) => {
        const nextGstin = patch.gstin?.toUpperCase();
        set({
          gstConfig: {
            ...get().gstConfig,
            ...patch,
            ...(nextGstin ? { gstin: nextGstin } : {}),
          },
        });
      },

      addStaff: (staff) => {
        const id = createId('staff');
        set({ staff: [...get().staff, { ...staff, id, pin: staff.pin.slice(0, 4) }] });
        return id;
      },

      updateStaff: (staffId, patch) => {
        set({
          staff: get().staff.map((member) =>
            member.id === staffId
              ? {
                  ...member,
                  ...patch,
                  pin: patch.pin ? patch.pin.slice(0, 4) : member.pin,
                }
              : member,
          ),
          currentUser:
            get().currentUser?.id === staffId
              ? {
                  ...get().currentUser!,
                  ...patch,
                  pin: patch.pin ? patch.pin.slice(0, 4) : get().currentUser!.pin,
                }
              : get().currentUser,
        });
      },

      deleteStaff: (staffId) => {
        if (get().currentUser?.id === staffId) {
          return false;
        }
        const exists = get().staff.some((member) => member.id === staffId);
        if (!exists) {
          return false;
        }
        set({ staff: get().staff.filter((member) => member.id !== staffId) });
        return true;
      },

      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed || get().categories.includes(trimmed)) {
          return false;
        }
        set({ categories: [...get().categories, trimmed] });
        return true;
      },

      addMenuItem: (item) => {
        const id = createId('item');
        set({ menuItems: [...get().menuItems, { ...item, id }] });
        return id;
      },

      updateMenuItem: (itemId, patch) => {
        set({
          menuItems: get().menuItems.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        });
      },

      toggleMenuItemStock: (itemId) => {
        set({
          menuItems: get().menuItems.map((item) =>
            item.id === itemId ? { ...item, isOutOfStock: !item.isOutOfStock } : item,
          ),
        });
      },
    }),
    {
      name: 'offline-mode-cafe-store',
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.rememberDevice ? state.currentUser : null,
        rememberDevice: state.rememberDevice,
        cafeProfile: state.cafeProfile,
        gstConfig: state.gstConfig,
        staff: state.staff,
        categories: state.categories,
        menuItems: state.menuItems,
        tables: state.tables,
        cart: state.cart,
        activeTableId: state.activeTableId,
        kotTickets: state.kotTickets,
        completedOrders: state.completedOrders,
      }),
      migrate: (persisted, version) => {
        let state = persisted as CafeStoreState & {
          menuItems: Array<MenuItem & { iconOrEmoji?: string }>;
        };
        const seedById = Object.fromEntries(MENU_ITEMS.map((item) => [item.id, item]));
        const withImageKey = <T extends { menuItemId?: string; imageKey?: string; iconOrEmoji?: string }>(
          line: T,
        ): T => ({
          ...line,
          imageKey: seedById[line.menuItemId ?? '']?.imageKey ?? resolveImageKey(line.imageKey ?? line.iconOrEmoji),
        });
        if (version < 2) {
          state = {
            ...state,
            staff: (state.staff ?? []).map((member) => ({
              ...member,
              role: migrateUserRole(member.role),
            })),
            currentUser: state.currentUser
              ? { ...state.currentUser, role: migrateUserRole(state.currentUser.role) }
              : null,
          };
        }
        if (version < 3) {
          state = {
            ...state,
            menuItems: (state.menuItems ?? []).map((item) => {
              const legacy = item as MenuItem & { iconOrEmoji?: string };
              return {
                ...item,
                imageKey:
                  seedById[item.id]?.imageKey ??
                  resolveImageKey(legacy.imageKey ?? legacy.iconOrEmoji),
              };
            }),
            cart: (state.cart ?? []).map((line) => withImageKey(line)),
            kotTickets: (state.kotTickets ?? []).map((ticket) => ({
              ...ticket,
              items: ticket.items.map((line) => withImageKey(line)),
            })),
            completedOrders: (state.completedOrders ?? []).map((bill) => ({
              ...bill,
              items: bill.items.map((line) => withImageKey(line)),
            })),
          };
        }
        if (version < 4) {
          const staff = mergeStaffRoles(state.staff ?? []);
          const currentUser = migrateCurrentUser(state.currentUser, staff);
          state = {
            ...state,
            staff,
            currentUser,
            kotTickets: (state.kotTickets ?? []).map((ticket) => ({
              ...ticket,
              createdByStaffId:
                ticket.createdByStaffId === 'staff-cashier' ? 'staff-chef' : ticket.createdByStaffId,
            })),
            completedOrders: (state.completedOrders ?? []).map((bill) => ({
              ...bill,
              settledByStaffId:
                bill.settledByStaffId === 'staff-cashier' ? 'staff-chef' : bill.settledByStaffId,
            })),
          };
        }
        if (version < 5) {
          state = {
            ...state,
            rememberDevice: state.rememberDevice !== false,
          };
        }
        return state;
      },
    },
  ),
);

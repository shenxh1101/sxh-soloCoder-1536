import type { Customer, Part, RepairOrder, RepairPart, Followup, StockMovement } from '@/types';

const STORAGE_KEYS = {
  customers: 'repair_customers',
  parts: 'repair_parts',
  orders: 'repair_orders',
  repairParts: 'repair_repair_parts',
  followups: 'repair_followups',
  stockMovements: 'repair_stock_movements',
  initialized: 'repair_initialized',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getCustomers: (): Customer[] => read<Customer[]>(STORAGE_KEYS.customers, []),
  setCustomers: (v: Customer[]) => write(STORAGE_KEYS.customers, v),

  getParts: (): Part[] => read<Part[]>(STORAGE_KEYS.parts, []),
  setParts: (v: Part[]) => write(STORAGE_KEYS.parts, v),

  getOrders: (): RepairOrder[] => read<RepairOrder[]>(STORAGE_KEYS.orders, []),
  setOrders: (v: RepairOrder[]) => write(STORAGE_KEYS.orders, v),

  getRepairParts: (): RepairPart[] => read<RepairPart[]>(STORAGE_KEYS.repairParts, []),
  setRepairParts: (v: RepairPart[]) => write(STORAGE_KEYS.repairParts, v),

  getFollowups: (): Followup[] => read<Followup[]>(STORAGE_KEYS.followups, []),
  setFollowups: (v: Followup[]) => write(STORAGE_KEYS.followups, v),

  getStockMovements: (): StockMovement[] => read<StockMovement[]>(STORAGE_KEYS.stockMovements, []),
  setStockMovements: (v: StockMovement[]) => write(STORAGE_KEYS.stockMovements, v),

  isInitialized: (): boolean => read<boolean>(STORAGE_KEYS.initialized, false),
  markInitialized: () => write(STORAGE_KEYS.initialized, true),
};

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

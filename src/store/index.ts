import { create } from 'zustand';
import type { Customer, Part, RepairOrder, RepairPart, Followup, OrderStatus } from '@/types';
import { storage, genId } from '@/utils/storage';
import { nowISO } from '@/utils/date';

interface AppState {
  customers: Customer[];
  parts: Part[];
  orders: RepairOrder[];
  repairParts: RepairPart[];
  followups: Followup[];

  initData: () => void;

  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addPart: (data: Omit<Part, 'id'>) => Part;
  updatePart: (id: string, data: Partial<Part>) => void;
  deletePart: (id: string) => void;
  addStock: (id: string, amount: number) => void;

  addOrder: (data: Omit<RepairOrder, 'id' | 'createdAt' | 'status' | 'laborFee'> & { laborFee?: number }) => RepairOrder;
  updateOrder: (id: string, data: Partial<RepairOrder>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  addRepairPart: (orderId: string, partId: string, quantity: number) => void;
  removeRepairPart: (repairPartId: string) => void;

  addFollowup: (orderId: string, result: 'normal' | 'issue', note: string) => void;

  getCustomerOrders: (customerId: string) => RepairOrder[];
  getOrderParts: (orderId: string) => RepairPart[];
  getOrderTotal: (orderId: string) => { partsTotal: number; laborFee: number; total: number };
  getLowStockParts: () => Part[];
  getOrdersNeedingFollowup: () => RepairOrder[];
}

function seedInitialData() {
  const customers: Customer[] = [
    { id: genId('c'), name: '张三', phone: '13800138001', note: '', createdAt: nowISO() },
    { id: genId('c'), name: '李四', phone: '13900139002', note: '老客户，价格优惠', createdAt: nowISO() },
    { id: genId('c'), name: '王五', phone: '13700137003', note: '', createdAt: nowISO() },
  ];

  const parts: Part[] = [
    { id: genId('p'), name: '空调压缩机 1.5P', category: '空调', unitPrice: 580, stock: 3, minStock: 2 },
    { id: genId('p'), name: '空调电容 35μF', category: '空调', unitPrice: 25, stock: 1, minStock: 5 },
    { id: genId('p'), name: '冰箱温控器 WDF28', category: '冰箱', unitPrice: 45, stock: 10, minStock: 5 },
    { id: genId('p'), name: '冰箱启动器 PTC', category: '冰箱', unitPrice: 15, stock: 20, minStock: 10 },
    { id: genId('p'), name: '电视电源板 32寸通用', category: '电视', unitPrice: 180, stock: 1, minStock: 2 },
    { id: genId('p'), name: '电视背光条', category: '电视', unitPrice: 95, stock: 4, minStock: 3 },
    { id: genId('p'), name: '洗衣机皮带 O-500E', category: '洗衣机', unitPrice: 25, stock: 20, minStock: 10 },
    { id: genId('p'), name: '洗衣机排水电机', category: '洗衣机', unitPrice: 65, stock: 2, minStock: 3 },
    { id: genId('p'), name: '加热管 2000W', category: '热水器', unitPrice: 55, stock: 6, minStock: 3 },
  ];

  storage.setCustomers(customers);
  storage.setParts(parts);
  storage.setOrders([]);
  storage.setRepairParts([]);
  storage.setFollowups([]);
  storage.markInitialized();

  return { customers, parts, orders: [], repairParts: [], followups: [] };
}

export const useAppStore = create<AppState>((set, get) => ({
  customers: [],
  parts: [],
  orders: [],
  repairParts: [],
  followups: [],

  initData: () => {
    if (!storage.isInitialized()) {
      const seed = seedInitialData();
      set(seed);
    } else {
      set({
        customers: storage.getCustomers(),
        parts: storage.getParts(),
        orders: storage.getOrders(),
        repairParts: storage.getRepairParts(),
        followups: storage.getFollowups(),
      });
    }
  },

  addCustomer: (data) => {
    const customer: Customer = { ...data, id: genId('c'), createdAt: nowISO() };
    const list = [...get().customers, customer];
    set({ customers: list });
    storage.setCustomers(list);
    return customer;
  },
  updateCustomer: (id, data) => {
    const list = get().customers.map(c => c.id === id ? { ...c, ...data } : c);
    set({ customers: list });
    storage.setCustomers(list);
  },
  deleteCustomer: (id) => {
    const list = get().customers.filter(c => c.id !== id);
    set({ customers: list });
    storage.setCustomers(list);
  },

  addPart: (data) => {
    const part: Part = { ...data, id: genId('p') };
    const list = [...get().parts, part];
    set({ parts: list });
    storage.setParts(list);
    return part;
  },
  updatePart: (id, data) => {
    const list = get().parts.map(p => p.id === id ? { ...p, ...data } : p);
    set({ parts: list });
    storage.setParts(list);
  },
  deletePart: (id) => {
    const list = get().parts.filter(p => p.id !== id);
    set({ parts: list });
    storage.setParts(list);
  },
  addStock: (id, amount) => {
    const list = get().parts.map(p => p.id === id ? { ...p, stock: p.stock + amount } : p);
    set({ parts: list });
    storage.setParts(list);
  },

  addOrder: (data) => {
    const order: RepairOrder = {
      ...data,
      laborFee: data.laborFee ?? 0,
      id: genId('o'),
      createdAt: nowISO(),
      status: 'pending',
    };
    const list = [...get().orders, order];
    set({ orders: list });
    storage.setOrders(list);
    return order;
  },
  updateOrder: (id, data) => {
    const list = get().orders.map(o => o.id === id ? { ...o, ...data } : o);
    set({ orders: list });
    storage.setOrders(list);
  },
  updateOrderStatus: (id, status) => {
    const now = nowISO();
    const list = get().orders.map(o => {
      if (o.id !== id) return o;
      const updated: RepairOrder = { ...o, status };
      if (status === 'ready' && !o.completedAt) updated.completedAt = now;
      if (status === 'completed' && !o.pickedUpAt) updated.pickedUpAt = now;
      return updated;
    });
    set({ orders: list });
    storage.setOrders(list);
  },
  deleteOrder: (id) => {
    const orderList = get().orders.filter(o => o.id !== id);
    const rpList = get().repairParts.filter(rp => rp.orderId !== id);
    const fList = get().followups.filter(f => f.orderId !== id);
    set({ orders: orderList, repairParts: rpList, followups: fList });
    storage.setOrders(orderList);
    storage.setRepairParts(rpList);
    storage.setFollowups(fList);
  },

  addRepairPart: (orderId, partId, quantity) => {
    const part = get().parts.find(p => p.id === partId);
    if (!part) return;
    if (part.stock < quantity) return;

    const rp: RepairPart = {
      id: genId('rp'),
      orderId,
      partId,
      partName: part.name,
      unitPrice: part.unitPrice,
      quantity,
    };
    const rpList = [...get().repairParts, rp];
    set({ repairParts: rpList });
    storage.setRepairParts(rpList);

    const partList = get().parts.map(p => p.id === partId ? { ...p, stock: p.stock - quantity } : p);
    set({ parts: partList });
    storage.setParts(partList);
  },
  removeRepairPart: (repairPartId) => {
    const rp = get().repairParts.find(r => r.id === repairPartId);
    if (!rp) return;

    const rpList = get().repairParts.filter(r => r.id !== repairPartId);
    set({ repairParts: rpList });
    storage.setRepairParts(rpList);

    const partList = get().parts.map(p => p.id === rp.partId ? { ...p, stock: p.stock + rp.quantity } : p);
    set({ parts: partList });
    storage.setParts(partList);
  },

  addFollowup: (orderId, result, note) => {
    const f: Followup = { id: genId('f'), orderId, result, note, createdAt: nowISO() };
    const list = [...get().followups, f];
    set({ followups: list });
    storage.setFollowups(list);
  },

  getCustomerOrders: (customerId) =>
    get().orders.filter(o => o.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  getOrderParts: (orderId) => get().repairParts.filter(rp => rp.orderId === orderId),

  getOrderTotal: (orderId) => {
    const order = get().orders.find(o => o.id === orderId);
    const parts = get().repairParts.filter(rp => rp.orderId === orderId);
    const partsTotal = parts.reduce((sum, rp) => sum + rp.unitPrice * rp.quantity, 0);
    const laborFee = order?.laborFee ?? 0;
    return { partsTotal, laborFee, total: partsTotal + laborFee };
  },

  getLowStockParts: () => get().parts.filter(p => p.stock <= p.minStock),

  getOrdersNeedingFollowup: () => {
    const now = new Date();
    return get().orders.filter(o => {
      if (o.status !== 'completed' || !o.pickedUpAt) return false;
      const picked = new Date(o.pickedUpAt);
      const diffDays = Math.floor((now.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) return false;
      return !get().followups.some(f => f.orderId === o.id);
    });
  },
}));

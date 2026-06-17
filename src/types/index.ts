export type OrderStatus = 'pending' | 'repairing' | 'ready' | 'completed';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  note: string;
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
  minStock: number;
}

export interface RepairPart {
  id: string;
  orderId: string;
  partId: string;
  partName: string;
  unitPrice: number;
  quantity: number;
}

export interface RepairOrder {
  id: string;
  customerId: string;
  applianceType: string;
  brand: string;
  model: string;
  fault: string;
  status: OrderStatus;
  laborFee: number;
  createdAt: string;
  completedAt?: string;
  pickedUpAt?: string;
  repairNote?: string;
}

export interface Followup {
  id: string;
  orderId: string;
  result: 'normal' | 'issue';
  note: string;
  createdAt: string;
}

export const APPLIANCE_TYPES = ['电视', '冰箱', '洗衣机', '空调', '热水器', '微波炉', '其他'];
export const PART_CATEGORIES = ['电视', '冰箱', '洗衣机', '空调', '热水器', '通用', '其他'];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待修',
  repairing: '维修中',
  ready: '待取',
  completed: '已完成',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  repairing: 'bg-blue-50 text-blue-700 border-blue-200',
  ready: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

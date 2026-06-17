export type OrderStatus = 'pending' | 'repairing' | 'ready' | 'completed';

export type StockMovementType = 'in' | 'out';
export type StockMovementReason = 'purchase' | 'repair' | 'cancel_repair' | 'adjust';

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
  startedAt?: string;
  completedAt?: string;
  notifiedAt?: string;
  pickedUpAt?: string;
  inspectionResult?: string;
  repairPlan?: string;
  technicianNote?: string;
}

export interface Followup {
  id: string;
  orderId: string;
  result: 'normal' | 'issue';
  note: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  type: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  orderId?: string;
  remark?: string;
  createdAt: string;
}

export const STOCK_MOVEMENT_REASONS: Record<StockMovementReason, string> = {
  purchase: '采购入库',
  repair: '维修耗用',
  cancel_repair: '撤销换件',
  adjust: '库存调整',
};

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

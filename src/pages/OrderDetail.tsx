import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, Clock, Wrench, CheckCircle2, DollarSign, Plus, X, AlertTriangle, User } from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { formatDate, formatDateTime } from '@/utils/date';
import type { OrderStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = useAppStore(s => s.orders);
  const customers = useAppStore(s => s.customers);
  const parts = useAppStore(s => s.parts);
  const allRepairParts = useAppStore(s => s.repairParts);
  const addRepairPart = useAppStore(s => s.addRepairPart);
  const removeRepairPart = useAppStore(s => s.removeRepairPart);
  const updateOrder = useAppStore(s => s.updateOrder);
  const updateOrderStatus = useAppStore(s => s.updateOrderStatus);
  const followups = useAppStore(s => s.followups);

  const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);
  const customer = useMemo(() => order ? customers.find(c => c.id === order.customerId) : undefined, [order, customers]);
  const repairParts = useMemo(() => (id ? allRepairParts.filter(rp => rp.orderId === id) : []), [id, allRepairParts]);
  const totals = useMemo(() => {
    if (!id) return { partsTotal: 0, laborFee: 0, total: 0 };
    const rps = allRepairParts.filter(rp => rp.orderId === id);
    const partsTotal = rps.reduce((sum, rp) => sum + rp.unitPrice * rp.quantity, 0);
    const o = orders.find(ord => ord.id === id);
    const laborFee = o?.laborFee ?? 0;
    return { partsTotal, laborFee, total: partsTotal + laborFee };
  }, [id, allRepairParts, orders]);
  const hasFollowup = useMemo(() => order ? followups.some(f => f.orderId === order.id) : false, [order, followups]);

  const [partModalOpen, setPartModalOpen] = useState(false);
  const [laborModalOpen, setLaborModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [laborFeeInput, setLaborFeeInput] = useState('0');

  if (!order || !customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">工单不存在</p>
        <button onClick={() => navigate('/orders')} className="mt-4 text-blue-600 hover:underline text-sm">
          返回工单列表
        </button>
      </div>
    );
  }

  const canEditParts = order.status === 'repairing' || order.status === 'pending';
  const canStartRepair = order.status === 'pending';
  const canMarkReady = order.status === 'repairing';
  const canSettle = order.status === 'ready';

  function openAddPart() {
    setSelectedPartId('');
    setPartQty(1);
    setPartModalOpen(true);
  }

  function handleAddPart() {
    if (!selectedPartId || partQty <= 0) return;
    addRepairPart(order.id, selectedPartId, partQty);
    setPartModalOpen(false);
  }

  function openLabor() {
    setLaborFeeInput(String(order.laborFee || 0));
    setLaborModalOpen(true);
  }

  function handleSaveLabor() {
    const fee = Number(laborFeeInput) || 0;
    updateOrder(order.id, { laborFee: fee });
    setLaborModalOpen(false);
  }

  function handleStartRepair() {
    updateOrderStatus(order.id, 'repairing');
  }

  function handleMarkReady() {
    updateOrderStatus(order.id, 'ready');
  }

  function handleSettle() {
    updateOrderStatus(order.id, 'completed');
    setSettleModalOpen(false);
  }

  const timelineSteps: { status: OrderStatus; label: string; time?: string; done: boolean; active: boolean }[] = [
    { status: 'pending', label: '工单登记', time: order.createdAt, done: true, active: order.status === 'pending' },
    { status: 'repairing', label: '维修中', done: order.status !== 'pending', active: order.status === 'repairing' },
    { status: 'ready', label: '待取机', time: order.completedAt, done: order.status === 'ready' || order.status === 'completed', active: order.status === 'ready' },
    { status: 'completed', label: '已完成', time: order.pickedUpAt, done: order.status === 'completed', active: false },
  ];

  const availableParts = parts.filter(p => p.stock > 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        返回工单列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-zinc-900">{customer.name} 的维修工单</h1>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm text-zinc-500 mt-1.5 flex items-center gap-1.5">
                  <Calendar size={14} />
                  登记于 {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canStartRepair && (
                  <button
                    onClick={handleStartRepair}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5"
                  >
                    <Wrench size={14} />
                    开始维修
                  </button>
                )}
                {canMarkReady && (
                  <button
                    onClick={handleMarkReady}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    修好待取
                  </button>
                )}
                {canSettle && (
                  <button
                    onClick={() => setSettleModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                  >
                    <DollarSign size={14} />
                    结算收款
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-200" />
                <div className="space-y-4">
                  {timelineSteps.map((step, idx) => (
                    <div key={step.status} className="relative flex items-start gap-3">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        step.done ? 'bg-blue-600 border-blue-600' : step.active ? 'bg-white border-blue-600' : 'bg-white border-zinc-300'
                      }`}>
                        {step.done && <CheckCircle2 size={12} className="text-white" />}
                        {step.active && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-medium ${step.done || step.active ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Clock size={11} />
                            {formatDateTime(step.time)}
                          </p>
                        )}
                        {idx === 2 && step.done && !hasFollowup && order.status === 'completed' && (
                          <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> 待回访
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <Wrench size={16} className="text-blue-600" />
                更换零件
              </h2>
              {canEditParts && (
                <button
                  onClick={openAddPart}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Plus size={14} />
                  添加零件
                </button>
              )}
            </div>
            {repairParts.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                暂无更换零件记录
                {canEditParts && '，点击右上角添加'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500">零件名称</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500">单价</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500">数量</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500">小计</th>
                    {canEditParts && <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500">操作</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {repairParts.map(rp => (
                    <tr key={rp.id}>
                      <td className="px-5 py-3 text-sm text-zinc-900">{rp.partName}</td>
                      <td className="px-5 py-3 text-sm text-zinc-600 text-right">¥{rp.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-3 text-sm text-zinc-600 text-right">{rp.quantity}</td>
                      <td className="px-5 py-3 text-sm font-medium text-zinc-900 text-right">¥{(rp.unitPrice * rp.quantity).toFixed(2)}</td>
                      {canEditParts && (
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => removeRepairPart(rp.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50 border-t border-zinc-100">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-sm font-medium text-zinc-600 text-right">零件费合计</td>
                    <td colSpan={canEditParts ? 2 : 1} className="px-5 py-3 text-sm font-semibold text-zinc-900 text-right">¥{totals.partsTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                客户信息
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <Link to={`/customers/${customer.id}`} className="block hover:bg-zinc-50 -m-2 p-2 rounded-lg transition-colors">
                <p className="font-medium text-zinc-900">{customer.name}</p>
                <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
                  <Phone size={13} />
                  {customer.phone}
                </p>
                {customer.note && <p className="text-xs text-zinc-400 mt-1">{customer.note}</p>}
                <p className="text-xs text-blue-600 mt-1">查看客户详情 →</p>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="font-semibold text-zinc-900">电器信息</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">类型</span>
                <span className="text-zinc-900 font-medium">{order.applianceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">品牌</span>
                <span className="text-zinc-900 font-medium">{order.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">型号</span>
                <span className="text-zinc-900 font-medium">{order.model || '-'}</span>
              </div>
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-zinc-500 block mb-1">故障现象</span>
                <p className="text-zinc-900">{order.fault}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-xl text-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <DollarSign size={16} />
                费用结算
              </h2>
              {canEditParts && (
                <button
                  onClick={openLabor}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                >
                  编辑工时
                </button>
              )}
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-blue-100">
                <span>零件费</span>
                <span>¥{totals.partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-100">
                <span>工时费</span>
                <span>¥{totals.laborFee.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/20 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-blue-100">应收总额</span>
                <span className="text-2xl font-bold">¥{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={partModalOpen} onClose={() => setPartModalOpen(false)} title="添加更换零件">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">选择零件</label>
            <select
              value={selectedPartId}
              onChange={e => setSelectedPartId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择零件</option>
              {availableParts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}（库存：{p.stock}，¥{p.unitPrice}）
                </option>
              ))}
            </select>
            {availableParts.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                当前库存中没有可用零件，请先补充库存
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">数量</label>
            <input
              type="number"
              min={1}
              value={partQty}
              onChange={e => setPartQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setPartModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleAddPart}
              disabled={!selectedPartId || partQty <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认添加
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={laborModalOpen} onClose={() => setLaborModalOpen(false)} title="设置工时费">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">工时费（元）</label>
            <input
              type="number"
              min={0}
              value={laborFeeInput}
              onChange={e => setLaborFeeInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setLaborModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleSaveLabor}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={settleModalOpen} onClose={() => setSettleModalOpen(false)} title="结算收款">
        <div className="space-y-4">
          <div className="bg-zinc-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>零件费</span>
              <span>¥{totals.partsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>工时费</span>
              <span>¥{totals.laborFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-zinc-200 my-1" />
            <div className="flex justify-between items-end">
              <span className="text-zinc-700 font-medium">应收金额</span>
              <span className="text-2xl font-bold text-green-600">¥{totals.total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500">
            确认收款后，工单状态将更新为"已完成"，{STATUS_LABELS.completed}。
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setSettleModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleSettle}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              确认收款并完成
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

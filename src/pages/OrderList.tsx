import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Phone, Trash2, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/utils/date';
import type { RepairOrder, OrderStatus } from '@/types';
import { APPLIANCE_TYPES, STATUS_LABELS } from '@/types';

interface NewOrderForm {
  customerId: string;
  newCustomerName: string;
  newCustomerPhone: string;
  applianceType: string;
  brand: string;
  model: string;
  fault: string;
}

const emptyForm: NewOrderForm = {
  customerId: '',
  newCustomerName: '',
  newCustomerPhone: '',
  applianceType: APPLIANCE_TYPES[0],
  brand: '',
  model: '',
  fault: '',
};

const statusFilters: (OrderStatus | 'all')[] = ['all', 'pending', 'repairing', 'ready', 'completed'];

export default function OrderList() {
  const navigate = useNavigate();
  const orders = useAppStore(s => s.orders);
  const customers = useAppStore(s => s.customers);
  const addOrder = useAppStore(s => s.addOrder);
  const addCustomer = useAppStore(s => s.addCustomer);
  const deleteOrder = useAppStore(s => s.deleteOrder);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewOrderForm>(emptyForm);
  const [useNewCustomer, setUseNewCustomer] = useState(false);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }
    const kw = search.trim().toLowerCase();
    if (kw) {
      list = list.filter(o => {
        const customer = customers.find(c => c.id === o.customerId);
        return (
          customer?.name.toLowerCase().includes(kw) ||
          customer?.phone.includes(kw) ||
          o.brand.toLowerCase().includes(kw) ||
          o.model.toLowerCase().includes(kw) ||
          o.fault.toLowerCase().includes(kw)
        );
      });
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, customers, statusFilter, search]);

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name ?? '-';
  const getCustomerPhone = (id: string) => customers.find(c => c.id === id)?.phone ?? '';

  function openNew() {
    setForm(emptyForm);
    setUseNewCustomer(false);
    setModalOpen(true);
  }

  function handleSubmit() {
    let customerId = form.customerId;
    if (useNewCustomer) {
      if (!form.newCustomerName.trim() || !form.newCustomerPhone.trim()) return;
      const c = addCustomer({ name: form.newCustomerName.trim(), phone: form.newCustomerPhone.trim(), note: '' });
      customerId = c.id;
    }
    if (!customerId) return;
    if (!form.brand.trim() || !form.fault.trim()) return;

    addOrder({
      customerId,
      applianceType: form.applianceType,
      brand: form.brand.trim(),
      model: form.model.trim(),
      fault: form.fault.trim(),
    });
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm('确定删除此工单吗？相关维修记录也会删除。')) {
      deleteOrder(id);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">维修工单</h1>
          <p className="text-sm text-zinc-500 mt-1">共 {orders.length} 条工单</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新建工单
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索客户、电器、故障..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-zinc-400" />
            <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
              {statusFilters.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {s === 'all' ? '全部' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">客户</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">电器信息</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">故障</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">状态</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">登记时间</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 text-sm">暂无工单数据</td>
              </tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-zinc-900">{getCustomerName(o.customerId)}</p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                      <Phone size={11} />
                      {getCustomerPhone(o.customerId)}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-zinc-900">{o.applianceType}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{o.brand} {o.model}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-600 max-w-[200px] truncate">{o.fault}</td>
                  <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-4 text-sm text-zinc-500">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="新建维修工单"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">客户选择</label>
            <div className="flex items-center gap-2 mb-2">
              <label className="flex items-center gap-1.5 text-sm text-zinc-600">
                <input
                  type="radio"
                  checked={!useNewCustomer}
                  onChange={() => setUseNewCustomer(false)}
                  className="text-blue-600"
                />
                选择已有客户
              </label>
              <label className="flex items-center gap-1.5 text-sm text-zinc-600">
                <input
                  type="radio"
                  checked={useNewCustomer}
                  onChange={() => setUseNewCustomer(true)}
                  className="text-blue-600"
                />
                新增客户
              </label>
            </div>
            {!useNewCustomer ? (
              <select
                value={form.customerId}
                onChange={e => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择客户</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.newCustomerName}
                  onChange={e => setForm({ ...form, newCustomerName: e.target.value })}
                  placeholder="客户姓名"
                  className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  value={form.newCustomerPhone}
                  onChange={e => setForm({ ...form, newCustomerPhone: e.target.value })}
                  placeholder="联系电话"
                  className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">电器类型</label>
              <select
                value={form.applianceType}
                onChange={e => setForm({ ...form, applianceType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {APPLIANCE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">品牌</label>
              <input
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                placeholder="如：海尔、格力"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">型号</label>
            <input
              value={form.model}
              onChange={e => setForm({ ...form, model: e.target.value })}
              placeholder="如：KFR-35GW"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">故障现象</label>
            <textarea
              value={form.fault}
              onChange={e => setForm({ ...form, fault: e.target.value })}
              rows={3}
              placeholder="如：不制冷、不启动、异响等"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                (!useNewCustomer && !form.customerId) ||
                (useNewCustomer && (!form.newCustomerName.trim() || !form.newCustomerPhone.trim())) ||
                !form.brand.trim() || !form.fault.trim()
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建工单
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

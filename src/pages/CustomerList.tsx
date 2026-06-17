import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, FileText, Trash2, Edit, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/date';
import type { Customer } from '@/types';

type FormData = Omit<Customer, 'id' | 'createdAt'>;

const emptyForm: FormData = { name: '', phone: '', note: '' };

export default function CustomerList() {
  const navigate = useNavigate();
  const customers = useAppStore(s => s.customers);
  const orders = useAppStore(s => s.orders);
  const addCustomer = useAppStore(s => s.addCustomer);
  const updateCustomer = useAppStore(s => s.updateCustomer);
  const deleteCustomer = useAppStore(s => s.deleteCustomer);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(kw) || c.phone.includes(kw)
    );
  }, [customers, search]);

  const getOrderCount = (customerId: string) => orders.filter(o => o.customerId === customerId).length;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, note: c.note });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editing) {
      updateCustomer(editing.id, form);
    } else {
      addCustomer(form);
    }
    setModalOpen(false);
  }

  function handleDelete(c: Customer) {
    if (getOrderCount(c.id) > 0) {
      alert('该客户有维修记录，无法删除');
      return;
    }
    if (confirm(`确定删除客户 "${c.name}" 吗？`)) {
      deleteCustomer(c.id);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">客户管理</h1>
          <p className="text-sm text-zinc-500 mt-1">共 {customers.length} 位客户</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新增客户
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名或电话..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">客户姓名</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">联系电话</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">维修次数</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">备注</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">登记时间</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 text-sm">暂无客户数据</td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-medium text-zinc-900">{c.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <Phone size={14} />
                      {c.phone}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <FileText size={14} />
                      {getOrderCount(c.id)} 次
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500 truncate max-w-[200px]">{c.note || '-'}</td>
                  <td className="px-5 py-4 text-sm text-zinc-500">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="查看详情"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
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
        title={editing ? '编辑客户' : '新增客户'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">客户姓名 <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入客户姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">联系电话 <span className="text-red-500">*</span></label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入手机号码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">备注</label>
            <textarea
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="可选，如老客户、价格优惠等"
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
              disabled={!form.name.trim() || !form.phone.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? '保存修改' : '确认添加'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

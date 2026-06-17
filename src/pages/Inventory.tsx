import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';
import type { Part } from '@/types';
import { PART_CATEGORIES } from '@/types';

type FormData = Omit<Part, 'id'>;

const emptyForm: FormData = {
  name: '',
  category: PART_CATEGORIES[0],
  unitPrice: 0,
  stock: 0,
  minStock: 0,
};

export default function Inventory() {
  const parts = useAppStore(s => s.parts);
  const addPart = useAppStore(s => s.addPart);
  const updatePart = useAppStore(s => s.updatePart);
  const deletePart = useAppStore(s => s.deletePart);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(0);

  const filtered = useMemo(() => {
    let list = parts;
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }
    if (onlyLowStock) {
      list = list.filter(p => p.stock <= p.minStock);
    }
    const kw = search.trim().toLowerCase();
    if (kw) {
      list = list.filter(p => p.name.toLowerCase().includes(kw));
    }
    return list;
  }, [parts, categoryFilter, onlyLowStock, search]);

  const lowStockCount = parts.filter(p => p.stock <= p.minStock).length;

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Part) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      unitPrice: p.unitPrice,
      stock: p.stock,
      minStock: p.minStock,
    });
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    if (editing) {
      updatePart(editing.id, form);
    } else {
      addPart(form);
    }
    setModalOpen(false);
  }

  function handleDelete(p: Part) {
    if (confirm(`确定删除零件 "${p.name}" 吗？`)) {
      deletePart(p.id);
    }
  }

  function openRestock(p: Part) {
    setRestockId(p.id);
    setRestockQty(p.minStock * 2 - p.stock || 5);
  }

  const addStock = useAppStore(s => s.addStock);

  function handleRestock() {
    if (!restockId || restockQty <= 0) return;
    addStock(restockId, restockQty);
    setRestockId(null);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">零件库存</h1>
          <p className="text-sm text-zinc-500 mt-1">
            共 {parts.length} 种零件
            {lowStockCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle size={12} />
                {lowStockCount} 种低于最低库存
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新增零件
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <AlertTriangle size={18} className="animate-pulse-slow" />
            库存预警（{lowStockCount}）
          </div>
          <div className="flex flex-wrap gap-2">
            {parts.filter(p => p.stock <= p.minStock).slice(0, 8).map(p => (
              <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                <Package size={12} />
                {p.name} · 剩 {p.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索零件名称..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {PART_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={e => setOnlyLowStock(e.target.checked)}
              className="text-amber-600 rounded"
            />
            仅显示低库存
          </label>
        </div>

        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">零件名称</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">分类</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">单价</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">当前库存</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">最低库存</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 text-sm">暂无零件数据</td>
              </tr>
            ) : (
              filtered.map(p => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className={`hover:bg-zinc-50 transition-colors ${isLow ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-5 py-4">
                      <span className="font-medium text-zinc-900">{p.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">{p.category}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-600 text-right">¥{p.unitPrice.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-semibold text-sm ${isLow ? 'text-amber-600' : 'text-zinc-900'}`}>
                        {p.stock}
                      </span>
                      {isLow && <AlertTriangle size={12} className="inline-block ml-1 text-amber-500" />}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500 text-right">{p.minStock}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {isLow && (
                          <button
                            onClick={() => openRestock(p)}
                            className="px-2 py-1 rounded-md text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                          >
                            进货
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                          title="编辑"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑零件' : '新增零件'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">零件名称 <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：空调压缩机"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">分类</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PART_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">单价（元）</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.unitPrice}
                onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">当前库存</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={e => setForm({ ...form, stock: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">最低库存</label>
              <input
                type="number"
                min={0}
                value={form.minStock}
                onChange={e => setForm({ ...form, minStock: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? '保存修改' : '确认添加'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!restockId}
        onClose={() => setRestockId(null)}
        title="补充库存"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">进货数量</label>
            <input
              type="number"
              min={1}
              value={restockQty}
              onChange={e => setRestockQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setRestockId(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleRestock}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
            >
              确认进货
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

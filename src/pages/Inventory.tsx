import { useState, useMemo } from 'react';
import {
  Plus, Search, Edit, Trash2, AlertTriangle, Package, ArrowLeftRight,
  ChevronDown, ChevronUp, TrendingDown, TrendingUp, ShoppingCart, XCircle,
  Download, Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';
import { formatDateTime, isBetweenDates } from '@/utils/date';
import type { Part, StockMovement } from '@/types';
import { PART_CATEGORIES, STOCK_MOVEMENT_REASONS } from '@/types';

type FormData = Omit<Part, 'id'>;

const emptyForm: FormData = {
  name: '',
  category: PART_CATEGORIES[0],
  unitPrice: 0,
  stock: 0,
  minStock: 0,
};

function movementColor(type: StockMovement['type']) {
  return type === 'in'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-700 border-red-200';
}
function movementIcon(type: StockMovement['type']) {
  return type === 'in' ? TrendingUp : TrendingDown;
}
function movementReasonColor(reason: StockMovement['reason']) {
  switch (reason) {
    case 'purchase': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'repair': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancel_repair': return 'bg-zinc-50 text-zinc-700 border-zinc-200';
    default: return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  }
}

export default function Inventory() {
  const parts = useAppStore(s => s.parts);
  const addPart = useAppStore(s => s.addPart);
  const updatePart = useAppStore(s => s.updatePart);
  const deletePart = useAppStore(s => s.deletePart);
  const addStock = useAppStore(s => s.addStock);
  const stockMovements = useAppStore(s => s.stockMovements);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockRemark, setRestockRemark] = useState('采购入库');
  const [showMovements, setShowMovements] = useState(true);
  const [movementPartFilter, setMovementPartFilter] = useState('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const lowStockParts = useMemo(() => parts.filter(p => p.stock < p.minStock), [parts]);
  const lowStockCount = lowStockParts.length;

  const filtered = useMemo(() => {
    let list = parts;
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }
    if (onlyLowStock) {
      list = list.filter(p => p.stock < p.minStock);
    }
    const kw = search.trim().toLowerCase();
    if (kw) {
      list = list.filter(p => p.name.toLowerCase().includes(kw));
    }
    return list;
  }, [parts, categoryFilter, onlyLowStock, search]);

  const filteredMovements = useMemo(() => {
    let list = stockMovements;
    if (movementPartFilter !== 'all') {
      list = list.filter(m => m.partId === movementPartFilter);
    }
    if (movementTypeFilter !== 'all') {
      list = list.filter(m => m.type === movementTypeFilter);
    }
    if (startDate && endDate) {
      list = list.filter(m => isBetweenDates(m.createdAt, startDate, endDate));
    }
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [stockMovements, movementPartFilter, movementTypeFilter, startDate, endDate]);

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
    setRestockQty(Math.max(1, p.minStock * 2 - p.stock || 5));
    setRestockRemark('采购入库');
  }

  function handleRestock() {
    if (!restockId || restockQty <= 0) return;
    addStock(restockId, restockQty, restockRemark.trim() || '采购入库');
    setRestockId(null);
  }

  function exportCSV() {
    if (filteredMovements.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const headers = ['时间', '零件', '类型', '原因', '数量', '变动前库存', '变动后库存', '备注'];
    const rows = filteredMovements.map(m => [
      formatDateTime(m.createdAt),
      m.partName,
      m.type === 'in' ? '入库' : '出库',
      STOCK_MOVEMENT_REASONS[m.reason],
      m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`,
      m.stockBefore,
      m.stockAfter,
      m.remark || '-',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `库存流水_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function clearDateFilter() {
    setStartDate('');
    setEndDate('');
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">零件库存</h1>
          <p className="text-sm text-zinc-500 mt-1">
            共 {parts.length} 种零件
            {lowStockCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle size={12} />
                {lowStockCount} 种低于最低库存（需补货）
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
            <AlertTriangle size={18} className={lowStockCount > 0 ? 'animate-pulse-slow' : ''} />
            库存预警（{lowStockCount}）— 低于最低库存
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockParts.slice(0, 8).map(p => (
              <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                <Package size={12} />
                {p.name} · 剩 {p.stock} / 最低 {p.minStock}
              </span>
            ))}
            {lowStockParts.length > 8 && (
              <span className="text-xs text-amber-600 px-2 py-1">+{lowStockParts.length - 8} 种...</span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
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

        <div className="overflow-x-auto">
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
                  const isLow = p.stock < p.minStock;
                  const isExactlyMin = p.stock === p.minStock;
                  return (
                    <tr key={p.id} className={`hover:bg-zinc-50 transition-colors ${isLow ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setMovementPartFilter(p.id);
                              setShowMovements(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="查看流水"
                          >
                            <ArrowLeftRight size={14} />
                          </button>
                          <span className="font-medium text-zinc-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">{p.category}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600 text-right">¥{p.unitPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold text-sm ${
                          isLow ? 'text-amber-600' :
                          isExactlyMin ? 'text-blue-600' :
                          'text-zinc-900'
                        }`}>
                          {p.stock}
                        </span>
                        {isLow && <AlertTriangle size={12} className="inline-block ml-1 text-amber-500" />}
                        {isExactlyMin && !isLow && (
                          <span className="inline-block ml-1 text-[10px] text-blue-500 align-middle">（等于最低）</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-500 text-right">{p.minStock}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openRestock(p)}
                            className="px-2 py-1 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            title="补货"
                          >
                            <span className="inline-flex items-center gap-1">
                              <ShoppingCart size={11} />
                              进货
                            </span>
                          </button>
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
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <button
          onClick={() => setShowMovements(v => !v)}
          className="w-full px-5 py-4 flex items-center justify-between border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
        >
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-blue-600" />
            出入库流水
            <span className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5">
              {stockMovements.length}
            </span>
          </h2>
          {showMovements ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
        </button>

        {showMovements && (
          <>
            <div className="p-4 border-b border-zinc-100">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <select
                  value={movementPartFilter}
                  onChange={e => setMovementPartFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                >
                  <option value="all">全部零件</option>
                  {parts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}（库存：{p.stock}）</option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                  {(['all', 'in', 'out'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setMovementTypeFilter(t)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        movementTypeFilter === t
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {t === 'all' ? '全部' : t === 'in' ? '入库' : '出库'}
                    </button>
                  ))}
                </div>
                {movementPartFilter !== 'all' && (
                  <button
                    onClick={() => setMovementPartFilter('all')}
                    className="text-xs text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1"
                  >
                    <XCircle size={12} />
                    清除零件筛选
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-zinc-400 text-sm">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="text-xs text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1"
                  >
                    <XCircle size={12} />
                    清除日期
                  </button>
                )}
                <button
                  onClick={exportCSV}
                  disabled={filteredMovements.length === 0}
                  className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  导出 CSV
                </button>
              </div>
            </div>
            <div className="max-h-[480px] overflow-y-auto">
              {filteredMovements.length === 0 ? (
                <div className="p-10 text-center text-zinc-400 text-sm">
                  <ArrowLeftRight size={32} className="mx-auto mb-2 text-zinc-300" />
                  暂无出入库记录
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-100 sticky top-0">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">时间</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">零件</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">类型</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">原因</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">数量</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">库存变化</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredMovements.slice(0, 200).map(m => {
                      const Icon = movementIcon(m.type);
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">
                            {formatDateTime(m.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-sm text-zinc-800 font-medium">{m.partName}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${movementColor(m.type)}`}>
                              <Icon size={11} />
                              {m.type === 'in' ? '入库' : '出库'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${movementReasonColor(m.reason)}`}>
                              {STOCK_MOVEMENT_REASONS[m.reason]}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-sm text-right font-semibold ${
                            m.type === 'in' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </td>
                          <td className="px-5 py-3 text-xs text-zinc-500 text-right whitespace-nowrap">
                            {m.stockBefore} → <span className="text-zinc-800 font-medium">{m.stockAfter}</span>
                          </td>
                          <td className="px-5 py-3 text-xs text-zinc-500 max-w-[220px] truncate">
                            {m.remark || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {filteredMovements.length > 200 && (
                <div className="px-5 py-3 text-center text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50">
                  仅显示最近 200 条
                </div>
              )}
            </div>
          </>
        )}
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
          {!editing && form.stock > 0 && (
            <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-md px-3 py-2">
              💡 新增时录入的初始库存将自动记录为"初始入库"流水
            </p>
          )}
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">入库备注</label>
            <input
              type="text"
              value={restockRemark}
              onChange={e => setRestockRemark(e.target.value)}
              placeholder="如：采购入库、赠送、盘盈等"
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

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PhoneCall, CheckCircle, AlertCircle, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, isInRange } from '@/utils/date';

export default function Followups() {
  const [searchParams] = useSearchParams();
  const orders = useAppStore(s => s.orders);
  const customers = useAppStore(s => s.customers);
  const followups = useAppStore(s => s.followups);
  const addFollowup = useAppStore(s => s.addFollowup);

  const paramRange = searchParams.get('range') as 'today' | 'week' | 'month' | null;
  const paramStart = searchParams.get('start');
  const paramEnd = searchParams.get('end');
  const hasFilter = !!(paramRange || paramStart || paramEnd);

  const pending = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (o.status !== 'completed' || !o.pickedUpAt) return false;
      const picked = new Date(o.pickedUpAt);
      const diffDays = Math.floor((now.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) return false;
      if (!followups.every(f => f.orderId !== o.id)) return false;

      if (paramRange) {
        if (!isInRange(o.pickedUpAt, paramRange)) return false;
      }
      if (paramStart || paramEnd) {
        const d = new Date(o.pickedUpAt);
        if (paramStart) {
          const s = new Date(paramStart);
          s.setHours(0, 0, 0, 0);
          if (d < s) return false;
        }
        if (paramEnd) {
          const e = new Date(paramEnd);
          e.setHours(23, 59, 59, 999);
          if (d > e) return false;
        }
      }
      return true;
    });
  }, [orders, followups, paramRange, paramStart, paramEnd]);
  const done = useMemo(
    () => [...followups].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [followups]
  );

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [result, setResult] = useState<'normal' | 'issue'>('normal');
  const [note, setNote] = useState('');

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name ?? '-';
  const getCustomerPhone = (id: string) => customers.find(c => c.id === id)?.phone ?? '';

  function openFollowup(orderId: string) {
    setActiveOrderId(orderId);
    setResult('normal');
    setNote('');
  }

  function handleSubmit() {
    if (!activeOrderId) return;
    addFollowup(activeOrderId, result, note.trim());
    setActiveOrderId(null);
  }

  function getOrderById(id: string) {
    return orders.find(o => o.id === id);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">回访记录</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
              <Clock size={14} />
              待回访：{pending.length}
            </span>
            <span className="mx-2 text-zinc-300">|</span>
            已回访：{done.length}
          </p>
          {hasFilter && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              已按时间段筛选
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2 bg-amber-50/50">
            <Clock size={18} className="text-amber-600" />
            <h2 className="font-semibold text-zinc-900">待回访工单</h2>
            {pending.length > 0 && (
              <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-medium">
                {pending.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto">
            {pending.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-300" />
                暂无待回访工单
              </div>
            ) : (
              pending.map(o => {
                const daysSince = Math.floor(
                  (Date.now() - new Date(o.pickedUpAt!).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={o.id} className="px-5 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{getCustomerName(o.customerId)}</span>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="text-sm text-zinc-500 mt-1 truncate">
                          {o.applianceType} · {o.brand} {o.model} · {o.fault}
                        </p>
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Clock size={11} />
                          取机已过 {daysSince} 天
                        </p>
                      </div>
                      <button
                        onClick={() => openFollowup(o.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shrink-0 ml-3"
                      >
                        <PhoneCall size={12} />
                        去回访
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" />
            <h2 className="font-semibold text-zinc-900">历史回访</h2>
          </div>
          <div className="divide-y divide-zinc-50 max-h-[600px] overflow-y-auto">
            {done.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-sm">
                <MessageSquare size={32} className="mx-auto mb-2 text-zinc-300" />
                暂无回访记录
              </div>
            ) : (
              done.map(f => {
                const order = getOrderById(f.orderId);
                return (
                  <div key={f.id} className="px-5 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {f.result === 'normal' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                              <CheckCircle size={11} />
                              使用正常
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <AlertCircle size={11} />
                              仍有问题
                            </span>
                          )}
                          {order && (
                            <span className="font-medium text-zinc-900 text-sm">{getCustomerName(order.customerId)}</span>
                          )}
                        </div>
                        {f.note && (
                          <p className="text-sm text-zinc-600 mt-1.5">{f.note}</p>
                        )}
                        <p className="text-xs text-zinc-400 mt-1">{formatDate(f.createdAt)}</p>
                      </div>
                      {order && (
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 shrink-0 ml-3"
                        >
                          工单详情
                          <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        open={!!activeOrderId}
        onClose={() => setActiveOrderId(null)}
        title="客户回访"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">回访结果</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResult('normal')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  result === 'normal'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <CheckCircle size={18} />
                <span className="text-sm font-medium">使用正常</span>
              </button>
              <button
                onClick={() => setResult('issue')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  result === 'issue'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <AlertCircle size={18} />
                <span className="text-sm font-medium">仍有问题</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">回访备注</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="记录回访情况，如客户反馈、使用状态等..."
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setActiveOrderId(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800"
            >
              保存回访记录
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

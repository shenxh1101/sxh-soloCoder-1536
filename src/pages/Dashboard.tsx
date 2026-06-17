import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, Package, PhoneCall, AlertTriangle, Plus, UserPlus, ClipboardPlus, Search } from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, isSameDay } from '@/utils/date';

export default function Dashboard() {
  const navigate = useNavigate();
  const orders = useAppStore(s => s.orders);
  const customers = useAppStore(s => s.customers);
  const parts = useAppStore(s => s.parts);
  const followups = useAppStore(s => s.followups);

  const lowStockParts = useMemo(() => parts.filter(p => p.stock < p.minStock), [parts]);
  const needFollowup = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (o.status !== 'completed' || !o.pickedUpAt) return false;
      const picked = new Date(o.pickedUpAt);
      const diffDays = Math.floor((now.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) return false;
      return !followups.some(f => f.orderId === o.id);
    });
  }, [orders, followups]);

  const stats = useMemo(() => {
    const inProgress = orders.filter(o => o.status === 'pending' || o.status === 'repairing').length;
    const todayDone = orders.filter(o => o.pickedUpAt && isSameDay(o.pickedUpAt)).length;
    return {
      totalOrders: orders.length,
      inProgress,
      todayDone,
      totalCustomers: customers.length,
      lowStockCount: lowStockParts.length,
      followupCount: needFollowup.length,
    };
  }, [orders, customers, lowStockParts, needFollowup]);

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [orders]
  );

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name ?? '-';

  const cards = [
    { label: '处理中工单', value: stats.inProgress, icon: ClipboardList, color: 'from-blue-600 to-blue-500', to: '/orders' },
    { label: '今日完成', value: stats.todayDone, icon: ClipboardPlus, color: 'from-green-600 to-green-500', to: '/orders' },
    { label: '客户总数', value: stats.totalCustomers, icon: Users, color: 'from-indigo-600 to-indigo-500', to: '/customers' },
    { label: '低库存零件', value: stats.lowStockCount, icon: AlertTriangle, color: 'from-amber-500 to-orange-500', to: '/inventory', warn: stats.lowStockCount > 0 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">工作台</h1>
        <p className="text-sm text-zinc-500 mt-1">欢迎使用家电维修管理系统</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={() => navigate(c.to)}
            className="group relative overflow-hidden rounded-xl p-5 text-left text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color}`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-90">{c.label}</p>
                  <p className="text-3xl font-bold mt-2">{c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center ${c.warn ? 'animate-pulse-slow' : ''}`}>
                  <c.icon size={20} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">最近工单</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              查看全部
            </button>
          </div>
          <div className="divide-y divide-zinc-50">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">暂无工单，点击右上角新建</div>
            ) : (
              recentOrders.map(o => (
                <button
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-zinc-900 truncate">{getCustomerName(o.customerId)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-1 truncate">
                      {o.brand} {o.model} · {o.fault}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0 ml-4">{formatDate(o.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <h2 className="font-semibold text-zinc-900 mb-4">快捷操作</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/orders')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
              >
                <ClipboardPlus size={22} />
                <span className="text-sm font-medium">新建工单</span>
              </button>
              <button
                onClick={() => navigate('/customers')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
              >
                <UserPlus size={22} />
                <span className="text-sm font-medium">新增客户</span>
              </button>
              <button
                onClick={() => navigate('/inventory')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
              >
                <Search size={22} />
                <span className="text-sm font-medium">查询库存</span>
              </button>
              <button
                onClick={() => navigate('/followups')}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
              >
                <PhoneCall size={22} />
                <span className="text-sm font-medium">回访客户</span>
              </button>
            </div>
          </div>

          {lowStockParts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-amber-700 mb-3">
                <AlertTriangle size={18} className="animate-pulse-slow" />
                <h2 className="font-semibold">低库存提醒</h2>
              </div>
              <div className="space-y-2">
                {lowStockParts.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-amber-900 truncate">{p.name}</span>
                    <span className="text-amber-700 font-medium">剩 {p.stock} 个</span>
                  </div>
                ))}
                {lowStockParts.length > 4 && (
                  <button
                    onClick={() => navigate('/inventory')}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium pt-1"
                  >
                    还有 {lowStockParts.length - 4} 个...
                  </button>
                )}
              </div>
            </div>
          )}

          {needFollowup.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <PhoneCall size={18} />
                <h2 className="font-semibold">待回访</h2>
                <span className="text-xs bg-blue-200 text-blue-800 rounded-full px-2 py-0.5">{needFollowup.length}</span>
              </div>
              <button
                onClick={() => navigate('/followups')}
                className="text-xs text-blue-700 hover:text-blue-800 font-medium"
              >
                去处理 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

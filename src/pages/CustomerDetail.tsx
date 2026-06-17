import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, FileText, Calendar, CheckCircle, AlertCircle,
  CreditCard, Wrench, Clock, TrendingUp, Users, Package,
  MessageSquare, ThumbsUp, ThumbsDown, BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/utils/date';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customers = useAppStore(s => s.customers);
  const followups = useAppStore(s => s.followups);
  const allOrders = useAppStore(s => s.orders);
  const repairParts = useAppStore(s => s.repairParts);
  const isInitialized = useAppStore(s => s.isInitialized);

  const customer = useMemo(() => {
    if (!id || !isInitialized) return null;
    return customers.find(c => c.id === id) || null;
  }, [customers, id, isInitialized]);

  const orders = useMemo(() => {
    if (!id || !isInitialized) return [];
    return allOrders
      .filter(o => o.customerId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [id, allOrders, isInitialized]);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed');
    const total = orders.length;
    const inProgress = total - completed.length;

    let totalSpent = 0;
    completed.forEach(o => {
      const rps = repairParts.filter(rp => rp.orderId === o.id);
      const partsTotal = rps.reduce((sum, rp) => sum + rp.unitPrice * rp.quantity, 0);
      totalSpent += partsTotal + Math.max(0, o.laborFee ?? 0);
    });

    const avgOrderValue = completed.length > 0 ? totalSpent / completed.length : 0;
    const lastRepair = orders.length > 0 ? orders[0].createdAt : null;

    const typeCount: Record<string, number> = {};
    orders.forEach(o => {
      typeCount[o.applianceType] = (typeCount[o.applianceType] || 0) + 1;
    });
    let favoriteType: string | null = null;
    let maxCount = 0;
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteType = type;
      }
    });

    return {
      total,
      completed: completed.length,
      inProgress,
      totalSpent,
      avgOrderValue,
      lastRepair,
      favoriteType,
    };
  }, [orders, repairParts]);

  function calcOrderTotal(orderId: string) {
    const rps = repairParts.filter(rp => rp.orderId === orderId);
    const partsTotal = rps.reduce((sum, rp) => sum + rp.unitPrice * rp.quantity, 0);
    const order = allOrders.find(o => o.id === orderId);
    return partsTotal + Math.max(0, order?.laborFee ?? 0);
  }

  const deepInsights = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed').slice(0, 5);

    const trend = completedOrders.map(o => ({
      orderId: o.id,
      date: o.pickedUpAt || o.createdAt,
      total: calcOrderTotal(o.id),
      appliance: o.applianceType,
    })).reverse();

    const partCount: Record<string, { name: string; count: number; total: number }> = {};
    orders.forEach(o => {
      const rps = repairParts.filter(rp => rp.orderId === o.id);
      rps.forEach(rp => {
        if (!partCount[rp.partId]) {
          partCount[rp.partId] = { name: rp.partName, count: 0, total: 0 };
        }
        partCount[rp.partId].count += rp.quantity;
        partCount[rp.partId].total += rp.unitPrice * rp.quantity;
      });
    });
    const favoriteParts = Object.values(partCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const customerFollowups = followups.filter(f => {
      const o = orders.find(oo => oo.id === f.orderId);
      return !!o;
    });
    const normalCount = customerFollowups.filter(f => f.result === 'normal').length;
    const issueCount = customerFollowups.filter(f => f.result === 'issue').length;
    const pendingFollowup = orders.filter(o => {
      if (o.status !== 'completed' || !o.pickedUpAt) return false;
      const now = new Date();
      const picked = new Date(o.pickedUpAt);
      const diffDays = Math.floor((now.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) return false;
      return !followups.some(f => f.orderId === o.id);
    }).length;

    let serviceHint = '';
    if (pendingFollowup > 0) {
      serviceHint = `有 ${pendingFollowup} 笔工单待回访，建议优先跟进`;
    } else if (issueCount > 0) {
      serviceHint = `历史有 ${issueCount} 次回访反馈问题，下次服务需更仔细`;
    } else if (stats.completed >= 3) {
      serviceHint = '高价值老客户，建议提供优先服务和关怀';
    } else if (stats.completed >= 1) {
      serviceHint = '已建立信任，可适当推荐保养或关联服务';
    } else {
      serviceHint = '新客户，做好第一次服务体验很重要';
    }

    return {
      trend,
      favoriteParts,
      followupSummary: {
        total: customerFollowups.length,
        normal: normalCount,
        issue: issueCount,
        pending: pendingFollowup,
      },
      serviceHint,
    };
  }, [orders, repairParts, followups, stats.completed]);

  if (!isInitialized) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-8 h-8 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-zinc-500">加载中...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">客户不存在</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 hover:underline text-sm">
          返回客户列表
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        返回客户列表
      </button>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-blue-100 text-sm">
            <span className="flex items-center gap-1.5">
              <Phone size={14} />
              {customer.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              登记于 {formatDate(customer.createdAt)}
            </span>
          </div>
          {customer.note && (
            <p className="mt-3 text-sm text-blue-50 bg-white/10 inline-block px-3 py-1.5 rounded-lg">
              {customer.note}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-zinc-100">
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
            <p className="text-sm text-zinc-500 mt-1">维修总次数</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-zinc-500 mt-1">已完成</p>
          </div>
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-zinc-500 mt-1">进行中</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-600" />
            消费与维修偏好
          </h2>
          {stats.completed > 0 && (
            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
              老客户
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-100">
          <div className="p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <CreditCard size={14} className="text-green-600" />
              总消费金额
            </div>
            <p className="text-xl font-bold text-zinc-900">¥{stats.totalSpent.toFixed(2)}</p>
            {stats.completed > 0 && (
              <p className="text-xs text-zinc-500 mt-1">共 {stats.completed} 笔已完成</p>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <TrendingUp size={14} className="text-blue-600" />
              平均客单价
            </div>
            <p className="text-xl font-bold text-zinc-900">
              {stats.completed > 0 ? `¥${stats.avgOrderValue.toFixed(2)}` : '-'}
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <Wrench size={14} className="text-amber-600" />
              常修电器
            </div>
            <p className="text-xl font-bold text-zinc-900">
              {stats.favoriteType || '-'}
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-2">
              <Clock size={14} className="text-purple-600" />
              最近维修
            </div>
            <p className="text-lg font-semibold text-zinc-900">
              {stats.lastRepair ? formatDate(stats.lastRepair) : '-'}
            </p>
          </div>
        </div>
      </div>

      {deepInsights.serviceHint && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">客户服务建议</h3>
              <p className="text-sm text-blue-700 mt-1">{deepInsights.serviceHint}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              最近消费趋势
            </h2>
            <span className="text-xs text-zinc-400">最近 {deepInsights.trend.length} 次</span>
          </div>
          {deepInsights.trend.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">暂无已完成维修记录</div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {deepInsights.trend.map(t => (
                <Link
                  key={t.orderId}
                  to={`/orders/${t.orderId}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm text-zinc-900 font-medium">{t.appliance}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatDate(t.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">¥{t.total.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Package size={16} className="text-amber-600" />
              常用更换零件
            </h2>
            <span className="text-xs text-zinc-400">Top {deepInsights.favoriteParts.length}</span>
          </div>
          {deepInsights.favoriteParts.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">暂无零件更换记录</div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {deepInsights.favoriteParts.map(p => (
                <div key={p.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-zinc-900 font-medium">{p.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">累计更换 {p.count} 次</p>
                  </div>
                  <p className="text-sm font-semibold text-amber-600">¥{p.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-purple-600" />
            回访情况汇总
          </h2>
        </div>
        <div className="grid grid-cols-4 divide-x divide-zinc-100">
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-zinc-900">{deepInsights.followupSummary.total}</p>
            <p className="text-xs text-zinc-500 mt-1">总回访次数</p>
          </div>
          <div className="p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <ThumbsUp size={16} className="text-green-500" />
              <p className="text-2xl font-bold text-green-600">{deepInsights.followupSummary.normal}</p>
            </div>
            <p className="text-xs text-zinc-500 mt-1">使用正常</p>
          </div>
          <div className="p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <ThumbsDown size={16} className="text-red-500" />
              <p className="text-2xl font-bold text-red-600">{deepInsights.followupSummary.issue}</p>
            </div>
            <p className="text-xs text-zinc-500 mt-1">仍有问题</p>
          </div>
          <div className="p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock size={16} className="text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">{deepInsights.followupSummary.pending}</p>
            </div>
            <p className="text-xs text-zinc-500 mt-1">待回访</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">维修历史</h2>
        </div>
        {orders.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-sm">
            <FileText size={32} className="mx-auto mb-2 text-zinc-300" />
            该客户暂无维修记录
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {orders.map(o => {
              const hasFollowup = followups.some(f => f.orderId === o.id);
              return (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="block px-5 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <span className="font-medium text-zinc-900">{o.applianceType}</span>
                        <span className="text-sm text-zinc-500">· {o.brand} {o.model}</span>
                      </div>
                      <p className="text-sm text-zinc-600 mt-1.5">故障：{o.fault}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {formatDate(o.createdAt)}
                        {o.pickedUpAt && ` · 取机：${formatDate(o.pickedUpAt)}`}
                        {hasFollowup && (
                          <span className="inline-flex items-center gap-1 ml-3 text-green-600">
                            <CheckCircle size={12} /> 已回访
                          </span>
                        )}
                        {o.status === 'completed' && !hasFollowup && (
                          <span className="inline-flex items-center gap-1 ml-3 text-amber-600">
                            <AlertCircle size={12} /> 待回访
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      {o.status === 'completed' && (
                        <p className="text-sm font-semibold text-zinc-900">
                          ¥{calcOrderTotal(o.id).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

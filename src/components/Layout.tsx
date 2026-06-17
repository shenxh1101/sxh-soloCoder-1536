import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Package, PhoneCall, Wrench, LogOut } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { to: '/customers', label: '客户管理', icon: Users },
  { to: '/orders', label: '维修工单', icon: ClipboardList },
  { to: '/inventory', label: '零件库存', icon: Package },
  { to: '/followups', label: '回访记录', icon: PhoneCall },
];

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-zinc-100">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 leading-tight">家电维修</h1>
            <p className="text-[11px] text-zinc-500 leading-tight">管理系统</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 w-full transition-all"
          >
            <LogOut size={18} />
            <span>返回首页</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

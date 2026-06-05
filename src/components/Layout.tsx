import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Database, CalendarClock, Send, Rocket,
  Activity, Wrench, BarChart3, Map, ChevronLeft, ChevronRight,
  Bell, User, Shield
} from 'lucide-react';
import { useStore } from '@/store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '总览仪表盘' },
  { to: '/base/pads', icon: Database, label: '基础信息管理', children: [
    { to: '/base/pads', label: '发射工位' },
    { to: '/base/rockets', label: '火箭型号' },
    { to: '/base/payloads', label: '有效载荷' },
    { to: '/base/windows', label: '发射窗口' },
    { to: '/base/personnel', label: '人员管理' },
  ]},
  { to: '/schedule', icon: CalendarClock, label: '智能排程调度' },
  { to: '/tasks', icon: Send, label: '任务推送与审批' },
  { to: '/execution', icon: Rocket, label: '发射执行管控' },
  { to: '/monitor', icon: Activity, label: '实时监控告警' },
  { to: '/maintenance', icon: Wrench, label: '设备维保管理' },
  { to: '/statistics', icon: BarChart3, label: '统计分析报表' },
  { to: '/sitemap', icon: Map, label: '场区可视化地图' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const alerts = useStore((s) => s.alerts);
  const unackAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex h-screen overflow-hidden bg-space-900">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col border-r border-cyber-blue/10 bg-space-800/80 transition-all duration-300 relative`}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-cyber-blue/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyber-blue" />
              <span className="font-orbitron text-sm font-bold text-cyber-blue tracking-wider">SCMS</span>
            </div>
          )}
          {collapsed && <Shield className="w-6 h-6 text-cyber-blue mx-auto" />}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <div key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  if (item.children) {
                    setExpandedMenu(expandedMenu === item.to ? null : item.to);
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-cyber-blue/15 text-cyber-blue shadow-[inset_0_0_12px_rgba(0,212,255,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-700/50'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                {!collapsed && item.children && (
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${expandedMenu === item.to ? 'rotate-90' : ''}`} />
                )}
              </NavLink>
              {item.children && expandedMenu === item.to && !collapsed && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        `block px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                          isActive
                            ? 'text-cyber-blue bg-cyber-blue/10'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-space-700/30'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-space-700 border border-cyber-blue/20 rounded-full flex items-center justify-center text-cyber-blue hover:bg-space-600 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-cyber-blue/10 bg-space-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="font-orbitron text-sm font-semibold text-slate-300 tracking-wider">
              航天发射场综合调度与设备管理系统
            </h1>
            {unackAlerts > 0 && (
              <span className="px-2 py-0.5 text-xs bg-cyber-red/20 text-cyber-red border border-cyber-red/30 rounded-full font-mono animate-pulse-glow">
                {unackAlerts} 告警
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-cyber-blue transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 glass-card shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-space-600/50">
                    <h3 className="text-sm font-semibold text-slate-200">消息通知</h3>
                  </div>
                  {notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 border-b border-space-600/30 cursor-pointer hover:bg-space-700/30 transition-colors ${!n.read ? 'bg-cyber-blue/5' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-cyber-blue">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 bg-cyber-blue rounded-full" />}
                      </div>
                      <p className="text-xs text-slate-400">{n.content}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">{n.timestamp.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span>张远航</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/20 rounded">指挥员</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-space-900 bg-grid-pattern">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

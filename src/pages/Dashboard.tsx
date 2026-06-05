import { useMemo } from 'react';
import {
  CalendarCheck, Satellite, Wifi, ClipboardCheck,
  TrendingUp, TrendingDown, Minus,
  Rocket, Fuel, Flame, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, Bell, CheckCircle2, Clock, ArrowRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import { useStore } from '@/store';

const STATUS_COLORS: Record<string, string> = {
  preparing: '#FFD600',
  fueling: '#FF6B35',
  launch: '#FF3B3B',
  flight: '#00D4FF',
  reentry: '#7B61FF',
};

const STATUS_LABELS: Record<string, string> = {
  preparing: '准备中',
  fueling: '加注中',
  launch: '发射中',
  flight: '飞行中',
  reentry: '再入返回',
};

const ALERT_COLORS: Record<string, string> = {
  emergency: 'border-l-cyber-red',
  critical: 'border-l-cyber-orange',
  warning: 'border-l-cyber-yellow',
  info: 'border-l-cyber-blue',
};

const ALERT_BG: Record<string, string> = {
  emergency: 'bg-cyber-red/5',
  critical: 'bg-cyber-orange/5',
  warning: 'bg-cyber-yellow/5',
  info: 'bg-cyber-blue/5',
};

const PAD_STATUS_CLASS: Record<string, string> = {
  idle: 'status-idle',
  preparing: 'status-preparing',
  occupied: 'status-occupied',
  maintenance: 'status-maintenance',
};

const PAD_STATUS_LABEL: Record<string, string> = {
  idle: '空闲',
  preparing: '准备中',
  occupied: '占用中',
  maintenance: '维护中',
};

const PAD_DOT_COLOR: Record<string, string> = {
  idle: 'bg-cyber-blue',
  preparing: 'bg-cyber-yellow',
  occupied: 'bg-cyber-orange',
  maintenance: 'bg-cyber-purple',
};

const PAD_GLOW_COLOR: Record<string, string> = {
  idle: 'shadow-[0_0_8px_rgba(0,212,255,0.5)]',
  preparing: 'shadow-[0_0_8px_rgba(255,214,0,0.5)]',
  occupied: 'shadow-[0_0_8px_rgba(255,107,53,0.5)]',
  maintenance: 'shadow-[0_0_8px_rgba(123,97,255,0.5)]',
};

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color,
  glowClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  color: string;
  glowClass: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-cyber-green' : trend === 'down' ? 'text-cyber-red' : 'text-slate-500';

  return (
    <div className={`glass-card glow-border p-5 relative overflow-hidden group hover:${glowClass} transition-all duration-500`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={`text-3xl font-mono font-bold ${color} tracking-wider`}>{value}</p>
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${color.replace('text-', 'bg-')}/5 blur-2xl group-hover:${color.replace('text-', 'bg-')}/10 transition-all duration-700`} />
    </div>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <p className="text-slate-300 font-medium">{item.name}: <span className="font-mono text-white">{item.value}</span></p>
    </div>
  );
}

export default function Dashboard() {
  const tasks = useStore((s) => s.tasks);
  const launchPads = useStore((s) => s.launchPads);
  const equipment = useStore((s) => s.equipment);
  const alerts = useStore((s) => s.alerts);
  const notifications = useStore((s) => s.notifications);

  const todayTaskCount = useMemo(() => {
    return tasks.filter((t) => !['draft', 'completed', 'aborted'].includes(t.status)).length;
  }, [tasks]);

  const flightCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'flight').length;
  }, [tasks]);

  const onlineRate = useMemo(() => {
    const total = equipment.length;
    const online = equipment.filter((e) => e.status === 'online').length;
    return total > 0 ? Math.round((online / total) * 100) : 0;
  }, [equipment]);

  const pendingApprovalCount = useMemo(() => {
    return tasks.reduce((count, task) => {
      return count + task.assignedPersonnel.filter(
        (a) => a.adjustmentRequested && a.approved === null
      ).length;
    }, 0);
  }, [tasks]);

  const statusDistribution = useMemo(() => {
    const statusKeys = ['preparing', 'fueling', 'launch', 'flight', 'reentry'] as const;
    return statusKeys
      .map((key) => ({
        name: STATUS_LABELS[key],
        value: tasks.filter((t) => t.status === key).length,
        key,
      }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  const recentAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [alerts]);

  const pendingTodos = useMemo(() => {
    const todos: Array<{
      id: string;
      type: 'approval' | 'task' | 'notification';
      title: string;
      description: string;
      time: string;
      icon: React.ElementType;
      iconColor: string;
    }> = [];

    tasks.forEach((task) => {
      task.assignedPersonnel.forEach((a) => {
        if (a.adjustmentRequested && a.approved === null) {
          todos.push({
            id: `approval-${task.id}-${a.personnelId}`,
            type: 'approval',
            title: '调整申请待审批',
            description: `${a.personnelName} 申请调整「${task.name}」`,
            time: new Date().toISOString(),
            icon: ClipboardCheck,
            iconColor: 'text-cyber-orange',
          });
        }
      });
    });

    notifications
      .filter((n) => !n.read)
      .forEach((n) => {
        todos.push({
          id: `notif-${n.id}`,
          type: 'notification',
          title: n.title,
          description: n.content,
          time: n.timestamp,
          icon: n.type === 'task_assign' ? Rocket : n.type === 'approval_request' ? ClipboardCheck : Bell,
          iconColor: n.type === 'task_assign' ? 'text-cyber-blue' : n.type === 'approval_request' ? 'text-cyber-yellow' : 'text-cyber-purple',
        });
      });

    return todos.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    ).slice(0, 8);
  }, [tasks, notifications]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">总览仪表盘</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={CalendarCheck}
          label="今日任务数"
          value={todayTaskCount}
          trend="up"
          trendLabel="较昨日 +2"
          color="text-cyber-blue"
          glowClass="shadow-[0_0_20px_rgba(0,212,255,0.2)]"
        />
        <MetricCard
          icon={Satellite}
          label="在轨飞行数"
          value={flightCount}
          trend="flat"
          trendLabel="与昨日持平"
          color="text-cyber-green"
          glowClass="shadow-[0_0_20px_rgba(0,230,118,0.2)]"
        />
        <MetricCard
          icon={Wifi}
          label="设备在线率"
          value={`${onlineRate}%`}
          trend={onlineRate >= 80 ? 'up' : 'down'}
          trendLabel={onlineRate >= 80 ? '运行良好' : '低于阈值'}
          color="text-cyber-purple"
          glowClass="shadow-[0_0_20px_rgba(123,97,255,0.2)]"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="待审批数"
          value={pendingApprovalCount}
          trend={pendingApprovalCount > 0 ? 'down' : 'flat'}
          trendLabel={pendingApprovalCount > 0 ? '需尽快处理' : '暂无待审批'}
          color="text-cyber-orange"
          glowClass="shadow-[0_0_20px_rgba(255,107,53,0.2)]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card glow-border p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            任务状态分布
          </h2>
          {statusDistribution.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-white">{tasks.filter((t) => !['draft', 'completed', 'aborted'].includes(t.status)).length}</p>
                    <p className="text-xs text-slate-500">活跃任务</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3">
                {statusDistribution.map((d) => (
                  <div key={d.key} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                    {d.name}
                    <span className="font-mono text-slate-300">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
              暂无活跃任务
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass-card glow-border p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5" />
            发射工位状态
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {launchPads.map((pad) => (
              <div
                key={pad.id}
                className={`relative rounded-lg border p-4 transition-all duration-300 hover:scale-[1.02] ${PAD_STATUS_CLASS[pad.status]}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${PAD_DOT_COLOR[pad.status]} animate-pulse ${PAD_GLOW_COLOR[pad.status]}`} />
                  <span className="text-sm font-semibold text-slate-200">{pad.name}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{pad.code}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${PAD_STATUS_CLASS[pad.status]}`}>
                    {PAD_STATUS_LABEL[pad.status]}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{pad.totalLaunches}次</span>
                </div>
                {pad.type === 'liquid' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Fuel className="w-3 h-3" />
                    液体
                  </div>
                )}
                {pad.type === 'solid' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Rocket className="w-3 h-3" />
                    固体
                  </div>
                )}
                {pad.type === 'mixed' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Flame className="w-3 h-3" />
                    混合
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card glow-border p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            最近告警
          </h2>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-[3px] ${ALERT_COLORS[alert.level]} ${ALERT_BG[alert.level]} ${alert.acknowledged ? 'opacity-50' : ''}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.level === 'emergency' && <AlertTriangle className="w-4 h-4 text-cyber-red" />}
                    {alert.level === 'critical' && <AlertTriangle className="w-4 h-4 text-cyber-orange" />}
                    {alert.level === 'warning' && <AlertTriangle className="w-4 h-4 text-cyber-yellow" />}
                    {alert.level === 'info' && <CheckCircle2 className="w-4 h-4 text-cyber-blue" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-200 truncate">{alert.message}</p>
                      {alert.acknowledged && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-space-600/50 text-slate-500 flex-shrink-0">已确认</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {alert.taskName && <span className="truncate">{alert.taskName}</span>}
                      <span className="font-mono">{alert.timestamp.slice(5, 16).replace('T', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                暂无告警信息
              </div>
            )}
          </div>
        </div>

        <div className="glass-card glow-border p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            待办事项
          </h2>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {pendingTodos.length > 0 ? (
              pendingTodos.map((todo) => {
                const TodoIcon = todo.icon;
                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-space-700/30 hover:bg-space-700/50 transition-colors group cursor-pointer"
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${todo.iconColor}`}>
                      <TodoIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{todo.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{todo.description}</p>
                      <span className="text-[10px] text-slate-600 font-mono mt-1 block">
                        {todo.time.slice(5, 16).replace('T', ' ')}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyber-blue transition-colors flex-shrink-0 mt-1" />
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                <CheckCircle2 className="w-5 h-5 mr-2 text-cyber-green" />
                暂无待办
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

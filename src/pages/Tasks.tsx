import { useState, useMemo } from 'react';
import {
  ClipboardList, CheckSquare, Bell, UserCheck, UserX,
  AlertTriangle, CheckCircle2, Clock, Shield, Rocket,
  Satellite, MapPin, ChevronDown, ChevronUp, Filter,
  MessageSquare, FileText, Monitor, Zap, Settings,
  Info, X
} from 'lucide-react';
import { useStore } from '@/store';
import type { TaskAssignment, Notification } from '@/types';

type TabKey = 'assign' | 'approval' | 'notification';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'assign', label: '任务分配', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'approval', label: '审批管理', icon: <CheckSquare className="w-4 h-4" /> },
  { key: 'notification', label: '通知中心', icon: <Bell className="w-4 h-4" /> },
];

const PRIORITY_BADGE: Record<string, { label: string; style: string }> = {
  critical: { label: '紧急', style: 'bg-cyber-red/20 text-cyber-red border-cyber-red/30' },
  high: { label: '高', style: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30' },
  medium: { label: '中', style: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30' },
  low: { label: '低', style: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' },
};

const ROLE_MAP: Record<TaskAssignment['role'], string> = {
  commander: '指挥员',
  fueler: '加注手',
  telemetry_op: '测控操作员',
  safety_officer: '安全员',
};

const NOTIF_TYPE_CONFIG: Record<Notification['type'], { label: string; icon: React.ReactNode; style: string }> = {
  task_assign: { label: '任务分配', icon: <UserCheck className="w-3.5 h-3.5" />, style: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30' },
  approval_request: { label: '审批申请', icon: <MessageSquare className="w-3.5 h-3.5" />, style: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30' },
  approval_result: { label: '审批结果', icon: <CheckCircle2 className="w-3.5 h-3.5" />, style: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' },
  alert: { label: '告警', icon: <AlertTriangle className="w-3.5 h-3.5" />, style: 'bg-cyber-red/20 text-cyber-red border-cyber-red/30' },
  system: { label: '系统', icon: <Settings className="w-3.5 h-3.5" />, style: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdjustForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="mt-2 p-3 bg-space-700/40 border border-cyber-orange/20 rounded-lg space-y-2">
      <label className="text-xs text-slate-400">调整原因</label>
      <textarea
        className="input-field text-sm min-h-[60px] resize-none"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="请输入申请调整的原因..."
      />
      <div className="flex gap-2">
        <button
          onClick={() => reason.trim() && onSubmit(reason.trim())}
          disabled={!reason.trim()}
          className="btn-primary py-1 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          提交申请
        </button>
        <button onClick={onCancel} className="btn-danger py-1 px-3 text-xs">
          取消
        </button>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onConfirm,
  onRequestAdjust,
}: {
  task: ReturnType<typeof useStore.getState>['tasks'][0];
  onConfirm: (taskId: string, personnelId: string) => void;
  onRequestAdjust: (taskId: string, personnelId: string, reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const priority = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium;
  const unconfirmedCount = task.assignedPersonnel.filter((a) => !a.confirmed).length;

  return (
    <div className="glass-card glow-border overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-space-700/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${priority.style}`}>
            {priority.label}
          </span>
          <span className="text-white font-medium truncate">{task.name}</span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {unconfirmedCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-cyber-yellow/15 text-cyber-yellow border border-cyber-yellow/30 rounded-full font-mono">
              {unconfirmedCount}人待确认
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyber-blue/60" />
              {task.padName}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Rocket className="w-3.5 h-3.5 text-cyber-orange/60" />
              {task.rocketName}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Satellite className="w-3.5 h-3.5 text-cyber-purple/60" />
              {task.payloadName}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyber-green/60" />
              <span className="font-mono">{formatTime(task.scheduledTime)}</span>
            </span>
          </div>

          {task.assignedPersonnel.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">分配人员</span>
              {task.assignedPersonnel.map((ap) => (
                <div key={ap.personnelId} className="space-y-1">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-space-700/30 border border-space-600/30">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-medium">{ap.personnelName}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full border border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple">
                        {ROLE_MAP[ap.role]}
                      </span>
                      {ap.confirmed ? (
                        <span className="flex items-center gap-1 text-xs text-cyber-green">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已确认
                        </span>
                      ) : ap.adjustmentRequested ? (
                        <span className="flex items-center gap-1 text-xs text-cyber-orange">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          调整申请中
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-cyber-yellow">
                          <Clock className="w-3.5 h-3.5" />
                          待确认
                        </span>
                      )}
                    </div>
                    {!ap.confirmed && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onConfirm(task.id, ap.personnelId)}
                          className="btn-success py-1 px-3 text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          确认
                        </button>
                        {!ap.adjustmentRequested && (
                          <button
                            onClick={() => setAdjustingId(ap.personnelId)}
                            className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            申请调整
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {adjustingId === ap.personnelId && (
                    <AdjustForm
                      onSubmit={(reason) => {
                        onRequestAdjust(task.id, ap.personnelId, reason);
                        setAdjustingId(null);
                      }}
                      onCancel={() => setAdjustingId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-sm text-slate-500">
              暂未分配人员
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalTab() {
  const tasks = useStore((s) => s.tasks);
  const approveAdjustment = useStore((s) => s.approveAdjustment);

  const pendingRequests = useMemo(() => {
    const result: { taskId: string; taskName: string; assignment: TaskAssignment }[] = [];
    for (const task of tasks) {
      for (const ap of task.assignedPersonnel) {
        if (ap.adjustmentRequested && ap.approved === null) {
          result.push({ taskId: task.id, taskName: task.name, assignment: ap });
        }
      }
    }
    return result;
  }, [tasks]);

  const approvalHistory = useMemo(() => {
    const result: { taskId: string; taskName: string; assignment: TaskAssignment }[] = [];
    for (const task of tasks) {
      for (const ap of task.assignedPersonnel) {
        if (ap.approved !== null) {
          result.push({ taskId: task.id, taskName: task.name, assignment: ap });
        }
      }
    }
    return result;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h2 className="section-title flex items-center gap-2 text-base mb-4">
          <Shield className="w-4 h-4" />
          待审批调整申请
          {pendingRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30 rounded-full font-mono">
              {pendingRequests.length}
            </span>
          )}
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">暂无待审批的调整申请</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={`${req.taskId}-${req.assignment.personnelId}`}
                className="p-4 rounded-lg bg-space-700/30 border border-cyber-orange/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium">{req.taskName}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue">
                        {req.assignment.personnelName}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full border border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple">
                        {ROLE_MAP[req.assignment.role]}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-cyber-orange/60 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300">{req.assignment.adjustmentReason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveAdjustment(req.taskId, req.assignment.personnelId, true)}
                      className="btn-success py-1.5 px-4 text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      同意
                    </button>
                    <button
                      onClick={() => approveAdjustment(req.taskId, req.assignment.personnelId, false)}
                      className="btn-danger py-1.5 px-4 text-xs flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      驳回
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4">
        <h2 className="section-title flex items-center gap-2 text-base mb-4">
          <Clock className="w-4 h-4" />
          审批历史
        </h2>

        {approvalHistory.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">暂无审批记录</div>
        ) : (
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-cyber-blue/15" />
            {approvalHistory.map((record, idx) => (
              <div key={`${record.taskId}-${record.assignment.personnelId}-${idx}`} className="relative pb-4">
                <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 ${
                  record.assignment.approved
                    ? 'bg-cyber-green/30 border-cyber-green'
                    : 'bg-cyber-red/30 border-cyber-red'
                }`} />
                <div className="p-3 rounded-lg bg-space-700/20 border border-space-600/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-white font-medium">{record.taskName}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue">
                      {record.assignment.personnelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.assignment.approved ? (
                      <span className="flex items-center gap-1 text-xs text-cyber-green">
                        <CheckCircle2 className="w-3 h-3" />
                        已同意
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-cyber-red">
                        <UserX className="w-3 h-3" />
                        已驳回
                      </span>
                    )}
                    {record.assignment.adjustmentReason && (
                      <span className="text-xs text-slate-500">- {record.assignment.adjustmentReason}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationTab() {
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);

  const [filterType, setFilterType] = useState<Notification['type'] | 'all'>('all');

  const filtered = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterOptions: { key: Notification['type'] | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'task_assign', label: '任务分配' },
    { key: 'approval_request', label: '审批申请' },
    { key: 'approval_result', label: '审批结果' },
    { key: 'alert', label: '告警' },
    { key: 'system', label: '系统' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex gap-1.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterType(opt.key)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 ${
                  filterType === opt.key
                    ? 'border-cyber-blue/40 bg-cyber-blue/15 text-cyber-blue'
                    : 'border-space-600/40 bg-space-700/30 text-slate-400 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="text-xs text-cyber-yellow font-mono">{unreadCount} 条未读</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-12 text-center text-slate-500">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const cfg = NOTIF_TYPE_CONFIG[notif.type];
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationRead(notif.id)}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  notif.read ? 'opacity-60' : 'border-cyber-blue/15 hover:border-cyber-blue/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-md border ${cfg.style}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${cfg.style}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm text-white font-medium">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{notif.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="font-mono">{formatTime(notif.timestamp)}</span>
                      <span>来自: {notif.fromUser}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const confirmAssignment = useStore((s) => s.confirmAssignment);
  const requestAdjustment = useStore((s) => s.requestAdjustment);

  const [activeTab, setActiveTab] = useState<TabKey>('assign');

  const pendingApprovalCount = useMemo(() => {
    let count = 0;
    for (const task of tasks) {
      for (const ap of task.assignedPersonnel) {
        if (ap.adjustmentRequested && ap.approved === null) count++;
      }
    }
    return count;
  }, [tasks]);

  const unreadNotifCount = useStore((s) => s.notifications.filter((n) => !n.read).length);

  const tasksWithPersonnel = useMemo(
    () => tasks.filter((t) => t.assignedPersonnel.length > 0),
    [tasks]
  );

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-3">
        <ClipboardList className="w-7 h-7 text-cyber-blue" />
        任务调度与审批
      </h1>

      <div className="flex gap-1 p-1 bg-space-800/60 border border-cyber-blue/10 rounded-lg w-fit">
        {TABS.map((tab) => {
          const count =
            tab.key === 'approval' ? pendingApprovalCount :
            tab.key === 'notification' ? unreadNotifCount : 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-cyber-red/20 text-cyber-red border border-cyber-red/30 rounded-full font-mono leading-none">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'assign' && (
        tasksWithPersonnel.length === 0 ? (
          <div className="glass-card py-12 text-center text-slate-500">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">暂无分配人员的任务</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasksWithPersonnel.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onConfirm={confirmAssignment}
                onRequestAdjust={requestAdjustment}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'approval' && <ApprovalTab />}

      {activeTab === 'notification' && <NotificationTab />}
    </div>
  );
}

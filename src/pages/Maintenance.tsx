import { useState, useMemo } from 'react';
import {
  Wrench, Package, Plus, ArrowRight, X,
  Clock, AlertTriangle, CheckCircle2, Zap,
  Thermometer, Activity, ChevronRight
} from 'lucide-react';
import { useStore } from '@/store';
import type { MaintenanceOrder, SparePart } from '@/types';

type TabKey = 'orders' | 'spareParts';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'orders', label: '维保工单', icon: <Wrench className="w-4 h-4" /> },
  { key: 'spareParts', label: '备件库存', icon: <Package className="w-4 h-4" /> },
];

const TYPE_BADGE: Record<MaintenanceOrder['type'], { label: string; style: string }> = {
  routine: { label: '例行维保', style: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30' },
  corrective: { label: '纠正维修', style: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30' },
  overhaul: { label: '大修', style: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30' },
};

const PRIORITY_BADGE: Record<MaintenanceOrder['priority'], { label: string; style: string }> = {
  high: { label: '高', style: 'bg-cyber-red/20 text-cyber-red border-cyber-red/30' },
  medium: { label: '中', style: 'bg-cyber-yellow/20 text-cyber-yellow border-cyber-yellow/30' },
  low: { label: '低', style: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' },
};

const KANBAN_COLUMNS: {
  key: string;
  label: string;
  statuses: MaintenanceOrder['status'][];
  tint: string;
  headerStyle: string;
}[] = [
  {
    key: 'pending',
    label: '待处理',
    statuses: ['pending'],
    tint: 'border-cyber-yellow/20',
    headerStyle: 'text-cyber-yellow',
  },
  {
    key: 'active',
    label: '进行中',
    statuses: ['assigned', 'in_progress'],
    tint: 'border-cyber-orange/20',
    headerStyle: 'text-cyber-orange',
  },
  {
    key: 'done',
    label: '已完成',
    statuses: ['completed'],
    tint: 'border-cyber-green/20',
    headerStyle: 'text-cyber-green',
  },
];

const STATUS_TRANSITIONS: Record<MaintenanceOrder['status'], { next: MaintenanceOrder['status']; label: string }[]> = {
  pending: [{ next: 'assigned', label: '分配' }],
  assigned: [{ next: 'in_progress', label: '开始' }],
  in_progress: [{ next: 'completed', label: '完成' }],
  completed: [],
};

const CATEGORY_MAP: Record<string, string> = {
  fueling: '加注系统',
  telemetry: '测控系统',
  transport: '运输设备',
  support: '支撑结构',
};

function formatDate(ts: string) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function OrderCard({
  order,
  onTransition,
}: {
  order: MaintenanceOrder;
  onTransition: (id: string, status: MaintenanceOrder['status']) => void;
}) {
  const typeBadge = TYPE_BADGE[order.type];
  const priorityBadge = PRIORITY_BADGE[order.priority];
  const transitions = STATUS_TRANSITIONS[order.status];

  return (
    <div className="glass-card p-3.5 space-y-2.5 hover:border-cyber-blue/30 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-white font-medium truncate">{order.equipmentName}</span>
        <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium shrink-0 ${priorityBadge.style}`}>
          {priorityBadge.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${typeBadge.style}`}>
          {typeBadge.label}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{order.reason}</p>

      {order.assignedTeam && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Activity className="w-3 h-3" />
          <span>{order.assignedTeam}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">{formatDate(order.createdAt)}</span>
        {transitions.length > 0 && (
          <div className="flex gap-1.5">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => onTransition(order.id, t.next)}
                className="btn-primary py-0.5 px-2.5 text-[10px] flex items-center gap-1"
              >
                <ArrowRight className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddOrderForm({
  onSubmit,
  onCancel,
  equipmentId,
  equipmentName,
}: {
  onSubmit: (order: MaintenanceOrder) => void;
  onCancel: () => void;
  equipmentId?: string;
  equipmentName?: string;
}) {
  const [form, setForm] = useState({
    equipmentId: equipmentId || '',
    equipmentName: equipmentName || '',
    type: 'routine' as MaintenanceOrder['type'],
    reason: '',
    priority: 'medium' as MaintenanceOrder['priority'],
    assignedTeam: '',
    estimatedHours: 4,
  });

  const equipment = useStore((s) => s.equipment);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-50 w-full max-w-lg glass-card glow-border p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white font-orbitron">新建维保工单</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="label-field">设备</label>
          <select
            className="select-field"
            value={form.equipmentId}
            onChange={(e) => {
              const eq = equipment.find((eq) => eq.id === e.target.value);
              setForm({ ...form, equipmentId: e.target.value, equipmentName: eq?.name || '' });
            }}
          >
            <option value="">选择设备</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">类型</label>
            <select
              className="select-field"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceOrder['type'] })}
            >
              <option value="routine">例行维保</option>
              <option value="corrective">纠正维修</option>
              <option value="overhaul">大修</option>
            </select>
          </div>
          <div>
            <label className="label-field">优先级</label>
            <select
              className="select-field"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as MaintenanceOrder['priority'] })}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">原因</label>
          <textarea
            className="input-field text-sm min-h-[60px] resize-none"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="请输入维保原因..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">分配班组</label>
            <select
              className="select-field"
              value={form.assignedTeam}
              onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })}
            >
              <option value="">暂不分配</option>
              <option value="维保一班">维保一班</option>
              <option value="维保二班">维保二班</option>
            </select>
          </div>
          <div>
            <label className="label-field">预计工时(h)</label>
            <input
              type="number"
              className="input-field"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (!form.equipmentId || !form.reason.trim()) return;
              onSubmit({
                id: `mo-${Date.now()}`,
                equipmentId: form.equipmentId,
                equipmentName: form.equipmentName,
                type: form.type,
                reason: form.reason.trim(),
                status: form.assignedTeam ? 'assigned' : 'pending',
                assignedTeam: form.assignedTeam,
                partsUsed: [],
                createdAt: new Date().toISOString(),
                completedAt: null,
                priority: form.priority,
                estimatedHours: form.estimatedHours,
                actualHours: 0,
              });
            }}
            disabled={!form.equipmentId || !form.reason.trim()}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            创建工单
          </button>
          <button onClick={onCancel} className="btn-danger flex-1">取消</button>
        </div>
      </div>
    </div>
  );
}

function UsePartModal({
  part,
  onSubmit,
  onCancel,
}: {
  part: SparePart;
  onSubmit: (partId: string, quantity: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-50 w-full max-w-sm glass-card glow-border p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white font-orbitron">领用备件</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-lg bg-space-700/30 border border-space-600/30">
          <div className="text-sm text-white font-medium">{part.name}</div>
          <div className="text-xs text-slate-400 mt-1">当前库存: <span className="font-mono text-cyber-blue">{part.quantity}</span></div>
        </div>

        <div>
          <label className="label-field">领用数量</label>
          <input
            type="number"
            min={1}
            max={part.quantity}
            className="input-field"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(part.quantity, Number(e.target.value))))}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (qty > 0 && qty <= part.quantity) {
                onSubmit(part.id, qty);
              }
            }}
            disabled={qty <= 0 || qty > part.quantity}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            确认领用
          </button>
          <button onClick={onCancel} className="btn-danger flex-1">取消</button>
        </div>
      </div>
    </div>
  );
}

function KanbanTab({ onAddOrder }: { onAddOrder: () => void }) {
  const maintenanceOrders = useStore((s) => s.maintenanceOrders);
  const updateMaintenanceOrder = useStore((s) => s.updateMaintenanceOrder);

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      orders: maintenanceOrders
        .filter((o) => col.statuses.includes(o.status))
        .sort((a, b) => {
          const pOrder = { high: 0, medium: 1, low: 2 };
          return pOrder[a.priority] - pOrder[b.priority];
        }),
    }));
  }, [maintenanceOrders]);

  const handleTransition = (id: string, status: MaintenanceOrder['status']) => {
    const updates: Partial<MaintenanceOrder> = { status };
    if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    updateMaintenanceOrder(id, updates);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          共 <span className="font-mono text-white">{maintenanceOrders.length}</span> 条工单
        </span>
        <button onClick={onAddOrder} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className={`rounded-xl border ${col.tint} bg-space-800/30 flex flex-col min-h-[400px]`}>
            <div className={`flex items-center justify-between p-3 border-b ${col.tint}`}>
              <span className={`text-sm font-semibold font-orbitron ${col.headerStyle}`}>{col.label}</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full border border-space-600/50 bg-space-700/50 text-slate-400 font-mono">
                {col.orders.length}
              </span>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {col.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-8">
                  <Clock className="w-6 h-6 mb-1.5 opacity-30" />
                  暂无工单
                </div>
              ) : (
                col.orders.map((order) => (
                  <OrderCard key={order.id} order={order} onTransition={handleTransition} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SparePartsTab() {
  const spareParts = useStore((s) => s.spareParts);
  const useSparePart = useStore((s) => s.useSparePart);
  const [usingPart, setUsingPart] = useState<SparePart | null>(null);

  const getStockStatus = (part: SparePart) => {
    const ratio = part.safetyStock > 0 ? part.quantity / part.safetyStock : 2;
    if (ratio > 1.5) return { label: '充足', dot: 'bg-cyber-green', text: 'text-cyber-green' };
    if (ratio >= 1) return { label: '偏低', dot: 'bg-cyber-yellow', text: 'text-cyber-yellow' };
    return { label: '不足', dot: 'bg-cyber-red', text: 'text-cyber-red' };
  };

  return (
    <div className="space-y-4">
      <span className="text-sm text-slate-400">
        共 <span className="font-mono text-white">{spareParts.length}</span> 种备件
      </span>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类别</th>
              <th>库存数量</th>
              <th>安全库存</th>
              <th>库存状态</th>
              <th>单价</th>
              <th>位置</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {spareParts.map((part) => {
              const status = getStockStatus(part);
              const ratio = part.safetyStock > 0 ? Math.min((part.quantity / part.safetyStock) * 100, 100) : 100;
              const barColor = ratio > 150 ? 'bg-cyber-green' : ratio >= 100 ? 'bg-cyber-yellow' : 'bg-cyber-red';
              return (
                <tr key={part.id}>
                  <td className="text-white font-medium">{part.name}</td>
                  <td className="text-slate-400">{part.category}</td>
                  <td>
                    <div className="space-y-1">
                      <span className="font-mono text-white">{part.quantity}</span>
                      <div className="w-20 h-1.5 bg-space-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-slate-400">{part.safetyStock}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="font-mono text-slate-300">¥{part.unitPrice.toLocaleString()}</td>
                  <td className="text-slate-400 text-xs font-mono">{part.location}</td>
                  <td>
                    <button
                      onClick={() => setUsingPart(part)}
                      disabled={part.quantity <= 0}
                      className="btn-primary py-1 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      领用
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usingPart && (
        <UsePartModal
          part={usingPart}
          onSubmit={(partId, quantity) => {
            useSparePart(partId, quantity);
            setUsingPart(null);
          }}
          onCancel={() => setUsingPart(null)}
        />
      )}
    </div>
  );
}

function EquipmentPanel({ onCreateOrder }: { onCreateOrder: (eqId: string, eqName: string) => void }) {
  const equipment = useStore((s) => s.equipment);

  const urgentEquipment = useMemo(() => {
    return equipment
      .filter((eq) => {
        if (eq.status === 'offline' || eq.status === 'maintenance') return true;
        const nextDate = new Date(eq.nextMaintenance);
        const now = new Date();
        const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 15 || eq.totalRunHours > 8000;
      })
      .sort((a, b) => a.totalRunHours > b.totalRunHours ? -1 : 1);
  }, [equipment]);

  const getUrgencyInfo = (eq: typeof equipment[0]) => {
    const nextDate = new Date(eq.nextMaintenance);
    const now = new Date();
    const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (eq.status === 'offline') return { label: '已离线', style: 'text-cyber-red', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    if (eq.status === 'maintenance') return { label: '维护中', style: 'text-cyber-purple', icon: <Wrench className="w-3.5 h-3.5" /> };
    if (daysUntil <= 0) return { label: `逾期${Math.abs(daysUntil)}天`, style: 'text-cyber-red', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    if (daysUntil <= 15) return { label: `${daysUntil}天后`, style: 'text-cyber-orange', icon: <Clock className="w-3.5 h-3.5" /> };
    if (eq.totalRunHours > 8000) return { label: '高运行时长', style: 'text-cyber-yellow', icon: <Zap className="w-3.5 h-3.5" /> };
    return { label: '', style: '', icon: null };
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <h2 className="section-title flex items-center gap-2 text-base">
        <Thermometer className="w-4 h-4" />
        设备维保预警
        <span className="ml-1 px-2 py-0.5 text-[10px] bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30 rounded-full font-mono">
          {urgentEquipment.length}
        </span>
      </h2>

      {urgentEquipment.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
          所有设备状态良好
        </div>
      ) : (
        <div className="space-y-2">
          {urgentEquipment.map((eq) => {
            const urgency = getUrgencyInfo(eq);
            return (
              <div
                key={eq.id}
                className="p-3 rounded-lg bg-space-700/30 border border-space-600/30 hover:border-cyber-blue/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-white font-medium truncate">{eq.name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded border border-space-600/50 bg-space-700/50 text-slate-400">
                        {CATEGORY_MAP[eq.category] || eq.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-mono">运行 {eq.totalRunHours}h</span>
                      <span className={`flex items-center gap-1 ${urgency.style}`}>
                        {urgency.icon}
                        {urgency.label}
                      </span>
                      <span className="text-slate-500 font-mono">温度 {eq.temperature}°C</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onCreateOrder(eq.id, eq.name)}
                    className="btn-primary py-1 px-2.5 text-[10px] flex items-center gap-1 shrink-0"
                  >
                    <ChevronRight className="w-3 h-3" />
                    生成维保工单
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const [showAddForm, setShowAddForm] = useState(false);
  const [prefillEquipment, setPrefillEquipment] = useState<{ id: string; name: string } | undefined>();
  const addMaintenanceOrder = useStore((s) => s.addMaintenanceOrder);

  const handleCreateOrder = (eqId: string, eqName: string) => {
    setPrefillEquipment({ id: eqId, name: eqName });
    setShowAddForm(true);
  };

  const handleAddOrder = (order: MaintenanceOrder) => {
    addMaintenanceOrder(order);
    setShowAddForm(false);
    setPrefillEquipment(undefined);
  };

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-3">
        <Wrench className="w-7 h-7 text-cyber-blue" />
        设备维保管理
      </h1>

      <div className="flex gap-1 p-1 bg-space-800/60 border border-cyber-blue/10 rounded-lg w-fit">
        {TABS.map((tab) => (
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
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {activeTab === 'orders' && (
            <KanbanTab onAddOrder={() => { setPrefillEquipment(undefined); setShowAddForm(true); }} />
          )}
          {activeTab === 'spareParts' && <SparePartsTab />}
        </div>

        <div className="w-[380px] shrink-0">
          <EquipmentPanel onCreateOrder={handleCreateOrder} />
        </div>
      </div>

      {showAddForm && (
        <AddOrderForm
          equipmentId={prefillEquipment?.id}
          equipmentName={prefillEquipment?.name}
          onSubmit={handleAddOrder}
          onCancel={() => { setShowAddForm(false); setPrefillEquipment(undefined); }}
        />
      )}
    </div>
  );
}

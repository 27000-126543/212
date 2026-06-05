import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Activity, ChevronDown, AlertTriangle, CheckCircle2, ShieldAlert,
  Zap, Gauge, Mountain, Route, Thermometer, BarChart3,
  Siren, CheckSquare, Square
} from 'lucide-react';
import {
  LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useStore } from '@/store';
import type { TelemetryRecord, Alert } from '@/types';

const PHASE_FLOW: { key: string; label: string; color: string; bg: string }[] = [
  { key: 'preparing', label: '准备', color: '#FFD600', bg: 'bg-cyber-yellow/20' },
  { key: 'fueling', label: '加注', color: '#FF6B35', bg: 'bg-cyber-orange/20' },
  { key: 'launch', label: '发射', color: '#FF3B3B', bg: 'bg-cyber-red/20' },
  { key: 'flight', label: '飞行', color: '#00D4FF', bg: 'bg-cyber-blue/20' },
  { key: 'reentry', label: '再入', color: '#7B61FF', bg: 'bg-cyber-purple/20' },
];

interface MetricConfig {
  key: keyof TelemetryRecord;
  label: string;
  unit: string;
  icon: React.ElementType;
  min: number;
  max: number;
  warnLow: number;
  warnHigh: number;
  dangerLow: number;
  dangerHigh: number;
  decimals?: number;
}

const METRICS: MetricConfig[] = [
  { key: 'thrust', label: '推力', unit: 'kN', icon: Zap, min: 0, max: 12000, warnLow: 500, warnHigh: 10000, dangerLow: 200, dangerHigh: 11500, decimals: 0 },
  { key: 'velocity', label: '速度', unit: 'km/s', icon: Gauge, min: 0, max: 12, warnLow: 0.5, warnHigh: 10, dangerLow: 0.1, dangerHigh: 11.5, decimals: 2 },
  { key: 'altitude', label: '高度', unit: 'km', icon: Mountain, min: 0, max: 500, warnLow: 10, warnHigh: 400, dangerLow: 5, dangerHigh: 450, decimals: 1 },
  { key: 'downrange', label: '下程', unit: 'km', icon: Route, min: 0, max: 2000, warnLow: 50, warnHigh: 1800, dangerLow: 20, dangerHigh: 1900, decimals: 0 },
  { key: 'temperature', label: '温度', unit: '°C', icon: Thermometer, min: -50, max: 3000, warnLow: -10, warnHigh: 2500, dangerLow: -30, dangerHigh: 2800, decimals: 0 },
  { key: 'pressure', label: '压力', unit: 'MPa', icon: BarChart3, min: 0, max: 25, warnLow: 2, warnHigh: 20, dangerLow: 1, dangerHigh: 23, decimals: 2 },
];

const ALERT_STYLE: Record<Alert['level'], { border: string; bg: string; text: string; label: string }> = {
  info: { border: 'border-cyber-blue/40', bg: 'bg-cyber-blue/10', text: 'text-cyber-blue', label: '信息' },
  warning: { border: 'border-cyber-yellow/40', bg: 'bg-cyber-yellow/10', text: 'text-cyber-yellow', label: '警告' },
  critical: { border: 'border-cyber-red/40', bg: 'bg-cyber-red/10', text: 'text-cyber-red', label: '严重' },
  emergency: { border: 'border-cyber-red/60', bg: 'bg-cyber-red/15', text: 'text-cyber-red', label: '紧急' },
};

const RECOVERY_STEPS = [
  '切断推进剂供应',
  '启动逃逸系统',
  '安全距离确认',
  '应急回收船就位',
  '人员撤离确认',
];

function getMetricStatus(value: number, cfg: MetricConfig): 'normal' | 'warning' | 'danger' {
  if (value <= cfg.dangerLow || value >= cfg.dangerHigh) return 'danger';
  if (value <= cfg.warnLow || value >= cfg.warnHigh) return 'warning';
  return 'normal';
}

function getMetricColor(status: 'normal' | 'warning' | 'danger'): string {
  if (status === 'danger') return 'text-cyber-red';
  if (status === 'warning') return 'text-cyber-yellow';
  return 'text-cyber-blue';
}

function generateTelemetry(prev: TelemetryRecord | null, phase: string): TelemetryRecord {
  const now = new Date().toISOString();
  if (!prev) {
    return { timestamp: now, thrust: 0, velocity: 0, altitude: 0, downrange: 0, temperature: 25, pressure: 1.01 };
  }
  const jitter = () => (Math.random() - 0.5) * 2;
  const phaseIdx = PHASE_FLOW.findIndex((p) => p.key === phase);

  let thrust = prev.thrust;
  let velocity = prev.velocity;
  let altitude = prev.altitude;
  let downrange = prev.downrange;
  let temperature = prev.temperature;
  let pressure = prev.pressure;

  if (phase === 'preparing') {
    thrust = 0;
    velocity = 0;
    altitude = 0;
    downrange = 0;
    temperature = 25 + jitter() * 2;
    pressure = 1.01 + jitter() * 0.05;
  } else if (phase === 'fueling') {
    thrust = 0;
    velocity = 0;
    altitude = 0;
    downrange = 0;
    pressure = Math.min(5, prev.pressure + 0.3 + jitter() * 0.1);
    temperature = Math.min(80, prev.temperature + 1 + jitter() * 0.5);
  } else if (phase === 'launch') {
    thrust = Math.min(11000, prev.thrust + 800 + jitter() * 200);
    velocity = Math.min(2, prev.velocity + 0.15 + jitter() * 0.03);
    altitude = Math.min(50, prev.altitude + 2 + jitter() * 0.5);
    downrange = Math.min(30, prev.downrange + 1.5 + jitter() * 0.3);
    temperature = Math.min(2500, prev.temperature + 150 + jitter() * 30);
    pressure = Math.min(20, prev.pressure + 1.5 + jitter() * 0.3);
  } else if (phase === 'flight') {
    thrust = Math.max(0, prev.thrust * (0.97 + Math.random() * 0.04));
    velocity = Math.min(11, prev.velocity + 0.3 + jitter() * 0.05);
    altitude = Math.min(400, prev.altitude + 15 + jitter() * 3);
    downrange = Math.min(1800, prev.downrange + 50 + jitter() * 10);
    temperature = Math.min(1500, prev.temperature - 50 + jitter() * 40);
    pressure = Math.max(0.1, prev.pressure * (0.95 + Math.random() * 0.06));
  } else if (phase === 'reentry') {
    thrust = 0;
    velocity = Math.max(0.5, prev.velocity * (0.96 + Math.random() * 0.02));
    altitude = Math.max(0, prev.altitude - 20 + jitter() * 5);
    downrange = Math.min(2000, prev.downrange + 30 + jitter() * 8);
    temperature = Math.min(2800, prev.temperature + 200 + jitter() * 50);
    pressure = Math.min(15, prev.pressure + 1 + jitter() * 0.3);
  } else {
    return { timestamp: now, thrust: 0, velocity: 0, altitude: 0, downrange: 0, temperature: 25, pressure: 1.01 };
  }

  return {
    timestamp: now,
    thrust: Math.max(0, thrust),
    velocity: Math.max(0, velocity),
    altitude: Math.max(0, altitude),
    downrange: Math.max(0, downrange),
    temperature,
    pressure: Math.max(0, pressure),
  };
}

const CHART_AXIS_STYLE = {
  fontSize: 11,
  fill: '#00D4FF88',
  fontFamily: 'JetBrains Mono, monospace',
};

const CHART_GRID_STYLE = {
  stroke: '#16294466',
  strokeDasharray: '3 3',
};

const CUSTOM_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#0F1F3Aee',
  border: '1px solid #00D4FF33',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      {label !== undefined && <div className="text-slate-400 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Monitor() {
  const tasks = useStore((s) => s.tasks);
  const alerts = useStore((s) => s.alerts);
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert);
  const addAlert = useStore((s) => s.addAlert);
  const updateTask = useStore((s) => s.updateTask);

  const monitorableStatuses = ['preparing', 'fueling', 'launch', 'flight', 'reentry'];
  const monitorableTasks = useMemo(
    () => tasks.filter((t) => monitorableStatuses.includes(t.status)),
    [tasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryRecord[]>([]);
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryRecord | null>(null);
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [recoverySteps, setRecoverySteps] = useState<boolean[]>([false, false, false, false, false]);
  const alertIdCounter = useRef(0);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  useEffect(() => {
    if (monitorableTasks.length > 0 && (!selectedTaskId || !monitorableTasks.find((t) => t.id === selectedTaskId))) {
      setSelectedTaskId(monitorableTasks[0].id);
    }
  }, [monitorableTasks, selectedTaskId]);

  useEffect(() => {
    setTelemetryHistory([]);
    setCurrentTelemetry(null);
    setRecoveryActive(false);
    setRecoverySteps([false, false, false, false, false]);
  }, [selectedTaskId]);

  useEffect(() => {
    if (!selectedTask) return;

    const interval = setInterval(() => {
      setCurrentTelemetry((prev) => {
        const newRecord = generateTelemetry(prev, selectedTask.status);
        setTelemetryHistory((hist) => {
          const next = [...hist, newRecord];
          return next.length > 30 ? next.slice(-30) : next;
        });
        return newRecord;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask || !currentTelemetry) return;
    const last30 = telemetryHistory.slice(-30);
    if (last30.length < 2) return;

    updateTask(selectedTask.id, { telemetryData: last30 });
  }, [telemetryHistory.length]);

  const unacknowledgedAlert = useMemo(() => {
    const relevant = alerts
      .filter((a) => !a.acknowledged)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return relevant[0] ?? null;
  }, [alerts]);

  const handleAcknowledge = useCallback(() => {
    if (unacknowledgedAlert) {
      acknowledgeAlert(unacknowledgedAlert.id);
    }
  }, [unacknowledgedAlert, acknowledgeAlert]);

  const handleActivateRecovery = useCallback(() => {
    if (!selectedTask) return;
    setRecoveryActive(true);
    setRecoverySteps([false, false, false, false, false]);
    alertIdCounter.current += 1;
    addAlert({
      id: `alert-recovery-${Date.now()}-${alertIdCounter.current}`,
      taskId: selectedTask.id,
      taskName: selectedTask.name,
      level: 'emergency',
      message: `已启动应急回收预案 - ${selectedTask.name}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }, [selectedTask, addAlert]);

  const toggleRecoveryStep = useCallback((index: number) => {
    setRecoverySteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const phaseIndex = PHASE_FLOW.findIndex((p) => p.key === selectedTask?.status);

  const chartData = useMemo(() => {
    return telemetryHistory.map((r, i) => ({
      index: i,
      thrust: r.thrust,
      velocity: r.velocity,
      altitude: r.altitude,
      downrange: r.downrange,
      temperature: r.temperature,
      pressure: r.pressure,
      time: new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
  }, [telemetryHistory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="page-title flex items-center gap-3">
          <Activity className="w-7 h-7 text-cyber-blue" />
          实时监控
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">监控任务</label>
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="select-field pr-8 min-w-[280px] appearance-none cursor-pointer"
            >
              {monitorableTasks.length === 0 && (
                <option value="">无可监控任务</option>
              )}
              {monitorableTasks.map((t) => {
                const phase = PHASE_FLOW.find((p) => p.key === t.status);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({phase?.label ?? t.status})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {unacknowledgedAlert && (() => {
        const style = ALERT_STYLE[unacknowledgedAlert.level];
        const isCriticalOrEmergency = ['critical', 'emergency'].includes(unacknowledgedAlert.level);
        return (
          <div
            className={`glass-card p-4 border ${style.border} ${style.bg} ${isCriticalOrEmergency ? 'animate-pulse-glow' : ''}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${style.text} ${isCriticalOrEmergency ? 'animate-blink' : ''}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${style.text} border-current/20 bg-current/5`}>
                      {style.label}
                    </span>
                    <span className="text-sm text-white font-medium truncate">{unacknowledgedAlert.message}</span>
                  </div>
                  {unacknowledgedAlert.taskName && (
                    <span className="text-xs text-slate-400 mt-0.5 block">{unacknowledgedAlert.taskName}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleAcknowledge}
                className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                确认
              </button>
            </div>
          </div>
        );
      })()}

      {selectedTask && (
        <div className="glass-card glow-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-400">任务阶段</span>
            <span className="text-sm text-white font-medium">{selectedTask.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            {PHASE_FLOW.map((phase, i) => {
              const isActive = i === phaseIndex;
              const isCompleted = i < phaseIndex;
              return (
                <div key={phase.key} className="flex items-center gap-2 flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-orbitron font-bold border-2 transition-all duration-500 ${
                        isActive
                          ? 'scale-110 shadow-[0_0_16px_rgba(0,212,255,0.4)]'
                          : ''
                      }`}
                      style={{
                        borderColor: isCompleted || isActive ? phase.color : '#24416C88',
                        backgroundColor: isCompleted ? `${phase.color}30` : isActive ? `${phase.color}20` : '#0F1F3A',
                        color: isCompleted || isActive ? phase.color : '#4A6A8A',
                      }}
                    >
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: isCompleted || isActive ? phase.color : '#4A6A8A' }}
                    >
                      {phase.label}
                    </span>
                  </div>
                  {i < PHASE_FLOW.length - 1 && (
                    <div
                      className="flex-1 h-0.5 rounded-full mb-5 transition-all duration-500"
                      style={{
                        backgroundColor: isCompleted ? phase.color : '#24416C66',
                        boxShadow: isCompleted ? `0 0 8px ${phase.color}44` : 'none',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTask && currentTelemetry && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {METRICS.map((cfg) => {
            const value = currentTelemetry[cfg.key] as number;
            const status = getMetricStatus(value, cfg);
            const colorClass = getMetricColor(status);
            const Icon = cfg.icon;
            const borderColor = status === 'danger' ? 'border-cyber-red/30' : status === 'warning' ? 'border-cyber-yellow/30' : 'border-cyber-blue/20';
            const glowShadow = status === 'danger'
              ? 'shadow-[0_0_12px_rgba(255,59,59,0.2)]'
              : status === 'warning'
              ? 'shadow-[0_0_12px_rgba(255,214,0,0.2)]'
              : 'shadow-[0_0_8px_rgba(0,212,255,0.1)]';

            return (
              <div key={cfg.key} className={`glass-card ${borderColor} ${glowShadow} p-4 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className="text-sm text-slate-400">{cfg.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{cfg.unit}</span>
                </div>
                <div className={`font-mono text-3xl font-bold ${colorClass} transition-colors duration-300`}>
                  {value.toFixed(cfg.decimals ?? 0)}
                </div>
                <div className="mt-2 w-full h-1 bg-space-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((value - cfg.min) / (cfg.max - cfg.min)) * 100))}%`,
                      backgroundColor: status === 'danger' ? '#FF3B3B' : status === 'warning' ? '#FFD600' : '#00D4FF',
                      boxShadow: `0 0 6px ${status === 'danger' ? '#FF3B3B66' : status === 'warning' ? '#FFD60066' : '#00D4FF44'}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card glow-border p-5">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              推力曲线
            </h2>
            {chartData.length < 2 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                等待数据采集...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis dataKey="time" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} />
                  <YAxis tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="thrust" name="推力(kN)" stroke="#00D4FF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00D4FF' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="glass-card glow-border p-5">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <Route className="w-5 h-5" />
              轨迹图
            </h2>
            {chartData.length < 2 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                等待数据采集...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid {...CHART_GRID_STYLE} />
                  <XAxis dataKey="downrange" name="下程(km)" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} type="number" domain={[0, 'auto']} />
                  <YAxis dataKey="altitude" name="高度(km)" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} type="number" domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={chartData} fill="#00E676" name="轨迹" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="glass-card glow-border p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            遥测数据
          </h2>
          {chartData.length < 2 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
              等待数据采集...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid {...CHART_GRID_STYLE} />
                <XAxis dataKey="time" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} />
                <YAxis yAxisId="left" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" tick={CHART_AXIS_STYLE} axisLine={{ stroke: '#24416C44' }} domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(value: string) => <span className="text-slate-300">{value}</span>}
                />
                <Line yAxisId="left" type="monotone" dataKey="velocity" name="速度(km/s)" stroke="#00D4FF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="altitude" name="高度(km)" stroke="#00E676" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {selectedTask && (
        <div className="glass-card glow-border p-5 border-cyber-red/20">
          <h2 className="section-title mb-4 flex items-center gap-2 text-cyber-red">
            <ShieldAlert className="w-5 h-5" />
            应急回收预案
          </h2>
          {!recoveryActive ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                启动应急回收预案将立即进入紧急处置程序，请确保所有人员已就位。
              </p>
              <button
                onClick={handleActivateRecovery}
                className="btn-danger w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold"
              >
                <Siren className="w-5 h-5" />
                启动应急回收预案
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 animate-pulse-glow">
                <div className="flex items-center gap-2 text-cyber-red font-semibold">
                  <Siren className="w-4 h-4" />
                  <span>应急回收预案已启动</span>
                </div>
              </div>
              <div className="space-y-2">
                {RECOVERY_STEPS.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => toggleRecoveryStep(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                      recoverySteps[i]
                        ? 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
                        : 'bg-space-700/30 border-space-600/30 text-slate-300 hover:border-cyber-yellow/30'
                    }`}
                  >
                    {recoverySteps[i] ? (
                      <CheckSquare className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs text-slate-500 mr-1">{i + 1}.</span>
                    <span className="text-sm font-medium">{step}</span>
                    {recoverySteps[i] && (
                      <span className="ml-auto text-xs">已完成</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 px-1">
                <div className="flex-1 h-1.5 bg-space-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyber-green transition-all duration-500"
                    style={{
                      width: `${(recoverySteps.filter(Boolean).length / RECOVERY_STEPS.length) * 100}%`,
                      boxShadow: '0 0 6px #00E67666',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {recoverySteps.filter(Boolean).length}/{RECOVERY_STEPS.length}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedTask && (
        <div className="glass-card glow-border p-16 flex flex-col items-center justify-center text-slate-500">
          <Activity className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg">请选择一个可监控任务</p>
          <p className="text-sm mt-1">仅显示准备、加注、发射、飞行、再入状态的任务</p>
        </div>
      )}
    </div>
  );
}

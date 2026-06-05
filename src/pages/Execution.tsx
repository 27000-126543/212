import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronDown, Timer, Zap, Radio, ShieldCheck, Fuel,
  OctagonAlert, CheckCircle2, XCircle, Clock, Play,
  ArrowRight, AlertTriangle, RotateCcw, ArrowLeftRight
} from 'lucide-react';
import { useStore } from '@/store';
import type { LaunchTask, ChecklistItem, Equipment } from '@/types';

type SubsystemKey = 'propulsion' | 'telemetry_ctrl' | 'telemetry' | 'safety' | 'fueling';

interface SubsystemCheckResult {
  status: 'passed' | 'failed';
  details: string[];
}

interface SubsystemState {
  key: SubsystemKey;
  name: string;
  icon: React.ElementType;
  status: 'passed' | 'pending' | 'failed';
  progress: number;
  checking: boolean;
  checkDetails: string[];
}

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; progress: number }> = {
  preparing: { label: '准备阶段', color: 'text-cyber-yellow', bg: 'bg-cyber-yellow/20', border: 'border-cyber-yellow/40', progress: 25 },
  fueling: { label: '加注阶段', color: 'text-cyber-orange', bg: 'bg-cyber-orange/20', border: 'border-cyber-orange/40', progress: 55 },
  launch: { label: '发射阶段', color: 'text-cyber-red', bg: 'bg-cyber-red/20', border: 'border-cyber-red/40', progress: 85 },
  scheduled: { label: '待命阶段', color: 'text-cyber-blue', bg: 'bg-cyber-blue/20', border: 'border-cyber-blue/40', progress: 10 },
};

const CHECKLIST_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: '待检', color: 'text-cyber-yellow', icon: Clock },
  passed: { label: '通过', color: 'text-cyber-green', icon: CheckCircle2 },
  failed: { label: '未通过', color: 'text-cyber-red', icon: XCircle },
};

const SUBSYSTEM_CATEGORY_MAP: Record<string, SubsystemKey> = {
  '推进': 'propulsion',
  '测控': 'telemetry_ctrl',
  '遥测': 'telemetry',
  '安全': 'safety',
  '加注': 'fueling',
};

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'T+00:00:00:00';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `T-${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function checkPropulsion(
  padEquipment: Equipment[],
  allEquipment: Equipment[],
  task: LaunchTask
): SubsystemCheckResult {
  const details: string[] = [];
  let passed = true;

  const fuelingOnline = padEquipment.filter(
    (eq) => eq.category === 'fueling' && eq.status === 'online'
  );
  const fuelingOffline = padEquipment.filter(
    (eq) => eq.category === 'fueling' && eq.status !== 'online'
  );

  if (fuelingOnline.length > 0) {
    details.push(`加注设备在线：${fuelingOnline.length}台`);
  } else {
    details.push(`无在线加注设备`);
    passed = false;
  }

  if (fuelingOffline.length > 0) {
    details.push(`加注设备离线/维保：${fuelingOffline.map((e) => e.name).join('、')}`);
  }

  const fuelLevel = task.status === 'fueling'
    ? 45 + Math.floor(Math.random() * 30)
    : task.status === 'launch'
      ? 95 + Math.floor(Math.random() * 5)
      : 0;

  if (task.status === 'fueling' || task.status === 'launch') {
    details.push(`燃料余量：${fuelLevel}%`);
    if (fuelLevel < 30) {
      passed = false;
      details.push('燃料余量不足30%，无法执行发射');
    }
  } else {
    details.push(`燃料余量：待加注`);
  }

  if (fuelingOnline.length === 0 && task.status !== 'scheduled') {
    passed = false;
  }

  return { status: passed ? 'passed' : 'failed', details };
}

function checkTelemetryCtrl(
  allEquipment: Equipment[],
  _task: LaunchTask
): SubsystemCheckResult {
  const details: string[] = [];
  let passed = true;

  const telemetryOnline = allEquipment.filter(
    (eq) => eq.category === 'telemetry' && eq.status === 'online'
  );
  const telemetryMaintenance = allEquipment.filter(
    (eq) => eq.category === 'telemetry' && eq.status === 'maintenance'
  );
  const telemetryOffline = allEquipment.filter(
    (eq) => eq.category === 'telemetry' && eq.status === 'offline'
  );

  details.push(`测控设备在线：${telemetryOnline.length}台`);

  if (telemetryOnline.length === 0) {
    passed = false;
    details.push('无在线测控设备，无法提供测控支持');
  } else if (telemetryOnline.length < 2) {
    details.push('仅1台测控设备在线，冗余不足');
  } else {
    details.push(`测控冗余：${telemetryOnline.length}台，满足≥2台要求`);
  }

  if (telemetryMaintenance.length > 0) {
    details.push(`维保中：${telemetryMaintenance.map((e) => e.name).join('、')}`);
  }
  if (telemetryOffline.length > 0) {
    details.push(`离线：${telemetryOffline.map((e) => e.name).join('、')}`);
  }

  return { status: passed ? 'passed' : 'failed', details };
}

function checkTelemetry(
  allEquipment: Equipment[],
  _task: LaunchTask
): SubsystemCheckResult {
  const details: string[] = [];
  let passed = true;

  const telemetryOnline = allEquipment.filter(
    (eq) => eq.category === 'telemetry' && eq.status === 'online'
  );

  if (telemetryOnline.length === 0) {
    passed = false;
    details.push('无在线遥测设备');
  } else {
    const maxTemp = Math.max(...telemetryOnline.map((e) => e.temperature));
    details.push(`遥测设备在线：${telemetryOnline.length}台`);
    details.push(`设备最高温度：${maxTemp}°C`);

    if (maxTemp > 60) {
      passed = false;
      details.push(`设备过热（>${60}°C），遥测精度受影响`);
    } else if (maxTemp > 50) {
      details.push('设备温度偏高，建议关注');
    }
  }

  return { status: passed ? 'passed' : 'failed', details };
}

function checkSafety(
  padEquipment: Equipment[],
  _task: LaunchTask
): SubsystemCheckResult {
  const details: string[] = [];
  let passed = true;

  const onlineEquip = padEquipment.filter((eq) => eq.status === 'online');
  const offlineEquip = padEquipment.filter((eq) => eq.status === 'offline');

  details.push(`工位设备在线：${onlineEquip.length}/${padEquipment.length}台`);

  if (offlineEquip.length > 0) {
    details.push(`离线设备：${offlineEquip.map((e) => e.name).join('、')}`);
    if (offlineEquip.length >= padEquipment.length / 2) {
      passed = false;
      details.push('离线设备过多，安全风险较高');
    }
  }

  const highTempEquip = padEquipment.filter((eq) => eq.temperature > 60);
  if (highTempEquip.length > 0) {
    details.push(`高温设备：${highTempEquip.map((e) => `${e.name}(${e.temperature}°C)`).join('、')}`);
    if (highTempEquip.length >= 2) {
      passed = false;
      details.push('多台设备过热，安全系统不满足发射条件');
    }
  }

  return { status: passed ? 'passed' : 'failed', details };
}

function checkFueling(
  padEquipment: Equipment[],
  _task: LaunchTask
): SubsystemCheckResult {
  const details: string[] = [];
  let passed = true;

  const fuelingEquip = padEquipment.filter((eq) => eq.category === 'fueling');
  const fuelingOnline = fuelingEquip.filter((eq) => eq.status === 'online');

  if (fuelingEquip.length === 0) {
    details.push('工位无加注设备');
    passed = false;
  } else {
    details.push(`加注设备：${fuelingOnline.length}/${fuelingEquip.length}台在线`);

    if (fuelingOnline.length === 0) {
      passed = false;
      details.push('所有加注设备均不在线，无法执行加注');
    } else {
      for (const fe of fuelingOnline) {
        details.push(`${fe.name}：运行${fe.totalRunHours}h，温度${fe.temperature}°C`);
        if (fe.temperature > 55) {
          passed = false;
          details.push(`${fe.name}温度过高（>${55}°C），加注风险高`);
        }
      }
    }
  }

  return { status: passed ? 'passed' : 'failed', details };
}

export default function Execution() {
  const tasks = useStore((s) => s.tasks);
  const updateTask = useStore((s) => s.updateTask);
  const abortTaskAndSwitch = useStore((s) => s.abortTaskAndSwitch);
  const switchToBackupPlan = useStore((s) => s.switchToBackupPlan);
  const launchPads = useStore((s) => s.launchPads);
  const equipment = useStore((s) => s.equipment);

  const activeTasks = useMemo(
    () => tasks.filter((t) => ['preparing', 'fueling', 'scheduled', 'launch'].includes(t.status)),
    [tasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const [abortReason, setAbortReason] = useState('');
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [subsystems, setSubsystems] = useState<SubsystemState[]>([
    { key: 'propulsion', name: '推进系统', icon: Zap, status: 'pending', progress: 0, checking: false, checkDetails: [] },
    { key: 'telemetry_ctrl', name: '测控系统', icon: Radio, status: 'pending', progress: 0, checking: false, checkDetails: [] },
    { key: 'telemetry', name: '遥测系统', icon: Timer, status: 'pending', progress: 0, checking: false, checkDetails: [] },
    { key: 'safety', name: '安全系统', icon: ShieldCheck, status: 'pending', progress: 0, checking: false, checkDetails: [] },
    { key: 'fueling', name: '加注系统', icon: Fuel, status: 'pending', progress: 0, checking: false, checkDetails: [] },
  ]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const prevStatusRef = useRef<string>('');

  useEffect(() => {
    if (activeTasks.length > 0 && (!selectedTaskId || !activeTasks.find((t) => t.id === selectedTaskId))) {
      setSelectedTaskId(activeTasks[0].id);
    }
  }, [activeTasks, selectedTaskId]);

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!selectedTask) {
      setCountdown(0);
      return;
    }

    const scheduled = new Date(selectedTask.scheduledTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((scheduled - now) / 1000));
    setCountdown(diff);
  }, [selectedTask?.id, selectedTask?.scheduledTime, selectedTask?.status]);

  useEffect(() => {
    if (!selectedTask || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTask?.id, countdown > 0]);

  useEffect(() => {
    if (!selectedTask) return;

    const currentStatus = selectedTask.status;
    if (prevStatusRef.current === currentStatus) return;
    prevStatusRef.current = currentStatus;

    setSubsystems((prev) =>
      prev.map((s) => ({ ...s, status: 'pending' as const, progress: 0, checking: false, checkDetails: [] }))
    );

    const scheduled = new Date(selectedTask.scheduledTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((scheduled - now) / 1000));
    setCountdown(diff);
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTask) {
      setSubsystems((prev) => prev.map((s) => ({ ...s, status: 'pending' as const, progress: 0, checking: false, checkDetails: [] })));
      return;
    }
    const checklistByCategory: Record<string, ChecklistItem['status']> = {};
    for (const item of selectedTask.checklist) {
      checklistByCategory[item.category] = item.status;
    }
    setSubsystems((prev) =>
      prev.map((s) => {
        const matchedCategory = Object.entries(SUBSYSTEM_CATEGORY_MAP).find(([, key]) => key === s.key);
        const category = matchedCategory ? matchedCategory[0] : '';
        const checklistStatus = checklistByCategory[category];
        const status: SubsystemState['status'] = checklistStatus ?? 'pending';
        const progress = status === 'passed' ? 100 : status === 'failed' ? 30 : 0;
        return { ...s, status, progress, checking: false };
      })
    );
  }, [selectedTask]);

  const padEquipment = useMemo(() => {
    if (!selectedTask) return [];
    const pad = launchPads.find((p) => p.id === selectedTask.padId);
    if (!pad) return [];
    return pad.equipment
      .map((eqId) => equipment.find((eq) => eq.id === eqId))
      .filter((eq): eq is Equipment => eq !== undefined);
  }, [selectedTask, launchPads, equipment]);

  const handleCheckSubsystem = useCallback((key: SubsystemKey) => {
    setSubsystems((prev) =>
      prev.map((s) => (s.key === key ? { ...s, checking: true } : s))
    );

    setTimeout(() => {
      let result: SubsystemCheckResult;

      switch (key) {
        case 'propulsion':
          result = checkPropulsion(padEquipment, equipment, selectedTask!);
          break;
        case 'telemetry_ctrl':
          result = checkTelemetryCtrl(equipment, selectedTask!);
          break;
        case 'telemetry':
          result = checkTelemetry(equipment, selectedTask!);
          break;
        case 'safety':
          result = checkSafety(padEquipment, selectedTask!);
          break;
        case 'fueling':
          result = checkFueling(padEquipment, selectedTask!);
          break;
        default:
          result = { status: 'failed', details: ['未知子系统'] };
      }

      setSubsystems((prev) =>
        prev.map((s) =>
          s.key === key
            ? {
                ...s,
                checking: false,
                status: result.status,
                progress: result.status === 'passed' ? 100 : 35,
                checkDetails: result.details,
              }
            : s
        )
      );

      if (selectedTask) {
        const categoryMap: Record<SubsystemKey, string> = {
          propulsion: '推进',
          telemetry_ctrl: '测控',
          telemetry: '遥测',
          safety: '安全',
          fueling: '加注',
        };
        const category = categoryMap[key];
        const updatedChecklist = selectedTask.checklist.map((item) => {
          if (item.category !== category) return item;
          return {
            ...item,
            status: result.status === 'passed' ? 'passed' as const : 'failed' as const,
            checkedAt: new Date().toISOString(),
          };
        });
        updateTask(selectedTask.id, { checklist: updatedChecklist });
      }
    }, 1500);
  }, [padEquipment, equipment, selectedTask, updateTask]);

  const handleToggleChecklist = useCallback(
    (itemId: string) => {
      if (!selectedTask) return;
      const updatedChecklist = selectedTask.checklist.map((item) => {
        if (item.id !== itemId) return item;
        const nextStatus: ChecklistItem['status'] =
          item.status === 'pending' ? 'passed' : item.status === 'passed' ? 'failed' : 'pending';
        return {
          ...item,
          status: nextStatus,
          checkedAt: nextStatus !== 'pending' ? new Date().toISOString() : null,
        };
      });
      updateTask(selectedTask.id, { checklist: updatedChecklist });
    },
    [selectedTask, updateTask]
  );

  const handleAbort = useCallback(() => {
    if (!selectedTask || !abortReason.trim()) return;
    abortTaskAndSwitch(selectedTask.id, abortReason.trim());
    setShowAbortDialog(false);
    setAbortReason('');
    setSelectedTaskId('');
  }, [selectedTask, abortReason, abortTaskAndSwitch]);

  const handleSwitchToBackup = useCallback(() => {
    if (!selectedTask) return;
    switchToBackupPlan(selectedTask.id);
    setShowSwitchConfirm(false);
  }, [selectedTask, switchToBackupPlan]);

  const handlePhaseTransition = useCallback(
    (nextStatus: LaunchTask['status']) => {
      if (!selectedTask) return;

      if (nextStatus === 'fueling' || nextStatus === 'launch') {
        const allPassed = subsystems.every((s) => s.status === 'passed');
        if (!allPassed) return;
      }

      updateTask(selectedTask.id, { status: nextStatus });

      if (nextStatus === 'preparing') {
        const pad = launchPads.find((p) => p.id === selectedTask.padId);
        if (pad) {
          const updatedPads = launchPads.map((p) =>
            p.id === selectedTask.padId ? { ...p, status: 'preparing' as const } : p
          );
          useStore.setState({ launchPads: updatedPads });
        }
      }
      if (nextStatus === 'fueling') {
        const pad = launchPads.find((p) => p.id === selectedTask.padId);
        if (pad) {
          const updatedPads = launchPads.map((p) =>
            p.id === selectedTask.padId ? { ...p, status: 'occupied' as const } : p
          );
          useStore.setState({ launchPads: updatedPads });
        }
      }
    },
    [selectedTask, subsystems, updateTask, launchPads]
  );

  const phase = selectedTask ? PHASE_CONFIG[selectedTask.status] : null;
  const allSubsystemsPassed = subsystems.every((s) => s.status === 'passed');
  const checklistPassedCount = selectedTask?.checklist.filter((c) => c.status === 'passed').length ?? 0;
  const checklistTotal = selectedTask?.checklist.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">发射执行</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">当前任务</label>
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                prevStatusRef.current = '';
              }}
              className="select-field pr-8 min-w-[280px] appearance-none cursor-pointer"
            >
              {activeTasks.length === 0 && (
                <option value="">无可执行任务</option>
              )}
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({PHASE_CONFIG[t.status]?.label ?? t.status})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {!selectedTask ? (
        <div className="glass-card glow-border p-16 flex flex-col items-center justify-center text-slate-500">
          <OctagonAlert className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg">请选择一个可执行任务</p>
          <p className="text-sm mt-1">仅显示待命、准备中、加注中、发射中的任务</p>
        </div>
      ) : (
        <>
          <div className="glass-card glow-border p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center lg:justify-start">
                  {phase && (
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${phase.color} ${phase.bg} ${phase.border}`}>
                      {phase.label}
                    </span>
                  )}
                  <span className="text-sm text-slate-400">
                    {selectedTask.rocketName} · {selectedTask.payloadName}
                  </span>
                </div>
                <div className="font-orbitron text-5xl md:text-7xl font-bold text-white tracking-widest mb-2">
                  {formatCountdown(countdown)}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 justify-center lg:justify-start">
                  <span>计划发射：{new Date(selectedTask.scheduledTime).toLocaleString('zh-CN')}</span>
                  <span>工位：{selectedTask.padName}</span>
                  <span className={`font-mono ${selectedTask.priority === 'critical' ? 'text-cyber-red' : selectedTask.priority === 'high' ? 'text-cyber-orange' : 'text-cyber-blue'}`}>
                    {selectedTask.priority === 'critical' ? '紧急' : selectedTask.priority === 'high' ? '高' : selectedTask.priority === 'medium' ? '中' : '低'}优先级
                  </span>
                </div>
              </div>
              <div className="w-full lg:w-64 flex-shrink-0">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>任务进度</span>
                  <span className="font-mono">{phase?.progress ?? 0}%</span>
                </div>
                <div className="w-full h-3 bg-space-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${phase?.progress ?? 0}%`,
                      background: phase
                        ? `linear-gradient(90deg, ${phase.color === 'text-cyber-yellow' ? '#FFD600' : phase.color === 'text-cyber-orange' ? '#FF6B35' : phase.color === 'text-cyber-red' ? '#FF3B3B' : '#00D4FF'}, ${phase.color === 'text-cyber-yellow' ? '#FFD60088' : phase.color === 'text-cyber-orange' ? '#FF6B3588' : phase.color === 'text-cyber-red' ? '#FF3B3B88' : '#00D4FF88'})`
                        : '#00D4FF',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>待命</span>
                  <span>准备</span>
                  <span>加注</span>
                  <span>发射</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card glow-border p-5">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                子系统状态
              </h2>
              <div className="space-y-3">
                {subsystems.map((sub) => {
                  const SubIcon = sub.icon;
                  const statusColor = sub.status === 'passed' ? 'text-cyber-green' : sub.status === 'failed' ? 'text-cyber-red' : 'text-cyber-yellow';
                  const statusBg = sub.status === 'passed' ? 'bg-cyber-green' : sub.status === 'failed' ? 'bg-cyber-red' : 'bg-cyber-yellow';
                  const barColor = sub.status === 'passed' ? '#00E676' : sub.status === 'failed' ? '#FF3B3B' : '#FFD600';
                  const statusLabel = sub.status === 'passed' ? '通过' : sub.status === 'failed' ? '未通过' : '待检';

                  return (
                    <div key={sub.key} className="p-3 rounded-lg bg-space-700/30 border border-space-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusBg} ${sub.status === 'pending' ? 'animate-pulse' : ''}`} />
                          <SubIcon className={`w-4 h-4 ${statusColor}`} />
                          <span className="text-sm text-slate-200 font-medium">{sub.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${statusColor} font-mono`}>{statusLabel}</span>
                          <button
                            onClick={() => handleCheckSubsystem(sub.key)}
                            disabled={sub.checking}
                            className="btn-primary text-xs px-2.5 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {sub.checking ? (
                              <RotateCcw className="w-3 h-3 animate-spin" />
                            ) : (
                              '校验'
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-space-600/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${sub.progress}%`,
                            backgroundColor: barColor,
                            boxShadow: `0 0 6px ${barColor}66`,
                          }}
                        />
                      </div>
                      {sub.checkDetails.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {sub.checkDetails.map((detail, i) => (
                            <div key={i} className={`text-[11px] ${sub.status === 'passed' ? 'text-cyber-green/70' : sub.status === 'failed' ? 'text-cyber-red/70' : 'text-slate-500'}`}>
                              {sub.status === 'passed' ? '✓' : sub.status === 'failed' ? '✗' : '○'} {detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className={`mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${allSubsystemsPassed ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-yellow/10 text-cyber-yellow'}`}>
                  {allSubsystemsPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {allSubsystemsPassed ? '所有子系统校验通过，可执行阶段转换' : '部分子系统尚未通过校验，无法进入下一阶段'}
                </div>
              </div>
            </div>

            <div className="glass-card glow-border p-5">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                任务检查单
              </h2>
              {selectedTask.checklist.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                  暂无检查项
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>完成进度</span>
                    <span className="font-mono">{checklistPassedCount}/{checklistTotal}</span>
                  </div>
                  <div className="w-full h-1.5 bg-space-700/50 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-cyber-green transition-all duration-500"
                      style={{
                        width: checklistTotal > 0 ? `${(checklistPassedCount / checklistTotal) * 100}%` : '0%',
                        boxShadow: '0 0 6px #00E67666',
                      }}
                    />
                  </div>
                  {selectedTask.checklist.map((item) => {
                    const cfg = CHECKLIST_STATUS[item.status];
                    const ItemIcon = cfg.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(item.id)}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-space-700/30 border border-space-600/30 cursor-pointer hover:bg-space-700/50 transition-colors group"
                      >
                        <ItemIcon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-200">{item.name}</span>
                            <span className="text-[10px] text-slate-600 font-mono">{item.category}</span>
                          </div>
                          {item.checkedAt && (
                            <span className="text-[10px] text-slate-600">
                              {new Date(item.checkedAt).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color} border-current/20 bg-current/5`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card glow-border p-5">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                阶段转换
              </h2>
              <div className="space-y-3">
                {selectedTask.status === 'scheduled' && (
                  <button
                    onClick={() => handlePhaseTransition('preparing')}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    待命 → 准备阶段
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {selectedTask.status === 'preparing' && (
                  <button
                    onClick={() => handlePhaseTransition('fueling')}
                    disabled={!allSubsystemsPassed}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    准备 → 加注阶段
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {selectedTask.status === 'fueling' && (
                  <button
                    onClick={() => handlePhaseTransition('launch')}
                    disabled={!allSubsystemsPassed}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    加注 → 发射阶段
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {selectedTask.status === 'launch' && (
                  <div className="text-center text-cyber-red py-4 font-orbitron text-lg animate-pulse">
                    发射程序已启动
                  </div>
                )}
                {!['scheduled', 'preparing', 'fueling', 'launch'].includes(selectedTask.status) && (
                  <div className="text-center text-slate-500 py-4">
                    当前任务状态无法进行阶段转换
                  </div>
                )}
                {selectedTask.status === 'preparing' && !allSubsystemsPassed && (
                  <p className="text-xs text-cyber-yellow/70 text-center">所有子系统校验通过后方可进入加注阶段</p>
                )}
                {selectedTask.status === 'fueling' && !allSubsystemsPassed && (
                  <p className="text-xs text-cyber-yellow/70 text-center">所有子系统校验通过后方可进入发射阶段</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="glass-card glow-border p-5 border-cyber-red/20">
                <h2 className="section-title mb-4 flex items-center gap-2 text-cyber-red">
                  <OctagonAlert className="w-5 h-5" />
                  紧急中止
                </h2>
                {!showAbortDialog ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                      中止操作将立即终止当前任务的所有流程，进入安全处置程序。此操作不可逆，请谨慎执行。
                    </p>
                    <button
                      onClick={() => setShowAbortDialog(true)}
                      className="btn-danger w-full flex items-center justify-center gap-2 py-3 text-lg font-semibold"
                    >
                      <OctagonAlert className="w-5 h-5" />
                      紧急中止
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30">
                      <div className="flex items-center gap-2 text-cyber-red font-semibold mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>确认中止任务</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        确认中止「{selectedTask.name}」？此操作不可撤销。
                      </p>
                    </div>
                    <div>
                      <label className="label-field">中止原因</label>
                      <textarea
                        value={abortReason}
                        onChange={(e) => setAbortReason(e.target.value)}
                        placeholder="请输入中止原因..."
                        className="input-field min-h-[80px] resize-none"
                        rows={3}
                      />
                    </div>
                    {selectedTask.backupPlan && (
                      <div>
                        <label className="label-field">备选方案</label>
                        <div className="p-2.5 rounded-lg bg-cyber-blue/10 border border-cyber-blue/20 text-sm text-cyber-blue">
                          {selectedTask.backupPlan}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleAbort}
                        disabled={!abortReason.trim()}
                        className="btn-danger flex-1 flex items-center justify-center gap-2 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <OctagonAlert className="w-4 h-4" />
                        确认中止
                      </button>
                      <button
                        onClick={() => { setShowAbortDialog(false); setAbortReason(''); }}
                        className="btn-primary flex-1 py-2.5"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card glow-border p-5 border-cyber-blue/20">
                <h2 className="section-title mb-4 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5" />
                  切换备用方案
                </h2>
                {!showSwitchConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-400">
                      将任务切换至备用工位和发射窗口，自动分配可用人员。当前方案数据将保留。
                    </p>
                    {selectedTask.backupPlan ? (
                      <div className="p-2.5 rounded-lg bg-cyber-blue/10 border border-cyber-blue/20 text-sm text-cyber-blue">
                        {selectedTask.backupPlan}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-700/30 border border-slate-600/30 text-sm text-slate-500">
                        系统将自动寻找可用工位和窗口
                      </div>
                    )}
                    <button
                      onClick={() => setShowSwitchConfirm(true)}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      切换到备用方案
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
                      <p className="text-sm text-cyber-blue">
                        确认将「{selectedTask.name}」切换到备用方案？任务工位、窗口、人员将重新分配，检查单将重置。
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSwitchToBackup}
                        className="btn-success flex-1 flex items-center justify-center gap-2 py-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        确认切换
                      </button>
                      <button
                        onClick={() => setShowSwitchConfirm(false)}
                        className="btn-primary flex-1 py-2.5"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

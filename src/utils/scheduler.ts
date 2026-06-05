import type { LaunchPad, RocketModel, LaunchWindow, Equipment, LaunchTask, ScheduleItem, ScheduleConflict, Personnel, MaintenanceOrder, SparePart } from '@/types';

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface SchedulingInput {
  tasks: LaunchTask[];
  pads: LaunchPad[];
  rockets: RocketModel[];
  windows: LaunchWindow[];
  equipment: Equipment[];
  personnel: Personnel[];
  constraints: {
    enforceTransition: boolean;
    minTransitionDays: number;
    enforceCooling: boolean;
    enforceWeather: boolean;
  };
  priorityWeights: Record<string, number>;
}

interface SchedulingResult {
  scheduleItems: ScheduleItem[];
  updatedTasks: { id: string; changes: Partial<LaunchTask> }[];
  conflicts: { taskId: string; conflicts: ScheduleConflict[] }[];
  stats: {
    totalScheduled: number;
    totalConflicts: number;
    errorCount: number;
    warningCount: number;
  };
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return (db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function getRocketFuelingDuration(rockets: RocketModel[], rocketId: string): number {
  const rocket = rockets.find((r) => r.id === rocketId);
  return rocket?.fuelingDuration ?? 6;
}

function checkEquipmentAvailability(
  pad: LaunchPad,
  equipment: Equipment[],
  scheduledTime: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (const eqId of pad.equipment) {
    const eq = equipment.find((e) => e.id === eqId);
    if (eq && eq.status === 'offline') {
      conflicts.push({
        type: 'equipment',
        message: `${eq.name}当前处于离线状态，无法支持发射任务`,
        severity: 'error',
      });
    } else if (eq && eq.status === 'maintenance') {
      const maintEnd = new Date(eq.nextMaintenance);
      const schedDate = new Date(scheduledTime);
      if (schedDate < maintEnd) {
        conflicts.push({
          type: 'equipment',
          message: `${eq.name}维保中（预计${eq.nextMaintenance}恢复），与任务时间冲突`,
          severity: 'warning',
        });
      }
    }
  }
  return conflicts;
}

function checkPersonnelAvailability(
  personnel: Personnel[],
  existingAssignments: { personnelId: string; scheduledTime: string }[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  return conflicts;
}

function checkFuelingEquipment(
  pad: LaunchPad,
  equipment: Equipment[],
  rocket: RocketModel | undefined
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const fuelingEquipment = equipment.filter(
    (eq) => pad.equipment.includes(eq.id) && eq.category === 'fueling'
  );
  const onlineFueling = fuelingEquipment.filter((eq) => eq.status === 'online');

  if (onlineFueling.length === 0 && fuelingEquipment.length > 0) {
    conflicts.push({
      type: 'equipment',
      message: `${pad.name}无在线加注设备，无法执行推进剂加注`,
      severity: 'error',
    });
  }
  return conflicts;
}

function checkTelemetryEquipment(
  equipment: Equipment[],
  scheduledTime: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const telemetryEquip = equipment.filter((eq) => eq.category === 'telemetry');
  const onlineTelemetry = telemetryEquip.filter((eq) => eq.status === 'online');

  if (onlineTelemetry.length === 0) {
    conflicts.push({
      type: 'equipment',
      message: '无在线测控设备，无法提供测控支持',
      severity: 'error',
    });
  } else if (onlineTelemetry.length < 2) {
    conflicts.push({
      type: 'equipment',
      message: '仅1台测控设备在线，冗余不足，建议等待备用设备上线',
      severity: 'warning',
    });
  }
  return conflicts;
}

function checkWeatherConstraint(
  window: LaunchWindow,
  enforceWeather: boolean
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  if (!enforceWeather) return conflicts;

  if (!window.available) {
    conflicts.push({
      type: 'weather',
      message: `发射窗口不可用（气象评分${window.weatherScore}），约束条件：${window.constraints.join('、')}`,
      severity: 'error',
    });
  } else if (window.weatherScore < 70) {
    conflicts.push({
      type: 'weather',
      message: `气象评分较低（${window.weatherScore}），存在风险，建议关注天气变化`,
      severity: 'warning',
    });
  }
  return conflicts;
}

function checkPadTransition(
  pad: LaunchPad,
  scheduledTime: string,
  existingOnPad: ScheduleItem[],
  minTransitionDays: number,
  enforceTransition: boolean
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  if (!enforceTransition) return conflicts;

  for (const existing of existingOnPad) {
    const daysAfterExisting = daysBetween(existing.endTime, scheduledTime);
    const daysBeforeExisting = daysBetween(scheduledTime, existing.startTime);

    if (daysAfterExisting > 0 && daysAfterExisting < minTransitionDays) {
      conflicts.push({
        type: 'pad',
        message: `${pad.name}转换时间不足（需≥${minTransitionDays}天，当前${Math.abs(daysAfterExisting).toFixed(1)}天），与「${existing.taskName}」冲突`,
        severity: daysAfterExisting < 3 ? 'error' : 'warning',
      });
    }
    if (daysBeforeExisting > 0 && daysBeforeExisting < minTransitionDays) {
      conflicts.push({
        type: 'pad',
        message: `${pad.name}转换时间不足（需≥${minTransitionDays}天，当前${Math.abs(daysBeforeExisting).toFixed(1)}天），与「${existing.taskName}」冲突`,
        severity: daysBeforeExisting < 3 ? 'error' : 'warning',
      });
    }
  }
  return conflicts;
}

export function generateSchedule(input: SchedulingInput): SchedulingResult {
  const {
    tasks, pads, rockets, windows, equipment, personnel,
    constraints, priorityWeights,
  } = input;

  const schedulableTasks = tasks
    .filter((t) => t.status === 'draft' || t.status === 'scheduled')
    .sort((a, b) => {
      const wA = (priorityWeights[a.priority] ?? PRIORITY_WEIGHT[a.priority]) * (a.priority === 'critical' ? 1.5 : 1);
      const wB = (priorityWeights[b.priority] ?? PRIORITY_WEIGHT[b.priority]) * (b.priority === 'critical' ? 1.5 : 1);
      if (wB !== wA) return wB - wA;
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });

  const scheduleItems: ScheduleItem[] = [];
  const taskConflicts: { taskId: string; conflicts: ScheduleConflict[] }[] = [];
  const updatedTasks: { id: string; changes: Partial<LaunchTask> }[] = [];

  for (const task of schedulableTasks) {
    const taskWindows = windows.filter((w) => w.padId === task.padId);
    if (taskWindows.length === 0 && !task.windowId) {
      const allWindowsForPad = windows.filter((w) => w.padId === task.padId);
      if (allWindowsForPad.length === 0) {
        taskConflicts.push({
          taskId: task.id,
          conflicts: [{ type: 'weather', message: `${task.padName}无可用发射窗口`, severity: 'error' }],
        });
        continue;
      }
    }

    const rocket = rockets.find((r) => r.id === task.rocketId);
    const pad = pads.find((p) => p.id === task.padId);
    const window = windows.find((w) => w.id === task.windowId);

    if (!pad || !window) {
      taskConflicts.push({
        taskId: task.id,
        conflicts: [{ type: 'pad', message: '任务关联的工位或窗口不存在', severity: 'error' }],
      });
      continue;
    }

    const scheduledTime = task.scheduledTime || window.startTime;
    const fuelingHours = getRocketFuelingDuration(rockets, task.rocketId);
    const launchDuration = 2;
    const endTime = addDays(scheduledTime, 0);
    const endDt = new Date(endTime);
    endDt.setHours(endDt.getHours() + launchDuration);
    const endTimeStr = endDt.toISOString();

    const padScheduleItems = scheduleItems.filter((si) => si.padId === task.padId);

    const padConflicts = checkPadTransition(
      pad, scheduledTime, padScheduleItems,
      constraints.minTransitionDays, constraints.enforceTransition
    );

    const equipConflicts = checkEquipmentAvailability(pad, equipment, scheduledTime);

    const fuelingConflicts = checkFuelingEquipment(pad, equipment, rocket);

    const telemetryConflicts = checkTelemetryEquipment(equipment, scheduledTime);

    const weatherConflicts = checkWeatherConstraint(window, constraints.enforceWeather);

    const allConflicts = [
      ...padConflicts,
      ...equipConflicts,
      ...fuelingConflicts,
      ...telemetryConflicts,
      ...weatherConflicts,
    ];

    const effectivePriority = task.priority;

    scheduleItems.push({
      id: `sch-${task.id}`,
      taskId: task.id,
      taskName: task.name,
      padId: task.padId,
      padName: task.padName,
      startTime: scheduledTime,
      endTime: endTimeStr,
      transitionDays: pad.transitionDays,
      coolingDays: pad.coolingPeriod,
      priority: effectivePriority,
      conflicts: allConflicts,
    });

    if (allConflicts.length > 0) {
      taskConflicts.push({ taskId: task.id, conflicts: allConflicts });
    }

    const availablePersonnel = personnel.filter((p) => p.status === 'available');
    const assignCommander = availablePersonnel.find((p) => p.role === 'commander');
    const assignFueler = availablePersonnel.find((p) => p.role === 'fueler');
    const assignTelemetry = availablePersonnel.find((p) => p.role === 'telemetry_op');
    const assignSafety = availablePersonnel.find((p) => p.role === 'safety_officer');

    if (task.assignedPersonnel.length === 0) {
      updatedTasks.push({
        id: task.id,
        changes: {
          status: 'scheduled',
          assignedPersonnel: [
            assignCommander ? { personnelId: assignCommander.id, personnelName: assignCommander.name, role: 'commander' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
            assignFueler ? { personnelId: assignFueler.id, personnelName: assignFueler.name, role: 'fueler' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
            assignTelemetry ? { personnelId: assignTelemetry.id, personnelName: assignTelemetry.name, role: 'telemetry_op' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
            assignSafety ? { personnelId: assignSafety.id, personnelName: assignSafety.name, role: 'safety_officer' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
          ].filter(Boolean) as LaunchTask['assignedPersonnel'],
          backupPlan: generateBackupPlan(task, pads, windows),
        },
      });
    } else {
      updatedTasks.push({
        id: task.id,
        changes: { status: 'scheduled' },
      });
    }
  }

  const totalConflicts = taskConflicts.reduce((sum, tc) => sum + tc.conflicts.length, 0);
  const errorCount = taskConflicts.reduce(
    (sum, tc) => sum + tc.conflicts.filter((c) => c.severity === 'error').length, 0
  );
  const warningCount = taskConflicts.reduce(
    (sum, tc) => sum + tc.conflicts.filter((c) => c.severity === 'warning').length, 0
  );

  return {
    scheduleItems,
    updatedTasks,
    conflicts: taskConflicts,
    stats: {
      totalScheduled: scheduleItems.length,
      totalConflicts,
      errorCount,
      warningCount,
    },
  };
}

function generateBackupPlan(task: LaunchTask, pads: LaunchPad[], windows: LaunchWindow[]): string {
  const alternativePads = pads.filter((p) => p.id !== task.padId && p.status !== 'maintenance');
  const altPad = alternativePads[0];
  if (altPad) {
    const altWindow = windows.find((w) => w.padId === altPad.id && w.available);
    if (altWindow) {
      return `B方案：使用${altPad.name}，窗口${new Date(altWindow.startTime).toLocaleDateString('zh-CN')}，延后72小时`;
    }
    return `B方案：使用${altPad.name}，窗口待定`;
  }
  return 'B方案：暂无备用工位可用';
}

export function autoGenerateMaintenanceOrders(
  equipment: Equipment[],
  existingOrders: MaintenanceOrder[],
  spareParts: SparePart[]
): { orders: Partial<import('@/types').MaintenanceOrder>[]; partDeductions: { partId: string; quantity: number }[] } {
  const orders: Partial<import('@/types').MaintenanceOrder>[] = [];
  const partDeductions: { partId: string; quantity: number }[] = [];

  for (const eq of equipment) {
    const hasExistingOrder = existingOrders.some(
      (o) => o.equipmentId === eq.id && o.status !== 'completed'
    );
    if (hasExistingOrder) continue;

    let shouldCreate = false;
    let reason = '';
    let type: 'routine' | 'corrective' | 'overhaul' = 'routine';
    let priority: 'low' | 'medium' | 'high' = 'medium';

    if (eq.totalRunHours >= 8000) {
      shouldCreate = true;
      reason = `运行时长达${eq.totalRunHours}小时，超过8000小时阈值，需全面检修`;
      type = eq.totalRunHours >= 10000 ? 'overhaul' : 'corrective';
      priority = eq.totalRunHours >= 10000 ? 'high' : 'medium';
    } else if (eq.launchCount > 0 && eq.launchCount % 5 === 0) {
      shouldCreate = true;
      reason = `累计发射${eq.launchCount}次，达每5次例行维保阈值`;
      type = 'routine';
      priority = 'medium';
    }

    if (eq.status === 'offline') {
      shouldCreate = true;
      if (!reason) reason = `设备已离线，需立即检修`;
      type = 'corrective';
      priority = 'high';
    }

    if (!shouldCreate) continue;

    const estimatedHours = type === 'overhaul' ? 48 : type === 'corrective' ? 16 : 6;
    const partsNeeded: { partId: string; partName: string; quantity: number }[] = [];

    if (eq.category === 'fueling') {
      const sealKit = spareParts.find((sp) => sp.name === '密封圈套件');
      const oil = spareParts.find((sp) => sp.name === '润滑油5L');
      const valve = spareParts.find((sp) => sp.name === '高压阀门');
      if (sealKit && sealKit.quantity >= 2) {
        partsNeeded.push({ partId: sealKit.id, partName: sealKit.name, quantity: 2 });
        partDeductions.push({ partId: sealKit.id, quantity: 2 });
      }
      if (oil && oil.quantity >= 1) {
        partsNeeded.push({ partId: oil.id, partName: oil.name, quantity: 1 });
        partDeductions.push({ partId: oil.id, quantity: 1 });
      }
      if (type === 'overhaul' && valve && valve.quantity >= 1) {
        partsNeeded.push({ partId: valve.id, partName: valve.name, quantity: 1 });
        partDeductions.push({ partId: valve.id, quantity: 1 });
      }
    } else if (eq.category === 'telemetry') {
      const filter = spareParts.find((sp) => sp.name === '滤波器模块');
      const amplifier = spareParts.find((sp) => sp.name === '信号放大器');
      const sensor = spareParts.find((sp) => sp.name === '温度传感器');
      if (filter && filter.quantity >= 1) {
        partsNeeded.push({ partId: filter.id, partName: filter.name, quantity: 1 });
        partDeductions.push({ partId: filter.id, quantity: 1 });
      }
      if (type === 'overhaul' && amplifier && amplifier.quantity >= 1) {
        partsNeeded.push({ partId: amplifier.id, partName: amplifier.name, quantity: 1 });
        partDeductions.push({ partId: amplifier.id, quantity: 1 });
      }
      if (sensor && sensor.quantity >= 1) {
        partsNeeded.push({ partId: sensor.id, partName: sensor.name, quantity: 1 });
        partDeductions.push({ partId: sensor.id, quantity: 1 });
      }
    } else {
      const sealKit = spareParts.find((sp) => sp.name === '密封圈套件');
      const oil = spareParts.find((sp) => sp.name === '润滑油5L');
      if (sealKit && sealKit.quantity >= 1) {
        partsNeeded.push({ partId: sealKit.id, partName: sealKit.name, quantity: 1 });
        partDeductions.push({ partId: sealKit.id, quantity: 1 });
      }
      if (oil && oil.quantity >= 1) {
        partsNeeded.push({ partId: oil.id, partName: oil.name, quantity: 1 });
        partDeductions.push({ partId: oil.id, quantity: 1 });
      }
    }

    orders.push({
      equipmentId: eq.id,
      equipmentName: eq.name,
      type,
      reason,
      status: 'pending',
      assignedTeam: '',
      partsUsed: partsNeeded,
      createdAt: new Date().toISOString(),
      completedAt: null,
      priority,
      estimatedHours,
      actualHours: 0,
    });
  }

  return { orders, partDeductions };
}

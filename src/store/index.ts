import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LaunchPad, RocketModel, Payload, LaunchWindow, Personnel,
  LaunchTask, ScheduleItem, MaintenanceOrder, SparePart,
  Equipment, Alert, Notification
} from '@/types';

interface AppState {
  launchPads: LaunchPad[];
  rocketModels: RocketModel[];
  payloads: Payload[];
  launchWindows: LaunchWindow[];
  personnel: Personnel[];
  tasks: LaunchTask[];
  scheduleItems: ScheduleItem[];
  maintenanceOrders: MaintenanceOrder[];
  spareParts: SparePart[];
  equipment: Equipment[];
  alerts: Alert[];
  notifications: Notification[];

  addLaunchPad: (pad: LaunchPad) => void;
  updateLaunchPad: (id: string, data: Partial<LaunchPad>) => void;
  addRocketModel: (rocket: RocketModel) => void;
  updateRocketModel: (id: string, data: Partial<RocketModel>) => void;
  addPayload: (payload: Payload) => void;
  updatePayload: (id: string, data: Partial<Payload>) => void;
  addLaunchWindow: (window: LaunchWindow) => void;
  updateLaunchWindow: (id: string, data: Partial<LaunchWindow>) => void;
  addPersonnel: (p: Personnel) => void;
  updatePersonnel: (id: string, data: Partial<Personnel>) => void;
  addTask: (task: LaunchTask) => void;
  updateTask: (id: string, data: Partial<LaunchTask>) => void;
  confirmAssignment: (taskId: string, personnelId: string) => void;
  requestAdjustment: (taskId: string, personnelId: string, reason: string) => void;
  approveAdjustment: (taskId: string, personnelId: string, approved: boolean) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  updateScheduleItem: (id: string, data: Partial<ScheduleItem>) => void;
  replaceScheduleItems: (items: ScheduleItem[]) => void;
  batchUpdateTasks: (updates: { id: string; changes: Partial<LaunchTask> }[]) => void;
  confirmAndNotify: (taskId: string, personnelId: string) => void;
  requestAdjustmentAndNotify: (taskId: string, personnelId: string, reason: string) => void;
  approveAdjustmentAndNotify: (taskId: string, personnelId: string, approved: boolean, comment: string) => void;
  confirmScheduleAndPush: () => void;
  abortTaskAndSwitch: (taskId: string, reason: string) => void;
  switchToBackupPlan: (taskId: string) => void;
  addMaintenanceOrder: (order: MaintenanceOrder) => void;
  updateMaintenanceOrder: (id: string, data: Partial<MaintenanceOrder>) => void;
  useSparePart: (partId: string, quantity: number) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
}

const initialPads: LaunchPad[] = [
  { id: 'pad-001', name: '101工位', code: 'LC-101', type: 'liquid', status: 'occupied', lastLaunchTime: '2026-05-20T08:00:00', transitionDays: 7, coolingPeriod: 3, equipment: ['eq-001', 'eq-002', 'eq-003'], position: { x: 35, y: 30 }, totalLaunches: 47 },
  { id: 'pad-002', name: '102工位', code: 'LC-102', type: 'liquid', status: 'preparing', lastLaunchTime: '2026-04-15T10:30:00', transitionDays: 7, coolingPeriod: 3, equipment: ['eq-004', 'eq-005'], position: { x: 55, y: 25 }, totalLaunches: 35 },
  { id: 'pad-003', name: '103工位', code: 'LC-103', type: 'solid', status: 'idle', lastLaunchTime: '2026-03-28T14:00:00', transitionDays: 7, coolingPeriod: 2, equipment: ['eq-006'], position: { x: 75, y: 35 }, totalLaunches: 22 },
  { id: 'pad-004', name: '201工位', code: 'LC-201', type: 'mixed', status: 'maintenance', lastLaunchTime: '2026-02-10T06:00:00', transitionDays: 10, coolingPeriod: 5, equipment: ['eq-007', 'eq-008', 'eq-009'], position: { x: 45, y: 55 }, totalLaunches: 58 },
  { id: 'pad-005', name: '202工位', code: 'LC-202', type: 'liquid', status: 'idle', lastLaunchTime: '2026-05-01T12:00:00', transitionDays: 7, coolingPeriod: 3, equipment: ['eq-010', 'eq-011'], position: { x: 65, y: 60 }, totalLaunches: 31 },
  { id: 'pad-006', name: '301工位', code: 'LC-301', type: 'solid', status: 'preparing', lastLaunchTime: '2026-04-22T09:00:00', transitionDays: 7, coolingPeriod: 2, equipment: ['eq-012'], position: { x: 25, y: 65 }, totalLaunches: 15 },
];

const initialRockets: RocketModel[] = [
  { id: 'rocket-001', name: '长征五号', code: 'CZ-5', propellantType: '液氢液氧/液氧煤油', leoCapacity: 25000, gtoCapacity: 14000, totalLaunches: 15, successRate: 93.3, fuelingDuration: 8, stages: 2, height: 56.97, diameter: 5.0 },
  { id: 'rocket-002', name: '长征七号', code: 'CZ-7', propellantType: '液氧煤油', leoCapacity: 13500, gtoCapacity: 5500, totalLaunches: 12, successRate: 100, fuelingDuration: 6, stages: 2, height: 53.1, diameter: 3.35 },
  { id: 'rocket-003', name: '长征二号F', code: 'CZ-2F', propellantType: '四氧化二氮/偏二甲肼', leoCapacity: 8400, gtoCapacity: 0, totalLaunches: 20, successRate: 95, fuelingDuration: 5, stages: 2, height: 58.34, diameter: 3.35 },
  { id: 'rocket-004', name: '长征三号乙', code: 'CZ-3B', propellantType: '液氢液氧/四氧化二氮', leoCapacity: 11800, gtoCapacity: 5500, totalLaunches: 67, successRate: 94, fuelingDuration: 7, stages: 3, height: 54.84, diameter: 3.35 },
  { id: 'rocket-005', name: '长征八号', code: 'CZ-8', propellantType: '液氧煤油/液氢液氧', leoCapacity: 5000, gtoCapacity: 2800, totalLaunches: 5, successRate: 100, fuelingDuration: 5, stages: 2, height: 50.34, diameter: 3.35 },
];

const initialPayloads: Payload[] = [
  { id: 'payload-001', name: '天宫空间站实验舱', type: 'manned', mass: 22000, organization: '中国载人航天工程办公室', orbitType: 'LEO 400km', specialRequirements: '对接机构校验' },
  { id: 'payload-002', name: '北斗导航卫星组', type: 'satellite', mass: 3800, organization: '中国卫星导航系统管理办公室', orbitType: 'MEO 21500km', specialRequirements: '星座相位精度' },
  { id: 'payload-003', name: '天问二号探测器', type: 'deep_space', mass: 5200, organization: '国家航天局', orbitType: '小行星转移轨道', specialRequirements: '深空测控链路' },
  { id: 'payload-004', name: '天舟货运飞船', type: 'cargo', mass: 13500, organization: '中国载人航天工程办公室', orbitType: 'LEO 400km', specialRequirements: '交会对接' },
  { id: 'payload-005', name: '遥感四十一号卫星', type: 'satellite', mass: 2800, organization: '中国航天科技集团', orbitType: 'SSO 500km', specialRequirements: '整流罩定制' },
];

const initialWindows: LaunchWindow[] = [
  { id: 'win-001', padId: 'pad-001', padName: '101工位', startTime: '2026-06-10T08:00:00', endTime: '2026-06-10T10:30:00', weatherScore: 92, available: true, constraints: ['风速<15m/s', '无雷暴'] },
  { id: 'win-002', padId: 'pad-002', padName: '102工位', startTime: '2026-06-12T06:30:00', endTime: '2026-06-12T09:00:00', weatherScore: 78, available: true, constraints: ['风速<12m/s', '能见度>10km'] },
  { id: 'win-003', padId: 'pad-003', padName: '103工位', startTime: '2026-06-15T14:00:00', endTime: '2026-06-15T16:00:00', weatherScore: 85, available: true, constraints: ['风速<10m/s'] },
  { id: 'win-004', padId: 'pad-005', padName: '202工位', startTime: '2026-06-18T07:00:00', endTime: '2026-06-18T09:30:00', weatherScore: 65, available: false, constraints: ['台风预警', '风速>20m/s'] },
  { id: 'win-005', padId: 'pad-006', padName: '301工位', startTime: '2026-06-20T10:00:00', endTime: '2026-06-20T12:00:00', weatherScore: 88, available: true, constraints: ['风速<12m/s', '温度>-10°C'] },
];

const initialPersonnel: Personnel[] = [
  { id: 'p-001', name: '张远航', role: 'commander', team: '指挥组A', phone: '138****1001', status: 'assigned' },
  { id: 'p-002', name: '李志刚', role: 'commander', team: '指挥组B', phone: '138****1002', status: 'available' },
  { id: 'p-003', name: '王建国', role: 'fueler', team: '加注一班', phone: '138****2001', status: 'assigned' },
  { id: 'p-004', name: '刘明辉', role: 'fueler', team: '加注二班', phone: '138****2002', status: 'available' },
  { id: 'p-005', name: '陈晓东', role: 'telemetry_op', team: '测控组A', phone: '138****3001', status: 'assigned' },
  { id: 'p-006', name: '赵伟', role: 'telemetry_op', team: '测控组B', phone: '138****3002', status: 'available' },
  { id: 'p-007', name: '孙强', role: 'safety_officer', team: '安全组', phone: '138****4001', status: 'assigned' },
  { id: 'p-008', name: '周涛', role: 'safety_officer', team: '安全组', phone: '138****4002', status: 'available' },
  { id: 'p-009', name: '吴磊', role: 'maintenance', team: '维保一班', phone: '138****5001', status: 'assigned' },
  { id: 'p-010', name: '郑凯', role: 'maintenance', team: '维保二班', phone: '138****5002', status: 'available' },
  { id: 'p-011', name: '黄超', role: 'admin', team: '管理组', phone: '138****6001', status: 'available' },
];

const initialTasks: LaunchTask[] = [
  {
    id: 'task-001', name: '天宫空间站实验舱发射任务', padId: 'pad-001', padName: '101工位',
    rocketId: 'rocket-001', rocketName: '长征五号', payloadId: 'payload-001', payloadName: '天宫空间站实验舱',
    windowId: 'win-001', priority: 'critical', status: 'preparing', scheduledTime: '2026-06-10T08:00:00',
    assignedPersonnel: [
      { personnelId: 'p-001', personnelName: '张远航', role: 'commander', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-003', personnelName: '王建国', role: 'fueler', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-005', personnelName: '陈晓东', role: 'telemetry_op', confirmed: false, adjustmentRequested: true, adjustmentReason: '测控设备检修中，建议延期2天', approved: null },
      { personnelId: 'p-007', personnelName: '孙强', role: 'safety_officer', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
    ],
    checklist: [
      { id: 'ck-001', name: '推进系统检查', category: '推进', status: 'passed', checkedAt: '2026-06-08T10:00:00' },
      { id: 'ck-002', name: '测控链路测试', category: '测控', status: 'pending', checkedAt: null },
      { id: 'ck-003', name: '遥测系统校验', category: '遥测', status: 'passed', checkedAt: '2026-06-08T11:00:00' },
      { id: 'ck-004', name: '安全系统确认', category: '安全', status: 'passed', checkedAt: '2026-06-08T09:30:00' },
      { id: 'ck-005', name: '加注管路检查', category: '加注', status: 'pending', checkedAt: null },
    ],
    telemetryData: [],
    backupPlan: 'B方案：使用103工位，窗口延后72小时', abortReason: '',
  },
  {
    id: 'task-002', name: '北斗导航卫星发射任务', padId: 'pad-002', padName: '102工位',
    rocketId: 'rocket-004', rocketName: '长征三号乙', payloadId: 'payload-002', payloadName: '北斗导航卫星组',
    windowId: 'win-002', priority: 'high', status: 'scheduled', scheduledTime: '2026-06-12T06:30:00',
    assignedPersonnel: [
      { personnelId: 'p-002', personnelName: '李志刚', role: 'commander', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-004', personnelName: '刘明辉', role: 'fueler', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-006', personnelName: '赵伟', role: 'telemetry_op', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-008', personnelName: '周涛', role: 'safety_officer', confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null },
    ],
    checklist: [], telemetryData: [],
    backupPlan: 'B方案：使用202工位，窗口延后48小时', abortReason: '',
  },
  {
    id: 'task-003', name: '天问二号发射任务', padId: 'pad-006', padName: '301工位',
    rocketId: 'rocket-001', rocketName: '长征五号', payloadId: 'payload-003', payloadName: '天问二号探测器',
    windowId: 'win-005', priority: 'critical', status: 'draft', scheduledTime: '2026-06-20T10:00:00',
    assignedPersonnel: [], checklist: [], telemetryData: [],
    backupPlan: '', abortReason: '',
  },
  {
    id: 'task-004', name: '遥感四十一号卫星发射', padId: 'pad-003', padName: '103工位',
    rocketId: 'rocket-002', rocketName: '长征七号', payloadId: 'payload-005', payloadName: '遥感四十一号卫星',
    windowId: 'win-003', priority: 'medium', status: 'scheduled', scheduledTime: '2026-06-15T14:00:00',
    assignedPersonnel: [], checklist: [], telemetryData: [],
    backupPlan: '', abortReason: '',
  },
  {
    id: 'task-005', name: '天舟货运飞船发射', padId: 'pad-001', padName: '101工位',
    rocketId: 'rocket-002', rocketName: '长征七号', payloadId: 'payload-004', payloadName: '天舟货运飞船',
    windowId: 'win-001', priority: 'high', status: 'fueling', scheduledTime: '2026-06-08T06:00:00',
    assignedPersonnel: [
      { personnelId: 'p-001', personnelName: '张远航', role: 'commander', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
      { personnelId: 'p-003', personnelName: '王建国', role: 'fueler', confirmed: true, adjustmentRequested: false, adjustmentReason: '', approved: null },
    ],
    checklist: [
      { id: 'ck-010', name: '推进系统检查', category: '推进', status: 'passed', checkedAt: '2026-06-07T10:00:00' },
      { id: 'ck-011', name: '加注管路检查', category: '加注', status: 'passed', checkedAt: '2026-06-07T14:00:00' },
      { id: 'ck-012', name: '推进剂加注', category: '加注', status: 'pending', checkedAt: null },
    ],
    telemetryData: [], backupPlan: 'B方案：使用102工位', abortReason: '',
  },
  {
    id: 'task-006', name: '载人飞船发射任务', padId: 'pad-002', padName: '102工位',
    rocketId: 'rocket-003', rocketName: '长征二号F', payloadId: 'payload-001', payloadName: '天宫空间站实验舱',
    windowId: 'win-002', priority: 'critical', status: 'completed', scheduledTime: '2026-05-15T09:00:00',
    assignedPersonnel: [], checklist: [], telemetryData: [],
    backupPlan: '', abortReason: '',
  },
];

const initialSchedule: ScheduleItem[] = [
  { id: 'sch-001', taskId: 'task-005', taskName: '天舟货运飞船发射', padId: 'pad-001', padName: '101工位', startTime: '2026-06-08T06:00:00', endTime: '2026-06-08T08:00:00', transitionDays: 7, coolingDays: 3, priority: 'high', conflicts: [] },
  { id: 'sch-002', taskId: 'task-001', taskName: '天宫空间站实验舱发射任务', padId: 'pad-001', padName: '101工位', startTime: '2026-06-10T08:00:00', endTime: '2026-06-10T10:30:00', transitionDays: 7, coolingDays: 3, priority: 'critical', conflicts: [{ type: 'pad', message: '工位转换时间不足（需≥7天，当前仅2天）', severity: 'warning' }] },
  { id: 'sch-003', taskId: 'task-002', taskName: '北斗导航卫星发射任务', padId: 'pad-002', padName: '102工位', startTime: '2026-06-12T06:30:00', endTime: '2026-06-12T09:00:00', transitionDays: 7, coolingDays: 3, priority: 'high', conflicts: [] },
  { id: 'sch-004', taskId: 'task-004', taskName: '遥感四十一号卫星发射', padId: 'pad-003', padName: '103工位', startTime: '2026-06-15T14:00:00', endTime: '2026-06-15T16:00:00', transitionDays: 7, coolingDays: 2, priority: 'medium', conflicts: [] },
  { id: 'sch-005', taskId: 'task-003', taskName: '天问二号发射任务', padId: 'pad-006', padName: '301工位', startTime: '2026-06-20T10:00:00', endTime: '2026-06-20T12:00:00', transitionDays: 7, coolingDays: 2, priority: 'critical', conflicts: [] },
];

const initialMaintenance: MaintenanceOrder[] = [
  { id: 'mo-001', equipmentId: 'eq-001', equipmentName: '1号加注泵', type: 'routine', reason: '运行时长达2000小时，需例行维保', status: 'in_progress', assignedTeam: '维保一班', partsUsed: [{ partId: 'sp-001', partName: '密封圈套件', quantity: 2 }, { partId: 'sp-003', partName: '润滑油5L', quantity: 1 }], createdAt: '2026-06-01T08:00:00', completedAt: null, priority: 'medium', estimatedHours: 8, actualHours: 5 },
  { id: 'mo-002', equipmentId: 'eq-007', equipmentName: '201工位发射架', type: 'corrective', reason: '发射架导轨磨损超限', status: 'assigned', assignedTeam: '维保二班', partsUsed: [], createdAt: '2026-06-03T10:00:00', completedAt: null, priority: 'high', estimatedHours: 24, actualHours: 0 },
  { id: 'mo-003', equipmentId: 'eq-006', equipmentName: '103工位测控天线', type: 'routine', reason: '发射次数达20次，需例行维保', status: 'pending', assignedTeam: '', partsUsed: [], createdAt: '2026-06-05T09:00:00', completedAt: null, priority: 'low', estimatedHours: 4, actualHours: 0 },
  { id: 'mo-004', equipmentId: 'eq-010', equipmentName: '202工位加注系统', type: 'overhaul', reason: '系统运行5年，需大修', status: 'pending', assignedTeam: '', partsUsed: [], createdAt: '2026-06-04T14:00:00', completedAt: null, priority: 'high', estimatedHours: 48, actualHours: 0 },
  { id: 'mo-005', equipmentId: 'eq-002', equipmentName: '1号测控站', type: 'routine', reason: '季度例行维保', status: 'completed', assignedTeam: '维保一班', partsUsed: [{ partId: 'sp-002', partName: '滤波器模块', quantity: 1 }], createdAt: '2026-05-20T08:00:00', completedAt: '2026-05-21T16:00:00', priority: 'low', estimatedHours: 6, actualHours: 8 },
];

const initialSpareParts: SparePart[] = [
  { id: 'sp-001', name: '密封圈套件', category: '密封件', quantity: 45, safetyStock: 20, unitPrice: 350, location: 'A区-01-03' },
  { id: 'sp-002', name: '滤波器模块', category: '电子元件', quantity: 8, safetyStock: 5, unitPrice: 12000, location: 'B区-02-01' },
  { id: 'sp-003', name: '润滑油5L', category: '油品', quantity: 120, safetyStock: 50, unitPrice: 280, location: 'C区-01-02' },
  { id: 'sp-004', name: '高压阀门', category: '阀门', quantity: 12, safetyStock: 6, unitPrice: 8500, location: 'A区-02-01' },
  { id: 'sp-005', name: '温度传感器', category: '传感器', quantity: 3, safetyStock: 10, unitPrice: 2400, location: 'B区-01-05' },
  { id: 'sp-006', name: '液压缸总成', category: '液压件', quantity: 2, safetyStock: 2, unitPrice: 45000, location: 'A区-03-01' },
  { id: 'sp-007', name: '信号放大器', category: '电子元件', quantity: 15, safetyStock: 8, unitPrice: 6800, location: 'B区-02-03' },
];

const initialEquipment: Equipment[] = [
  { id: 'eq-001', name: '1号加注泵', category: 'fueling', status: 'online', totalRunHours: 2100, launchCount: 30, lastMaintenance: '2026-05-15', nextMaintenance: '2026-07-15', position: { x: 32, y: 28 }, temperature: 42 },
  { id: 'eq-002', name: '1号测控站', category: 'telemetry', status: 'online', totalRunHours: 8500, launchCount: 47, lastMaintenance: '2026-05-20', nextMaintenance: '2026-08-20', position: { x: 15, y: 20 }, temperature: 35 },
  { id: 'eq-003', name: '1号运输车', category: 'transport', status: 'online', totalRunHours: 3200, launchCount: 25, lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', position: { x: 40, y: 40 }, temperature: 28 },
  { id: 'eq-004', name: '2号加注泵', category: 'fueling', status: 'online', totalRunHours: 1800, launchCount: 22, lastMaintenance: '2026-05-01', nextMaintenance: '2026-08-01', position: { x: 52, y: 23 }, temperature: 39 },
  { id: 'eq-005', name: '2号测控站', category: 'telemetry', status: 'maintenance', totalRunHours: 7200, launchCount: 35, lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01', position: { x: 60, y: 18 }, temperature: 55 },
  { id: 'eq-006', name: '103工位测控天线', category: 'telemetry', status: 'online', totalRunHours: 4500, launchCount: 22, lastMaintenance: '2026-04-20', nextMaintenance: '2026-07-20', position: { x: 72, y: 33 }, temperature: 38 },
  { id: 'eq-007', name: '201工位发射架', category: 'support', status: 'offline', totalRunHours: 12000, launchCount: 58, lastMaintenance: '2026-02-10', nextMaintenance: '2026-06-10', position: { x: 42, y: 53 }, temperature: 30 },
  { id: 'eq-008', name: '3号加注泵', category: 'fueling', status: 'offline', totalRunHours: 9500, launchCount: 40, lastMaintenance: '2026-03-15', nextMaintenance: '2026-06-15', position: { x: 48, y: 58 }, temperature: 62 },
  { id: 'eq-009', name: '3号测控站', category: 'telemetry', status: 'offline', totalRunHours: 6800, launchCount: 30, lastMaintenance: '2026-03-01', nextMaintenance: '2026-06-01', position: { x: 38, y: 60 }, temperature: 58 },
  { id: 'eq-010', name: '202工位加注系统', category: 'fueling', status: 'online', totalRunHours: 5600, launchCount: 31, lastMaintenance: '2026-05-10', nextMaintenance: '2026-08-10', position: { x: 62, y: 58 }, temperature: 41 },
  { id: 'eq-011', name: '4号测控站', category: 'telemetry', status: 'online', totalRunHours: 3200, launchCount: 18, lastMaintenance: '2026-05-05', nextMaintenance: '2026-08-05', position: { x: 68, y: 55 }, temperature: 36 },
  { id: 'eq-012', name: '301工位运输车', category: 'transport', status: 'online', totalRunHours: 2100, launchCount: 15, lastMaintenance: '2026-04-25', nextMaintenance: '2026-07-25', position: { x: 22, y: 63 }, temperature: 32 },
];

const initialAlerts: Alert[] = [
  { id: 'alert-001', taskId: 'task-001', taskName: '天宫空间站实验舱发射任务', level: 'critical', message: '测控设备检修未完成，影响任务执行', timestamp: '2026-06-08T14:30:00', acknowledged: false },
  { id: 'alert-002', taskId: 'task-002', taskName: '北斗导航卫星发射任务', level: 'warning', message: '安全员尚未确认任务分配', timestamp: '2026-06-08T10:00:00', acknowledged: false },
  { id: 'alert-003', taskId: 'task-001', taskName: '天宫空间站实验舱发射任务', level: 'warning', message: '工位转换时间不足，建议调整排程', timestamp: '2026-06-07T16:00:00', acknowledged: true },
  { id: 'alert-004', taskId: '', taskName: '', level: 'emergency', message: '201工位发射架导轨磨损超限，设备已下线', timestamp: '2026-06-03T10:00:00', acknowledged: true },
  { id: 'alert-005', taskId: '', taskName: '', level: 'info', message: '温度传感器库存低于安全库存，请及时补充', timestamp: '2026-06-05T09:00:00', acknowledged: false },
];

const initialNotifications: Notification[] = [
  { id: 'notif-001', type: 'task_assign', title: '任务分配通知', content: '您已被分配至天宫空间站实验舱发射任务，请尽快确认', timestamp: '2026-06-06T08:00:00', read: false, fromUser: '系统' },
  { id: 'notif-002', type: 'approval_request', title: '调整申请待审批', content: '陈晓东申请调整天宫空间站实验舱任务，原因：测控设备检修中', timestamp: '2026-06-08T14:30:00', read: false, fromUser: '陈晓东' },
  { id: 'notif-003', type: 'alert', title: '告警通知', content: '201工位发射架导轨磨损超限，已下线维保', timestamp: '2026-06-03T10:00:00', read: true, fromUser: '系统' },
  { id: 'notif-004', type: 'system', title: '排程更新', content: '6月排程已更新，新增天问二号发射任务', timestamp: '2026-06-05T16:00:00', read: true, fromUser: '系统' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      launchPads: initialPads,
      rocketModels: initialRockets,
      payloads: initialPayloads,
      launchWindows: initialWindows,
      personnel: initialPersonnel,
      tasks: initialTasks,
      scheduleItems: initialSchedule,
      maintenanceOrders: initialMaintenance,
      spareParts: initialSpareParts,
      equipment: initialEquipment,
      alerts: initialAlerts,
      notifications: initialNotifications,

      addLaunchPad: (pad) => set((s) => ({ launchPads: [...s.launchPads, pad] })),
      updateLaunchPad: (id, data) => set((s) => ({
        launchPads: s.launchPads.map((p) => p.id === id ? { ...p, ...data } : p),
      })),
      addRocketModel: (rocket) => set((s) => ({ rocketModels: [...s.rocketModels, rocket] })),
      updateRocketModel: (id, data) => set((s) => ({
        rocketModels: s.rocketModels.map((r) => r.id === id ? { ...r, ...data } : r),
      })),
      addPayload: (payload) => set((s) => ({ payloads: [...s.payloads, payload] })),
      updatePayload: (id, data) => set((s) => ({
        payloads: s.payloads.map((p) => p.id === id ? { ...p, ...data } : p),
      })),
      addLaunchWindow: (window) => set((s) => ({ launchWindows: [...s.launchWindows, window] })),
      updateLaunchWindow: (id, data) => set((s) => ({
        launchWindows: s.launchWindows.map((w) => w.id === id ? { ...w, ...data } : w),
      })),
      addPersonnel: (p) => set((s) => ({ personnel: [...s.personnel, p] })),
      updatePersonnel: (id, data) => set((s) => ({
        personnel: s.personnel.map((p) => p.id === id ? { ...p, ...data } : p),
      })),
      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, data) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === id ? { ...t, ...data } : t),
      })),
      confirmAssignment: (taskId, personnelId) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === taskId ? {
          ...t,
          assignedPersonnel: t.assignedPersonnel.map((a) =>
            a.personnelId === personnelId ? { ...a, confirmed: true } : a
          ),
        } : t),
      })),
      requestAdjustment: (taskId, personnelId, reason) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === taskId ? {
          ...t,
          assignedPersonnel: t.assignedPersonnel.map((a) =>
            a.personnelId === personnelId ? { ...a, adjustmentRequested: true, adjustmentReason: reason } : a
          ),
        } : t),
      })),
      approveAdjustment: (taskId, personnelId, approved) => set((s) => ({
        tasks: s.tasks.map((t) => t.id === taskId ? {
          ...t,
          assignedPersonnel: t.assignedPersonnel.map((a) =>
            a.personnelId === personnelId ? { ...a, approved, adjustmentRequested: !approved } : a
          ),
        } : t),
      })),
      addScheduleItem: (item) => set((s) => ({ scheduleItems: [...s.scheduleItems, item] })),
      updateScheduleItem: (id, data) => set((s) => ({
        scheduleItems: s.scheduleItems.map((si) => si.id === id ? { ...si, ...data } : si),
      })),
      replaceScheduleItems: (items) => set({ scheduleItems: items }),
      batchUpdateTasks: (updates) => set((s) => ({
        tasks: s.tasks.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          return update ? { ...t, ...update.changes } : t;
        }),
      })),
      confirmAndNotify: (taskId, personnelId) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;
        const person = task.assignedPersonnel.find((a) => a.personnelId === personnelId);
        if (!person) return s;
        return {
          tasks: s.tasks.map((t) => t.id === taskId ? {
            ...t,
            assignedPersonnel: t.assignedPersonnel.map((a) =>
              a.personnelId === personnelId ? { ...a, confirmed: true } : a
            ),
          } : t),
          notifications: [{
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'task_assign' as const,
            title: '任务确认通知',
            content: `${person.personnelName}已确认「${task.name}」任务分配`,
            timestamp: new Date().toISOString(),
            read: false,
            fromUser: person.personnelName,
          }, ...s.notifications],
        };
      }),
      requestAdjustmentAndNotify: (taskId, personnelId, reason) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;
        const person = task.assignedPersonnel.find((a) => a.personnelId === personnelId);
        if (!person) return s;
        return {
          tasks: s.tasks.map((t) => t.id === taskId ? {
            ...t,
            assignedPersonnel: t.assignedPersonnel.map((a) =>
              a.personnelId === personnelId ? { ...a, adjustmentRequested: true, adjustmentReason: reason, approved: null } : a
            ),
          } : t),
          notifications: [{
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'approval_request' as const,
            title: '调整申请待审批',
            content: `${person.personnelName}（${person.role === 'commander' ? '指挥员' : person.role === 'fueler' ? '加注手' : person.role === 'telemetry_op' ? '测控操作员' : '安全员'}）申请调整「${task.name}」，原因：${reason}`,
            timestamp: new Date().toISOString(),
            read: false,
            fromUser: person.personnelName,
          }, ...s.notifications],
          alerts: [{
            id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            taskId: task.id,
            taskName: task.name,
            level: 'warning' as const,
            message: `${person.personnelName}申请调整任务，原因：${reason}`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          }, ...s.alerts],
        };
      }),
      approveAdjustmentAndNotify: (taskId, personnelId, approved, comment) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;
        const person = task.assignedPersonnel.find((a) => a.personnelId === personnelId);
        if (!person) return s;
        return {
          tasks: s.tasks.map((t) => t.id === taskId ? {
            ...t,
            assignedPersonnel: t.assignedPersonnel.map((a) =>
              a.personnelId === personnelId ? {
                ...a,
                approved,
                adjustmentRequested: !approved,
                confirmed: approved ? true : a.confirmed,
              } : a
            ),
          } : t),
          notifications: [{
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'approval_result' as const,
            title: approved ? '调整申请已同意' : '调整申请已驳回',
            content: `总指挥${approved ? '同意' : '驳回'}了「${task.name}」${person.personnelName}的调整申请${comment ? '，意见：' + comment : ''}`,
            timestamp: new Date().toISOString(),
            read: false,
            fromUser: '总指挥',
          }, ...s.notifications],
        };
      }),
      confirmScheduleAndPush: () => set((s) => {
        const scheduledTasks = s.tasks.filter((t) => t.status === 'draft' || t.status === 'scheduled');
        const notifications = scheduledTasks.map((task) => ({
          id: `notif-sch-${task.id}-${Date.now()}`,
          type: 'system' as const,
          title: '排程已确认',
          content: `「${task.name}」排程已确认，计划发射时间：${new Date(task.scheduledTime).toLocaleString('zh-CN')}，工位：${task.padName}`,
          timestamp: new Date().toISOString(),
          read: false,
          fromUser: '系统',
        }));
        const updatedTasks = s.tasks.map((t) => {
          if (t.status === 'draft') return { ...t, status: 'scheduled' as const };
          return t;
        });
        const pushNotifications = updatedTasks.flatMap((t) =>
          t.assignedPersonnel
            .filter((a) => !a.confirmed && !a.adjustmentRequested)
            .map((a) => ({
              id: `notif-push-${t.id}-${a.personnelId}-${Date.now()}`,
              type: 'task_assign' as const,
              title: '任务分配通知',
              content: `您已被分配至「${t.name}」任务（${t.padName}/${t.rocketName}），计划时间：${new Date(t.scheduledTime).toLocaleString('zh-CN')}，请尽快确认`,
              timestamp: new Date().toISOString(),
              read: false,
              fromUser: '系统',
            }))
        );
        return {
          tasks: updatedTasks,
          notifications: [...notifications, ...pushNotifications, ...s.notifications],
        };
      }),
      abortTaskAndSwitch: (taskId, reason) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;
        const backupPlan = task.backupPlan || '暂无备用方案';
        return {
          tasks: s.tasks.map((t) => t.id === taskId ? {
            ...t,
            status: 'aborted' as const,
            abortReason: reason,
          } : t),
          launchPads: s.launchPads.map((p) => p.id === task.padId ? {
            ...p,
            status: 'idle' as const,
          } : p),
          alerts: [{
            id: `alert-abort-${Date.now()}`,
            taskId: task.id,
            taskName: task.name,
            level: 'emergency' as const,
            message: `任务已中止，原因：${reason}。${backupPlan}`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          }, ...s.alerts],
          notifications: [{
            id: `notif-abort-${Date.now()}`,
            type: 'alert' as const,
            title: '任务中止通知',
            content: `「${task.name}」已中止，原因：${reason}。备选方案：${backupPlan}`,
            timestamp: new Date().toISOString(),
            read: false,
            fromUser: '系统',
          }, ...s.notifications],
        };
      }),
      switchToBackupPlan: (taskId) => set((s) => {
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task) return s;

        const alternativePads = s.launchPads.filter(
          (p) => p.id !== task.padId && p.status !== 'maintenance'
        );
        const altPad = alternativePads[0];
        if (!altPad) return s;

        const altWindow = s.launchWindows.find(
          (w) => w.padId === altPad.id && w.available
        );
        const newScheduledTime = altWindow
          ? altWindow.startTime
          : new Date(Date.now() + 72 * 3600 * 1000).toISOString();
        const newPadName = altPad.name;
        const newWindowId = altWindow?.id ?? '';

        const availablePersonnel = s.personnel.filter((p) => p.status === 'available');
        const assignCommander = availablePersonnel.find((p) => p.role === 'commander');
        const assignFueler = availablePersonnel.find((p) => p.role === 'fueler');
        const assignTelemetry = availablePersonnel.find((p) => p.role === 'telemetry_op');
        const assignSafety = availablePersonnel.find((p) => p.role === 'safety_officer');

        const newAssignments = [
          assignCommander ? { personnelId: assignCommander.id, personnelName: assignCommander.name, role: 'commander' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
          assignFueler ? { personnelId: assignFueler.id, personnelName: assignFueler.name, role: 'fueler' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
          assignTelemetry ? { personnelId: assignTelemetry.id, personnelName: assignTelemetry.name, role: 'telemetry_op' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
          assignSafety ? { personnelId: assignSafety.id, personnelName: assignSafety.name, role: 'safety_officer' as const, confirmed: false, adjustmentRequested: false, adjustmentReason: '', approved: null } : null,
        ].filter(Boolean) as LaunchTask['assignedPersonnel'];

        return {
          tasks: s.tasks.map((t) => t.id === taskId ? {
            ...t,
            padId: altPad.id,
            padName: newPadName,
            windowId: newWindowId,
            scheduledTime: newScheduledTime,
            status: 'scheduled' as const,
            abortReason: '',
            backupPlan: '',
            assignedPersonnel: newAssignments,
            checklist: t.checklist.map((c) => ({ ...c, status: 'pending' as const, checkedAt: null })),
          } : t),
          launchPads: s.launchPads.map((p) => {
            if (p.id === task.padId) return { ...p, status: 'idle' as const };
            if (p.id === altPad.id) return { ...p, status: 'preparing' as const };
            return p;
          }),
          notifications: [{
            id: `notif-switch-${Date.now()}`,
            type: 'system' as const,
            title: '备用方案已激活',
            content: `「${task.name}」已切换至${newPadName}，计划发射时间：${new Date(newScheduledTime).toLocaleString('zh-CN')}`,
            timestamp: new Date().toISOString(),
            read: false,
            fromUser: '系统',
          }, ...s.notifications],
          alerts: [{
            id: `alert-switch-${Date.now()}`,
            taskId: task.id,
            taskName: task.name,
            level: 'info' as const,
            message: `任务已切换至${newPadName}，新计划时间：${new Date(newScheduledTime).toLocaleString('zh-CN')}`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
          }, ...s.alerts],
        };
      }),
      addMaintenanceOrder: (order) => set((s) => ({ maintenanceOrders: [...s.maintenanceOrders, order] })),
      updateMaintenanceOrder: (id, data) => set((s) => ({
        maintenanceOrders: s.maintenanceOrders.map((m) => m.id === id ? { ...m, ...data } : m),
      })),
      useSparePart: (partId, quantity) => set((s) => ({
        spareParts: s.spareParts.map((sp) =>
          sp.id === partId ? { ...sp, quantity: Math.max(0, sp.quantity - quantity) } : sp
        ),
      })),
      addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
      acknowledgeAlert: (id) => set((s) => ({
        alerts: s.alerts.map((a) => a.id === id ? { ...a, acknowledged: true } : a),
      })),
      addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
      markNotificationRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      })),
    }),
    { name: 'space-launch-system' }
  )
);

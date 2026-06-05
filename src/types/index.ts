export interface LaunchPad {
  id: string;
  name: string;
  code: string;
  type: 'liquid' | 'solid' | 'mixed';
  status: 'idle' | 'preparing' | 'occupied' | 'maintenance';
  lastLaunchTime: string | null;
  transitionDays: number;
  coolingPeriod: number;
  equipment: string[];
  position: { x: number; y: number };
  totalLaunches: number;
}

export interface RocketModel {
  id: string;
  name: string;
  code: string;
  propellantType: string;
  leoCapacity: number;
  gtoCapacity: number;
  totalLaunches: number;
  successRate: number;
  fuelingDuration: number;
  stages: number;
  height: number;
  diameter: number;
}

export interface Payload {
  id: string;
  name: string;
  type: 'satellite' | 'manned' | 'cargo' | 'deep_space';
  mass: number;
  organization: string;
  orbitType: string;
  specialRequirements: string;
}

export interface LaunchWindow {
  id: string;
  padId: string;
  padName: string;
  startTime: string;
  endTime: string;
  weatherScore: number;
  available: boolean;
  constraints: string[];
}

export interface Personnel {
  id: string;
  name: string;
  role: 'commander' | 'fueler' | 'telemetry_op' | 'safety_officer' | 'maintenance' | 'admin';
  team: string;
  phone: string;
  status: 'available' | 'assigned' | 'offline';
}

export interface TaskAssignment {
  personnelId: string;
  personnelName: string;
  role: 'commander' | 'fueler' | 'telemetry_op' | 'safety_officer';
  confirmed: boolean;
  adjustmentRequested: boolean;
  adjustmentReason: string;
  approved: boolean | null;
}

export interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'passed' | 'failed';
  checkedAt: string | null;
}

export interface TelemetryRecord {
  timestamp: string;
  thrust: number;
  velocity: number;
  altitude: number;
  downrange: number;
  temperature: number;
  pressure: number;
}

export interface LaunchTask {
  id: string;
  name: string;
  padId: string;
  padName: string;
  rocketId: string;
  rocketName: string;
  payloadId: string;
  payloadName: string;
  windowId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'scheduled' | 'preparing' | 'fueling' | 'launch' | 'flight' | 'reentry' | 'completed' | 'aborted';
  scheduledTime: string;
  assignedPersonnel: TaskAssignment[];
  checklist: ChecklistItem[];
  telemetryData: TelemetryRecord[];
  backupPlan: string;
  abortReason: string;
}

export interface ScheduleItem {
  id: string;
  taskId: string;
  taskName: string;
  padId: string;
  padName: string;
  startTime: string;
  endTime: string;
  transitionDays: number;
  coolingDays: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  conflicts: ScheduleConflict[];
}

export interface ScheduleConflict {
  type: 'pad' | 'equipment' | 'weather' | 'personnel';
  message: string;
  severity: 'warning' | 'error';
}

export interface MaintenanceOrder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'routine' | 'corrective' | 'overhaul';
  reason: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedTeam: string;
  partsUsed: PartUsage[];
  createdAt: string;
  completedAt: string | null;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  actualHours: number;
}

export interface PartUsage {
  partId: string;
  partName: string;
  quantity: number;
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  quantity: number;
  safetyStock: number;
  unitPrice: number;
  location: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'fueling' | 'telemetry' | 'transport' | 'support';
  status: 'online' | 'offline' | 'maintenance';
  totalRunHours: number;
  launchCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  position: { x: number; y: number };
  temperature: number;
}

export interface Alert {
  id: string;
  taskId: string;
  taskName: string;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface Notification {
  id: string;
  type: 'task_assign' | 'approval_request' | 'approval_result' | 'alert' | 'system';
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
  fromUser: string;
}

export type TaskStatus = LaunchTask['status'];
export type PadStatus = LaunchPad['status'];
export type Priority = LaunchTask['priority'];
export type AlertLevel = Alert['level'];

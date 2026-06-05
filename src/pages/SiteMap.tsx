import { useState, useMemo } from 'react';
import {
  MapPin, Thermometer, X, Fuel, Wrench, Eye, EyeOff,
  Rocket, ChevronRight, Crosshair, LayoutGrid, Radio,
} from 'lucide-react';
import { useStore } from '@/store';
import type { LaunchPad, Equipment } from '@/types';

const VB_W = 800;
const VB_H = 600;
const toX = (v: number) => v * (VB_W / 100);
const toY = (v: number) => v * (VB_H / 100);

const PAD_STATUS_COLOR: Record<string, string> = {
  idle: '#00D4FF',
  preparing: '#FFD600',
  occupied: '#FF6B35',
  maintenance: '#7B61FF',
};

const PAD_STATUS_LABEL: Record<string, string> = {
  idle: '空闲',
  preparing: '准备中',
  occupied: '占用中',
  maintenance: '维护中',
};

const EQUIP_CAT_LABEL: Record<string, string> = {
  fueling: '加注设备',
  telemetry: '测控设备',
  transport: '运输设备',
  support: '支撑设备',
};

const HEAT_SCALE = [
  { color: '#00D4FF', label: '<35°C 冷却' },
  { color: '#FFD600', label: '35-50°C 温暖' },
  { color: '#FF6B35', label: '50-65°C 高温' },
  { color: '#FF3B3B', label: '>65°C 危险' },
];

function getHeatColor(temp: number): string {
  if (temp < 35) return '#00D4FF';
  if (temp < 50) return '#FFD600';
  if (temp < 65) return '#FF6B35';
  return '#FF3B3B';
}

function getHeatOpacity(temp: number): number {
  return Math.min(0.75, 0.25 + (temp / 100) * 0.5);
}

function getHeatRadius(temp: number): number {
  return 10 + (temp / 100) * 20;
}

interface StructureDef {
  name: string;
  x1: number; y1: number; x2: number; y2: number;
  color: string;
}

const STRUCTURES: StructureDef[] = [
  { name: '总装厂房', x1: 30, y1: 10, x2: 45, y2: 20, color: '#00D4FF' },
  { name: '指控中心', x1: 50, y1: 8, x2: 65, y2: 18, color: '#00E676' },
  { name: '加注站', x1: 10, y1: 35, x2: 20, y2: 45, color: '#FF6B35' },
  { name: '测控站A', x1: 10, y1: 15, x2: 18, y2: 22, color: '#7B61FF' },
  { name: '测控站B', x1: 80, y1: 20, x2: 90, y2: 28, color: '#7B61FF' },
  { name: '燃料库', x1: 75, y1: 45, x2: 85, y2: 52, color: '#FF3B3B' },
  { name: '维修车间', x1: 40, y1: 80, x2: 50, y2: 88, color: '#FFD600' },
];

const ROADS: number[][][] = [
  [[14, 18.5], [30, 15], [37.5, 15], [50, 15], [57.5, 13], [70, 18], [85, 24]],
  [[15, 35], [14, 22]],
  [[37.5, 20], [40, 35], [45, 50], [45, 80]],
  [[20, 40], [35, 42], [55, 45], [75, 48.5]],
  [[57.5, 18], [57, 35], [55, 45]],
  [[45, 50], [35, 55], [25, 65]],
  [[45, 50], [55, 55], [65, 60]],
];

export default function SiteMap() {
  const launchPads = useStore((s) => s.launchPads);
  const equipment = useStore((s) => s.equipment);
  const tasks = useStore((s) => s.tasks);
  const maintenanceOrders = useStore((s) => s.maintenanceOrders);

  const [selectedPad, setSelectedPad] = useState<LaunchPad | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<Equipment | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [popupPadId, setPopupPadId] = useState<string | null>(null);

  const padTasks = useMemo(() => {
    if (!selectedPad) return [];
    return tasks.filter((t) => t.padId === selectedPad.id);
  }, [selectedPad, tasks]);

  const padMaintenance = useMemo(() => {
    if (!selectedPad) return [];
    return maintenanceOrders.filter((m) => selectedPad.equipment.includes(m.equipmentId));
  }, [selectedPad, maintenanceOrders]);

  const padEquipList = useMemo(() => {
    if (!selectedPad) return [];
    return equipment.filter((e) => selectedPad.equipment.includes(e.id));
  }, [selectedPad, equipment]);

  const popupPad = useMemo(() => {
    if (!popupPadId) return null;
    return launchPads.find((p) => p.id === popupPadId) ?? null;
  }, [popupPadId, launchPads]);

  const handlePadClick = (pad: LaunchPad) => {
    setSelectedPad(pad);
    setSelectedEquip(null);
    setPopupPadId(pad.id);
  };

  const handleEquipClick = (eq: Equipment) => {
    setSelectedEquip(eq);
    setSelectedPad(null);
    setPopupPadId(null);
  };

  const handleClearSelection = () => {
    setSelectedPad(null);
    setSelectedEquip(null);
    setPopupPadId(null);
  };

  const renderPopup = () => {
    if (!popupPad) return null;
    const px = toX(popupPad.position.x);
    const py = toY(popupPad.position.y);
    const popW = 170;
    const popH = 90;
    const popX = px + 30 + popW > VB_W ? px - 30 - popW : px + 30;
    const popY = Math.max(10, Math.min(py - 30, VB_H - popH - 10));
    const color = PAD_STATUS_COLOR[popupPad.status];
    return (
      <g>
        <rect x={popX} y={popY} width={popW} height={popH} fill="#0F1F3A" stroke={color} strokeWidth={1} rx={6} opacity={0.95} />
        <text x={popX + 10} y={popY + 18} fill={color} fontSize={12} fontFamily="'Noto Sans SC', sans-serif" fontWeight={700}>{popupPad.name}</text>
        <text x={popX + 10} y={popY + 34} fill="#94A3B8" fontSize={9} fontFamily="monospace">{popupPad.code}</text>
        <text x={popX + 10} y={popY + 50} fill="#CBD5E1" fontSize={9} fontFamily="'Noto Sans SC', sans-serif">状态: {PAD_STATUS_LABEL[popupPad.status]}</text>
        <text x={popX + 10} y={popY + 66} fill="#CBD5E1" fontSize={9} fontFamily="'Noto Sans SC', sans-serif">类型: {popupPad.type === 'liquid' ? '液体' : popupPad.type === 'solid' ? '固体' : '混合'}</text>
        <text x={popX + 10} y={popY + 80} fill="#CBD5E1" fontSize={9} fontFamily="'Noto Sans SC', sans-serif">发射: <tspan fontFamily="monospace" fill="white">{popupPad.totalLaunches}</tspan> 次</text>
        <g onClick={() => setPopupPadId(null)} style={{ cursor: 'pointer' }}>
          <rect x={popX + popW - 22} y={popY + 5} width={16} height={16} rx={3} fill="#1E293B" opacity={0.8} />
          <line x1={popX + popW - 17} y1={popY + 10} x2={popX + popW - 11} y2={popY + 16} stroke="#64748B" strokeWidth={1.5} />
          <line x1={popX + popW - 11} y1={popY + 10} x2={popX + popW - 17} y2={popY + 16} stroke="#64748B" strokeWidth={1.5} />
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">场区可视化地图</h1>
        <button
          onClick={() => setShowHeatMap(!showHeatMap)}
          className={`btn-primary flex items-center gap-2 ${showHeatMap ? '!bg-cyber-orange/20 !text-cyber-orange !border-cyber-orange/30 hover:!bg-cyber-orange/30' : ''}`}
        >
          {showHeatMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showHeatMap ? '隐藏热力图' : '显示热力图'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 glass-card glow-border p-4 overflow-hidden">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" style={{ minHeight: 400 }}>
            <rect x={0} y={0} width={VB_W} height={VB_H} fill="#0F1F3A" rx={8} onClick={handleClearSelection} />

            {Array.from({ length: 11 }, (_, i) => (
              <line key={`vg${i}`} x1={i * 80} y1={0} x2={i * 80} y2={VB_H} stroke="#1A2D4D" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`hg${i}`} x1={0} y1={i * 100} x2={VB_W} y2={i * 100} stroke="#1A2D4D" strokeWidth={0.5} />
            ))}

            {ROADS.map((road, i) => {
              const pts = road.map(([x, y]) => `${toX(x)},${toY(y)}`).join(' ');
              return <polyline key={`rd${i}`} points={pts} fill="none" stroke="#2A3F5F" strokeWidth={2} opacity={0.6} />;
            })}

            {STRUCTURES.map((s) => {
              const rx = toX(s.x1), ry = toY(s.y1);
              const rw = toX(s.x2) - rx, rh = toY(s.y2) - ry;
              return (
                <g key={s.name}>
                  <rect x={rx} y={ry} width={rw} height={rh} fill={`${s.color}15`} stroke={s.color} strokeWidth={1.5} rx={4} />
                  <text x={rx + rw / 2} y={ry + rh / 2} textAnchor="middle" dominantBaseline="middle" fill={s.color} fontSize={11} fontFamily="'Noto Sans SC', sans-serif" fontWeight={600}>{s.name}</text>
                </g>
              );
            })}

            {showHeatMap && equipment.map((eq) => {
              const cx = toX(eq.position.x), cy = toY(eq.position.y);
              const color = getHeatColor(eq.temperature);
              const opacity = getHeatOpacity(eq.temperature);
              const radius = getHeatRadius(eq.temperature);
              return (
                <g key={`ht${eq.id}`} style={{ cursor: 'pointer' }} onClick={() => handleEquipClick(eq)}>
                  <circle cx={cx} cy={cy} r={radius} fill={color} opacity={opacity * 0.4} />
                  <circle cx={cx} cy={cy} r={radius * 0.5} fill={color} opacity={opacity * 0.7} />
                </g>
              );
            })}

            {launchPads.map((pad) => {
              const cx = toX(pad.position.x), cy = toY(pad.position.y);
              const color = PAD_STATUS_COLOR[pad.status];
              const isActive = pad.status === 'occupied' || pad.status === 'preparing';
              const isSelected = selectedPad?.id === pad.id;
              return (
                <g key={pad.id} style={{ cursor: 'pointer' }} onClick={() => handlePadClick(pad)}>
                  {isActive && (
                    <circle cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={2}>
                      <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isSelected && <circle cx={cx} cy={cy} r={28} fill="none" stroke="#00E676" strokeWidth={2} strokeDasharray="4,3" />}
                  <circle cx={cx} cy={cy} r={14} fill={`${color}30`} stroke={color} strokeWidth={2} />
                  <circle cx={cx} cy={cy} r={4} fill={color}>
                    {isActive && <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />}
                  </circle>
                  <text x={cx} y={cy - 22} textAnchor="middle" fill={color} fontSize={10} fontFamily="'Noto Sans SC', sans-serif" fontWeight={700}>{pad.name}</text>
                  <text x={cx} y={cy + 28} textAnchor="middle" fill="#94A3B8" fontSize={8} fontFamily="monospace">{pad.code}</text>
                </g>
              );
            })}

            {renderPopup()}
          </svg>
        </div>

        <div className="space-y-4">
          <div className="glass-card glow-border p-4 min-h-[280px]">
            <h2 className="section-title mb-3 flex items-center gap-2 text-sm">
              <Crosshair className="w-4 h-4" />
              {selectedPad ? '工位详情' : selectedEquip ? '设备详情' : '选择查看详情'}
            </h2>

            {selectedPad && (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold text-lg">{selectedPad.name}</p>
                    <p className="text-slate-400 font-mono text-sm">{selectedPad.code}</p>
                  </div>
                  <button onClick={handleClearSelection} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: PAD_STATUS_COLOR[selectedPad.status] }} />
                  <span className="text-sm" style={{ color: PAD_STATUS_COLOR[selectedPad.status] }}>{PAD_STATUS_LABEL[selectedPad.status]}</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>类型: {selectedPad.type === 'liquid' ? '液体' : selectedPad.type === 'solid' ? '固体' : '混合'}</p>
                  <p>总发射: <span className="font-mono text-white">{selectedPad.totalLaunches}</span> 次</p>
                  <p>转换周期: <span className="font-mono text-white">{selectedPad.transitionDays}</span> 天</p>
                  <p>冷却周期: <span className="font-mono text-white">{selectedPad.coolingPeriod}</span> 天</p>
                </div>
                {padEquipList.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">关联设备</p>
                    <div className="space-y-1">
                      {padEquipList.map((eq) => (
                        <div key={eq.id} className="text-xs bg-space-700/30 rounded px-2 py-1 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${eq.status === 'online' ? 'bg-cyber-green' : eq.status === 'maintenance' ? 'bg-cyber-yellow' : 'bg-cyber-red'}`} />
                          <span className="text-slate-300 truncate flex-1">{eq.name}</span>
                          <span className="text-slate-500 font-mono">{eq.temperature}°C</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {padTasks.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">关联任务</p>
                    {padTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="text-xs bg-space-700/30 rounded px-2 py-1 mb-1 flex items-center gap-1">
                        <Rocket className="w-3 h-3 text-cyber-blue flex-shrink-0" />
                        <span className="text-slate-300 truncate">{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {padMaintenance.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">维保工单</p>
                    {padMaintenance.slice(0, 3).map((m) => (
                      <div key={m.id} className="text-xs bg-space-700/30 rounded px-2 py-1 mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-cyber-yellow flex-shrink-0" />
                        <span className="text-slate-300 truncate">{m.equipmentName}</span>
                        <span className="ml-auto text-slate-500 flex-shrink-0">{m.status === 'in_progress' ? '进行中' : m.status === 'assigned' ? '已指派' : '待处理'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedEquip && (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{selectedEquip.name}</p>
                    <p className="text-slate-400 text-xs">{EQUIP_CAT_LABEL[selectedEquip.category]}</p>
                  </div>
                  <button onClick={handleClearSelection} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedEquip.status === 'online' ? 'bg-cyber-green' : selectedEquip.status === 'maintenance' ? 'bg-cyber-yellow' : 'bg-cyber-red'}`} />
                  <span className={`text-sm ${selectedEquip.status === 'online' ? 'text-cyber-green' : selectedEquip.status === 'maintenance' ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
                    {selectedEquip.status === 'online' ? '在线' : selectedEquip.status === 'maintenance' ? '维护中' : '离线'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3" style={{ color: getHeatColor(selectedEquip.temperature) }} />
                    <span>温度: <span className="font-mono text-white">{selectedEquip.temperature}°C</span></span>
                  </div>
                  <p>运行: <span className="font-mono text-white">{selectedEquip.totalRunHours}</span> 小时</p>
                  <p>发射: <span className="font-mono text-white">{selectedEquip.launchCount}</span> 次</p>
                  <p>上次维保: <span className="font-mono text-white">{selectedEquip.lastMaintenance}</span></p>
                  <p>下次维保: <span className="font-mono text-white">{selectedEquip.nextMaintenance}</span></p>
                </div>
              </div>
            )}

            {!selectedPad && !selectedEquip && (
              <div className="text-center text-slate-500 text-sm py-8">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>点击地图上的工位或设备</p>
                <p>查看详细信息</p>
              </div>
            )}
          </div>

          <div className="glass-card glow-border p-4">
            <h2 className="section-title mb-3 flex items-center gap-2 text-sm">
              <Rocket className="w-4 h-4" />
              全部工位
            </h2>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {launchPads.map((pad) => (
                <div
                  key={pad.id}
                  onClick={() => handlePadClick(pad)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-space-700/50 ${selectedPad?.id === pad.id ? 'bg-space-700/60 border border-cyber-blue/20' : ''}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PAD_STATUS_COLOR[pad.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{pad.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{pad.code}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card glow-border p-4">
        <h2 className="section-title mb-3 flex items-center gap-2 text-sm">
          <LayoutGrid className="w-4 h-4" />
          图例
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-2">工位状态</p>
            <div className="space-y-1.5">
              {Object.entries(PAD_STATUS_LABEL).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PAD_STATUS_COLOR[key] }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">温度等级</p>
            <div className="space-y-1.5">
              {HEAT_SCALE.map((item) => (
                <div key={item.color} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.7 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">设施类型</p>
            <div className="space-y-1.5">
              {STRUCTURES.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3.5 h-2.5 rounded-sm flex-shrink-0 border" style={{ backgroundColor: `${s.color}15`, borderColor: s.color }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

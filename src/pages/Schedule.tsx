import { useState, useMemo } from 'react';
import {
  CalendarClock, AlertTriangle, AlertCircle, CheckCircle2,
  SlidersHorizontal, Zap, Thermometer, CloudSun, Play, Shield
} from 'lucide-react';
import { useStore } from '@/store';
import type { ScheduleItem, ScheduleConflict } from '@/types';

const PRIORITY_COLORS: Record<string, { bar: string; bg: string; text: string; border: string }> = {
  critical: { bar: '#FF3B3B', bg: 'rgba(255,59,59,0.25)', text: 'text-cyber-red', border: 'border-cyber-red/40' },
  high: { bar: '#FF6B35', bg: 'rgba(255,107,53,0.25)', text: 'text-cyber-orange', border: 'border-cyber-orange/40' },
  medium: { bar: '#00D4FF', bg: 'rgba(0,212,255,0.25)', text: 'text-cyber-blue', border: 'border-cyber-blue/40' },
  low: { bar: '#00E676', bg: 'rgba(0,230,118,0.25)', text: 'text-cyber-green', border: 'border-cyber-green/40' },
};

const DAY_WIDTH = 60;
const ROW_HEIGHT = 56;
const PAD_LABEL_WIDTH = 100;
const HEADER_HEIGHT = 40;

interface ConstraintToggle {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const constraints: ConstraintToggle[] = [
  { key: 'transition', label: '工位转换时间≥7天', icon: <Zap className="w-4 h-4" />, description: '同一工位两次发射间需至少7天转换时间' },
  { key: 'cooling', label: '设备冷却复检周期', icon: <Thermometer className="w-4 h-4" />, description: '发射后设备需冷却并复检后方可再次使用' },
  { key: 'weather', label: '气象约束', icon: <CloudSun className="w-4 h-4" />, description: '排程需满足气象窗口约束条件' },
];

interface PriorityWeight {
  key: string;
  label: string;
  color: string;
}

const priorityWeights: PriorityWeight[] = [
  { key: 'critical', label: '紧急任务', color: 'cyber-red' },
  { key: 'high', label: '高优先级', color: 'cyber-orange' },
  { key: 'medium', label: '中优先级', color: 'cyber-blue' },
  { key: 'low', label: '低优先级', color: 'cyber-green' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
        checked ? 'bg-cyber-blue/40 shadow-[0_0_8px_rgba(0,212,255,0.3)]' : 'bg-space-600/60'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
          checked ? 'translate-x-5 bg-cyber-blue' : 'bg-slate-500'
        }`}
      />
    </button>
  );
}

function GanttChart({ items, pads }: { items: ScheduleItem[]; pads: { id: string; name: string }[] }) {
  const chartData = useMemo(() => {
    if (items.length === 0) return null;

    const allDates = items.flatMap((item) => {
      const start = new Date(item.startTime);
      const end = new Date(item.endTime);
      const coolEnd = new Date(end);
      coolEnd.setDate(coolEnd.getDate() + item.coolingDays);
      return [start, end, coolEnd];
    });

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 2);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayOffset = (dateStr: string) => {
      const d = new Date(dateStr);
      return Math.round((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    const days: Date[] = [];
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    const padItems: Record<string, ScheduleItem[]> = {};
    for (const item of items) {
      if (!padItems[item.padId]) padItems[item.padId] = [];
      padItems[item.padId].push(item);
    }
    for (const key of Object.keys(padItems)) {
      padItems[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    const uniquePads = pads.length > 0 ? pads : items.map((i) => ({ id: i.padId, name: i.padName }));
    const seen = new Set<string>();
    const orderedPads = uniquePads.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return { minDate, maxDate, totalDays, days, padItems, orderedPads, dayOffset };
  }, [items, pads]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <CalendarClock className="w-8 h-8 mr-3 opacity-40" />
        <span>暂无排程数据，请配置参数后生成排程</span>
      </div>
    );
  }

  const { totalDays, days, padItems, orderedPads, dayOffset } = chartData;
  const chartWidth = PAD_LABEL_WIDTH + totalDays * DAY_WIDTH;
  const chartHeight = HEADER_HEIGHT + orderedPads.length * ROW_HEIGHT;

  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="select-none">
        <defs>
          <pattern id="hatch-pattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,214,0,0.35)" strokeWidth="2" />
          </pattern>
          <pattern id="cooling-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="rgba(0,212,255,0.06)" />
            <circle cx="2" cy="2" r="0.5" fill="rgba(0,212,255,0.15)" />
          </pattern>
        </defs>

        <rect x={PAD_LABEL_WIDTH} y={HEADER_HEIGHT} width={totalDays * DAY_WIDTH} height={orderedPads.length * ROW_HEIGHT} fill="transparent" />

        {days.map((d, i) => {
          const x = PAD_LABEL_WIDTH + i * DAY_WIDTH;
          const isWkend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <g key={i}>
              {isWkend && (
                <rect x={x} y={HEADER_HEIGHT} width={DAY_WIDTH} height={orderedPads.length * ROW_HEIGHT} fill="rgba(255,255,255,0.02)" />
              )}
              {isToday(d) && (
                <rect x={x} y={HEADER_HEIGHT} width={DAY_WIDTH} height={orderedPads.length * ROW_HEIGHT} fill="rgba(0,212,255,0.06)" />
              )}
              <line x1={x} y1={HEADER_HEIGHT} x2={x} y2={chartHeight} stroke="rgba(0,212,255,0.07)" strokeWidth="1" />
            </g>
          );
        })}

        {orderedPads.map((pad, rowIdx) => {
          const y = HEADER_HEIGHT + rowIdx * ROW_HEIGHT;
          return (
            <g key={pad.id}>
              <line x1={PAD_LABEL_WIDTH} y1={y + ROW_HEIGHT} x2={chartWidth} y2={y + ROW_HEIGHT} stroke="rgba(0,212,255,0.07)" strokeWidth="1" />
              <text x={PAD_LABEL_WIDTH - 12} y={y + ROW_HEIGHT / 2 + 4} textAnchor="end" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono, monospace">
                {pad.name}
              </text>
            </g>
          );
        })}

        {days.map((d, i) => {
          const x = PAD_LABEL_WIDTH + i * DAY_WIDTH;
          const showLabel = i === 0 || d.getDate() === 1 || i % 2 === 0;
          if (!showLabel) return null;
          return (
            <text key={i} x={x + DAY_WIDTH / 2} y={HEADER_HEIGHT - 10} textAnchor="middle" fill={isToday(d) ? '#00D4FF' : '#64748B'} fontSize="11" fontFamily="JetBrains Mono, monospace">
              {formatDate(d)}
            </text>
          );
        })}

        {orderedPads.map((pad, rowIdx) => {
          const padSchedule = padItems[pad.id] || [];
          const rowY = HEADER_HEIGHT + rowIdx * ROW_HEIGHT;

          return (
            <g key={`items-${pad.id}`}>
              {padSchedule.map((item, idx) => {
                const startOff = dayOffset(item.startTime);
                const endOff = dayOffset(item.endTime);
                const barX = PAD_LABEL_WIDTH + startOff * DAY_WIDTH;
                const barW = Math.max((endOff - startOff) * DAY_WIDTH, DAY_WIDTH * 0.5);
                const barY = rowY + 10;
                const barH = ROW_HEIGHT - 20;
                const color = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
                const hasConflict = item.conflicts && item.conflicts.length > 0;

                const transitionEl = idx > 0 ? (() => {
                  const prevItem = padSchedule[idx - 1];
                  const prevEndOff = dayOffset(prevItem.endTime);
                  const transStartX = PAD_LABEL_WIDTH + prevEndOff * DAY_WIDTH;
                  const transW = barX - transStartX;
                  if (transW > 0) {
                    return (
                      <rect key={`trans-${item.id}`} x={transStartX} y={barY} width={transW} height={barH} fill="url(#hatch-pattern)" rx="3" />
                    );
                  }
                  return null;
                })() : null;

                const coolingDays = item.coolingDays || 0;
                const coolingEl = coolingDays > 0 ? (() => {
                  const coolX = PAD_LABEL_WIDTH + endOff * DAY_WIDTH;
                  const coolW = coolingDays * DAY_WIDTH;
                  return (
                    <rect key={`cool-${item.id}`} x={coolX} y={barY} width={coolW} height={barH} fill="url(#cooling-pattern)" rx="3" stroke="rgba(0,212,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
                  );
                })() : null;

                return (
                  <g key={item.id}>
                    {transitionEl}
                    {coolingEl}
                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={barH}
                      fill={color.bg}
                      stroke={color.bar}
                      strokeWidth={hasConflict ? 2 : 1}
                      rx="4"
                      strokeDasharray={hasConflict ? '4,2' : 'none'}
                    />
                    {barW > 80 && (
                      <text
                        x={barX + barW / 2}
                        y={barY + barH / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={color.bar}
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="Noto Sans SC, sans-serif"
                      >
                        {item.taskName.length > Math.floor(barW / 8) ? item.taskName.slice(0, Math.floor(barW / 8)) + '…' : item.taskName}
                      </text>
                    )}
                    {hasConflict && (
                      <circle cx={barX + barW - 6} cy={barY + 6} r="4" fill="#FF3B3B" stroke="#0F1F3A" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {(() => {
          const now = new Date();
          const todayOff = Math.round((now.getTime() - chartData.minDate.getTime()) / (1000 * 60 * 60 * 24));
          if (todayOff >= 0 && todayOff <= totalDays) {
            const x = PAD_LABEL_WIDTH + todayOff * DAY_WIDTH + DAY_WIDTH / 2;
            return (
              <g>
                <line x1={x} y1={HEADER_HEIGHT} x2={x} y2={chartHeight} stroke="#00D4FF" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6" />
                <text x={x} y={HEADER_HEIGHT - 22} textAnchor="middle" fill="#00D4FF" fontSize="10" fontFamily="JetBrains Mono, monospace">今日</text>
              </g>
            );
          }
          return null;
        })()}
      </svg>
    </div>
  );
}

function ConflictPanel({ conflicts }: { conflicts: (ScheduleConflict & { taskName: string })[] }) {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 px-4 text-cyber-green/70">
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-sm">当前排程无冲突，所有约束条件均已满足</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((c, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            c.severity === 'error'
              ? 'bg-cyber-red/10 border-cyber-red/20'
              : 'bg-cyber-yellow/10 border-cyber-yellow/20'
          }`}
        >
          {c.severity === 'error' ? (
            <AlertCircle className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-cyber-yellow flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                c.type === 'pad' ? 'bg-cyber-orange/20 text-cyber-orange' :
                c.type === 'equipment' ? 'bg-cyber-purple/20 text-cyber-purple' :
                c.type === 'weather' ? 'bg-cyber-blue/20 text-cyber-blue' :
                'bg-space-600/50 text-slate-400'
              }`}>
                {c.type === 'pad' ? '工位冲突' : c.type === 'equipment' ? '设备冲突' : c.type === 'weather' ? '气象约束' : '人员冲突'}
              </span>
              <span className="text-xs text-slate-500">{c.taskName}</span>
            </div>
            <p className={`text-sm ${c.severity === 'error' ? 'text-cyber-red/80' : 'text-cyber-yellow/80'}`}>
              {c.message}
            </p>
          </div>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
            c.severity === 'error' ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-yellow/20 text-cyber-yellow'
          }`}>
            {c.severity === 'error' ? 'ERROR' : 'WARN'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Schedule() {
  const scheduleItems = useStore((s) => s.scheduleItems);
  const launchPads = useStore((s) => s.launchPads);

  const [constraintToggles, setConstraintToggles] = useState<Record<string, boolean>>({
    transition: true,
    cooling: true,
    weather: true,
  });

  const [weights, setWeights] = useState<Record<string, number>>({
    critical: 9,
    high: 7,
    medium: 5,
    low: 3,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const allConflicts = useMemo(() => {
    const result: (ScheduleConflict & { taskName: string })[] = [];
    for (const item of scheduleItems) {
      for (const conflict of item.conflicts) {
        result.push({ ...conflict, taskName: item.taskName });
      }
    }
    result.sort((a, b) => (a.severity === 'error' ? -1 : 1) - (b.severity === 'error' ? -1 : 1));
    return result;
  }, [scheduleItems]);

  const pads = useMemo(() => launchPads.map((p) => ({ id: p.id, name: p.name })), [launchPads]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsConfirmed(false);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  const errorCount = allConflicts.filter((c) => c.severity === 'error').length;
  const warnCount = allConflicts.filter((c) => c.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <CalendarClock className="w-7 h-7 text-cyber-blue" />
            智能排程调度
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-10">基于约束条件与优先级权重的自动排程生成与冲突检测</p>
        </div>
        {isConfirmed && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-green/15 border border-cyber-green/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-cyber-green" />
            <span className="text-sm text-cyber-green font-medium">排程已确认</span>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="glass-card p-4 space-y-4">
            <h2 className="section-title flex items-center gap-2 text-base">
              <SlidersHorizontal className="w-4 h-4" />
              排程参数
            </h2>

            <div className="space-y-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">约束条件</span>
              {constraints.map((c) => (
                <div key={c.key} className="flex items-start gap-3 p-2.5 rounded-lg bg-space-700/30 border border-space-600/30">
                  <div className="text-cyber-blue/70 mt-0.5">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{c.label}</span>
                      <Toggle
                        checked={constraintToggles[c.key]}
                        onChange={(v) => setConstraintToggles((prev) => ({ ...prev, [c.key]: v }))}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-space-600/30 pt-3 space-y-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">优先级权重</span>
              {priorityWeights.map((pw) => (
                <div key={pw.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm text-${pw.color}`}>{pw.label}</span>
                    <span className="text-xs font-mono text-slate-400">{weights[pw.key]}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights[pw.key]}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [pw.key]: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-space-600/50 rounded-lg appearance-none cursor-pointer accent-cyber-blue"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? '生成中...' : '生成排程'}
            </button>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">排程统计</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">排程任务数</span>
                <span className="font-mono text-slate-300">{scheduleItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">涉及工位数</span>
                <span className="font-mono text-slate-300">{new Set(scheduleItems.map((s) => s.padId)).size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">冲突总数</span>
                <span className={`font-mono ${errorCount > 0 ? 'text-cyber-red' : warnCount > 0 ? 'text-cyber-yellow' : 'text-cyber-green'}`}>
                  {allConflicts.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">严重冲突</span>
                <span className={`font-mono ${errorCount > 0 ? 'text-cyber-red' : 'text-slate-400'}`}>{errorCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">警告</span>
                <span className={`font-mono ${warnCount > 0 ? 'text-cyber-yellow' : 'text-slate-400'}`}>{warnCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="glass-card glow-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2 text-base">
                甘特图视图
              </h2>
              <div className="flex items-center gap-4 text-xs">
                {Object.entries(PRIORITY_COLORS).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.bar }} />
                    <span className="text-slate-400">
                      {key === 'critical' ? '紧急' : key === 'high' ? '高' : key === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,214,0,0.35) 2px, rgba(255,214,0,0.35) 4px)' }} />
                  <span className="text-slate-400">转换期</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-cyber-blue/20" style={{ backgroundColor: 'rgba(0,212,255,0.06)' }} />
                  <span className="text-slate-400">冷却期</span>
                </div>
              </div>
            </div>
            <GanttChart items={scheduleItems} pads={pads} />
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4" />
                冲突检测
                {allConflicts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-cyber-red/20 text-cyber-red border border-cyber-red/30 rounded-full font-mono">
                    {allConflicts.length}
                  </span>
                )}
              </h2>
            </div>
            <ConflictPanel conflicts={allConflicts} />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={isConfirmed || scheduleItems.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isConfirmed
                  ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30 cursor-default'
                  : scheduleItems.length === 0
                  ? 'bg-space-700/50 text-slate-600 border border-space-600/30 cursor-not-allowed'
                  : 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30 hover:bg-cyber-green/30 hover:shadow-[0_0_12px_rgba(0,230,118,0.3)]'
              }`}
            >
              <Shield className="w-4 h-4" />
              {isConfirmed ? '排程已确认' : '确认排程'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

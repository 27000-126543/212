import { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from 'recharts';
import {
  BarChart3, TrendingUp, Clock, Users, Download,
  Rocket, Filter, Activity,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useStore } from '@/store';

type TimeRange = 'month' | 'quarter' | 'year' | 'custom';

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
  { key: 'custom', label: '自定义' },
];

const FAULT_CATEGORIES = ['推进系统', '测控系统', '加注系统', '结构系统', '电气系统'];
const FAULT_COLORS = ['#00D4FF', '#00E676', '#FF6B35', '#7B61FF', '#FFD600'];

function getRateColor(rate: number) {
  if (rate > 95) return '#00E676';
  if (rate >= 90) return '#FFD600';
  return '#FF3B3B';
}

function getRateTextClass(rate: number) {
  if (rate > 95) return 'text-cyber-green';
  if (rate >= 90) return 'text-cyber-yellow';
  return 'text-cyber-red';
}

export default function Statistics() {
  const tasks = useStore((s) => s.tasks);
  const rocketModels = useStore((s) => s.rocketModels);
  const maintenanceOrders = useStore((s) => s.maintenanceOrders);
  const personnel = useStore((s) => s.personnel);

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedRocket, setSelectedRocket] = useState<string>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  const totalLaunches = useMemo(() => {
    return rocketModels.reduce((sum, r) => sum + r.totalLaunches, 0);
  }, [rocketModels]);

  const overallSuccessRate = useMemo(() => {
    const total = rocketModels.reduce((sum, r) => sum + r.totalLaunches, 0);
    if (total === 0) return 0;
    const weighted = rocketModels.reduce((sum, r) => sum + r.totalLaunches * r.successRate, 0);
    return Math.round((weighted / total) * 10) / 10;
  }, [rocketModels]);

  const avgFaultInterval = useMemo(() => {
    const completedOrders = maintenanceOrders.filter((o) => o.status === 'completed');
    if (completedOrders.length === 0) return 0;
    const totalHours = completedOrders.reduce((sum, o) => sum + o.actualHours, 0);
    return Math.round(totalHours / completedOrders.length);
  }, [maintenanceOrders]);

  const totalWorkHours = useMemo(() => {
    return maintenanceOrders.reduce((sum, o) => sum + o.actualHours, 0);
  }, [maintenanceOrders]);

  const successRateData = useMemo(() => {
    const rocketFilter = selectedRocket === 'all'
      ? rocketModels
      : rocketModels.filter((r) => r.id === selectedRocket);

    return rocketFilter.map((r) => {
      const successCount = Math.round(r.totalLaunches * r.successRate / 100);
      const failCount = r.totalLaunches - successCount;
      return {
        name: r.name,
        code: r.code,
        totalLaunches: r.totalLaunches,
        successCount,
        failCount,
        successRate: r.successRate,
        fill: getRateColor(r.successRate),
      };
    });
  }, [rocketModels, selectedRocket]);

  const faultTrendData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return months.map((month, idx) => {
      const entry: Record<string, string | number> = { month };
      FAULT_CATEGORIES.forEach((cat) => {
        const base = Math.random() * 3 + 0.5;
        entry[cat] = Math.round((idx < 3 ? base + 1 : base - 0.5) * 10) / 10;
      });
      return entry;
    });
  }, []);

  const personnelData = useMemo(() => {
    const teamMap = new Map<string, { team: string; count: number; totalHours: number; taskCount: number }>();

    personnel.forEach((p) => {
      const existing = teamMap.get(p.team);
      if (existing) {
        existing.count += 1;
      } else {
        teamMap.set(p.team, { team: p.team, count: 1, totalHours: 0, taskCount: 0 });
      }
    });

    const taskPersonnelIds = new Set<string>();
    tasks.forEach((t) => {
      t.assignedPersonnel.forEach((a) => taskPersonnelIds.add(a.personnelId));
    });

    maintenanceOrders.forEach((mo) => {
      const team = teamMap.get(mo.assignedTeam);
      if (team) {
        team.totalHours += mo.actualHours;
        team.taskCount += 1;
      }
    });

    const entries = Array.from(teamMap.values());
    entries.forEach((e) => {
      e.totalHours = Math.round(e.totalHours + e.count * 48 + Math.random() * 20);
      e.taskCount = e.taskCount + Math.floor(Math.random() * 3 + 1);
    });

    return entries.sort((a, b) => b.totalHours - a.totalHours);
  }, [personnel, maintenanceOrders, tasks]);

  const personnelChartData = useMemo(() => {
    return personnelData.map((d) => ({
      name: d.team,
      totalHours: d.totalHours,
      avgHours: Math.round(d.totalHours / d.count),
    }));
  }, [personnelData]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: '#0A1628',
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`统计报表_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="page-title flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-cyber-blue" />
          统计与报表
        </h1>
        <button
          onClick={handleExportPDF}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Download className="w-4 h-4" />
          导出月度报告
        </button>
      </div>

      <div className="glass-card glow-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-1.5">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTimeRange(opt.key)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 ${
                  timeRange === opt.key
                    ? 'border-cyber-blue/40 bg-cyber-blue/15 text-cyber-blue'
                    : 'border-space-600/40 bg-space-700/30 text-slate-400 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-space-600/40" />
          <select
            value={selectedRocket}
            onChange={(e) => setSelectedRocket(e.target.value)}
            className="select-field text-sm min-w-[140px]"
          >
            <option value="all">全部型号</option>
            {rocketModels.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
            ))}
          </select>
          <button className="btn-primary px-4 py-1.5 text-sm">
            查询
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card glow-border p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm text-slate-400 mb-1">总发射次数</p>
                <p className="text-3xl font-mono font-bold text-cyber-blue tracking-wider">{totalLaunches}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-blue/10">
                <Rocket className="w-6 h-6 text-cyber-blue" />
              </div>
            </div>
          </div>
          <div className="glass-card glow-border p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,230,118,0.2)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm text-slate-400 mb-1">成功率</p>
                <p className={`text-3xl font-mono font-bold tracking-wider ${getRateTextClass(overallSuccessRate)}`}>
                  {overallSuccessRate}%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-green/10">
                <TrendingUp className="w-6 h-6 text-cyber-green" />
              </div>
            </div>
          </div>
          <div className="glass-card glow-border p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(255,107,53,0.2)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm text-slate-400 mb-1">平均故障间隔</p>
                <p className="text-3xl font-mono font-bold text-cyber-orange tracking-wider">{avgFaultInterval}<span className="text-base ml-1">h</span></p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-orange/10">
                <Activity className="w-6 h-6 text-cyber-orange" />
              </div>
            </div>
          </div>
          <div className="glass-card glow-border p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(123,97,255,0.2)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm text-slate-400 mb-1">总工时</p>
                <p className="text-3xl font-mono font-bold text-cyber-purple tracking-wider">{totalWorkHours}<span className="text-base ml-1">h</span></p>
              </div>
              <div className="p-2.5 rounded-lg bg-cyber-purple/10">
                <Clock className="w-6 h-6 text-cyber-purple" />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card glow-border p-5">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <Rocket className="w-5 h-5" />
            发射成功率统计
          </h2>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={successRateData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1f38',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) => [`${value}%`, '成功率']}
                />
                <Bar dataKey="successRate" radius={[4, 4, 0, 0]}>
                  {successRateData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>型号</th>
                  <th>总发射次数</th>
                  <th>成功次数</th>
                  <th>失败次数</th>
                  <th>成功率</th>
                </tr>
              </thead>
              <tbody>
                {successRateData.map((row) => (
                  <tr key={row.code}>
                    <td className="font-medium text-white">{row.name}</td>
                    <td className="font-mono">{row.totalLaunches}</td>
                    <td className="font-mono text-cyber-green">{row.successCount}</td>
                    <td className="font-mono text-cyber-red">{row.failCount}</td>
                    <td className={`font-mono font-semibold ${getRateTextClass(row.successRate)}`}>
                      {row.successRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card glow-border p-5">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5" />
            故障率统计趋势
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={faultTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1f38',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                />
                {FAULT_CATEGORIES.map((cat, idx) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={FAULT_COLORS[idx]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: FAULT_COLORS[idx] }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card glow-border p-5">
          <h2 className="section-title flex items-center gap-2 mb-6">
            <Users className="w-5 h-5" />
            人员工时统计
          </h2>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personnelChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1f38',
                    border: '1px solid rgba(0,212,255,0.2)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}h`,
                    name === 'totalHours' ? '总工时' : '平均工时',
                  ]}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                  formatter={(value: string) =>
                    value === 'totalHours' ? '总工时' : '平均工时'
                  }
                />
                <Bar dataKey="totalHours" fill="#7B61FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHours" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>班组</th>
                  <th>人员数</th>
                  <th>总工时</th>
                  <th>平均工时</th>
                  <th>参与任务数</th>
                </tr>
              </thead>
              <tbody>
                {personnelData.map((row) => (
                  <tr key={row.team}>
                    <td className="font-medium text-white">{row.team}</td>
                    <td className="font-mono">{row.count}</td>
                    <td className="font-mono text-cyber-purple">{row.totalHours}h</td>
                    <td className="font-mono text-cyber-blue">{Math.round(row.totalHours / row.count)}h</td>
                    <td className="font-mono">{row.taskCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

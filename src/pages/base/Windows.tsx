import { useState } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { LaunchWindow } from '@/types';

const emptyWindow: Omit<LaunchWindow, 'id'> = {
  padId: '',
  padName: '',
  startTime: '',
  endTime: '',
  weatherScore: 0,
  available: true,
  constraints: [],
};

function WeatherBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-cyber-green' : score >= 60 ? 'bg-cyber-yellow' : 'bg-cyber-red';
  const textColor = score >= 80 ? 'text-cyber-green' : score >= 60 ? 'text-cyber-yellow' : 'text-cyber-red';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-space-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-mono text-xs ${textColor}`}>{score}</span>
    </div>
  );
}

export default function Windows() {
  const launchWindows = useStore((s) => s.launchWindows);
  const addLaunchWindow = useStore((s) => s.addLaunchWindow);
  const updateLaunchWindow = useStore((s) => s.updateLaunchWindow);
  const launchPads = useStore((s) => s.launchPads);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LaunchWindow | null>(null);
  const [form, setForm] = useState<Omit<LaunchWindow, 'id'>>(emptyWindow);
  const [constraintInput, setConstraintInput] = useState('');

  const openAdd = () => {
    setEditing(null);
    setForm(emptyWindow);
    setConstraintInput('');
    setDrawerOpen(true);
  };

  const openEdit = (win: LaunchWindow) => {
    setEditing(win);
    const { id: _, ...rest } = win;
    setForm(rest);
    setConstraintInput('');
    setDrawerOpen(true);
  };

  const addConstraint = () => {
    if (constraintInput.trim()) {
      setForm({ ...form, constraints: [...form.constraints, constraintInput.trim()] });
      setConstraintInput('');
    }
  };

  const removeConstraint = (index: number) => {
    setForm({ ...form, constraints: form.constraints.filter((_, i) => i !== index) });
  };

  const handlePadChange = (padId: string) => {
    const pad = launchPads.find((p) => p.id === padId);
    setForm({ ...form, padId, padName: pad?.name ?? '' });
  };

  const handleSubmit = () => {
    if (editing) {
      updateLaunchWindow(editing.id, form);
    } else {
      addLaunchWindow({ ...form, id: `win-${Date.now()}` });
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">发射窗口管理</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增窗口
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>关联工位</th>
              <th>窗口开始时间</th>
              <th>窗口结束时间</th>
              <th>气象评分</th>
              <th>可用状态</th>
              <th>约束条件</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {launchWindows.map((win) => (
              <tr key={win.id}>
                <td className="text-white font-medium">{win.padName}</td>
                <td className="font-mono text-sm">{win.startTime.slice(0, 16).replace('T', ' ')}</td>
                <td className="font-mono text-sm">{win.endTime.slice(0, 16).replace('T', ' ')}</td>
                <td><WeatherBar score={win.weatherScore} /></td>
                <td>
                  {win.available ? (
                    <span className="inline-block px-2.5 py-0.5 text-xs rounded-full border border-cyber-green/30 bg-cyber-green/10 text-cyber-green">可用</span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 text-xs rounded-full border border-cyber-red/30 bg-cyber-red/10 text-cyber-red">不可用</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {win.constraints.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[10px] bg-space-700/60 text-slate-300 rounded border border-space-600/50">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button onClick={() => openEdit(win)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
                    <Edit2 className="w-3 h-3" />
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${drawerOpen ? 'visible' : 'invisible'}`}
        onClick={() => setDrawerOpen(false)}
      >
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      <div
        className={`fixed right-0 top-0 h-full w-[480px] z-50 bg-space-800 border-l border-cyber-blue/10 shadow-2xl transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-cyber-blue/10">
          <h2 className="text-lg font-semibold text-white">{editing ? '编辑窗口' : '新增窗口'}</h2>
          <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div>
            <label className="label-field">关联工位</label>
            <select className="select-field" value={form.padId} onChange={(e) => handlePadChange(e.target.value)}>
              <option value="">请选择工位</option>
              {launchPads.map((pad) => (
                <option key={pad.id} value={pad.id}>{pad.name} ({pad.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">窗口开始时间</label>
            <input type="datetime-local" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="label-field">窗口结束时间</label>
            <input type="datetime-local" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div>
            <label className="label-field">气象评分 (0-100)</label>
            <input type="number" min={0} max={100} className="input-field" value={form.weatherScore} onChange={(e) => setForm({ ...form, weatherScore: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label-field">可用状态</label>
            <select className="select-field" value={form.available ? 'true' : 'false'} onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}>
              <option value="true">可用</option>
              <option value="false">不可用</option>
            </select>
          </div>
          <div>
            <label className="label-field">约束条件</label>
            <div className="flex gap-2 mb-2">
              <input className="input-field flex-1" value={constraintInput} onChange={(e) => setConstraintInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addConstraint()} placeholder="输入约束条件后按回车添加" />
              <button onClick={addConstraint} className="btn-primary py-2 px-3 text-xs">添加</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.constraints.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-space-700/60 text-slate-300 rounded border border-space-600/50">
                  {c}
                  <button onClick={() => removeConstraint(i)} className="text-slate-500 hover:text-cyber-red transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSubmit} className="btn-primary flex-1">
              {editing ? '保存修改' : '确认新增'}
            </button>
            <button onClick={() => setDrawerOpen(false)} className="btn-danger flex-1">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

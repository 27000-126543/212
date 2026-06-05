import { useState } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { LaunchPad } from '@/types';

const padTypeMap: Record<LaunchPad['type'], string> = {
  liquid: '液体',
  solid: '固体',
  mixed: '混合',
};

const padStatusMap: Record<LaunchPad['status'], string> = {
  idle: '空闲',
  preparing: '准备中',
  occupied: '占用',
  maintenance: '维护中',
};

const emptyPad: Omit<LaunchPad, 'id'> = {
  name: '',
  code: '',
  type: 'liquid',
  status: 'idle',
  lastLaunchTime: null,
  transitionDays: 7,
  coolingPeriod: 3,
  equipment: [],
  position: { x: 50, y: 50 },
  totalLaunches: 0,
};

export default function Pads() {
  const launchPads = useStore((s) => s.launchPads);
  const addLaunchPad = useStore((s) => s.addLaunchPad);
  const updateLaunchPad = useStore((s) => s.updateLaunchPad);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LaunchPad | null>(null);
  const [form, setForm] = useState<Omit<LaunchPad, 'id'>>(emptyPad);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyPad);
    setDrawerOpen(true);
  };

  const openEdit = (pad: LaunchPad) => {
    setEditing(pad);
    const { id: _, ...rest } = pad;
    setForm(rest);
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateLaunchPad(editing.id, form);
    } else {
      addLaunchPad({ ...form, id: `pad-${Date.now()}` });
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">发射工位管理</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增工位
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>名称</th>
              <th>类型</th>
              <th>状态</th>
              <th>上次发射时间</th>
              <th>发射次数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {launchPads.map((pad) => (
              <tr key={pad.id}>
                <td className="font-mono text-cyber-blue">{pad.code}</td>
                <td>{pad.name}</td>
                <td>{padTypeMap[pad.type]}</td>
                <td>
                  <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full border status-${pad.status}`}>
                    {padStatusMap[pad.status]}
                  </span>
                </td>
                <td className="font-mono text-sm">
                  {pad.lastLaunchTime ? pad.lastLaunchTime.slice(0, 16).replace('T', ' ') : '-'}
                </td>
                <td className="font-mono">{pad.totalLaunches}</td>
                <td>
                  <button onClick={() => openEdit(pad)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
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
          <h2 className="text-lg font-semibold text-white">{editing ? '编辑工位' : '新增工位'}</h2>
          <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div>
            <label className="label-field">名称</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">编号</label>
            <input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <label className="label-field">类型</label>
            <select className="select-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LaunchPad['type'] })}>
              <option value="liquid">液体</option>
              <option value="solid">固体</option>
              <option value="mixed">混合</option>
            </select>
          </div>
          <div>
            <label className="label-field">状态</label>
            <select className="select-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LaunchPad['status'] })}>
              <option value="idle">空闲</option>
              <option value="preparing">准备中</option>
              <option value="occupied">占用</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div>
            <label className="label-field">上次发射时间</label>
            <input type="datetime-local" className="input-field" value={form.lastLaunchTime ?? ''} onChange={(e) => setForm({ ...form, lastLaunchTime: e.target.value || null })} />
          </div>
          <div>
            <label className="label-field">转换天数</label>
            <input type="number" className="input-field" value={form.transitionDays} onChange={(e) => setForm({ ...form, transitionDays: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label-field">冷却期(天)</label>
            <input type="number" className="input-field" value={form.coolingPeriod} onChange={(e) => setForm({ ...form, coolingPeriod: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label-field">累计发射次数</label>
            <input type="number" className="input-field" value={form.totalLaunches} onChange={(e) => setForm({ ...form, totalLaunches: Number(e.target.value) })} />
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

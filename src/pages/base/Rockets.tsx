import { useState } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { RocketModel } from '@/types';

const emptyRocket: Omit<RocketModel, 'id'> = {
  name: '',
  code: '',
  propellantType: '',
  leoCapacity: 0,
  gtoCapacity: 0,
  totalLaunches: 0,
  successRate: 0,
  fuelingDuration: 0,
  stages: 2,
  height: 0,
  diameter: 0,
};

export default function Rockets() {
  const rocketModels = useStore((s) => s.rocketModels);
  const addRocketModel = useStore((s) => s.addRocketModel);
  const updateRocketModel = useStore((s) => s.updateRocketModel);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RocketModel | null>(null);
  const [form, setForm] = useState<Omit<RocketModel, 'id'>>(emptyRocket);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyRocket);
    setDrawerOpen(true);
  };

  const openEdit = (rocket: RocketModel) => {
    setEditing(rocket);
    const { id: _, ...rest } = rocket;
    setForm(rest);
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updateRocketModel(editing.id, form);
    } else {
      addRocketModel({ ...form, id: `rocket-${Date.now()}` });
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">火箭型号管理</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增型号
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>代号</th>
              <th>名称</th>
              <th>推进剂类型</th>
              <th>LEO运载能力</th>
              <th>GTO运载能力</th>
              <th>发射次数</th>
              <th>成功率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rocketModels.map((rocket) => (
              <tr key={rocket.id}>
                <td className="font-mono text-cyber-blue">{rocket.code}</td>
                <td>{rocket.name}</td>
                <td className="text-xs">{rocket.propellantType}</td>
                <td className="font-mono">{rocket.leoCapacity > 0 ? `${rocket.leoCapacity.toLocaleString()} kg` : '-'}</td>
                <td className="font-mono">{rocket.gtoCapacity > 0 ? `${rocket.gtoCapacity.toLocaleString()} kg` : '-'}</td>
                <td className="font-mono">{rocket.totalLaunches}</td>
                <td>
                  <span className={`font-mono ${rocket.successRate >= 95 ? 'text-cyber-green' : rocket.successRate >= 90 ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
                    {rocket.successRate}%
                  </span>
                </td>
                <td>
                  <button onClick={() => openEdit(rocket)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
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
          <h2 className="text-lg font-semibold text-white">{editing ? '编辑型号' : '新增型号'}</h2>
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
            <label className="label-field">代号</label>
            <input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <label className="label-field">推进剂类型</label>
            <input className="input-field" value={form.propellantType} onChange={(e) => setForm({ ...form, propellantType: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">LEO运载能力(kg)</label>
              <input type="number" className="input-field" value={form.leoCapacity} onChange={(e) => setForm({ ...form, leoCapacity: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-field">GTO运载能力(kg)</label>
              <input type="number" className="input-field" value={form.gtoCapacity} onChange={(e) => setForm({ ...form, gtoCapacity: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">发射次数</label>
              <input type="number" className="input-field" value={form.totalLaunches} onChange={(e) => setForm({ ...form, totalLaunches: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-field">成功率(%)</label>
              <input type="number" step="0.1" className="input-field" value={form.successRate} onChange={(e) => setForm({ ...form, successRate: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">加注时长(h)</label>
              <input type="number" className="input-field" value={form.fuelingDuration} onChange={(e) => setForm({ ...form, fuelingDuration: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-field">级数</label>
              <input type="number" className="input-field" value={form.stages} onChange={(e) => setForm({ ...form, stages: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label-field">直径(m)</label>
              <input type="number" step="0.01" className="input-field" value={form.diameter} onChange={(e) => setForm({ ...form, diameter: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label-field">高度(m)</label>
            <input type="number" step="0.01" className="input-field" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
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

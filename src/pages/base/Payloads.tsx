import { useState } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { Payload } from '@/types';

const payloadTypeMap: Record<Payload['type'], string> = {
  satellite: '卫星',
  manned: '载人',
  cargo: '货运',
  deep_space: '深空探测',
};

const emptyPayload: Omit<Payload, 'id'> = {
  name: '',
  type: 'satellite',
  mass: 0,
  organization: '',
  orbitType: '',
  specialRequirements: '',
};

export default function Payloads() {
  const payloads = useStore((s) => s.payloads);
  const addPayload = useStore((s) => s.addPayload);
  const updatePayload = useStore((s) => s.updatePayload);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Payload | null>(null);
  const [form, setForm] = useState<Omit<Payload, 'id'>>(emptyPayload);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyPayload);
    setDrawerOpen(true);
  };

  const openEdit = (payload: Payload) => {
    setEditing(payload);
    const { id: _, ...rest } = payload;
    setForm(rest);
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updatePayload(editing.id, form);
    } else {
      addPayload({ ...form, id: `payload-${Date.now()}` });
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">有效载荷管理</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增载荷
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>质量</th>
              <th>所属机构</th>
              <th>轨道类型</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {payloads.map((payload) => (
              <tr key={payload.id}>
                <td className="text-white font-medium">{payload.name}</td>
                <td>
                  <span className="inline-block px-2.5 py-0.5 text-xs rounded-full border border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue">
                    {payloadTypeMap[payload.type]}
                  </span>
                </td>
                <td className="font-mono">{payload.mass.toLocaleString()} kg</td>
                <td className="text-sm text-slate-300">{payload.organization}</td>
                <td className="font-mono text-sm">{payload.orbitType}</td>
                <td>
                  <button onClick={() => openEdit(payload)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
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
          <h2 className="text-lg font-semibold text-white">{editing ? '编辑载荷' : '新增载荷'}</h2>
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
            <label className="label-field">类型</label>
            <select className="select-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Payload['type'] })}>
              <option value="satellite">卫星</option>
              <option value="manned">载人</option>
              <option value="cargo">货运</option>
              <option value="deep_space">深空探测</option>
            </select>
          </div>
          <div>
            <label className="label-field">质量(kg)</label>
            <input type="number" className="input-field" value={form.mass} onChange={(e) => setForm({ ...form, mass: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label-field">所属机构</label>
            <input className="input-field" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          </div>
          <div>
            <label className="label-field">轨道类型</label>
            <input className="input-field" value={form.orbitType} onChange={(e) => setForm({ ...form, orbitType: e.target.value })} />
          </div>
          <div>
            <label className="label-field">特殊要求</label>
            <textarea className="input-field min-h-[80px] resize-y" value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })} />
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

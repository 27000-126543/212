import { useState } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { useStore } from '@/store';
import type { Personnel } from '@/types';

const roleMap: Record<Personnel['role'], string> = {
  commander: '指挥员',
  fueler: '加注手',
  telemetry_op: '测控操作员',
  safety_officer: '安全员',
  maintenance: '维保人员',
  admin: '管理员',
};

const statusMap: Record<Personnel['status'], string> = {
  available: '空闲',
  assigned: '在岗',
  offline: '离线',
};

const statusStyle: Record<Personnel['status'], string> = {
  available: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
  assigned: 'border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue',
  offline: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

const emptyPersonnel: Omit<Personnel, 'id'> = {
  name: '',
  role: 'commander',
  team: '',
  phone: '',
  status: 'available',
};

export default function Personnel() {
  const personnel = useStore((s) => s.personnel);
  const addPersonnel = useStore((s) => s.addPersonnel);
  const updatePersonnel = useStore((s) => s.updatePersonnel);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [form, setForm] = useState<Omit<Personnel, 'id'>>(emptyPersonnel);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyPersonnel);
    setDrawerOpen(true);
  };

  const openEdit = (p: Personnel) => {
    setEditing(p);
    const { id: _, ...rest } = p;
    setForm(rest);
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      updatePersonnel(editing.id, form);
    } else {
      addPersonnel({ ...form, id: `p-${Date.now()}` });
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">人员管理</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增人员
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>岗位</th>
              <th>所属班组</th>
              <th>联系方式</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((p) => (
              <tr key={p.id}>
                <td className="text-white font-medium">{p.name}</td>
                <td>
                  <span className="inline-block px-2.5 py-0.5 text-xs rounded-full border border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple">
                    {roleMap[p.role]}
                  </span>
                </td>
                <td className="text-slate-300">{p.team}</td>
                <td className="font-mono text-sm">{p.phone}</td>
                <td>
                  <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full border ${statusStyle[p.status]}`}>
                    {statusMap[p.status]}
                  </span>
                </td>
                <td>
                  <button onClick={() => openEdit(p)} className="btn-primary py-1 px-3 text-xs flex items-center gap-1">
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
          <h2 className="text-lg font-semibold text-white">{editing ? '编辑人员' : '新增人员'}</h2>
          <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div>
            <label className="label-field">姓名</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">岗位</label>
            <select className="select-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Personnel['role'] })}>
              <option value="commander">指挥员</option>
              <option value="fueler">加注手</option>
              <option value="telemetry_op">测控操作员</option>
              <option value="safety_officer">安全员</option>
              <option value="maintenance">维保人员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div>
            <label className="label-field">所属班组</label>
            <input className="input-field" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
          </div>
          <div>
            <label className="label-field">联系方式</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">状态</label>
            <select className="select-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Personnel['status'] })}>
              <option value="available">空闲</option>
              <option value="assigned">在岗</option>
              <option value="offline">离线</option>
            </select>
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

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500';

const Family = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', email: '', relation: 'other', receiveAlerts: true, receiveSOS: true });

  const { data, isLoading } = useQuery('family', () => api.get('/family').then(r => r.data.data));

  const addMutation = useMutation(d => api.post('/family', d), {
    onSuccess: () => { toast.success('Member added!'); setShowForm(false); queryClient.invalidateQueries('family'); },
    onError: e => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation(id => api.delete(`/family/${id}`), {
    onSuccess: () => { toast.success('Member removed'); queryClient.invalidateQueries('family'); },
  });

  const members = data || [];

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Family Members</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
            {showForm ? '✕ Close' : '+ Add'}
          </button>
        </div>
        <p className="text-slate-400 text-sm mt-1">{members.length} emergency contacts</p>
      </div>

      {showForm && (
        <div className="mx-5 mt-5 bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-white font-semibold mb-4">Add Family Member</h3>
          <div className="space-y-3">
            {[
              { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
              { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              { label: 'WhatsApp (for alerts)', key: 'whatsapp', type: 'tel', placeholder: '+91 98765 43210' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-slate-300 text-xs mb-1 block">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} className={inputCls} />
              </div>
            ))}
            <div>
              <label className="text-slate-300 text-xs mb-1 block">Relation</label>
              <select value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} className={inputCls}>
                {['spouse','parent','child','sibling','caregiver','friend','doctor','other'].map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isLoading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium text-sm">
              {addMutation.isLoading ? 'Adding...' : '+ Add Member'}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 mt-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-5xl mb-3">👨‍👩‍👧</p>
            <p className="text-white font-semibold mb-1">No family members yet</p>
            <p className="text-slate-400 text-sm">Add contacts who get notified when you miss medicine or send SOS</p>
          </div>
        ) : members.map(m => (
          <div key={m._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-xl">
                  {m.relation === 'parent' ? '👴' : m.relation === 'child' ? '👶' : m.relation === 'spouse' ? '💑' : '👤'}
                </div>
                <div>
                  <p className="text-white font-medium">{m.name}</p>
                  <p className="text-slate-400 text-xs">{m.relation} · {m.phone}</p>
                  {m.whatsapp && <p className="text-emerald-400 text-xs">📱 {m.whatsapp}</p>}
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(m._id)} className="text-red-400 p-2 rounded-xl">🗑️</button>
            </div>
            <div className="flex gap-2 mt-3">
              {m.receiveAlerts && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">⚠️ Alerts</span>}
              {m.receiveSOS && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">🚨 SOS</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Family;
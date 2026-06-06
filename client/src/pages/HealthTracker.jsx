import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const metrics = [
  { key: 'blood_pressure', label: 'Blood Pressure', icon: '🩺', unit: 'mmHg', color: '#ef4444' },
  { key: 'blood_sugar', label: 'Blood Sugar', icon: '🍬', unit: 'mg/dL', color: '#f59e0b' },
  { key: 'heart_rate', label: 'Heart Rate', icon: '❤️', unit: 'bpm', color: '#ec4899' },
  { key: 'weight', label: 'Weight', icon: '⚖️', unit: 'kg', color: '#8b5cf6' },
  { key: 'oxygen', label: 'Oxygen', icon: '🫁', unit: '%', color: '#06b6d4' },
  { key: 'temperature', label: 'Temperature', icon: '🌡️', unit: '°C', color: '#f97316' },
];

const HealthTracker = () => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('blood_pressure');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'blood_pressure', value: '', value2: '', notes: '' });

  const { data } = useQuery(['health', selectedType], () =>
    api.get(`/health?type=${selectedType}&days=30`).then(r => r.data.data)
  );

  const addMutation = useMutation(d => api.post('/health', d), {
    onSuccess: () => { toast.success('Reading saved!'); setShowForm(false); queryClient.invalidateQueries('health'); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const chartData = (data || []).slice(0, 10).reverse().map(m => ({
    time: new Date(m.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: m.value, value2: m.value2,
  }));

  const selected = metrics.find(m => m.key === selectedType);

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Health Tracker</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
            {showForm ? '✕' : '+ Add'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mx-5 mt-5 bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <div className="space-y-3">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
              {metrics.map(m => <option key={m.key} value={m.key}>{m.icon} {m.label}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" placeholder="Value" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              {form.type === 'blood_pressure' && (
                <input type="number" placeholder="Diastolic" value={form.value2} onChange={e => setForm({ ...form, value2: e.target.value })}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
              )}
            </div>
            <button onClick={() => addMutation.mutate({ ...form, value: Number(form.value), value2: Number(form.value2) })}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium">Save Reading</button>
          </div>
        </div>
      )}

      <div className="px-5 mt-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {metrics.map(m => (
            <button key={m.key} onClick={() => setSelectedType(m.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                selectedType === m.key ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="mx-5 mt-4 bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <h3 className="text-white font-medium mb-4">{selected?.label} — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke={selected?.color} strokeWidth={2} dot={{ r: 3 }} />
              {selectedType === 'blood_pressure' && (
                <Line type="monotone" dataKey="value2" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="px-5 mt-4 space-y-3">
        <h3 className="text-white font-semibold">Recent Readings</h3>
        {(data || []).slice(0, 10).map(m => (
          <div key={m._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selected?.icon}</span>
              <div>
                <p className="text-white font-semibold">
                  {m.value}{m.value2 ? `/${m.value2}` : ''} <span className="text-slate-400 text-xs font-normal">{selected?.unit}</span>
                </p>
                {m.notes && <p className="text-slate-400 text-xs">{m.notes}</p>}
              </div>
            </div>
            <p className="text-slate-400 text-xs">{new Date(m.recordedAt).toLocaleDateString('en-IN')}</p>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="text-center py-10">
            <p className="text-4xl mb-2">{selected?.icon}</p>
            <p className="text-slate-400">No readings yet. Tap + Add to record one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTracker;
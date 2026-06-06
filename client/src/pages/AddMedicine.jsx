import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addMedicine } from '../store/slices/medicineSlice';

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition';

const AddMedicine = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'tablet', dosage: '', frequency: 'once_daily',
    times: ['08:00'], startDate: new Date().toISOString().split('T')[0],
    endDate: '', totalPills: '', instructions: '', color: '#10b981',
    reminderChannels: { push: true, whatsapp: false, sms: false, email: false },
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTimeChange = (i, v) => {
    const t = [...form.times]; t[i] = v; setForm({ ...form, times: t });
  };
  const addTime = () => { if (form.times.length < 6) setForm({ ...form, times: [...form.times, '12:00'] }); };
  const removeTime = (i) => setForm({ ...form, times: form.times.filter((_, idx) => idx !== i) });
  const toggleChannel = (ch) => setForm({
    ...form, reminderChannels: { ...form.reminderChannels, [ch]: !form.reminderChannels[ch] }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await dispatch(addMedicine(form));
    setLoading(false);
    navigate('/medicines');
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 p-2 rounded-xl">← Back</button>
          <h1 className="text-white text-xl font-bold">Add Medicine</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 mt-5 space-y-5">
        <div>
          <label className="text-slate-300 text-sm font-medium block mb-2">Medicine Name</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Metformin" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
              {['tablet','capsule','syrup','injection','drops','inhaler','cream'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Dosage</label>
            <input name="dosage" value={form.dosage} onChange={handleChange} required placeholder="500mg" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-slate-300 text-sm font-medium block mb-2">Frequency</label>
          <select name="frequency" value={form.frequency} onChange={handleChange} className={inputCls}>
            <option value="once_daily">Once Daily</option>
            <option value="twice_daily">Twice Daily</option>
            <option value="thrice_daily">Thrice Daily</option>
            <option value="weekly">Weekly</option>
            <option value="as_needed">As Needed</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 text-sm font-medium">Reminder Times</label>
            <button type="button" onClick={addTime} className="text-emerald-400 text-sm">+ Add time</button>
          </div>
          <div className="space-y-2">
            {form.times.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input type="time" value={t} onChange={e => handleTimeChange(i, e.target.value)} className={inputCls + ' flex-1'} />
                {form.times.length > 1 && (
                  <button type="button" onClick={() => removeTime(i)} className="text-red-400 px-3 rounded-xl">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Start Date</label>
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">End Date</label>
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-slate-300 text-sm font-medium block mb-2">Total Pills (optional)</label>
          <input type="number" name="totalPills" value={form.totalPills} onChange={handleChange} placeholder="30" className={inputCls} />
        </div>

        <div>
          <label className="text-slate-300 text-sm font-medium block mb-2">Instructions</label>
          <textarea name="instructions" value={form.instructions} onChange={handleChange}
            placeholder="e.g. Take after meals" rows={2} className={inputCls + ' resize-none'} />
        </div>

        <div>
          <label className="text-slate-300 text-sm font-medium block mb-3">Reminder Channels</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'push', label: 'Push Notification', icon: '🔔' },
              { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
              { key: 'sms', label: 'SMS', icon: '💬' },
              { key: 'email', label: 'Email', icon: '📧' },
            ].map(ch => (
              <button key={ch.key} type="button" onClick={() => toggleChannel(ch.key)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition ${
                  form.reminderChannels[ch.key]
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                    : 'border-slate-600 bg-slate-700 text-slate-400'
                }`}>
                <span>{ch.icon}</span> <span>{ch.label}</span>
                {form.reminderChannels[ch.key] && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin">⏳</span> Adding...</> : '💊 Add Medicine'}
        </button>
      </form>
    </div>
  );
};

export default AddMedicine;
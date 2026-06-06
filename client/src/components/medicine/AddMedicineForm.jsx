import React from 'react';

const AddMedicineForm = ({ form, onChange, onTimeChange, onAddTime, onRemoveTime, onToggleChannel }) => {
  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition';

  return (
    <div className="space-y-4">
      <input name="name" value={form.name} onChange={onChange} placeholder="Medicine name" className={inputCls} />
      <div className="grid grid-cols-2 gap-3">
        <select name="type" value={form.type} onChange={onChange} className={inputCls}>
          {['tablet','capsule','syrup','injection','drops','inhaler','cream'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <input name="dosage" value={form.dosage} onChange={onChange} placeholder="Dosage e.g. 500mg" className={inputCls} />
      </div>
      <div className="space-y-2">
        {form.times.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input type="time" value={t} onChange={e => onTimeChange(i, e.target.value)} className={inputCls + ' flex-1'} />
            {form.times.length > 1 && (
              <button type="button" onClick={() => onRemoveTime(i)} className="text-red-400 px-3 rounded-xl">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={onAddTime} className="text-emerald-400 text-sm">+ Add time</button>
      </div>
    </div>
  );
};

export default AddMedicineForm;
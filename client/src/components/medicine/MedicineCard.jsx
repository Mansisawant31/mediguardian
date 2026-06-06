import React from 'react';

const typeIcons = { tablet:'💊', syrup:'🧴', injection:'💉', drops:'💧', inhaler:'🫁', capsule:'💊', cream:'🧴' };

const MedicineCard = ({ medicine, onDelete }) => (
  <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: (medicine.color || '#10b981') + '33' }}>
          {typeIcons[medicine.type] || '💊'}
        </div>
        <div>
          <h3 className="text-white font-semibold">{medicine.name}</h3>
          <p className="text-slate-400 text-sm">{medicine.dosage} · {medicine.type}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {medicine.times?.map(t => (
              <span key={t} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(medicine._id, medicine.name)}
          className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition">
          🗑️
        </button>
      )}
    </div>
  </div>
);

export default MedicineCard;
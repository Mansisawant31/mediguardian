import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMedicines, deleteMedicine } from '../store/slices/medicineSlice';

const typeIcons = { tablet:'💊', syrup:'🧴', injection:'💉', drops:'💧', inhaler:'🫁', capsule:'💊', cream:'🧴' };

const Medicines = () => {
  const dispatch = useDispatch();
  const { items: medicines, loading } = useSelector(state => state.medicines);

  useEffect(() => { dispatch(fetchMedicines()); }, [dispatch]);

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove ${name}?`)) dispatch(deleteMedicine(id));
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">My Medicines</h1>
          <Link to="/medicines/add" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            + Add
          </Link>
        </div>
        <p className="text-slate-400 text-sm mt-1">{medicines.length} active medicines</p>
      </div>

      <div className="px-5 mt-5">
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-6xl mb-4">💊</p>
            <h3 className="text-white text-xl font-semibold mb-2">No medicines yet</h3>
            <Link to="/medicines/add" className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium">
              + Add Medicine
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {medicines.map(med => (
              <div key={med._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: (med.color || '#10b981') + '33' }}>
                      {typeIcons[med.type] || '💊'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{med.name}</h3>
                      <p className="text-slate-400 text-sm">{med.dosage} · {med.type}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {med.times?.map(t => (
                          <span key={t} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(med._id, med.name)}
                    className="text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition">🗑️</button>
                </div>
                {med.totalPills && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Pills remaining</span>
                      <span>{med.pillsRemaining}/{med.totalPills}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-emerald-500 rounded-full h-2"
                        style={{ width: `${(med.pillsRemaining / med.totalPills) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;
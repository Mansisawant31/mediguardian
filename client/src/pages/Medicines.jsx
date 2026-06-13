import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMedicines, deleteMedicine } from '../store/slices/medicineSlice';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import SnoozeAlarm from '../components/common/SnoozeAlarm';

const typeIcons = {
  tablet: '💊', syrup: '🧴', injection: '💉',
  drops: '💧', inhaler: '🫁', capsule: '💊', cream: '🧴'
};

const Medicines = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { items: medicines, loading } = useSelector(state => state.medicines);

  useEffect(() => { dispatch(fetchMedicines()); }, [dispatch]);

  const { data: remindersData, refetch: refetchReminders } = useQuery(
    'today-reminders',
    () => api.get('/reminders').then(r => r.data.data),
    { refetchInterval: 5000 }
  );

 const takeMutation = useMutation(
    (reminderId) => api.put(`/reminders/${reminderId}/take`),
    {
      onSuccess: () => {
        toast.success('✅ Medicine marked as Taken!');
        queryClient.invalidateQueries('today-reminders');
        refetchReminders();
      },
      onError: () => toast.error('Failed to update medicine status'),
    }
  );

  const snoozeMutation = useMutation(
    (reminderId) => api.put(`/reminders/${reminderId}/snooze`, { minutes: 15 }),
    {
      onSuccess: () => {
        toast.success('⏰ Snoozed for 15 minutes');
        queryClient.invalidateQueries('today-reminders');
      },
    }
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove ${name} from your medicines?`)) {
      dispatch(deleteMedicine(id));
    }
  };

  const reminders = remindersData || [];
  const pendingReminders = reminders.filter(r => r.status === 'pending' || r.status === 'snoozed');
  const takenReminders = reminders.filter(r => r.status === 'taken');
  const missedReminders = reminders.filter(r => r.status === 'missed');

  return (
    <div className="min-h-screen bg-slate-900 pb-24">

      {/* Header */}
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">My Medicines</h1>
            <p className="text-slate-400 text-sm mt-0.5">{medicines.length} medicines active</p>
          </div>
          <Link
            to="/medicines/add"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            + Add
          </Link>
        </div>
      </div>

      <div className="px-5 mt-5">

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-yellow-400 text-2xl font-bold">{pendingReminders.length}</div>
            <div className="text-slate-400 text-xs">Pending</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-emerald-400 text-2xl font-bold">{takenReminders.length}</div>
            <div className="text-slate-400 text-xs">Taken</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-red-400 text-2xl font-bold">{missedReminders.length}</div>
            <div className="text-slate-400 text-xs">Missed</div>
          </div>
        </div>

        {/* Today's Schedule with TAKEN button */}
        <h2 className="text-white font-semibold text-lg mb-3">📅 Today's Schedule</h2>

        {reminders.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700 mb-6">
            <p className="text-4xl mb-2">💊</p>
            <p className="text-slate-400 mb-1">No medicines scheduled today</p>
            <Link to="/medicines/add" className="text-emerald-400 text-sm">+ Add medicine</Link>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {reminders.map(r => (
              <div
                key={r._id}
                className={`bg-slate-800 rounded-2xl p-4 border border-slate-700 border-l-4 ${
                  r.status === 'taken' ? 'border-l-emerald-500' :
                  r.status === 'missed' ? 'border-l-red-500' :
                  r.status === 'snoozed' ? 'border-l-blue-500' :
                  'border-l-yellow-500'
                }`}
              >
                {/* Medicine Info Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">
                      {typeIcons[r.medicine?.type] || '💊'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{r.medicine?.name}</p>
                      <p className="text-slate-400 text-xs">{r.medicine?.dosage}</p>
                      <p className="text-slate-500 text-xs">
                        ⏰ {new Date(r.scheduledTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${
                    r.status === 'taken' ? 'bg-emerald-500/20 text-emerald-400' :
                    r.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                    r.status === 'snoozed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {r.status === 'taken' ? '✅ Taken' :
                     r.status === 'missed' ? '⚠️ Missed' :
                     r.status === 'snoozed' ? '⏰ Snoozed' :
                     '⏳ Pending'}
                  </span>
                </div>

                {/* TAKEN + SNOOZE buttons — only for pending/snoozed */}
               {/* TAKEN + SNOOZE buttons — only for pending/snoozed */}
                {(r.status === 'pending' || r.status === 'snoozed') && (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => takeMutation.mutate(r._id)}
                        disabled={takeMutation.isLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        {takeMutation.isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>✅ Mark as Taken</>
                        )}
                      </button>
                      <button
                        onClick={() => snoozeMutation.mutate(r._id)}
                        disabled={snoozeMutation.isLoading}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 px-4 rounded-xl text-sm transition"
                      >
                        ⏰ Snooze
                      </button>
                    </div>

                  {/* Snooze countdown + alarm */}
                    {r.snoozeUntil && (
                      <SnoozeAlarm
                        medicineName={r.medicine?.name}
                        snoozeUntil={r.snoozeUntil}
                        status={r.status}
                        onAlarm={() => refetchReminders()}
                      />
                    )}
                  </>
                )}

                {/* Taken confirmation */}
                {r.status === 'taken' && (
                  <div className="bg-emerald-500/10 rounded-xl px-3 py-2 mt-1">
                    <p className="text-emerald-400 text-xs font-medium">
                      ✅ Taken at {r.takenAt
                        ? new Date(r.takenAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : 'just now'}
                    </p>
                  </div>
                )}

                {/* Missed warning */}
                {r.status === 'missed' && (
                  <div className="bg-red-500/10 rounded-xl px-3 py-2 mt-1">
                    <p className="text-red-400 text-xs font-medium">
                      ⚠️ Missed — Family members have been notified
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* All Medicines List */}
        <h2 className="text-white font-semibold text-lg mb-3">💊 All Medicines</h2>

        {loading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-6xl mb-4">💊</p>
            <h3 className="text-white text-xl font-semibold mb-2">No medicines added</h3>
            <Link to="/medicines/add" className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium">
              + Add Medicine
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map(med => {
              const todayReminder = reminders.find(r => r.medicine?._id === med._id || r.medicine === med._id);
              return (
                <div key={med._id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: (med.color || '#10b981') + '33' }}
                      >
                        {typeIcons[med.type] || '💊'}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{med.name}</h3>
                        <p className="text-slate-400 text-sm">{med.dosage} · {med.type}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {med.times?.map(t => (
                            <span key={t} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Today status badge */}
                      {todayReminder && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          todayReminder.status === 'taken' ? 'bg-emerald-500/20 text-emerald-400' :
                          todayReminder.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {todayReminder.status === 'taken' ? '✅ Taken' :
                           todayReminder.status === 'missed' ? '⚠️ Missed' : '⏳ Pending'}
                        </span>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(med._id, med.name)}
                        className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-xl transition text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Quick TAKEN button in medicine card */}
                  {todayReminder && (todayReminder.status === 'pending' || todayReminder.status === 'snoozed') && (
                    <button
                      onClick={() => takeMutation.mutate(todayReminder._id)}
                      disabled={takeMutation.isLoading}
                      className="w-full mt-3 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      ✅ Mark as Taken
                    </button>
                  )}

                  {todayReminder && todayReminder.status === 'taken' && (
                    <div className="mt-3 bg-emerald-500/10 rounded-xl px-3 py-2">
                      <p className="text-emerald-400 text-xs font-medium text-center">
                        ✅ Taken today at {todayReminder.takenAt
                          ? new Date(todayReminder.takenAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : 'today'}
                      </p>
                    </div>
                  )}

                  {/* Pills progress bar */}
                  {med.totalPills && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Pills remaining</span>
                        <span>{med.pillsRemaining}/{med.totalPills}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 rounded-full h-2 transition-all"
                          style={{ width: `${Math.min((med.pillsRemaining / med.totalPills) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicines;
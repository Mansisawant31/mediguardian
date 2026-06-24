import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { playAlarm } from './useAlarm';

const MissedMedicineAlarm = () => {
  const alarmFiredRef = useRef(new Set());
  const audioRef = useRef(null);
  const [missedAlert, setMissedAlert] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Check ALL today's reminders every 30 seconds
  const { data: remindersData, refetch } = useQuery(
    'missed-alarm-check',
    () => api.get('/reminders').then(r => r.data.data),
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    if (!remindersData) return;

    const now = new Date();

    remindersData.forEach(reminder => {
      const scheduledTime = new Date(reminder.scheduledTime);
      const diffMinutes = Math.floor((now - scheduledTime) / (1000 * 60));

      // Fire alarm if:
      // 1. Status is "pending" and 5+ min overdue
      // 2. Status is "missed" and alarm not yet shown
      const shouldAlarm =
        (reminder.status === 'pending' && diffMinutes >= 5) ||
        (reminder.status === 'missed' && diffMinutes <= 120);

      if (!shouldAlarm) return;

      // Create unique key per 15 min window to avoid spam
      const windowKey = Math.floor(diffMinutes / 15);
      const alarmKey = `${reminder._id}-${windowKey}`;

      if (!alarmFiredRef.current.has(alarmKey)) {
        alarmFiredRef.current.add(alarmKey);
        triggerMissedAlarm(reminder, diffMinutes);
      }
    });
  }, [remindersData]);

  const triggerMissedAlarm = (reminder, minutesLate) => {
    const audio = playAlarm();
    if (audio) audioRef.current = audio;

    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }

    const scheduledTimeStr = new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

    setMissedAlert({
      id: reminder._id,
      name: reminder.medicine?.name || 'Medicine',
      dosage: reminder.medicine?.dosage || '',
      type: reminder.medicine?.type || 'tablet',
      scheduledTime: scheduledTimeStr,
      minutesLate,
      status: reminder.status,
    });
    setShowBanner(true);

    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('⚠️ Missed Medicine!', {
        body: `${reminder.medicine?.name} was scheduled at ${scheduledTimeStr}. ${minutesLate} minutes late!`,
        icon: '/logo.svg',
        tag: `missed-${reminder._id}`,
        requireInteraction: true,
      });
      notif.onclick = () => { window.focus(); notif.close(); };
      setTimeout(() => notif.close(), 30000);
    }

    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-white">Missed Medicine!</p>
          <p className="text-sm text-red-200">
            {reminder.medicine?.name} — {minutesLate} min late
          </p>
        </div>
        <button onClick={() => toast.dismiss(t.id)} className="text-slate-300 ml-2">✕</button>
      </div>
    ), {
      duration: 15000,
      style: { background: '#7f1d1d', border: '1px solid #ef4444', color: '#fff' },
    });
  };

  const handleTakeNow = async () => {
    if (!missedAlert) return;
    try {
      await api.put(`/reminders/${missedAlert.id}/take`);
      toast.success(`✅ ${missedAlert.name} marked as taken!`);
      setShowBanner(false);
      setMissedAlert(null);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      refetch();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setMissedAlert(null);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  };

  if (!showBanner || !missedAlert) return null;

  const typeIcons = {
    tablet: '💊', syrup: '🧴', injection: '💉',
    drops: '💧', inhaler: '🫁', capsule: '💊', cream: '🧴'
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/40">

        {/* Pulsing red header */}
        <div className="bg-red-600 px-5 py-5 text-center">
          <div className="text-5xl mb-2 animate-bounce">⚠️</div>
          <h2 className="text-white text-xl font-bold">
            {missedAlert.status === 'missed' ? 'Medicine Missed!' : 'Take Your Medicine!'}
          </h2>
          <p className="text-red-100 text-sm mt-1">
            {missedAlert.minutesLate} minutes overdue
          </p>
        </div>

        <div className="p-5">

          {/* Medicine card */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl">
                {typeIcons[missedAlert.type] || '💊'}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{missedAlert.name}</p>
                <p className="text-slate-400 text-sm">{missedAlert.dosage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-red-400 text-xs">⏰ Scheduled:</span>
                  <span className="text-red-300 text-xs font-semibold">{missedAlert.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-orange-400 text-xs">🕐 Now late by:</span>
                  <span className="text-orange-300 text-xs font-bold">{missedAlert.minutesLate} minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status specific message */}
          {missedAlert.status === 'missed' ? (
            <div className="bg-red-900/30 rounded-xl p-3 mb-4 text-center">
              <p className="text-red-300 text-xs">
                ⚠️ Your family has been notified about this missed dose.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-900/30 rounded-xl p-3 mb-4 text-center">
              <p className="text-yellow-300 text-xs">
                Please take your medicine now to avoid missing it!
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTakeNow}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2"
            >
              ✅ I Took It Now
            </button>
            <button
              onClick={handleDismiss}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-2xl font-medium text-sm transition"
            >
              ✕ Dismiss (remind me later)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissedMedicineAlarm;
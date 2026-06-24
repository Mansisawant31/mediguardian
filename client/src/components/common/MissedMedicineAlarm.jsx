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

  const { data: remindersData, refetch } = useQuery(
  'missed-check',
  () => api.get('/reminders/missed').then(r => r.data.data),
  {
    refetchInterval: 60000, // check every 1 minute
    refetchIntervalInBackground: true,
  }
);

useEffect(() => {
  if (!remindersData || remindersData.length === 0) return;

  remindersData.forEach(reminder => {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledTime);
    const diffMinutes = Math.floor((now - scheduledTime) / (1000 * 60));
    const alarmKey = `${reminder._id}-${Math.floor(diffMinutes / 15)}`;

    if (!alarmFiredRef.current.has(alarmKey)) {
      alarmFiredRef.current.add(alarmKey);
      triggerMissedAlarm(reminder, diffMinutes);
    }
  });
}, [remindersData]);

  const triggerMissedAlarm = (reminder, minutesLate) => {
    // Play alarm sound
    const audio = playAlarm();
    if (audio) audioRef.current = audio;

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }

    // Show banner
    setMissedAlert({
      id: reminder._id,
      name: reminder.medicine?.name || 'Medicine',
      dosage: reminder.medicine?.dosage || '',
      scheduledTime: new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      }),
      minutesLate,
    });
    setShowBanner(true);

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('⚠️ Missed Medicine Alert!', {
        body: `You missed ${reminder.medicine?.name} scheduled at ${new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Please take it now!`,
        icon: '/logo.svg',
        tag: `missed-${reminder._id}`,
        requireInteraction: true,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    }

    // Toast notification
    toast((t) => (
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-white">Missed Medicine!</p>
          <p className="text-sm text-slate-300">
            {reminder.medicine?.name} — {minutesLate} min late
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-white ml-2"
        >
          ✕
        </button>
      </div>
    ), {
      duration: 15000,
      style: {
        background: '#7f1d1d',
        border: '1px solid #ef4444',
        color: '#fff',
      },
    });
  };

  const handleTakeNow = async () => {
    if (!missedAlert) return;
    try {
      await api.put(`/reminders/${missedAlert.id}/take`);
      toast.success(`✅ ${missedAlert.name} marked as taken!`);
      setShowBanner(false);
      setMissedAlert(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      refetch();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setMissedAlert(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  if (!showBanner || !missedAlert) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">

        {/* Alert Card */}
        <div className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/30">

          {/* Red Header */}
          <div className="bg-red-600 px-5 py-4 text-center">
            <div className="text-5xl mb-2 animate-bounce">⚠️</div>
            <h2 className="text-white text-xl font-bold">Missed Medicine!</h2>
            <p className="text-red-100 text-sm mt-1">
              You are {missedAlert.minutesLate} minutes late
            </p>
          </div>

          {/* Medicine Info */}
          <div className="p-5">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-2xl">
                  💊
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{missedAlert.name}</p>
                  <p className="text-slate-400 text-sm">{missedAlert.dosage}</p>
                  <p className="text-red-400 text-xs mt-1">
                    Scheduled at {missedAlert.scheduledTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Reminder text */}
            <p className="text-slate-300 text-sm text-center mb-5">
              Please take your medicine now or notify your family if you need help.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleTakeNow}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-3.5 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2"
              >
                ✅ I Took It Now
              </button>
              <button
                onClick={handleDismiss}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-2xl font-medium text-sm transition"
              >
                ✕ Dismiss Reminder
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MissedMedicineAlarm;
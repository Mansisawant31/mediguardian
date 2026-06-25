import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { playAlarm } from './useAlarm';

// Global set to track which alarms have fired
const firedAlarms = new Set();
// Global map for repeating alarm intervals
const alarmIntervals = new Map();

const MissedMedicineAlarm = () => {
  const queryClient = useQueryClient();
  const audioRef = useRef(null);
  const [alerts, setAlerts] = useState([]); // queue of missed medicines
  const [currentAlert, setCurrentAlert] = useState(null);
  const swRegistration = useRef(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          swRegistration.current = reg;
          const token = localStorage.getItem('token');
          if (reg.active && token) {
            reg.active.postMessage({ type: 'SET_TOKEN', token });
          }
        })
        .catch(() => {});

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'MEDICINE_TAKEN') {
          handleStopAlarm(event.data.reminderId);
          queryClient.invalidateQueries('today-reminders');
          queryClient.invalidateQueries('missed-alarm-check');
        }
      });
    }
  }, []);

  // Check reminders every 30 seconds
  const { data: remindersData, refetch } = useQuery(
    'missed-alarm-check',
    () => api.get('/reminders').then(r => r.data.data),
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
      onSuccess: (data) => checkForMissedMedicines(data),
    }
  );

  const takeMutation = useMutation(
    (id) => api.put(`/reminders/${id}/take`),
    {
      onSuccess: (_, reminderId) => {
        handleStopAlarm(reminderId);
        toast.success('✅ Medicine marked as Taken!');
        queryClient.invalidateQueries('today-reminders');
        queryClient.invalidateQueries('missed-alarm-check');
        refetch();
        setCurrentAlert(null);
        setAlerts(prev => prev.filter(a => a.id !== reminderId));
      },
      onError: () => toast.error('Failed to update'),
    }
  );

  const checkForMissedMedicines = useCallback((data) => {
    if (!data) return;
    const now = new Date();
    const newAlerts = [];

    data.forEach(reminder => {
      const scheduledTime = new Date(reminder.scheduledTime);
      const diffMs = now - scheduledTime;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Only trigger for overdue medicines (5 min to 2 hours late)
      const isOverdue = diffMinutes >= 5 && diffMinutes <= 120;
      const isNotTaken = reminder.status === 'pending' || reminder.status === 'missed';

      if (!isOverdue || !isNotTaken) return;

      // Use 15-min window to avoid spam
      const windowKey = Math.floor(diffMinutes / 15);
      const alarmKey = `${reminder._id}-${windowKey}`;

      if (!firedAlarms.has(alarmKey)) {
        firedAlarms.add(alarmKey);

        newAlerts.push({
          id: reminder._id,
          name: reminder.medicine?.name || 'Medicine',
          dosage: reminder.medicine?.dosage || '',
          type: reminder.medicine?.type || 'tablet',
          scheduledTime: scheduledTime.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          }),
          minutesLate: diffMinutes,
          status: reminder.status,
        });

        // Start repeating alarm
        startRepeatingAlarm(reminder._id, reminder.medicine?.name, scheduledTime);
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const truly = newAlerts.filter(a => !existingIds.has(a.id));
        return [...prev, ...truly];
      });
    }
  }, []);

  const startRepeatingAlarm = (reminderId, medicineName, scheduledTime) => {
    // Stop existing alarm for this reminder
    if (alarmIntervals.has(reminderId)) {
      clearInterval(alarmIntervals.get(reminderId));
    }

    const playAndNotify = () => {
      // Play sound
      const audio = playAlarm();
      audioRef.current = audio;

      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate([600, 200, 600, 200, 600]);
      }

      // Service worker notification
      if (swRegistration.current?.active) {
        swRegistration.current.active.postMessage({
          type: 'TRIGGER_ALARM',
          medicineName,
          scheduledTime: scheduledTime.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          }),
          reminderId,
        });
      }

      // Browser notification fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Medicine Reminder!', {
          body: `Take ${medicineName} now! Scheduled at ${scheduledTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
          tag: `alarm-${reminderId}`,
          requireInteraction: true,
          icon: '/logo.svg',
        });
      }
    };

    // Play immediately
    playAndNotify();

    // Repeat every 2 minutes
    const intervalId = setInterval(playAndNotify, 2 * 60 * 1000);
    alarmIntervals.set(reminderId, intervalId);
  };

  const handleStopAlarm = (reminderId) => {
    // Clear repeating interval
    if (alarmIntervals.has(reminderId)) {
      clearInterval(alarmIntervals.get(reminderId));
      alarmIntervals.delete(reminderId);
    }

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Close SW notification
    if (swRegistration.current?.active) {
      swRegistration.current.active.postMessage({
        type: 'STOP_ALARM',
        reminderId,
      });
    }
  };

  // Show alerts one at a time
  useEffect(() => {
    if (alerts.length > 0 && !currentAlert) {
      setCurrentAlert(alerts[0]);
    }
  }, [alerts, currentAlert]);

  const handleTakeNow = () => {
    if (!currentAlert) return;
    takeMutation.mutate(currentAlert.id);
  };

  const handleDismiss = () => {
    if (!currentAlert) return;
    handleStopAlarm(currentAlert.id);
    setAlerts(prev => prev.filter(a => a.id !== currentAlert.id));
    setCurrentAlert(null);
  };

  const typeIcons = {
    tablet: '💊', syrup: '🧴', injection: '💉',
    drops: '💧', inhaler: '🫁', capsule: '💊', cream: '🧴'
  };

  if (!currentAlert) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center px-4">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-red-500/40">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-500 px-5 py-5 text-center">
          <div className="text-5xl mb-2 animate-bounce">⚠️</div>
          <h2 className="text-white text-xl font-bold">
            {currentAlert.status === 'missed' ? 'Medicine Missed!' : 'Take Your Medicine!'}
          </h2>
          <p className="text-red-100 text-sm mt-1">
            {currentAlert.minutesLate} minutes overdue
          </p>
          {alerts.length > 1 && (
            <p className="text-red-200 text-xs mt-1">
              +{alerts.length - 1} more medicine{alerts.length > 2 ? 's' : ''} pending
            </p>
          )}
        </div>

        <div className="p-5">

          {/* Medicine Info Card */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-3xl">
                {typeIcons[currentAlert.type] || '💊'}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">{currentAlert.name}</p>
                <p className="text-slate-400 text-sm">{currentAlert.dosage}</p>
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-xs">⏰ Scheduled:</span>
                    <span className="text-white text-xs font-semibold">{currentAlert.scheduledTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-400 text-xs">🕐 Late by:</span>
                    <span className="text-red-300 text-xs font-bold">{currentAlert.minutesLate} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className={`rounded-xl p-3 mb-4 text-center ${
            currentAlert.status === 'missed'
              ? 'bg-red-900/30 border border-red-800/50'
              : 'bg-yellow-900/30 border border-yellow-800/50'
          }`}>
            <p className={`text-xs ${
              currentAlert.status === 'missed' ? 'text-red-300' : 'text-yellow-300'
            }`}>
              {currentAlert.status === 'missed'
                ? '⚠️ Your family has been notified about this missed dose.'
                : '💊 Please take your medicine now to stay on track!'}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTakeNow}
              disabled={takeMutation.isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-4 rounded-2xl font-bold text-base transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {takeMutation.isLoading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : (
                <>✅ I Took It Now — Stop Alarm</>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-2xl font-medium text-sm transition"
            >
              ✕ Dismiss (alarm will repeat in 2 min)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MissedMedicineAlarm;
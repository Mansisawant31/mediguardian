import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { startGlobalAlarm, stopGlobalAlarm } from './globalAlarm';

const firedAlarms = new Set();

const MissedMedicineAlarm = () => {
  const queryClient = useQueryClient();
  const [currentAlert, setCurrentAlert] = useState(null);
  const alertQueueRef = useRef([]);

  const { data: remindersData, refetch } = useQuery(
    'missed-alarm-check',
    () => api.get('/reminders').then(r => r.data.data),
    {
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
    }
  );

  // Check for missed medicines whenever data updates
  useEffect(() => {
    if (!remindersData) return;
    const now = new Date();

    remindersData.forEach(reminder => {
      const scheduledTime = new Date(reminder.scheduledTime);
      const diffMinutes = Math.floor((now - scheduledTime) / (1000 * 60));
      const isOverdue = diffMinutes >= 5 && diffMinutes <= 120;
      const isNotTaken = reminder.status === 'pending' || reminder.status === 'missed';

      if (!isOverdue || !isNotTaken) return;

      const windowKey = Math.floor(diffMinutes / 15);
      const alarmKey = `${reminder._id}-${windowKey}`;

      if (!firedAlarms.has(alarmKey)) {
        firedAlarms.add(alarmKey);

        const alertData = {
          id: reminder._id,
          name: reminder.medicine?.name || 'Medicine',
          dosage: reminder.medicine?.dosage || '',
          type: reminder.medicine?.type || 'tablet',
          scheduledTime: scheduledTime.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          }),
          minutesLate: diffMinutes,
          status: reminder.status,
        };

        alertQueueRef.current.push(alertData);

        // Start alarm immediately
        startGlobalAlarm();

        // Show browser notification
        showBrowserNotification(reminder);
      }
    });

    // Show next alert from queue
    if (alertQueueRef.current.length > 0 && !currentAlert) {
      setCurrentAlert(alertQueueRef.current[0]);
    }
  }, [remindersData]);

  const showBrowserNotification = (reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const timeStr = new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      });
      const notif = new Notification('⚠️ Missed Medicine!', {
        body: `Take ${reminder.medicine?.name} now! Scheduled at ${timeStr}`,
        icon: '/logo.svg',
        tag: `alarm-${reminder._id}`,
        requireInteraction: true,
      });
      notif.onclick = () => { window.focus(); notif.close(); };
    }
  };

  const takeMutation = useMutation(
    (id) => api.put(`/reminders/${id}/take`),
    {
      onMutate: () => {
        // ✅ STOP ALARM INSTANTLY — before API call even completes
        stopGlobalAlarm();
        setCurrentAlert(null);
        alertQueueRef.current = alertQueueRef.current.slice(1);
      },
      onSuccess: () => {
        toast.success('✅ Medicine marked as Taken!');
        queryClient.invalidateQueries('today-reminders');
        queryClient.invalidateQueries('missed-alarm-check');
        refetch();

        // Show next alert if any
        if (alertQueueRef.current.length > 0) {
          setTimeout(() => {
            setCurrentAlert(alertQueueRef.current[0]);
            startGlobalAlarm();
          }, 1000);
        }
      },
      onError: () => {
        toast.error('Failed to update — please try again');
        // Restart alarm if failed
        if (alertQueueRef.current.length > 0) {
          setCurrentAlert(alertQueueRef.current[0]);
          startGlobalAlarm();
        }
      },
    }
  );

  const handleTakeNow = () => {
    if (!currentAlert) return;
    // ✅ Stop alarm FIRST immediately
    stopGlobalAlarm();
    takeMutation.mutate(currentAlert.id);
  };

  const handleDismiss = () => {
    if (!currentAlert) return;
    // Stop alarm immediately
    stopGlobalAlarm();
    alertQueueRef.current = alertQueueRef.current.slice(1);
    setCurrentAlert(null);

    // Show next alert if any
    if (alertQueueRef.current.length > 0) {
      setTimeout(() => {
        setCurrentAlert(alertQueueRef.current[0]);
        startGlobalAlarm();
      }, 500);
    }
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
          {alertQueueRef.current.length > 1 && (
            <p className="text-red-200 text-xs mt-1">
              +{alertQueueRef.current.length - 1} more medicine pending
            </p>
          )}
        </div>

        <div className="p-5">

          {/* Medicine Info */}
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
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>✅ Mark as Taken — Stop Alarm</>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-2xl font-medium text-sm transition"
            >
              ✕ Dismiss
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MissedMedicineAlarm;
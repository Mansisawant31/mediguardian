// client/src/components/common/SnoozeAlarm.jsx
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

const SnoozeAlarm = ({ medicineName, snoozeUntil, status, onAlarm }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const alarmFiredRef = useRef(false);

  useEffect(() => {
    // Stop everything if medicine is already taken/skipped
    if (status === 'taken' || status === 'skipped') {
      setTimeLeft(null);
      alarmFiredRef.current = false;
      return;
    }

    if (!snoozeUntil) return;

    alarmFiredRef.current = false;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(snoozeUntil).getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);

        if (!alarmFiredRef.current) {
          alarmFiredRef.current = true;
          playAlarmSound();
          showBrowserNotification(medicineName);
          toast((t) => (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold">Medicine Time!</p>
                <p className="text-sm">Time to take {medicineName}</p>
              </div>
            </div>
          ), { duration: 8000, icon: '⏰' });

          if (onAlarm) onAlarm();
        }
      } else {
        setTimeLeft(Math.ceil(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [snoozeUntil, medicineName, onAlarm, status]);

  const playAlarmSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
      audio.play().catch(() => {});
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    } catch (e) {}
  };

  const showBrowserNotification = (name) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('⏰ Medicine Reminder', {
        body: `Time to take ${name}!`,
        icon: '/logo.svg',
        tag: `medicine-${name}`, // prevents duplicate notifications stacking
      });
      // Auto close notification after 10 seconds
      setTimeout(() => notif.close(), 10000);
    }
  };

  // Don't render anything if taken/skipped or no countdown
  if (status === 'taken' || status === 'skipped') return null;
  if (!snoozeUntil || timeLeft === null || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 mt-1 flex items-center gap-2">
      <span className="text-lg">⏰</span>
      <p className="text-blue-400 text-xs font-medium">
        Snoozed — Alarm in {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
};

export default SnoozeAlarm;
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { playAlarm } from './useAlarm';

const SnoozeAlarm = ({ medicineName, snoozeUntil, status, onAlarm }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const alarmFiredRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (status === 'taken' || status === 'skipped') {
      setTimeLeft(null);
      alarmFiredRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
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

          // Play custom or default alarm
          const audio = playAlarm();
          if (audio) audioRef.current = audio;

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notif = new Notification('⏰ Medicine Reminder', {
              body: `Time to take ${medicineName}!`,
              tag: `medicine-${medicineName}`,
            });
            setTimeout(() => notif.close(), 10000);
          }

          // Toast notification
          toast((t) => (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-white">Medicine Time!</p>
                <p className="text-sm text-slate-300">Time to take {medicineName}</p>
              </div>
            </div>
          ), { duration: 10000 });

          if (onAlarm) onAlarm();
        }
      } else {
        setTimeLeft(Math.ceil(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [snoozeUntil, medicineName, onAlarm, status]);

  if (status === 'taken' || status === 'skipped') return null;
  if (!snoozeUntil || timeLeft === null || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 mt-1 flex items-center gap-2">
      <span className="text-lg animate-pulse">⏰</span>
      <p className="text-blue-400 text-xs font-medium">
        Alarm in {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  );
};

export default SnoozeAlarm;
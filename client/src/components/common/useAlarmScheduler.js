// client/src/components/common/useAlarmScheduler.js
import { useEffect, useRef, useCallback } from 'react';
import { playAlarm } from './useAlarm';

const activeAlarms = new Map(); // reminderId -> { intervalId, audioRef }

export const useAlarmScheduler = ({ reminders, onTake, onRefetch }) => {
  const audioRef = useRef(null);
  const registrationRef = useRef(null);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        registrationRef.current = reg;
        console.log('✅ Service Worker registered');

        // Send auth token to SW
        const token = localStorage.getItem('token');
        if (reg.active && token) {
          reg.active.postMessage({ type: 'SET_TOKEN', token });
        }
      }).catch(err => console.log('SW Error:', err));

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'MEDICINE_TAKEN') {
          stopAlarm(event.data.reminderId);
          if (onRefetch) onRefetch();
        }
      });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const stopAlarm = useCallback((reminderId) => {
    if (activeAlarms.has(reminderId)) {
      const { intervalId, audio } = activeAlarms.get(reminderId);
      clearInterval(intervalId);
      if (audio) { audio.pause(); audio.currentTime = 0; }
      activeAlarms.delete(reminderId);
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Tell service worker to close notification
    if (registrationRef.current?.active) {
      registrationRef.current.active.postMessage({
        type: 'STOP_ALARM',
        reminderId,
      });
    }
  }, []);

  const startAlarm = useCallback((reminder) => {
    const reminderId = reminder._id;

    // Don't start if already ringing
    if (activeAlarms.has(reminderId)) return;

    const scheduledTimeStr = new Date(reminder.scheduledTime)
      .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Play sound immediately
    const audio = playAlarm();
    audioRef.current = audio;

    // Tell service worker to show notification
    if (registrationRef.current?.active) {
      registrationRef.current.active.postMessage({
        type: 'TRIGGER_ALARM',
        medicineName: reminder.medicine?.name,
        scheduledTime: scheduledTimeStr,
        reminderId,
      });
    }

    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([600, 300, 600, 300, 600]);
    }

    // Repeat alarm every 2 minutes
    const intervalId = setInterval(() => {
      const a = playAlarm();
      audioRef.current = a;
      if (navigator.vibrate) navigator.vibrate([600, 300, 600]);
    }, 2 * 60 * 1000);

    activeAlarms.set(reminderId, { intervalId, audio });

    return reminderId;
  }, []);

  // Stop alarm when medicine is taken
  const handleTakeMedicine = useCallback(async (reminderId) => {
    // Stop alarm FIRST — immediately
    stopAlarm(reminderId);

    // Then call API
    try {
      await onTake(reminderId);
    } catch (err) {
      console.error('Take medicine error:', err);
    }
  }, [stopAlarm, onTake]);

  return { startAlarm, stopAlarm, handleTakeMedicine };
};

export { activeAlarms };
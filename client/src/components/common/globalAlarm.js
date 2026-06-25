// client/src/components/common/globalAlarm.js

let currentAudio = null;
let alarmInterval = null;
let isAlarmPlaying = false;

export const startGlobalAlarm = () => {
  if (isAlarmPlaying) return;
  isAlarmPlaying = true;
  playOnce();
  alarmInterval = setInterval(playOnce, 2 * 60 * 1000);
};

export const stopGlobalAlarm = () => {
  isAlarmPlaying = false;

  // Stop audio immediately
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop web audio context beep
  if (window.__alarmCtx) {
    try { window.__alarmCtx.close(); } catch (e) {}
    window.__alarmCtx = null;
  }

  // Clear repeating interval
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }

  // Stop vibration
  if (navigator.vibrate) navigator.vibrate(0);

  console.log('🔕 Alarm stopped');
};

const playOnce = () => {
  const soundType = localStorage.getItem('alarmSoundType') || 'default';
  const soundData = localStorage.getItem('alarmSound');
  const volume = Number(localStorage.getItem('alarmVolume') || 80) / 100;

  if (navigator.vibrate) {
    navigator.vibrate([600, 200, 600, 200, 600]);
  }

  if (soundType === 'custom' && soundData?.startsWith('data:')) {
    try {
      const audio = new Audio(soundData);
      audio.volume = volume;
      currentAudio = audio;
      audio.play().catch(console.error);
    } catch (e) {}
  } else {
    playBeep(volume);
  }
};

const playBeep = (volume) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    window.__alarmCtx = ctx;

    const beeps = [0, 0.4, 0.8, 1.2, 1.6];
    beeps.forEach(delay => {
      if (!isAlarmPlaying) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) {}
};
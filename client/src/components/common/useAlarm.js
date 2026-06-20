// client/src/components/common/useAlarm.js

export const playAlarm = () => {
  const soundType = localStorage.getItem('alarmSoundType') || 'default';
  const soundData = localStorage.getItem('alarmSound');
  const volume = Number(localStorage.getItem('alarmVolume') || 80) / 100;

  // Vibrate on mobile
  if (navigator.vibrate) {
    navigator.vibrate([400, 200, 400, 200, 400]);
  }

  if (soundType === 'custom' && soundData && soundData.startsWith('data:')) {
    // Play custom uploaded sound
    const audio = new Audio(soundData);
    audio.volume = volume;
    audio.play().catch(console.error);
    return audio;
  } else {
    // Play built-in beep sound
    const soundId = soundData || 'beep';
    playBuiltinSound(soundId, volume);
    return null;
  }
};

const playBuiltinSound = (type, volume) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const configs = {
      beep:   { freq: 880, type: 'sine',     repeats: 3, duration: 0.3 },
      gentle: { freq: 523, type: 'triangle', repeats: 2, duration: 0.5 },
      urgent: { freq: 1200, type: 'square',  repeats: 5, duration: 0.1 },
      nature: { freq: 440, type: 'sine',     repeats: 3, duration: 0.4 },
    };

    const config = configs[type] || configs.beep;

    for (let i = 0; i < config.repeats; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = config.freq;
      osc.type = config.type;

      const startTime = ctx.currentTime + i * (config.duration + 0.15);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration);
      osc.start(startTime);
      osc.stop(startTime + config.duration);
    }
  } catch (e) {
    console.error('Audio error:', e);
  }
};
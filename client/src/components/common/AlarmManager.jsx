import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const AlarmManager = () => {
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [alarmName, setAlarmName] = useState('Default Beep');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const defaultSounds = [
    { id: 'beep', name: '🔔 Default Beep', url: null },
    { id: 'gentle', name: '🎵 Gentle Chime', url: null },
    { id: 'urgent', name: '🚨 Urgent Alert', url: null },
    { id: 'nature', name: '🌿 Nature Bell', url: null },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('alarmSound');
    const savedName = localStorage.getItem('alarmSoundName');
    if (saved) {
      setSelectedAlarm(saved);
      setAlarmName(savedName || 'Custom Sound');
    }
    const savedVolume = localStorage.getItem('alarmVolume');
    if (savedVolume) setVolume(Number(savedVolume));
  }, []);

  const generateBeep = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = type === 'urgent' ? 0.1 : 0.3;
    const repeats = type === 'urgent' ? 5 : 2;

    for (let i = 0; i < repeats; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.value = 880;
        osc.type = 'sine';
      } else if (type === 'gentle') {
        osc.frequency.value = 523;
        osc.type = 'triangle';
      } else if (type === 'urgent') {
        osc.frequency.value = 1200;
        osc.type = 'square';
      } else if (type === 'nature') {
        osc.frequency.value = 440;
        osc.type = 'sine';
      }

      const startTime = ctx.currentTime + i * (duration + 0.1);
      gain.gain.setValueAtTime(volume / 100, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    return ctx;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      toast.error('Please select a valid audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large! Max 10MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const audioData = event.target.result;
      localStorage.setItem('alarmSound', audioData);
      localStorage.setItem('alarmSoundName', file.name);
      localStorage.setItem('alarmSoundType', 'custom');
      setSelectedAlarm(audioData);
      setAlarmName(file.name);
      toast.success(`✅ Alarm set to: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleDefaultSound = (sound) => {
    localStorage.setItem('alarmSound', sound.id);
    localStorage.setItem('alarmSoundName', sound.name);
    localStorage.setItem('alarmSoundType', 'default');
    setSelectedAlarm(sound.id);
    setAlarmName(sound.name);
    toast.success(`✅ Alarm set to: ${sound.name}`);
  };

  const previewSound = (soundId) => {
    if (isPlaying) {
      stopPreview();
      return;
    }
    setIsPlaying(true);

    if (soundId && soundId.startsWith('data:')) {
      const audio = new Audio(soundId);
      audio.volume = volume / 100;
      audioRef.current = audio;
      audio.play().catch(() => toast.error('Cannot play audio'));
      audio.onended = () => setIsPlaying(false);
    } else {
      generateBeep(soundId || 'beep');
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    localStorage.setItem('alarmVolume', val);
  };

  const resetToDefault = () => {
    localStorage.removeItem('alarmSound');
    localStorage.removeItem('alarmSoundName');
    localStorage.removeItem('alarmSoundType');
    setSelectedAlarm(null);
    setAlarmName('Default Beep');
    toast.success('Reset to default alarm');
  };

  return (
    <div className="space-y-5">

      {/* Current Alarm */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl">
              🔔
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Current Alarm</p>
              <p className="text-emerald-400 text-xs mt-0.5 max-w-[180px] truncate">{alarmName}</p>
            </div>
          </div>
          <button
            onClick={() => previewSound(selectedAlarm || 'beep')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              isPlaying
                ? 'bg-red-500 text-white'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '▶ Test'}
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium text-sm">🔊 Alarm Volume</p>
          <span className="text-emerald-400 text-sm font-bold">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-slate-500 text-xs mt-1">
          <span>🔇 Silent</span>
          <span>🔊 Max</span>
        </div>
      </div>

      {/* Upload Custom Sound */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-white font-medium text-sm mb-3">📁 Upload Custom Sound</p>
        <p className="text-slate-400 text-xs mb-3">
          Choose any music file from your phone (MP3, WAV, OGG, M4A — max 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-500/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
        >
          📱 Choose from Phone / Computer
        </button>
        {selectedAlarm && selectedAlarm.startsWith('data:') && (
          <div className="mt-3 bg-blue-500/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🎵</span>
              <p className="text-blue-400 text-xs truncate max-w-[180px]">{alarmName}</p>
            </div>
            <button
              onClick={() => previewSound(selectedAlarm)}
              className="text-blue-400 text-xs hover:text-blue-300"
            >
              {isPlaying ? '⏹' : '▶'}
            </button>
          </div>
        )}
      </div>

      {/* Default Sounds */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <p className="text-white font-medium text-sm mb-3">🎵 Built-in Sounds</p>
        <div className="space-y-2">
          {defaultSounds.map(sound => (
            <div
              key={sound.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                selectedAlarm === sound.id
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              onClick={() => handleDefaultSound(sound)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAlarm === sound.id
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-500'
                }`}>
                  {selectedAlarm === sound.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-white text-sm">{sound.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  previewSound(sound.id);
                }}
                className="text-slate-400 hover:text-emerald-400 text-xs px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition"
              >
                {isPlaying ? '⏹' : '▶ Preview'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefault}
        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl text-sm transition"
      >
        🔄 Reset to Default
      </button>

    </div>
  );
};

export default AlarmManager;
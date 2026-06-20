import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { playAlarm } from './useAlarm';

const SnoozeModal = ({ reminderId, onClose, onSnooze }) => {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [selectedSound, setSelectedSound] = useState(
    localStorage.getItem('alarmSoundName') || 'Default Beep'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const snoozeOptions = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
  ];

  const builtinSounds = [
    { id: 'beep', name: '🔔 Default Beep' },
    { id: 'gentle', name: '🎵 Gentle Chime' },
    { id: 'urgent', name: '🚨 Urgent Alert' },
    { id: 'nature', name: '🌿 Nature Bell' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large! Max 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      localStorage.setItem('alarmSound', event.target.result);
      localStorage.setItem('alarmSoundName', file.name);
      localStorage.setItem('alarmSoundType', 'custom');
      setSelectedSound(file.name);
      toast.success(`✅ Alarm set: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleBuiltinSound = (sound) => {
    localStorage.setItem('alarmSound', sound.id);
    localStorage.setItem('alarmSoundName', sound.name);
    localStorage.setItem('alarmSoundType', 'default');
    setSelectedSound(sound.name);
  };

  const previewAlarm = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const audio = playAlarm();
    if (audio) {
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    } else {
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const handleConfirmSnooze = () => {
    onSnooze(reminderId, selectedMinutes);
    toast.success(`⏰ Snoozed for ${selectedMinutes} min — alarm: ${selectedSound}`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
      <div className="bg-slate-800 rounded-3xl w-full max-w-md border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-700 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">⏰ Snooze Options</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-5">

          {/* Snooze Duration */}
          <div>
            <p className="text-slate-300 text-sm font-medium mb-3">Snooze Duration</p>
            <div className="grid grid-cols-5 gap-2">
              {snoozeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMinutes(opt.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition ${
                    selectedMinutes === opt.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Sound Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-300 text-sm font-medium">Alarm Sound</p>
              <button
                onClick={previewAlarm}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  isPlaying
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isPlaying ? '⏹ Stop' : '▶ Preview'}
              </button>
            </div>

            {/* Current Sound */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
              <p className="text-emerald-400 text-xs">
                🔔 Current: <span className="font-medium truncate">{selectedSound}</span>
              </p>
            </div>

            {/* Built-in Sounds */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {builtinSounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => handleBuiltinSound(sound)}
                  className={`p-2.5 rounded-xl text-xs text-left transition border ${
                    selectedSound === sound.name
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {sound.name}
                </button>
              ))}
            </div>

            {/* Upload Custom Sound */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-500/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
            >
              📁 Choose Custom Sound from Phone
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmSnooze}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            ⏰ Snooze for {selectedMinutes} min
          </button>

        </div>
      </div>
    </div>
  );
};

export default SnoozeModal;
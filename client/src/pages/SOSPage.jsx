import React, { useState } from 'react';
import api from '../api/axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SOSPage = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleSOS = async () => {
    if (!window.confirm('🚨 Send emergency SOS to all contacts?')) return;
    setLoading(true);
    try {
      let coords = { lat: 18.5204, lng: 73.8567 };
      try { coords = await getLocation(); setLocation(coords); } catch { toast.error('Using default location'); }

      const { data } = await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        message: `🚨 Emergency! ${user?.name} needs immediate help!`,
      });

      setSent(true);
      toast.success(`SOS sent to ${data.data.alertsSent?.length || 0} contacts!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send SOS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-5 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-white text-2xl font-bold">Emergency SOS</h1>
        <p className="text-slate-400 mt-1">Press to alert all family members instantly</p>
      </div>

      <div className="relative mb-10">
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150" />
        <button onClick={handleSOS} disabled={loading || sent}
          className={`relative w-48 h-48 rounded-full text-white font-bold text-xl shadow-2xl transition-all ${
            sent ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 hover:bg-red-600 shadow-red-500/50 active:scale-95'
          } disabled:cursor-not-allowed`}>
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Sending...</span>
            </div>
          ) : sent ? (
            <div className="flex flex-col items-center gap-2"><span className="text-4xl">✅</span><span>SOS Sent!</span></div>
          ) : (
            <div className="flex flex-col items-center gap-2"><span className="text-4xl">🚨</span><span>SOS</span></div>
          )}
        </button>
      </div>

      {sent && location && (
        <div className="bg-emerald-500/20 border border-emerald-500 rounded-2xl p-4 text-center mb-6 w-full max-w-sm">
          <p className="text-emerald-400 font-medium">✅ Emergency alerts sent!</p>
          <a href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank" rel="noreferrer" className="text-emerald-400 text-sm mt-2 block hover:underline">
            📍 View your location on Maps →
          </a>
        </div>
      )}

      {sent && <button onClick={() => setSent(false)} className="text-slate-400 text-sm mb-6">Send another SOS</button>}

      <div className="w-full max-w-sm space-y-3">
        {[
          { icon: '📍', title: 'GPS Location', desc: 'Live location shared with all contacts' },
          { icon: '📱', title: 'WhatsApp Alert', desc: 'Instant message with Google Maps link' },
          { icon: '👨‍👩‍👧', title: 'Family Notified', desc: 'All emergency contacts alerted immediately' },
        ].map(item => (
          <div key={item.title} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-white text-sm font-medium">{item.title}</p>
              <p className="text-slate-400 text-xs">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SOSPage;
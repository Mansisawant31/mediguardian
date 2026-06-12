import React, { useState } from 'react';
import api from '../api/axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const SOSPage = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

 const handleSOS = async () => {
    if (!window.confirm('Send emergency SOS to ALL contacts?')) return;
    setLoading(true);
    setActiveAction('sos');
    try {
      let coords = { lat: 18.5204, lng: 73.8567 };
      try { coords = await getLocation(); setLocation(coords); } catch { toast.error('Using default location'); }
      const { data } = await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        type: 'sos',
      });
      setSent(true);
      toast.success(`SOS sent to ${data.data.alertsSent?.filter(a => a.success).length || 0} contacts!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send SOS');
    } finally { setLoading(false); setActiveAction(null); }
  };
const handleGPSLocation = async () => {
    setLoading(true); setActiveAction('gps');
    try {
      const coords = await getLocation();
      setLocation(coords); setShowMap(true);

      // Send live location to family
      await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        type: 'gps',
      });

      toast.success('📍 Location fetched and shared with family!');
    } catch {
      toast.error('Could not get location. Please enable GPS.');
    } finally { setLoading(false); setActiveAction(null); }
  };

  const handleWhatsAppAlert = async () => {
    setLoading(true); setActiveAction('whatsapp');
    try {
      let coords = { lat: 18.5204, lng: 73.8567 };
      try { coords = await getLocation(); setLocation(coords); } catch {}
      await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        type: 'whatsapp',
      });
      toast.success('📱 WhatsApp alerts sent to all family members!');
    } catch { toast.error('Failed to send WhatsApp alert'); }
    finally { setLoading(false); setActiveAction(null); }
  };

  const handleFamilyNotify = async () => {
    setLoading(true); setActiveAction('family');
    try {
      let coords = { lat: 18.5204, lng: 73.8567 };
      try { coords = await getLocation(); } catch {}
      await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        type: 'family',
      });
      toast.success('👨‍👩‍👧 All family members notified!');
    } catch { toast.error('Failed to notify family'); }
    finally { setLoading(false); setActiveAction(null); }
  };

  const handleSocietySOS = async () => {
    setLoading(true); setActiveAction('society');
    try {
      let coords = { lat: 18.5204, lng: 73.8567 };
      try { coords = await getLocation(); } catch {}
      await api.post('/sos', {
        lat: coords.lat, lng: coords.lng,
        type: 'society',
      });
      toast.success('🏘️ Society SOS Team notified!');
    } catch { toast.error('Failed to notify society team'); }
    finally { setLoading(false); setActiveAction(null); }
  };

  const mapsLink = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : '#';
  const hospitalsLink = location ? `https://www.google.com/maps/search/hospitals/@${location.lat},${location.lng},14z` : '#';

  return (
    <div className="min-h-screen bg-slate-900 pb-24">

      <div className="bg-red-600 px-5 pt-12 pb-6 rounded-b-3xl">
        <h1 className="text-white text-2xl font-bold text-center">Emergency SOS</h1>
        <p className="text-red-100 text-sm text-center mt-1">Press SOS to alert all contacts immediately</p>
      </div>

      <div className="px-5 mt-6 space-y-4">

        <div className="flex justify-center my-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150" />
            <button
              onClick={handleSOS}
              disabled={loading}
              className={`relative w-40 h-40 rounded-full text-white font-bold shadow-2xl transition-all active:scale-95 disabled:cursor-not-allowed ${sent ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 hover:bg-red-600 shadow-red-500/50'}`}
            >
              {loading && activeAction === 'sos' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Sending...</span>
                </div>
              ) : sent ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl">✅</span>
                  <span className="text-sm font-bold">SOS Sent!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl">🚨</span>
                  <span className="text-xl font-bold">SOS</span>
                  <span className="text-xs">Tap to Alert</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {sent && location && (
          <div className="bg-emerald-500/20 border border-emerald-500 rounded-2xl p-4 text-center">
            <p className="text-emerald-400 font-semibold">Emergency alerts sent to all contacts!</p>
            <a href={mapsLink} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm mt-2 block hover:underline">
              View your location on Google Maps
            </a>
          </div>
        )}

        {sent && (
          <button onClick={() => setSent(false)} className="w-full text-slate-400 text-sm py-2">
            Send another SOS
          </button>
        )}

        <h2 className="text-white font-semibold text-lg">Emergency Options</h2>

        <div className="space-y-3">

          <button
            onClick={handleGPSLocation}
            disabled={loading}
            className="w-full bg-slate-800 border border-blue-500/30 hover:border-blue-500 rounded-2xl p-4 flex items-center gap-4 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📍</div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold">GPS Location</p>
              <p className="text-slate-400 text-xs mt-0.5">Fetch live location and show nearby hospitals on map</p>
            </div>
            {loading && activeAction === 'gps' && (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          <button
            onClick={handleWhatsAppAlert}
            disabled={loading}
            className="w-full bg-slate-800 border border-green-500/30 hover:border-green-500 rounded-2xl p-4 flex items-center gap-4 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📱</div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold">WhatsApp Alert</p>
              <p className="text-slate-400 text-xs mt-0.5">Send location and emergency message via WhatsApp</p>
            </div>
            {loading && activeAction === 'whatsapp' && (
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          <button
            onClick={handleFamilyNotify}
            disabled={loading}
            className="w-full bg-slate-800 border border-purple-500/30 hover:border-purple-500 rounded-2xl p-4 flex items-center gap-4 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">👨‍👩‍👧</div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold">Family Notified</p>
              <p className="text-slate-400 text-xs mt-0.5">Send emergency reminder to all family contacts</p>
            </div>
            {loading && activeAction === 'family' && (
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          <button
            onClick={handleSocietySOS}
            disabled={loading}
            className="w-full bg-slate-800 border border-yellow-500/30 hover:border-yellow-500 rounded-2xl p-4 flex items-center gap-4 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🏘️</div>
            <div className="text-left flex-1">
              <p className="text-white font-semibold">Society SOS Team</p>
              <p className="text-slate-400 text-xs mt-0.5">Alert society security and emergency contacts</p>
            </div>
            {loading && activeAction === 'society' && (
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            )}
          </button>

        </div>

        {showMap && location && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <h3 className="text-white font-semibold">Your Location</h3>
              <a href={hospitalsLink} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline">
                Nearby Hospitals
              </a>
            </div>
            <iframe
              title="map"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
            />
            <div className="p-4 space-y-2">
              <p className="text-slate-400 text-xs">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
              <a
                href={hospitalsLink}
                target="_blank"
                rel="noreferrer"
                className="block bg-blue-500 text-white text-center py-2 rounded-xl text-sm font-medium"
              >
                Find Nearby Hospitals
              </a>
              
              <a  href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="block bg-emerald-500 text-white text-center py-2 rounded-xl text-sm font-medium"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        )}

      

      </div>
    </div>
  );
};

export default SOSPage;
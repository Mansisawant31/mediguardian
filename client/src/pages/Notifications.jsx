import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAllRead } from '../store/slices/notificationSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

const typeIcons = { reminder:'💊', missed_dose:'⚠️', sos:'🚨', refill:'🔴', health:'❤️', system:'🔔', family_alert:'👨‍👩‍👧' };
const typeColors = { reminder:'text-blue-400', missed_dose:'text-red-400', sos:'text-red-500', refill:'text-yellow-400', health:'text-purple-400', system:'text-slate-400' };

const Notifications = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(state => state.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const handleDelete = async (id) => {
    await api.delete(`/notifications/${id}`);
    toast.success('Deleted');
    dispatch(fetchNotifications());
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-slate-400 text-sm">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={() => dispatch(markAllRead())} className="text-emerald-400 text-sm">Mark all read</button>
          )}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-slate-400">No notifications yet</p>
          </div>
        ) : items.map(n => (
          <div key={n._id} className={`bg-slate-800 rounded-2xl p-4 flex gap-3 border ${n.isRead ? 'border-slate-700' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
            <span className="text-2xl mt-0.5">{typeIcons[n.type] || '🔔'}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${typeColors[n.type] || 'text-slate-400'}`}>{n.title}</p>
              <p className="text-white text-sm mt-0.5">{n.message}</p>
              <p className="text-slate-500 text-xs mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <button onClick={() => handleDelete(n._id)} className="text-slate-500 hover:text-red-400 transition text-sm self-start">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
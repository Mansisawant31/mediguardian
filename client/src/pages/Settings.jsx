import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      <div className="bg-slate-800 px-5 pt-12 pb-5 border-b border-slate-700">
        <h1 className="text-white text-2xl font-bold">Settings</h1>
      </div>

      <div className="mx-5 mt-5 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            {user?.role === 'patient' ? '🤒' : user?.role === 'caregiver' ? '👩‍⚕️' : '👤'}
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">{user?.name}</h2>
            <p className="text-emerald-100 text-sm">{user?.email}</p>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
              {user?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {[
          {
            title: 'Account',
            items: [
              { icon: '👤', label: 'Profile', desc: 'Edit your information' },
              { icon: '🔔', label: 'Notifications', desc: 'Manage alert preferences' },
              { icon: '🔒', label: 'Privacy & Security', desc: 'Password and data' },
            ],
          },
          {
            title: 'App',
            items: [
              { icon: '🌙', label: 'Theme', desc: 'Dark mode (default)' },
              { icon: '🌍', label: 'Language', desc: 'English' },
              { icon: 'ℹ️', label: 'About MediGuardian', desc: 'v1.0.0' },
            ],
          },
        ].map(group => (
          <div key={group.title}>
            <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{group.title}</h3>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden divide-y divide-slate-700">
              {group.items.map(item => (
                <button key={item.label} className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-slate-400 text-xs">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleLogout}
          className="w-full bg-red-500/20 border border-red-500/30 text-red-400 py-4 rounded-2xl font-medium hover:bg-red-500/30 transition">
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
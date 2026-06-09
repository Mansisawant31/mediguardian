import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/axios';
import { fetchMedicines } from '../store/slices/medicineSlice';
import { logout } from '../store/slices/authSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { items: medicines } = useSelector(state => state.medicines);

  const { data: remindersData } = useQuery('today-reminders', () =>
    api.get('/reminders').then(r => r.data.data), { refetchInterval: 60000 }
  );
  const { data: healthSummary } = useQuery('health-summary', () =>
    api.get('/health/summary').then(r => r.data.data)
  );

  useEffect(() => { dispatch(fetchMedicines()); }, [dispatch]);

  const reminders = remindersData || [];
  const pending = reminders.filter(r => r.status === 'pending').length;
  const taken = reminders.filter(r => r.status === 'taken').length;
  const missed = reminders.filter(r => r.status === 'missed').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">{greeting()},</p>
            <h1 className="text-white text-2xl font-bold">{user?.name} 👋</h1>
            <p className="text-emerald-100 text-xs mt-1">Stay healthy, stay safe</p>
          </div>

          {/* Right side - Avatar + Logout */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🏥</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Pending', value: pending, icon: '⏰' },
            { label: 'Taken', value: taken, icon: '✅' },
            { label: 'Missed', value: missed, icon: '⚠️' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-white text-2xl font-bold">{s.value}</div>
              <div className="text-emerald-100 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Medicine', icon: '💊', to: '/medicines/add', color: 'from-emerald-600 to-teal-600' },
              { label: 'SOS Alert', icon: '🚨', to: '/sos', color: 'from-red-600 to-rose-600' },
              { label: 'Health Track', icon: '📊', to: '/health', color: 'from-blue-600 to-cyan-600' },
              { label: 'Family', icon: '👨‍👩‍👧', to: '/family', color: 'from-purple-600 to-violet-600' },
            ].map(a => (
              <Link key={a.label} to={a.to}
                className={`bg-gradient-to-br ${a.color} rounded-2xl p-4 flex flex-col items-start gap-2 shadow-lg`}>
                <span className="text-3xl">{a.icon}</span>
                <span className="text-white font-semibold text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-lg">📅 Today's Schedule</h2>
            <Link to="/medicines" className="text-emerald-400 text-sm">See all →</Link>
          </div>
          {reminders.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700">
              <p className="text-4xl mb-2">💊</p>
              <p className="text-slate-400">No medicines scheduled today</p>
              <Link to="/medicines/add" className="text-emerald-400 text-sm mt-2 block">+ Add medicine</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.slice(0, 5).map(r => (
                <div key={r._id} className={`bg-slate-800 rounded-2xl p-4 border border-l-4 ${r.status === 'taken' ? 'border-slate-700 border-l-emerald-500' :
                    r.status === 'missed' ? 'border-slate-700 border-l-red-500' :
                      'border-slate-700 border-l-yellow-500'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl">💊</div>
                      <div>
                        <p className="text-white font-medium text-sm">{r.medicine?.name}</p>
                        <p className="text-slate-400 text-xs">{r.medicine?.dosage}</p>
                        <p className="text-slate-500 text-xs">
                          ⏰ {new Date(r.scheduledTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'taken' ? 'bg-emerald-500/20 text-emerald-400' :
                        r.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {r.status === 'taken' ? '✅ Taken' :
                        r.status === 'missed' ? '⚠️ Missed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {reminders.length > 5 && (
                <Link to="/medicines" className="block text-center text-emerald-400 text-sm py-2">
                  View all {reminders.length} medicines →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Health Overview */}
        {healthSummary && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-lg">Health Overview</h2>
              <Link to="/health" className="text-emerald-400 text-sm">Details →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'blood_pressure', icon: '🩺', label: 'Blood Pressure', format: m => `${m.value}/${m.value2}`, unit: 'mmHg' },
                { key: 'blood_sugar', icon: '🍬', label: 'Blood Sugar', format: m => m.value, unit: 'mg/dL' },
                { key: 'heart_rate', icon: '❤️', label: 'Heart Rate', format: m => m.value, unit: 'bpm' },
                { key: 'oxygen', icon: '🫁', label: 'Oxygen', format: m => m.value, unit: '%' },
              ].filter(item => healthSummary[item.key]).map(item => (
                <div key={item.key} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-white font-bold text-xl">
                    {item.format(healthSummary[item.key])}
                    <span className="text-slate-400 text-xs font-normal ml-1">{item.unit}</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl">
                {user?.role === 'patient' ? '🤒' : user?.role === 'caregiver' ? '👩‍⚕️' : '👤'}
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white text-sm px-4 py-2 rounded-xl transition-all"
            >
              🚪 Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
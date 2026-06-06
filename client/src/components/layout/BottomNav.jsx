import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/medicines', icon: '💊', label: 'Medicines' },
  { to: '/health', icon: '📊', label: 'Health' },
  { to: '/family', icon: '👨‍👩‍👧', label: 'Family' },
  { to: '/notifications', icon: '🔔', label: 'Alerts' },
];

const BottomNav = () => {
  const { unreadCount } = useSelector(state => state.notifications);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-40">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition relative ${
                isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
                {item.label === 'Alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
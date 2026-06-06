import React from 'react';
import { useSelector } from 'react-redux';

const Navbar = () => {
  const { user } = useSelector(state => state.auth);
  return (
    <div className="bg-slate-800 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏥</span>
        <span className="text-white font-bold text-lg">MediGuardian</span>
      </div>
      <div className="text-slate-400 text-sm">{user?.name}</div>
    </div>
  );
};

export default Navbar;
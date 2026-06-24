import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SOSButton from '../sos/SOSButton';
import MissedMedicineAlarm from '../common/MissedMedicineAlarm';

const Layout = () => {
  return (
    <div className="relative min-h-screen bg-slate-900">

      {/* ✅ Missed Medicine Alarm — works on all pages */}
      <MissedMedicineAlarm />

      <main className="pb-20">
        <Outlet />
      </main>

      <SOSButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
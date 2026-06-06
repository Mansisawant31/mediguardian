import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SOSButton from '../sos/SOSButton';

const Layout = () => (
  <div className="relative min-h-screen bg-slate-900">
    <main className="pb-20">
      <Outlet />
    </main>
    <SOSButton />
    <BottomNav />
  </div>
);

export default Layout;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import store from './store/index';

import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import AddMedicine from './pages/AddMedicine';
import Family from './pages/Family';
import HealthTracker from './pages/HealthTracker';
import SOSPage from './pages/SOSPage';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import React, { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function App() {
useEffect(() => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Register and start service worker background check
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      const sendToSW = (sw) => {
        sw.postMessage({
          type: 'START_BACKGROUND_CHECK',
          token,
          apiBase,
        });
      };

      if (reg.active) sendToSW(reg.active);
      else if (reg.installing) reg.installing.addEventListener('statechange', e => {
        if (e.target.state === 'activated') sendToSW(e.target);
      });

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'MEDICINE_TAKEN') {
          window.dispatchEvent(new CustomEvent('medicine-taken', {
            detail: { reminderId: event.data.reminderId }
          }));
        }
      });
    });
  }
}, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/medicines/add" element={<AddMedicine />} />
                <Route path="/family" element={<Family />} />
                <Route path="/health" element={<HealthTracker />} />
                <Route path="/sos" element={<SOSPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
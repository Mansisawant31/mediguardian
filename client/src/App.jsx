import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster, toast } from 'react-hot-toast';

import store from './store';
import api from './api/axios';

import { requestNotificationPermission, onForegroundMessage } from './firebase';
import { startGlobalAlarm } from './components/common/globalAlarm';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {

      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register('/sw.js');

        const authToken = localStorage.getItem('token');
        const apiBase =
          process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

        const sendToSW = (sw) => {
          sw.postMessage({
            type: 'START_BACKGROUND_CHECK',
            token: authToken,
            apiBase,
          });
        };

        if (reg.active) {
          sendToSW(reg.active);
        } else if (reg.installing) {
          reg.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              sendToSW(e.target);
            }
          });
        }
      }

      // ---------------------------
      // Firebase Cloud Messaging
      // ---------------------------

      const fcmToken = await requestNotificationPermission();

      if (fcmToken) {

        const authToken = localStorage.getItem('token');

        if (authToken) {
          await api.put('/auth/fcm-token', {
            fcmToken,
          });
        }

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;

          if (reg.active) {
            reg.active.postMessage({
              type: 'SET_FCM_TOKEN',
              token: authToken,
              apiBase:
                process.env.REACT_APP_API_URL ||
                'http://localhost:5000/api',
            });
          }
        }
      }

      // ---------------------------
      // Foreground Notifications
      // ---------------------------

      onForegroundMessage((payload) => {
        console.log('Foreground message:', payload);

        const {
          title,
          body,
          medicineName,
          reminderId,
        } = payload.data || {};

        // Play alarm
        startGlobalAlarm();

        // Show Toast
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>

              <div>
                <p className="font-bold text-white">
                  {title || 'Medicine Reminder'}
                </p>

                <p className="text-sm text-slate-300">
                  {body || medicineName}
                </p>
              </div>

              <button
                className="ml-2 text-slate-300"
                onClick={() => toast.dismiss(t.id)}
              >
                ✕
              </button>
            </div>
          ),
          {
            duration: 15000,
            style: {
              background: '#7f1d1d',
              border: '1px solid #ef4444',
            },
          }
        );
      });

      // ---------------------------
      // Service Worker Messages
      // ---------------------------

      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data.type === 'MEDICINE_TAKEN') {
          window.dispatchEvent(
            new CustomEvent('medicine-taken', {
              detail: {
                reminderId: event.data.reminderId,
              },
            })
          );
        }
      });

    } catch (err) {
      console.error('Initialization Error:', err);
    }
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>

            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>

              <Route element={<Layout />}>

                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />

                <Route
                  path="/medicines"
                  element={<Medicines />}
                />

                <Route
                  path="/medicines/add"
                  element={<AddMedicine />}
                />

                <Route
                  path="/family"
                  element={<Family />}
                />

                <Route
                  path="/health"
                  element={<HealthTracker />}
                />

                <Route
                  path="/sos"
                  element={<SOSPage />}
                />

                <Route
                  path="/notifications"
                  element={<Notifications />}
                />

                <Route
                  path="/settings"
                  element={<Settings />}
                />

              </Route>

            </Route>

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
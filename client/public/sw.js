// client/public/sw.js
const ALARM_CHECK_INTERVAL = 60; // seconds

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// Store token from main app
let authToken = '';
let apiBase = '';

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_TOKEN') {
    authToken = event.data.token;
    apiBase = event.data.apiBase;
  }

  if (event.data.type === 'START_BACKGROUND_CHECK') {
    authToken = event.data.token;
    apiBase = event.data.apiBase;
    startAlarmCheck();
  }

  if (event.data.type === 'STOP_ALARM') {
    self.registration.getNotifications({ tag: `alarm-${event.data.reminderId}` })
      .then(notifications => notifications.forEach(n => n.close()));
    self.registration.getNotifications({ tag: 'missed-medicine' })
      .then(notifications => notifications.forEach(n => n.close()));
  }
});

// Background check using periodic sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'medicine-check') {
    event.waitUntil(checkMissedMedicines());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/logo.svg',
        tag: data.tag,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        actions: [
          { action: 'take', title: '✅ Mark as Taken' },
          { action: 'dismiss', title: '✕ Dismiss' },
        ],
        data: data.data,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'take') {
    const { reminderId } = event.notification.data || {};
    if (reminderId && authToken && apiBase) {
      event.waitUntil(
        fetch(`${apiBase}/reminders/${reminderId}/take`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }).then(() => {
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({
              type: 'MEDICINE_TAKEN',
              reminderId,
            }));
          });
        }).catch(console.error)
      );
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/medicines');
    })
  );
});

async function checkMissedMedicines() {
  if (!authToken || !apiBase) return;

  try {
    const res = await fetch(`${apiBase}/reminders`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (!data.data) return;

    const now = new Date();
    for (const reminder of data.data) {
      const scheduledTime = new Date(reminder.scheduledTime);
      const diffMinutes = Math.floor((now - scheduledTime) / (1000 * 60));

      if (diffMinutes >= 5 && diffMinutes <= 120 &&
        (reminder.status === 'pending' || reminder.status === 'missed')) {

        const timeStr = scheduledTime.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit'
        });

        await self.registration.showNotification('⚠️ Missed Medicine!', {
          body: `Take ${reminder.medicine?.name} now! Scheduled at ${timeStr}`,
          icon: '/logo.svg',
          tag: `missed-medicine`,
          requireInteraction: true,
          vibrate: [600, 200, 600, 200, 600],
          actions: [
            { action: 'take', title: '✅ Mark as Taken' },
            { action: 'dismiss', title: '✕ Dismiss' },
          ],
          data: { reminderId: reminder._id },
        });
      }
    }
  } catch (err) {
    console.error('SW check error:', err);
  }
}

function startAlarmCheck() {
  setInterval(checkMissedMedicines, ALARM_CHECK_INTERVAL * 1000);
}
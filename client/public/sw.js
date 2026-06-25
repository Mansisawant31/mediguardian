// client/public/sw.js
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for alarm trigger from main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'TRIGGER_ALARM') {
    const { medicineName, scheduledTime, reminderId } = event.data;

    // Show notification even when app is closed
    self.registration.showNotification('⚠️ Medicine Reminder!', {
      body: `Time to take ${medicineName} (scheduled at ${scheduledTime})`,
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: `alarm-${reminderId}`,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      actions: [
        { action: 'take', title: '✅ Mark as Taken' },
        { action: 'dismiss', title: '✕ Dismiss' },
      ],
      data: { reminderId, medicineName },
    });
  }

  if (event.data.type === 'STOP_ALARM') {
    // Close notification when taken
    self.registration.getNotifications({ tag: `alarm-${event.data.reminderId}` })
      .then(notifications => notifications.forEach(n => n.close()));
  }
});

// Handle notification button clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'take') {
    // Mark as taken via API
    const { reminderId } = event.notification.data;
    event.waitUntil(
      fetch(`/api/reminders/${reminderId}/take`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${self.__token || ''}`,
          'Content-Type': 'application/json',
        },
      }).then(() => {
        // Notify all open windows
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({
            type: 'MEDICINE_TAKEN',
            reminderId,
          }));
        });
      })
    );
  }

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/medicines');
      }
    })
  );
});
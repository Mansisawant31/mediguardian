// client/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyBh6NP-qnKO9LpvpTQ6tAdUvuAP42xE1GQ",
  authDomain: "mediguardian-66026.firebaseapp.com",
  projectId: "mediguardian-66026",
  storageBucket: "mediguardian-66026.firebasestorage.app",
  messagingSenderId: "868767894251",
  appId: "1:868767894251:web:a138d04e8f2ec75ef5ccae"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const { title, body, reminderId } = payload.data || {};

  // Play alarm sound via notification
  self.registration.showNotification(title || '⚠️ Medicine Reminder', {
    body: body || 'Time to take your medicine!',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: `medicine-${reminderId}`,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    actions: [
      { action: 'take', title: '✅ Mark as Taken' },
      { action: 'snooze', title: '⏰ Snooze 15 min' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
    data: { reminderId },
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const reminderId = event.notification.data?.reminderId;

  if (event.action === 'take' && reminderId) {
    const token = self.__fcmToken;
    const apiBase = self.__apiBase;

    if (token && apiBase) {
      event.waitUntil(
        fetch(`${apiBase}/reminders/${reminderId}/take`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).then(() => {
          return self.clients.matchAll({ type: 'window' }).then(clients => {
            clients.forEach(c => c.postMessage({
              type: 'MEDICINE_TAKEN',
              reminderId,
            }));
          });
        }).catch(console.error)
      );
    }
  }

  // Open app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/medicines');
    })
  );
});

// Store token for API calls
self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_FCM_TOKEN') {
    self.__fcmToken = event.data.token;
    self.__apiBase = event.data.apiBase;
  }
});
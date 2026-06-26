// server/services/fcmService.js
const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

const initFirebase = () => {
  if (initialized) return;
  try {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin error:', err.message);
  }
};

initFirebase();

// Send push notification to a single device
exports.sendPushNotification = async (fcmToken, data) => {
  if (!initialized || !fcmToken) return false;

  try {
    const message = {
      token: fcmToken,
      data: {
        title: data.title || '⚠️ Medicine Reminder',
        body: data.body || 'Time to take your medicine!',
        reminderId: data.reminderId || '',
        medicineName: data.medicineName || '',
        type: data.type || 'reminder',
      },
      notification: {
        title: data.title || '⚠️ Medicine Reminder',
        body: data.body || 'Time to take your medicine!',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'high',
          channelId: 'medicine-reminders',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title: data.title,
          body: data.body,
          requireInteraction: true,
          icon: '/logo.svg',
          badge: '/logo.svg',
          vibrate: [500, 200, 500, 200, 500],
          actions: [
            { action: 'take', title: '✅ Mark as Taken' },
            { action: 'dismiss', title: '✕ Dismiss' },
          ],
        },
        data: {
          reminderId: data.reminderId || '',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push notification sent: ${response}`);
    return true;
  } catch (err) {
    console.error('FCM Error:', err.message);
    return false;
  }
};

// Send to multiple tokens
exports.sendToMultiple = async (tokens, data) => {
  if (!initialized || !tokens?.length) return;

  const validTokens = tokens.filter(t => t && t.length > 10);
  if (!validTokens.length) return;

  const results = await Promise.all(
    validTokens.map(token => exports.sendPushNotification(token, data))
  );

  return results;
};
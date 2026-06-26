import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBh6NP-qnKO9LpvpTQ6tAdUvuAP42xE1GQ",
  authDomain: "mediguardian-66026.firebaseapp.com",
  projectId: "mediguardian-66026",
  storageBucket: "mediguardian-66026.firebasestorage.app",
  messagingSenderId: "868767894251",
  appId: "1:868767894251:web:a138d04e8f2ec75ef5ccae"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY_HERE'
    });

    console.log('FCM Token:', token);
    return token;
  } catch (err) {
    console.error('FCM Error:', err);
    return null;
  }
};

export const onForegroundMessage = (callback) => {
  return onMessage(messaging, callback);
};

export { messaging };
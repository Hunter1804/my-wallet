import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export async function requestPushPermission(familyId: string) {
  try {
    const messaging = getMessaging();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_FCM_VAPID_KEY is not defined in .env. FCM push registration may fail if missing.');
      }

      // Thay vì tự đăng ký riêng một con SW làm sung đột với Vite PWA,
      // ta lấy con SW chính của website (nó đã import firebase bên trong vite.config.ts)
      const reg = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: reg
      });

      if (token) {
        // Save to Firestore 'fcm_tokens' globally so backend can find it
        await setDoc(doc(db, 'fcm_tokens', token), {
          token,
          familyId,
          createdAt: new Date().toISOString()
        });
        console.log('Firebase Push Notification Token registered.');
      }
    }
  } catch (e) {
    console.error('Failed to request or save push token:', e);
  }
}

export async function disablePush() {
  try {
    const messaging = getMessaging();
    const reg = await navigator.serviceWorker.ready;
    // Get the current token so we can delete it from Firestore
    const token = await getToken(messaging, { serviceWorkerRegistration: reg }).catch(() => null);

    if (token) {
      await deleteDoc(doc(db, 'fcm_tokens', token));
    }
    await deleteToken(messaging);
    console.log('Firebase Push Notification Token deleted.');
  } catch (e) {
    console.error('Failed to disable push token:', e);
  }
}

export function setupMessageListener() {
  try {
    console.log('✅ FCM setupMessageListener is running...');

    // Tắt FCM nội tuyến của Firebase SDK để tránh đúp alert, vì SW của ta đã gánh việc này bằng `data` payload
    // onMessage(messaging, (payload) => { ... })

    // Bắt sự kiện PostMessage độc quyền từ SW của dự án
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_BADGE') {
        console.log('Cập nhật Badge số hiệu:', event.data.badgeCount);
      }
      if (event.data?.type === 'PUSH_NAVIGATE') {
        // Custom Vue Router navigation if needed
        window.location.href = event.data.url;
      }
      if (event.data?.type === 'FCM_DATA') {
        const payload = event.data.payload?.data;
        if (payload?.title && payload?.body) {

        }
      }
    });

  } catch (err) {
    console.error('Failed to init setupMessageListener:', err);
  }
}

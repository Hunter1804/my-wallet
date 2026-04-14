importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDHwZFCG0DCc4oa0jWi_6EJDwUYNiswHbs",
  authDomain: "ewa-wallet.firebaseapp.com",
  projectId: "ewa-wallet",
  storageBucket: "ewa-wallet.firebasestorage.app",
  messagingSenderId: "1076211604218",
  appId: "1:1076211604218:web:c672f5553e395a6e028743"
};

firebase.initializeApp(firebaseConfig);

// Bắt buộc Service Worker cướp quyền điều khiển ngay lập tức để không bị kẹt ở trạng thái "Waiting"
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// messaging.onBackgroundMessage((payload) => {
// });

self.addEventListener('push', async function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data?.data?.title || '💰 Chi tiêu mới!';
    const badgeCount = data?.data?.badge || 1;
    const options = {
        body: data?.data?.body || 'Có cập nhật mới trong ví.',
        icon: '/favicon.svg',
        data: {
            url: data?.data?.url || '/'
        }
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            
            // Send a message to all open clients (tabs).
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'UPDATE_BADGE',
                            badgeCount: badgeCount
                        });
                        client.postMessage({
                            type: 'FCM_DATA',
                            payload: data
                        });
                    });
                })
        ])
    );

    if ('setAppBadge' in self.navigator) {
        try {
            await self.navigator.setAppBadge(badgeCount);
        } catch (error) {
        }
    }
});


// When user clicks on notification
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";

    event.waitUntil((async () => {
        const absoluteUrl = new URL(url, self.location.origin).href;

        const allClients = await clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        });

        // 1) Prioritize focus any tab/app instance with the same origin
        const sameOriginClient = allClients.find(c => {
            try {
                return new URL(c.url).origin === self.location.origin;
            } catch {
                return false;
            }
        });

        if (sameOriginClient) {
            await sameOriginClient.focus();

            // 2) Ensure navigation by message for SPA/MPA
            sameOriginClient.postMessage({
                type: "PUSH_NAVIGATE",
                url: absoluteUrl,
            });

            return;
        }

        // 3) No client -> open new
        if (clients.openWindow) {
            return clients.openWindow(absoluteUrl);
        }
    })());
});

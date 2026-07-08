// Little Rabbani Preschool LMS — Service Worker
// Manages push notifications for reminders (capture-pending, schedule-entry)

const APP_NAME = 'Little Rabbani';

// ─────────────── Install Event ───────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  // Activate immediately without waiting for page reload
  self.skipWaiting();
});

// ─────────────── Activate Event ───────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  // Claim all clients so the SW controls all open pages
  event.waitUntil(clients.claim());
});

// ─────────────── Push Event ───────────────
// Receives push notifications from the server via web-push.
// VAL-REMIN-001: Capture-pending notification
// VAL-REMIN-002: Schedule-entry notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {
    title: APP_NAME,
    body: 'Ada pembaruan dari Little Rabbani',
    icon: '/og-image.png',
    badge: '/og-image.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      // If not JSON, use the raw text as the body
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─────────────── Notification Click Event ───────────────
// When user clicks the notification, open/focus the app.
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Check if there's already an open window
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'notification-clicked' });
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

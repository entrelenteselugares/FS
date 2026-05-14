import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 1. Cache for API (Agenda) - Network First
registerRoute(
  ({ url }) => url.pathname.includes('/api/profissional/agenda'),
  new NetworkFirst({
    cacheName: 'agenda-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 2. Cache for Uploaded Images - Stale While Revalidate
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.pathname.includes('/uploads/'),
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Nova Notificação', body: 'Você tem uma atualização na Foto Segundo.' };

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon.png',
    data: {
      url: data.url || '/'
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
});

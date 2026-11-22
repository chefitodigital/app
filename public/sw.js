// Legacy app-shell service worker cleanup.
// The previous worker cached old JS bundles, so returning browsers could keep
// running the removed Supabase Storage upload path instead of the R2 upload path.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.map((name) => caches.delete(name)));

        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(clients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })()
  );
});
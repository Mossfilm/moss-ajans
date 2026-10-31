// Telefon bildirimleri: servis çalışanına eklenen dinleyiciler
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'Moss Ajans', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Moss Ajans', {
    body: d.body || '',
    icon: self.registration.scope + 'icons/icon-192.png',
    badge: self.registration.scope + 'icons/icon-192.png',
    data: { url: d.url || '/' },
    tag: d.tag || undefined
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = self.registration.scope + '#' + ((event.notification.data && event.notification.data.url) || '/');
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { await c.focus(); if ('navigate' in c) await c.navigate(target); return; }
    }
    await self.clients.openWindow(target);
  })());
});

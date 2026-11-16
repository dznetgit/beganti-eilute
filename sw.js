// Offline palaikymas: programėlės failai ir šriftai saugomi telefone.
const VERSION = 'v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open('shell-' + VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => !k.endsWith(VERSION)).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === 'cdn.jsdelivr.net';

  if (isFont) {
    // šriftai: iš talpyklos, fone atnaujinant
    e.respondWith(caches.open('fonts-' + VERSION).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin === location.origin) {
    // programėlė: pirmiausia tinklas (kad gautum naujausią versiją), be ryšio – talpykla
    e.respondWith(fetch(req).then(r => {
      if (r.ok) caches.open('shell-' + VERSION).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
  }
});

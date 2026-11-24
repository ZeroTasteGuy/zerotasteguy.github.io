// Service worker for VLTL: makes the page work offline.
// Own files: network first (so updates show up right away), the cached copy when offline.
// jsDelivr libraries (mux.js, mediainfo.js and its .wasm): cache first.
const CACHE = 'vltl-test-v1';
const LIBS = [
  'https://cdn.jsdelivr.net/npm/mux.js@6.3.0/dist/mux.min.js',
  'https://cdn.jsdelivr.net/npm/mediainfo.js@0.3.5/dist/umd/index.min.js',
  'https://cdn.jsdelivr.net/npm/mediainfo.js@0.3.5/dist/MediaInfoModule.wasm'
];
const OWN = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../resolve/', '../resolve/HDZeroOSD.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled([
    ...OWN.map(u => c.add(u)),
    ...LIBS.map(u => c.add(new Request(u, { mode: 'cors' })))
  ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const store = res => { if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); } return res; };
  if (url.origin === location.origin) {
    if (req.headers.has('range')) return; // video files and tests: leave alone
    e.respondWith(fetch(req).then(store).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(store)));
  }
});

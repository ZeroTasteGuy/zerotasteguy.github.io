// Service worker for VLTL: makes the page work offline.
// Own files: network first (so updates show up right away), the cached copy when offline.
// Self-hosted libraries in ../lib/ (mux.js, mediainfo.js and its .wasm, Mediabunny): cached on install too.
const CACHE = 'vltl-test-v2';
const LIBS = [
  '../lib/mux.js-6.3.0/mux.min.js',
  '../lib/mediainfo.js-0.3.5/index.min.js',
  '../lib/mediainfo.js-0.3.5/MediaInfoModule.wasm',
  '../lib/mediabunny-1.61.6/mediabunny.min.mjs'
];
const OWN = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', '../resolve/', '../resolve/HDZeroOSD.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled([
    ...OWN.concat(LIBS).map(u => c.add(u))
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
  }
});

// ===== Hylden service worker =====
// Bump CACHE when you change app-shell files so browsers fetch the new ones.
const CACHE = 'hylden-v6';
const SHELL = [
  './', './index.html',
  './css/style.css?v=6',
  './js/app.js?v=6', './js/config.js', './js/auth.js',
  './js/spotify.js', './js/demo.js',
  './manifest.json?v=6',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // Never cache Spotify API / auth — always go to network.
  if (url.hostname.endsWith('spotify.com')) return;
  // App shell: cache-first, fall back to network.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res=>{
      if (res.ok && url.origin===location.origin){
        const copy = res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy));
      }
      return res;
    }).catch(()=>hit))
  );
});

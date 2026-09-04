const CACHE_NAME = 'tng-qr-v1';
const SHARED_IMG_KEY = 'shared-qr-image';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Web Share Target:别的 App 分享图片进来时,把文件存进 Cache,主页面再读出来
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method === 'POST' && url.pathname.endsWith('/share-handler')) {
    e.respondWith(Response.redirect('./?shared=1'));
    e.waitUntil((async () => {
      try {
        const data = await e.request.formData();
        const file = data.get('qr');
        if (file) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(SHARED_IMG_KEY, new Response(file, {
            headers: { 'Content-Type': file.type || 'image/png' }
          }));
        }
      } catch (err) {
        console.error('share target error', err);
      }
    })());
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});

const cacheName = 'ffmpegweb-cache';
const filestoCache = [
    './',
    './index.html',
    './out.js',
    './style.css',
    './assets/mergedAssets.json',
    './assets/logo.png',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@700&family=Work+Sans&display=swap',
    'https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css',
    'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    'https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js',
    'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    "./translations/it.json"
];
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(filestoCache))
    );
});
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.url.indexOf("updatecode") !== -1) return fetch(req); else event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
    try {
        const networkResponse = await fetch(req);
        const cache = await caches.open('ffmpegweb-cache');
        await cache.delete(req);
        await cache.put(req, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(req);
        return cachedResponse;
    }
}
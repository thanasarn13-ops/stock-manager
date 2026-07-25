const CACHE = 'stock-v4'; // เพิ่มเลขทุกครั้งที่อัพเดท → บังคับโหลดใหม่

const FILES = [
  '/stock-manager/',
  '/stock-manager/index.html',
  '/stock-manager/manifest.json',
  '/stock-manager/icon-192.png',
  '/stock-manager/icon-512.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://unpkg.com/@zxing/library@0.18.6/umd/index.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting()) // บังคับ activate ทันที
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim()) // บังคับทุก tab ใช้ SW ใหม่
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Network first สำหรับ index.html เพื่อให้ได้เวอร์ชันล่าสุดเสมอ
      if (e.request.url.includes('index.html')) {
        return fetch(e.request)
          .then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return res;
          })
          .catch(() => cached);
      }
      // Cache first สำหรับไฟล์อื่น
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

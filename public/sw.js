// 簡略版サービスワーカー
const CACHE_NAME = 'whiteboard-app-v1.0';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// インストール
self.addEventListener('install', (event) => {
  console.log('SW: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: キャッシュを開始');
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// アクティベート
self.addEventListener('activate', (event) => {
  console.log('SW: アクティベート中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチ
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
// ===== 养娃工作台 Service Worker =====
const CACHE_NAME = 'baby-workbench-v1';
const ASSETS = [
  './baby-daily-workbench.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './'
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先，网络兜底
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // 缓存命中：返回缓存
        if (cached) return cached;

        // 无缓存：请求网络
        return fetch(event.request)
          .then((response) => {
            // 成功则缓存副本（同源请求才缓存）
            if (response && response.status === 200 && event.request.url.startsWith(self.location.origin)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // 离线兜底：返回主页面
            return caches.match('./baby-daily-workbench.html');
          });
      })
  );
});

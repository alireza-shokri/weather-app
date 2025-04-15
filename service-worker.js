const CACHE_NAME = 'weather-app-cache-v1';
const urlsToCache = [
  '/', 
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'service-worker.js',

  // تصاویر پس‌زمینه
  'backgroundImg/background_dark.webp',
  'backgroundImg/background_light.jpg',
  'backgroundImg/project_photo.png',

  // آیکون‌های پویا
  'icons_dynamic/cloudy-day.svg',
  'icons_dynamic/cloudy-night.svg',
  'icons_dynamic/cloudy.svg',
  'icons_dynamic/night.svg',
  'icons_dynamic/rainy.svg',
  'icons_dynamic/snow.svg',
  'icons_dynamic/sun.svg',

  // آیکون‌های ثابت
  'icons_static/cloudy-day.svg',
  'icons_static/cloudy-night.svg',
  'icons_static/cloudy.svg',
  'icons_static/favicon.webp',
  'icons_static/fog.png',
  'icons_static/humidity.png',
  'icons_static/marker.svg',
  'icons_static/night.svg',
  'icons_static/rainy.svg',
  'icons_static/snow.svg',
  'icons_static/sun.svg',
  'icons_static/tempMax.svg',
  'icons_static/tempMin.svg',
  'icons_static/uvIndex.png',
  'icons_static/visibility.png',
  'icons_static/windy.png',

  // فایل‌های نقشه
  'map/map.js',
  'ol_map/ol.css',
  'ol_map/ol.js',

  // صفحه آفلاین
  'offline.html',

  // فونت‌های گوگل
  'https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap'
];

// نصب Service Worker و کش کردن فایل‌ها
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// فعال‌سازی و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

// سرویس‌دهی از کش یا اینترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // اگر فایل در کش بود، همان را بده
      if (response) {
        return response;
      }
      // اگر نبود، از اینترنت بیار و در کش ذخیره کن
      return fetch(event.request).then(fetchResponse => {
        // فقط فایل‌های GET و موفق کش شوند
        if (
          !fetchResponse || 
          fetchResponse.status !== 200 || 
          fetchResponse.type !== 'basic'
        ) {
          return fetchResponse;
        }
        // کلون برای کش و پاسخ‌دهی
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      });
    }).catch(() => {
      // اگر آنلاین نبود، صفحه آفلاین را برگردان
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});
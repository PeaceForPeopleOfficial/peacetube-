const CACHE_NAME = 'peaceforpeople-v1';
// যেসব ফাইল অফলাইনে সেভ থাকবে
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/quran.html'
];

// ১. ফাইলগুলো ক্যাশে (ফোন মেমোরিতে) সেভ করা
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// ২. পুরোনো ক্যাশ ডিলিট করা
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ৩. নেট না থাকলে অফলাইন ফাইল দেখাবে
self.addEventListener('fetch', (event) => {
  // কেবল GET রিকোয়েস্টগুলোর জন্য কাজ করবে
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // নেট থাকলে সাথে সাথে পেজটি আপডেট করে ক্যাশে সেভ রাখবে
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // নেট না থাকলে সেভ থাকা অফলাইন পেজ লোড করবে
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // যদি পেজ ক্যাশে না থাকে
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

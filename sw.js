self.addEventListener("install", (e) => {
  console.log("Kirong AI Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("Kirong AI Service Worker Activated");
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

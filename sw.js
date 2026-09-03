/* ============================================================
   👑 KIRONG AI — SERVICE WORKER V4
   Network-first App Shell
   Prevents stale PWA deployments
   ============================================================ */

"use strict";

const CACHE_NAME = "kirong-ai-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  /*
   * Never intercept:
   * - API requests
   * - external resources
   */

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  /*
   * Network-first strategy.
   *
   * This makes sure a new Vercel deployment is fetched
   * instead of serving an old cached version.
   */

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
